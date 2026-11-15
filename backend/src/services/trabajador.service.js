import prisma from '../config/prisma.js';

function calcularPromedio(evaluaciones) {
    if (evaluaciones.length === 0) return null;
    const total = evaluaciones.reduce((suma, evaluacion) => suma + Number(evaluacion.calificacion), 0);
    return Number((total / evaluaciones.length).toFixed(2));
}

function normalizarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function coincideNombre(persona, nombre) {
    const partesNombre = normalizarTexto(nombre).trim().split(/\s+/).filter(Boolean);
    const camposPersona = [persona.nombre, persona.primerApellido, persona.segundoApellido]
        .filter(Boolean)
        .map(normalizarTexto);

    return partesNombre.every((parte) =>
        camposPersona.some((campo) => campo.includes(parte))
    );
}

export async function getRankingTrabajadores(filtros = {}) {
    const { nombre, especialidad, aniosExperienciaMin, aniosExperienciaMax } = filtros;
    const where = {
        activo: true,
        evaluaciones: { some: {} },
        especialidades: { some: {} }
    };

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

    const [trabajadores, especialidadesDisponibles] = await Promise.all([
        prisma.trabajador.findMany({
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
                        codigoEspecialidad: true,
                        especialidad: { select: { codigo: true, nombre: true } }
                    }
                }
            }
        }),
        prisma.especialidad.findMany({
            select: { codigo: true, nombre: true },
            orderBy: { nombre: 'asc' }
        })
    ]);

    const trabajadoresFiltrados = nombre
        ? trabajadores.filter((trabajador) => coincideNombre(trabajador.persona, nombre))
        : trabajadores;

    const ranking = trabajadoresFiltrados.map((trabajador) => {
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
            rut: trabajador.rut,
            nombre: [persona.nombre, persona.primerApellido, persona.segundoApellido]
                .filter(Boolean)
                .join(' '),
            esExterno: trabajador.esExterno,
            aniosExperiencia: trabajador.aniosExperiencia,
            activo: true,
            calificacionPromedio: calcularPromedio(trabajador.evaluaciones),
            totalEvaluaciones: trabajador.evaluaciones.length,
            especialidades: trabajador.especialidades.map(({ especialidad: item }) => ({
                codigo: item.codigo,
                nombre: item.nombre
            })),
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
        filtros: {
            nombre: nombre ?? null,
            especialidad: especialidad ?? null,
            aniosExperienciaMin: aniosExperienciaMin ?? null,
            aniosExperienciaMax: aniosExperienciaMax ?? null
        },
        especialidadesDisponibles,
        trabajadores: ranking
    };
}