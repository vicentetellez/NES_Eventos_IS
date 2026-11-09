import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';

export async function existingEvaluacionEvento(codigoEvaluacion){
    const evento = await prisma.evento.findUnique({
        where: {codigoEvaluacion},
        select: {codigo: true}
    });
    if(!evento) throw new AppError('Evento no encontrado',404);

    
    const evaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where: {codigoEvento: evento.codigo},
        select: {codigo: true}
    });
    return evaluacionEvento !== null;
}

export async function createEvaluacionEvento(evaluacionEvento){
    const existingEvaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where: {codigoEvento: evaluacionEvento.codigoEvento}
    });
    if(existingEvaluacionEvento) throw new AppError('La evaluacion del evento ya existe',400);

    const evento = await prisma.evento.findUnique({
        where: {codigo: evaluacionEvento.codigoEvento},
        select: {estado: true}
    });
    if(!evento) throw new AppError('Evento no encontrado',404);
    
    const participacionEvaluable = await prisma.trabajadorParticipaEvento.findFirst({
        where: {
            codigoEvento: evaluacionEvento.codigoEvento,
            especialidad: {is: {esEvaluable: true}}
        },
        select: {rutTrabajador: true}
    });
    if(!participacionEvaluable) {
        throw new AppError('No se puede enviar la reseña porque el evento no tiene trabajadores evaluables',400);
    }

    const newEvaluacionEvento = await prisma.evaluacionEvento.create({
        data: evaluacionEvento
    });

    return {evaluacionEvento: newEvaluacionEvento};
}

export async function getEvaluacionEventoBycodigo(codigo){
    const evaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where: {codigo}
    });
    if(!evaluacionEvento) throw new AppError('Evaluacion del evento no encontrada',404);
    return {evaluacionEvento};
}

export async function getResenasEventos(){
    const evaluaciones = await prisma.evaluacionEvento.findMany({
        orderBy: {fechaRegistro: 'desc'},
        include: {
            evento: {
                select: {
                    codigo: true,
                    codigoEvaluacion: true,
                    estado: true,
                    fechaEvento: true,
                    tipoEvento: {select: {nombre: true}},
                    tipoEventoCliente: true,
                    centroEvento: {select: {nombre: true}},
                    centroEventoCliente: true,
                    cliente: {
                        select: {
                            persona: {
                                select: {
                                    nombre: true,
                                    primerApellido: true,
                                    segundoApellido: true
                                }
                            }
                        }
                    },
                    participaciones: {
                        where: {especialidad: {is: {esEvaluable: true}}},
                        select: {
                            rutTrabajador: true,
                            codigoEspecialidad: true,
                            especialidad: {select: {codigo: true, nombre: true}},
                            trabajador: {
                                select: {
                                    rut: true,
                                    persona: {
                                        select: {
                                            nombre: true,
                                            primerApellido: true,
                                            segundoApellido: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    evaluacionesTrabajadores: {
                        select: {
                            calificacion: true,
                            comentarioEspecifico: true,
                            rutTrabajador: true,
                            codigoEspecialidad: true
                        }
                    }
                }
            }
        }
    });

    return {
        resenas: evaluaciones.map(({evento, ...resena}) => {
            const puntajeTotalGuardado = Number(resena.puntajeTotal);
            const evaluacionesPorParticipacion = new Map(
                evento.evaluacionesTrabajadores.map((evaluacion) => [
                    `${evaluacion.rutTrabajador}:${evaluacion.codigoEspecialidad}`,
                    evaluacion
                ])
            );
            const especialidadesPorCodigo = new Map();

            for (const participacion of evento.participaciones) {
                const {especialidad, trabajador} = participacion;
                if (!especialidadesPorCodigo.has(especialidad.codigo)) {
                    especialidadesPorCodigo.set(especialidad.codigo, {
                        codigo: especialidad.codigo,
                        nombre: especialidad.nombre,
                        trabajadores: []
                    });
                }

                const persona = trabajador.persona;
                especialidadesPorCodigo.get(especialidad.codigo).trabajadores.push({
                    rut: trabajador.rut,
                    nombre: [persona.nombre, persona.primerApellido, persona.segundoApellido]
                        .filter(Boolean)
                        .join(' '),
                    evaluacion: evaluacionesPorParticipacion.get(
                        `${trabajador.rut}:${especialidad.codigo}`
                    ) ?? null
                });
            }

            const personaCliente = evento.cliente.persona;
            return {
                ...resena,
                puntajeTotal: puntajeTotalGuardado > 5
                    ? Number((puntajeTotalGuardado / 20).toFixed(2))
                    : puntajeTotalGuardado,
                evento: {
                    codigo: evento.codigo,
                    codigoEvaluacion: evento.codigoEvaluacion,
                    estado: evento.estado,
                    fechaEvento: evento.fechaEvento,
                    nombre: evento.tipoEvento?.nombre ?? evento.tipoEventoCliente ?? 'Evento',
                    centro: evento.centroEvento?.nombre ?? evento.centroEventoCliente ?? null,
                    cliente: [personaCliente.nombre, personaCliente.primerApellido, personaCliente.segundoApellido]
                        .filter(Boolean)
                        .join(' '),
                    especialidades: [...especialidadesPorCodigo.values()]
                        .map((especialidad) => ({
                            ...especialidad,
                            trabajadores: especialidad.trabajadores.sort((a, b) =>
                                a.nombre.localeCompare(b.nombre, 'es')
                            )
                        }))
                        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
                }
            };
        })
    };
}