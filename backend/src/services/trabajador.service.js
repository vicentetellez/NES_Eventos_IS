import prisma from '../config/prisma.js';

function calcularPromedio(evaluaciones) {
    if (evaluaciones.length === 0) return null;
    const total = evaluaciones.reduce((suma, evaluacion) => suma + Number(evaluacion.calificacion), 0);
    return Number((total / evaluaciones.length).toFixed(2));
}

export async function getRankingTrabajadores(filtros = {}, opciones = {}) {
    const { incluirRut = true, modoDemostracion = false } = opciones;
    const { nombre, especialidad, aniosExperienciaMin, aniosExperienciaMax } = filtros;
    const where = {
        activo: true,
        evaluaciones: { some: {} },
        especialidades: { some: {} }
    };

    if (nombre) {
        where.persona = {
            is: {
                AND: nombre.split(/\s+/).map((parteNombre) => ({
                    OR: [
                        { nombre: { contains: parteNombre, mode: 'insensitive' } },
                        { primerApellido: { contains: parteNombre, mode: 'insensitive' } },
                        { segundoApellido: { contains: parteNombre, mode: 'insensitive' } }
                    ]
                }))
            }
        };
    }

    if (especialidad) {
        where.especialidades = {
            some: {
                especialidad: {
                    is: { nombre: { contains: especialidad, mode: 'insensitive' } }
                }
            }
        };
    }

    if (aniosExperienciaMin !== undefined || aniosExperienciaMax !== undefined) {
        where.aniosExperiencia = {
            ...(aniosExperienciaMin !== undefined ? { gte: aniosExperienciaMin } : {}),
            ...(aniosExperienciaMax !== undefined ? { lte: aniosExperienciaMax } : {})
        };
    }

    const trabajadores = await prisma.trabajador.findMany({
        where,
        select: {
            rut: true,
            esExterno: true,
            aniosExperiencia: true,
            persona: {
                select: {
                    nombre: true,
                    primerApellido: true,
                    segundoApellido: true
                }
            },
            especialidades: {
                select: {
                    especialidad: { select: { codigo: true, nombre: true } }
                }
            },
            evaluaciones: {
                select: {
                    calificacion: true,
                    comentarioEspecifico: true,
                    codigoEspecialidad: true,
                    especialidad: { select: { codigo: true, nombre: true } }
                }
            }
        }
    });

    const ranking = trabajadores.map((trabajador) => {
        const evaluacionesPorEspecialidad = new Map();
        for (const evaluacion of trabajador.evaluaciones) {
            const codigo = evaluacion.codigoEspecialidad;
            const grupo = evaluacionesPorEspecialidad.get(codigo) ?? {
                codigoEspecialidad: codigo,
                nombre: evaluacion.especialidad.nombre,
                calificaciones: []
            };
            grupo.calificaciones.push(evaluacion);
            evaluacionesPorEspecialidad.set(codigo, grupo);
        }

        const persona = trabajador.persona;
        return {
            ...(incluirRut ? { rut: trabajador.rut } : {}),
            nombre: [persona.nombre, persona.primerApellido, persona.segundoApellido]
                .filter(Boolean)
                .join(' '),
            esExterno: trabajador.esExterno,
            aniosExperiencia: trabajador.aniosExperiencia,
            activo: true,
            calificacionPromedio: calcularPromedio(trabajador.evaluaciones),
            totalEvaluaciones: trabajador.evaluaciones.length,
            tieneEvaluacionDemo: trabajador.evaluaciones.some(({ comentarioEspecifico }) =>
                comentarioEspecifico?.startsWith('[DEMO FICTICIA]')
            ),
            especialidades: trabajador.especialidades.map(({ especialidad: item }) => ({
                codigo: item.codigo,
                nombre: item.nombre
            })),
            tieneExperienciaDemo: trabajador.aniosExperiencia !== null
                && trabajador.especialidades.some(({ especialidad: item }) => item.nombre.startsWith('DEMO -')),
            evaluacionesPorEspecialidad: [...evaluacionesPorEspecialidad.values()].map((grupo) => ({
                codigoEspecialidad: grupo.codigoEspecialidad,
                nombre: grupo.nombre,
                calificacionPromedio: calcularPromedio(grupo.calificaciones),
                totalEvaluaciones: grupo.calificaciones.length
            }))
        };
    });

    ranking.sort((primero, segundo) =>
        (segundo.calificacionPromedio ?? -1) - (primero.calificacionPromedio ?? -1)
        || segundo.totalEvaluaciones - primero.totalEvaluaciones
        || primero.nombre.localeCompare(segundo.nombre, 'es')
    );

    return {
        total: ranking.length,
        ...(modoDemostracion ? { modoDemostracion: true } : {}),
        filtros: {
            nombre: nombre ?? null,
            especialidad: especialidad ?? null,
            aniosExperienciaMin: aniosExperienciaMin ?? null,
            aniosExperienciaMax: aniosExperienciaMax ?? null
        },
        trabajadores: ranking
    };
}