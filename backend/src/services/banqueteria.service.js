import { constants } from 'node:os';
import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'

export async function getAllBanqueteriasByFilterStatus(filtroActivo) {
    const banqueteria = await prisma.banqueteria.findMany({
        where: { activo: filtroActivo }
    });
    if (banqueteria.length === 0) {
        if (filtroActivo) throw new AppError(`No hay banqueteria activas registradas`, 404);
        if (!filtroActivo) throw new AppError(`No hay banqueteria inactivas registradas`, 404);
    }

    return { banqueteria };
}

export async function getBanqueteriasPublicas() {
    const banqueterias = await prisma.banqueteria.findMany({
        where: { activo: true },
        select: {
            codigo: true,
            nombre: true,
            descripcion: true,
            precioPersonaReferencial: true
        }
    });

    return { banqueterias };
}

export async function getBanqueteriaByCodigo(codigo) {
    const banqueteria = await prisma.banqueteria.findUnique({
        where: { codigo }
    });
    if (!banqueteria) throw new AppError('Banqueteria no encontrada', 404);
    return { banqueteria };
}

export async function createBanqueteria(banqueteria) {
    const existingBanqueteria = await prisma.banqueteria.findUnique({
        where: { nombre: banqueteria.nombre }
    });
    if (existingBanqueteria) throw new AppError('La banqueteria ya existe', 400);

    const newBanqueteria = await prisma.banqueteria.create({
        data: banqueteria
    });
    return { banqueteria: newBanqueteria };
}

export async function updateBanqueteria(codigo, banqueteria) {
    const existingBanqueteria = await prisma.banqueteria.findUnique({
        where: { codigo }
    });
    if (!existingBanqueteria) throw new AppError('Banqueteria no encontrada', 404);

    const updatedBanqueteria = await prisma.banqueteria.update({
        where: { codigo },
        data: banqueteria
    });
    return { banqueteria: updatedBanqueteria, datoModificado: banqueteria };
}

export async function changeBanqueteriaStatus(codigo, activo) {
    const existingBanqueteria = await prisma.banqueteria.findUnique({
        where: { codigo }
    });
    if (!existingBanqueteria) throw new AppError('Banqueteria no encontrada', 404);

    if (existingBanqueteria.activo === activo) {
        throw new AppError(`La banqueteria ya está ${activo ? 'activo' : 'inactivo'}`, 400);
    }

    await prisma.banqueteria.update({
        where: { codigo },
        data: { activo: activo }
    });
}

export async function validarBanqueteriasActivas(prismaTransaction, listaBanqueterias) {
    const codigosBanquete = [...new Set(
        listaBanqueterias.map(({ codigoBanquete }) => Number(codigoBanquete))
    )];
    const banqueteriasActivas = await prismaTransaction.banqueteria.findMany({
        where: {
            codigo: { in: codigosBanquete },
            activo: true
        },
        select: { codigo: true }
    });

    if (banqueteriasActivas.length !== codigosBanquete.length) {
        throw new AppError('Una o más banqueterías no existen o están inactivas', 400);
    }
}

export async function crearAsignacionesBanqueteria(prismaTransaction, codigoEvento, listaBanqueterias = []) {
    if (listaBanqueterias.length === 0) return 0;

    // Validar que el evento existe
    const existingEvento = await prismaTransaction.evento.findUnique({
        where: { codigo: codigoEvento }
    });
    if (!existingEvento) throw new AppError('Evento no encontrado', 404);

    await validarBanqueteriasActivas(prismaTransaction, listaBanqueterias);

    const resultado = await prismaTransaction.eventoTieneBanqueteria.createMany({
        data: listaBanqueterias.map(({ codigoBanquete, cantidadRequerida }) => ({
            codigoEvento,
            codigoBanquete: Number(codigoBanquete),
            cantidadRequerida: Number(cantidadRequerida)
        })),
        skipDuplicates: true
    });

    const resultadoDTO = await prismaTransaction.banqueteria.findMany({
        select: { nombre: true },
        where: {
            codigo: { in: listaBanqueterias.map(({ codigoBanquete }) => Number(codigoBanquete)) }
        }
    });

    return { cantidadBanquetes: resultado.count, banqueterias: resultadoDTO };
}