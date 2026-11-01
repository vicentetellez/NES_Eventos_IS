import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
import {
    agregarLineaPersonalAsignado,
    quitarLineaPersonalAsignado
} from './presupuesto.service.js';

const ESTADOS_ASIGNABLES = ['ORGANIZANDO', 'PENDIENTE_PAGO_FINAL', 'EN_PREPARACION'];
const ESTADOS_SIN_OCUPAR_TRABAJADOR = ['CANCELADO', 'FINALIZADO'];

function nombreCompleto(persona) {
    return [persona.nombre, persona.primerApellido, persona.segundoApellido].filter(Boolean).join(' ');
}

// Rango en minutos desde las 00:00 del día del evento (montaje y desmontaje incluidos en la duración)
function calcularRangoMinutos(evento) {
    const inicio = evento.horaInicio.getUTCHours() * 60 + evento.horaInicio.getUTCMinutes();
    const duracion = (evento.horasEvento + (evento.horasMontajeDesmontaje ?? 0)) * 60;
    return { inicio, fin: inicio + duracion };
}

function haySolapamiento(eventoA, eventoB) {
    const a = calcularRangoMinutos(eventoA);
    const b = calcularRangoMinutos(eventoB);
    return a.inicio < b.fin && b.inicio < a.fin;
}

async function obtenerEventoOError(cliente, codigoEvento) {
    const evento = await cliente.evento.findUnique({ where: { codigo: codigoEvento } });
    if (!evento) {
        throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    }
    return evento;
}

function validarEstadoAsignable(evento) {
    if (!ESTADOS_ASIGNABLES.includes(evento.estado)) {
        throw new AppError(
            `Solo se pueden gestionar trabajadores cuando el evento está en ${ESTADOS_ASIGNABLES.join(', ')} (estado actual: ${evento.estado})`,
            409
        );
    }
}

// Devuelve, por trabajador, el evento de la misma fecha con el que se solapa (si existe)
async function buscarConflictos(cliente, evento, ruts) {
    if (ruts.length === 0) return new Map();

    const participaciones = await cliente.trabajadorParticipaEvento.findMany({
        where: {
            rutTrabajador: { in: ruts },
            evento: {
                fechaEvento: evento.fechaEvento,
                codigo: { not: evento.codigo },
                estado: { notIn: ESTADOS_SIN_OCUPAR_TRABAJADOR }
            }
        },
        select: {
            rutTrabajador: true,
            evento: {
                select: { codigo: true, horaInicio: true, horasEvento: true, horasMontajeDesmontaje: true }
            }
        }
    });

    const conflictos = new Map();
    for (const participacion of participaciones) {
        if (haySolapamiento(evento, participacion.evento)) {
            conflictos.set(participacion.rutTrabajador, participacion.evento.codigo);
        }
    }
    return conflictos;
}

export async function listarCatalogoTrabajadores(codigoEvento, { codigoEspecialidad, nombre, soloDisponibles } = {}) {
    const evento = await obtenerEventoOError(prisma, codigoEvento);

    const where = { activo: true };
    if (codigoEspecialidad) {
        where.especialidades = { some: { codigoEspecialidad } };
    }
    if (nombre) {
        where.persona = {
            is: {
                AND: nombre.split(/\s+/).map((parte) => ({
                    OR: [
                        { nombre: { contains: parte, mode: 'insensitive' } },
                        { primerApellido: { contains: parte, mode: 'insensitive' } },
                        { segundoApellido: { contains: parte, mode: 'insensitive' } }
                    ]
                }))
            }
        };
    }

    const trabajadores = await prisma.trabajador.findMany({
        where,
        select: {
            rut: true,
            esExterno: true,
            aniosExperiencia: true,
            persona: { select: { nombre: true, primerApellido: true, segundoApellido: true } },
            especialidades: {
                select: {
                    especialidad: {
                        select: { codigo: true, nombre: true, tarifaHoraReferencial: true, esPersonalFijo: true }
                    }
                }
            },
            participaciones: {
                where: { codigoEvento },
                select: { codigoEspecialidad: true, tarifaHoraAcordada: true }
            }
        }
    });

    const conflictos = await buscarConflictos(prisma, evento, trabajadores.map(({ rut }) => rut));

    const catalogo = trabajadores
        .map((trabajador) => ({
            rut: trabajador.rut,
            nombre: nombreCompleto(trabajador.persona),
            esExterno: trabajador.esExterno,
            aniosExperiencia: trabajador.aniosExperiencia,
            especialidades: trabajador.especialidades.map(({ especialidad }) => especialidad),
            asignadoEnEvento: trabajador.participaciones.length > 0,
            codigoEventoConflicto: conflictos.get(trabajador.rut) ?? null,
            disponible: trabajador.participaciones.length === 0 && !conflictos.has(trabajador.rut)
        }))
        .filter((trabajador) => !soloDisponibles || trabajador.disponible)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return { total: catalogo.length, trabajadores: catalogo };
}

