import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'

export async function getAllCentroEventosByFilterStatus(filtroActivo) {
    const centroEventos = await prisma.centroEvento.findMany({
        where: { activo: filtroActivo }
    });
    if (centroEventos.length === 0) {
        if (filtroActivo) throw new AppError(`No hay centros de eventos activos registrados`, 404);
        if (!filtroActivo) throw new AppError(`No hay centros de eventos inactivos registrados`, 404);
    }

    return { centroEventos };
}

export async function getCentrosEventoPublicos() {
    const centroEventos = await prisma.centroEvento.findMany({
        where: { activo: true },
        select: {
            codigo: true,
            nombre: true,
            capacidadPersonas: true,
            direccionExacta: true
        }
    });

    return { centroEventos };
}

export async function getCentroEventoByCodigo(codigo) {
    const centroEvento = await prisma.centroEvento.findUnique({
        where: { codigo }
    });
    if (!centroEvento) throw new AppError('Centro de evento no encontrado', 404);
    return { centroEvento };
}

export async function createCentroEvento(centroEvento) {
    const existingCentroEvento = await prisma.centroEvento.findUnique({
        where: { nombre: centroEvento.nombre }
    });
    if (existingCentroEvento) throw new AppError('El centro de evento ya existe', 400);

    const newCentroEvento = await prisma.centroEvento.create({
        data: centroEvento
    });
    return { centroEvento: newCentroEvento };
}

export async function updateCentroEvento(codigo, centroEvento) {
    const existingCentroEvento = await prisma.centroEvento.findUnique({
        where: { codigo }
    });
    if (!existingCentroEvento) throw new AppError('Centro de evento no encontrado', 404);

    const updatedCentroEvento = await prisma.centroEvento.update({
        where: { codigo },
        data: centroEvento
    });
    return { centroEvento: updatedCentroEvento, datoModificado: centroEvento };
}

export async function changeCentroEventoStatus(codigo, activo) {
    const existingCentroEvento = await prisma.centroEvento.findUnique({
        where: { codigo }
    });
    if (!existingCentroEvento) throw new AppError('Centro de evento no encontrado', 404);

    if (existingCentroEvento.activo === activo) {
        throw new AppError(`El centro de evento ya está ${activo ? 'activo' : 'inactivo'}`, 400);
    }

    await prisma.centroEvento.update({
        where: { codigo },
        data: { activo: activo }
    });
}