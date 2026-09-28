import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'

export async function getAllTipoEventosByFilterStatus(filtroActivo) {
    const tipoEventos = await prisma.tipoEvento.findMany({
        where: { activo: filtroActivo }
    });
    if (tipoEventos.length === 0) {
        if (filtroActivo) throw new AppError(`No hay tipos de eventos activos registrados`, 404);
        if (!filtroActivo) throw new AppError(`No hay tipos de eventos inactivos registrados`, 404);
    }

    return { tipoEventos };
}

export async function getTiposEventoPublicos() {
    const tipoEventos = await prisma.tipoEvento.findMany({
        where: { activo: true },
        select: {
            codigo: true,
            nombre: true,
            descripcion: true
        }
    });

    return { tipoEventos };
}

export async function getTipoEventoByCodigo(codigo) {
    const tipoEvento = await prisma.tipoEvento.findUnique({
        where: { codigo }
    });
    if (!tipoEvento) throw new AppError('Tipo de evento no encontrado', 404);
    return { tipoEvento };
}

export async function createTipoEvento(tipoEvento) {
    const existingTipoEvento = await prisma.tipoEvento.findUnique({
        where: { nombre: tipoEvento.nombre }
    });
    if (existingTipoEvento) throw new AppError('El tipo de evento ya existe', 400);

    const newTipoEvento = await prisma.tipoEvento.create({
        data: tipoEvento
    });
    return { tipoEvento: newTipoEvento };
}

export async function updateTipoEvento(codigo, tipoEvento) {
    const existingTipoEvento = await prisma.tipoEvento.findUnique({
        where: { codigo }
    });
    if (!existingTipoEvento) throw new AppError('Tipo de evento no encontrado', 404);

    const updatedTipoEvento = await prisma.tipoEvento.update({
        where: { codigo },
        data: tipoEvento
    });
    return { tipoEvento: updatedTipoEvento, datoModificado: tipoEvento };
}

export async function changeTipoEventoStatus(codigo, activo) {
    const existingTipoEvento = await prisma.tipoEvento.findUnique({
        where: { codigo }
    });
    if (!existingTipoEvento) throw new AppError('Tipo de evento no encontrado', 404);

    if (existingTipoEvento.activo === activo) {
        throw new AppError(`El tipo de evento ya está ${activo ? 'activo' : 'inactivo'}`, 400);
    }

    await prisma.tipoEvento.update({
        where: { codigo },
        data: { activo: activo }
    });
}