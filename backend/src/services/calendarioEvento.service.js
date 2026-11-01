import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';

export function normalizarFecha(fecha) {
    if (!fecha) return null;

    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return null;

    return date;
}

export function getEstadoCalendarioEvento(evento) {
    const estadoEvento = (evento?.estado ?? '').toUpperCase();
    const fechaPagoAbono = normalizarFecha(evento?.fechaPagoAbono);
    const fechaPagoFinal = normalizarFecha(evento?.fechaPagoFinal);
    const fechaEvento = normalizarFecha(evento?.fechaEvento);

    if (!fechaEvento) {
        return {
            visible: false,
            color: null,
            motivo: 'Sin fecha del evento'
        };
    }

    if (estadoEvento === 'FINALIZADO' && fechaPagoAbono && fechaPagoFinal) {
        return {
            visible: true,
            color: 'azul',
            motivo: 'El evento está finalizado con fechaPagoAbono y fechaPagoFinal, por lo tanto el cliente podra realizar la reseña'
        };
    }

    if (fechaPagoAbono && fechaPagoFinal) {
        return {
            visible: true,
            color: 'verde',
            motivo: 'El evento tiene fechaPagoAbono y fechaPagoFinal, por lo tanto está en verde'
        };
    }

    if (fechaPagoAbono && !fechaPagoFinal) {
        const hoy = new Date();
        const fechaLimiteRojo = new Date(fechaEvento);
        fechaLimiteRojo.setDate(fechaEvento.getDate() - 14);

        if (hoy >= fechaLimiteRojo && hoy < fechaEvento) {
            return {
                visible: true,
                color: 'rojo',
                motivo: 'Falta fechaPagoFinal y queda menos de dos semanas para el evento'
            };
        }

        return {
            visible: true,
            color: 'naranja',
            motivo: 'El evento tiene fechaPagoAbono, por lo tanto va en naranja'
        };
    }

    return {
        visible: false,
        color: null,
        motivo: 'El evento no cumple las condiciones del calendario'
    };
}

export async function getAllCalendarioEventos() {
    const eventos = await prisma.evento.findMany({
        orderBy: {
            fechaEvento: 'asc'
        }
    });

    const calendario = eventos
        .map((evento) => ({
            ...evento,
            estadoCalendario: getEstadoCalendarioEvento(evento)
        }))
        .filter((evento) => evento.estadoCalendario?.visible === true);

    return { calendario };
}

export async function createCalendarioEvento(codigoEvento, calendarioEventoData = {}) {
    const evento = await prisma.evento.findUnique({
        where: { codigo: Number(codigoEvento) }
    });

    if (!evento) {
        throw new AppError('Evento no encontrado', 404);
    }

    const fechaPagoAbono = normalizarFecha(evento.fechaPagoAbono);
    const fechaPagoFinal = normalizarFecha(evento.fechaPagoFinal);
    const fechaEvento = normalizarFecha(evento.fechaEvento);

    if (!fechaEvento) {
        throw new AppError('El evento no tiene fecha del evento', 400);
    }

    if (evento.estado?.toUpperCase() === 'FINALIZADO') {
        throw new AppError('El evento ya está finalizado y no puede volver al calendario', 400);
    }

    if (!fechaPagoAbono && !fechaPagoFinal) {
        throw new AppError('El evento no cumple las condiciones para aparecer en el calendario', 400);
    }

    const estadoCalendario = getEstadoCalendarioEvento(evento);

    const calendarioEvento = {
        codigoEvento: evento.codigo,
        fechaEvento: evento.fechaEvento,
        fechaPagoAbono: evento.fechaPagoAbono,
        fechaPagoFinal: evento.fechaPagoFinal,
        estadoCalendario,
        ...calendarioEventoData
    };

    return { calendarioEvento };
}