export async function listarTrabajadoresAsignados(codigoEvento) {
    await obtenerEventoOError(prisma, codigoEvento);

    const participaciones = await prisma.trabajadorParticipaEvento.findMany({
        where: { codigoEvento },
        select: {
            rutTrabajador: true,
            tarifaHoraAcordada: true,
            minutosTrabajador: true,
            especialidad: { select: { codigo: true, nombre: true } },
            trabajador: {
                select: { esExterno: true, persona: { select: { nombre: true, primerApellido: true, segundoApellido: true } } }
            }
        }
    });

    return {
        total: participaciones.length,
        asignaciones: participaciones.map((participacion) => ({
            rutTrabajador: participacion.rutTrabajador,
            nombre: nombreCompleto(participacion.trabajador.persona),
            esExterno: participacion.trabajador.esExterno,
            especialidad: participacion.especialidad,
            tarifaHoraAcordada: participacion.tarifaHoraAcordada,
            minutosTrabajador: participacion.minutosTrabajador
        }))
    };
}

export async function asignarTrabajador(codigoEvento, { rutTrabajador, codigoEspecialidad, tarifaHoraAcordada }) {
    return prisma.$transaction(async (tx) => {
        const evento = await obtenerEventoOError(tx, codigoEvento);
        validarEstadoAsignable(evento);

        const trabajador = await tx.trabajador.findUnique({
            where: { rut: rutTrabajador },
            include: {
                persona: true,
                especialidades: { where: { codigoEspecialidad }, include: { especialidad: true } }
            }
        });
        if (!trabajador) throw new AppError('Trabajador no encontrado', 404);
        if (!trabajador.activo) throw new AppError('El trabajador está inactivo', 400);
        if (trabajador.especialidades.length === 0) {
            throw new AppError('El trabajador no tiene la especialidad indicada', 400);
        }
        const especialidad = trabajador.especialidades[0].especialidad;

        const yaAsignado = await tx.trabajadorParticipaEvento.findFirst({
            where: { rutTrabajador, codigoEvento }
        });
        if (yaAsignado) throw new AppError('El trabajador ya está asignado a este evento', 409);

        const conflictos = await buscarConflictos(tx, evento, [rutTrabajador]);
        if (conflictos.has(rutTrabajador)) {
            throw new AppError(
                `El trabajador ya está asignado al evento ${conflictos.get(rutTrabajador)} en un horario que se solapa`,
                409
            );
        }

        // Los internos tienen sueldo fijo: no se cobran por hora (tarifa 0). Los externos, con su tarifa acordada.
        let tarifaFinal = 0;
        if (trabajador.esExterno) {
            tarifaFinal = tarifaHoraAcordada ?? especialidad.tarifaHoraReferencial;
            if (tarifaFinal <= 0) {
                throw new AppError('Debe indicar la tarifa por hora acordada del trabajador externo', 422);
            }
        }

        const participacion = await tx.trabajadorParticipaEvento.create({
            data: {
                rutTrabajador,
                codigoEspecialidad,
                codigoEvento,
                minutosTrabajador: 0,
                tarifaHoraAcordada: tarifaFinal
            }
        });

        await agregarLineaPersonalAsignado(tx, {
            codigoEvento,
            trabajador: { rut: rutTrabajador, nombreCompleto: nombreCompleto(trabajador.persona) },
            especialidad,
            tarifaHoraAcordada: tarifaFinal
        });

        return { asignacion: participacion };
    });
}

export async function desasignarTrabajador(codigoEvento, rutTrabajador, codigoEspecialidad) {
    return prisma.$transaction(async (tx) => {
        const evento = await obtenerEventoOError(tx, codigoEvento);
        validarEstadoAsignable(evento);

        const participacion = await tx.trabajadorParticipaEvento.findUnique({
            where: {
                rutTrabajador_codigoEspecialidad_codigoEvento: { rutTrabajador, codigoEspecialidad, codigoEvento }
            },
            include: { especialidad: true }
        });
        if (!participacion) throw new AppError('El trabajador no está asignado a este evento con esa especialidad', 404);

        await tx.trabajadorParticipaEvento.delete({
            where: {
                rutTrabajador_codigoEspecialidad_codigoEvento: { rutTrabajador, codigoEspecialidad, codigoEvento }
            }
        });

        await quitarLineaPersonalAsignado(tx, {
            codigoEvento,
            rutTrabajador,
            especialidad: participacion.especialidad
        });

        return { asignacionEliminada: { rutTrabajador, codigoEspecialidad, codigoEvento } };
    });
}
