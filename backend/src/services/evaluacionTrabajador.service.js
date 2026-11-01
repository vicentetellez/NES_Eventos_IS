import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
export async function getTrabajadoresParaEvaluacionByCodigoEvento(codigoEvento){
    const evento = await prisma.evento.findUnique({
        where: {codigo: codigoEvento},
        select: {estado: true}
    });
    if(!evento) throw new AppError('Evento no encontrado',404);
    if(evento.estado !== 'FINALIZADO') {
        throw new AppError('Solo se pueden evaluar trabajadores en eventos finalizados',400);
    }

    const participaciones = await prisma.trabajadorParticipaEvento.findMany({
        where: {
            codigoEvento,
            especialidad: {is: {esEvaluable: true}}
        },
        include: {
            especialidad: {
                select: {codigo: true, nombre: true}
            },
            trabajador: {
                include: {persona: true}
            }
        }
    });

    const especialidadesPorCodigo = new Map();
    for (const participacion of participaciones) {
        const {especialidad, trabajador} = participacion;
        if (!especialidadesPorCodigo.has(especialidad.codigo)) {
            especialidadesPorCodigo.set(especialidad.codigo, {
                codigo: especialidad.codigo,
                nombre: especialidad.nombre,
                trabajadores: []
            });
        }
        especialidadesPorCodigo.get(especialidad.codigo).trabajadores.push(trabajador);
    }

    const especialidades = [...especialidadesPorCodigo.values()]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return {especialidades};
}


export async function createEvaluacionTrabajadores(evaluacionesTrabajadores){
    if(!Array.isArray(evaluacionesTrabajadores) || evaluacionesTrabajadores.length === 0) {
        throw new AppError('Debe entregar al menos una evaluación de trabajador',400);
    }

    return prisma.$transaction(async (transaction) => {
        const claveParticipacion = ({codigoEvento, codigoEspecialidad, rutTrabajador}) =>
            JSON.stringify([codigoEvento, codigoEspecialidad, rutTrabajador]);
        const claves = evaluacionesTrabajadores.map(claveParticipacion);
        if(new Set(claves).size !== claves.length) {
            throw new AppError('La lista contiene evaluaciones duplicadas para un trabajador y especialidad',400);
        }

        const codigosEvento = [...new Set(evaluacionesTrabajadores.map(({codigoEvento}) => codigoEvento))];
        const eventos = await transaction.evento.findMany({
            where: {codigo: {in: codigosEvento}},
            select: {codigo: true, estado: true}
        });
        const eventosPorCodigo = new Map(eventos.map((evento) => [evento.codigo, evento]));
        for(const codigoEvento of codigosEvento) {
            const evento = eventosPorCodigo.get(codigoEvento);
            if(!evento) throw new AppError('Evento no encontrado',404);
            if(evento.estado !== 'FINALIZADO') {
                throw new AppError('Solo se pueden evaluar trabajadores en eventos finalizados',400);
            }
        }

        const codigosEspecialidad = [...new Set(evaluacionesTrabajadores.map(({codigoEspecialidad}) => codigoEspecialidad))];
        const especialidades = await transaction.especialidad.findMany({
            where: {codigo: {in: codigosEspecialidad}},
            select: {codigo: true, esEvaluable: true}
        });
        const especialidadesPorCodigo = new Map(especialidades.map((especialidad) => [especialidad.codigo, especialidad]));
        for(const codigoEspecialidad of codigosEspecialidad) {
            const especialidad = especialidadesPorCodigo.get(codigoEspecialidad);
            if(!especialidad) throw new AppError('Especialidad no encontrada',404);
            if(!especialidad.esEvaluable) {
                throw new AppError('La especialidad no es evaluable',400);
            }
        }

        const condicionesParticipacion = evaluacionesTrabajadores.map(
            ({codigoEvento, codigoEspecialidad, rutTrabajador}) => ({
                codigoEvento,
                codigoEspecialidad,
                rutTrabajador
            })
        );
        const participaciones = await transaction.trabajadorParticipaEvento.findMany({
            where: {OR: condicionesParticipacion},
            select: {codigoEvento: true, codigoEspecialidad: true, rutTrabajador: true}
        });
        const participacionesEncontradas = new Set(participaciones.map(claveParticipacion));
        if(claves.some((clave) => !participacionesEncontradas.has(clave))) {
            throw new AppError('Uno o más trabajadores no participaron en el evento y especialidad indicados',400);
        }

        const evaluacionesExistentes = await transaction.evaluacionTrabajador.findMany({
            where: {OR: condicionesParticipacion},
            select: {codigoEvento: true, codigoEspecialidad: true, rutTrabajador: true}
        });
        const clavesExistentes = new Set(evaluacionesExistentes.map(claveParticipacion));
        if(claves.some((clave) => clavesExistentes.has(clave))) {
            throw new AppError('La evaluación de uno o más trabajadores ya existe',400);
        }

        const nuevasEvaluaciones = [];
        for(const evaluacion of evaluacionesTrabajadores) {
            nuevasEvaluaciones.push(await transaction.evaluacionTrabajador.create({
                data: {
                    calificacion: evaluacion.calificacion,
                    comentarioEspecifico: evaluacion.comentarioEspecifico,
                    esAutogenerado: evaluacion.esAutogenerado,
                    codigoEvento: evaluacion.codigoEvento,
                    codigoEspecialidad: evaluacion.codigoEspecialidad,
                    rutTrabajador: evaluacion.rutTrabajador
                }
            }));
        }
        return {evaluacionesTrabajadores: nuevasEvaluaciones};
    });
}