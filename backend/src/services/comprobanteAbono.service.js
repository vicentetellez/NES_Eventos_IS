import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';

const camposComprobante = {
    estado: true,
    observacion: true,
    fechaCarga: true,
    fechaRevision: true
};

function validarArchivo(archivo) {
    if (!archivo) throw new AppError('Debe adjuntar un comprobante PNG o PDF', 400);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const pdf = Buffer.from('%PDF-');
    const esPng = archivo.mimetype === 'image/png' && archivo.buffer.subarray(0, 8).equals(png);
    const esPdf = archivo.mimetype === 'application/pdf' && archivo.buffer.subarray(0, 5).equals(pdf);
    if (!esPng && !esPdf) throw new AppError('El comprobante debe ser un archivo PNG o PDF válido', 400);
}

async function bloquearEvento(tx, codigoEvento) {
    await tx.$queryRaw`SELECT codigo FROM evento WHERE codigo = ${codigoEvento} FOR UPDATE`;
    const evento = await tx.evento.findUnique({
        where: { codigo: codigoEvento },
        include: { presupuesto: { select: { estado: true } } }
    });
    if (!evento) throw new AppError('Evento no encontrado', 404);
    if (evento.estado !== 'PENDIENTE_PAGO_ABONO' || evento.presupuesto?.estado !== 'VALIDADO') {
        throw new AppError('El evento debe tener un presupuesto validado y estar pendiente del primer abono', 409);
    }
}

export async function subirComprobante(codigoEvento, archivo, rutUsuario) {
    validarArchivo(archivo);
    return prisma.$transaction(async (tx) => {
        await bloquearEvento(tx, codigoEvento);
        const anterior = await tx.comprobanteAbono.findUnique({ where: { codigoEvento } });
        if (anterior && anterior.estado !== 'RECHAZADO') {
            throw new AppError('Ya existe un comprobante pendiente o aprobado', 409);
        }
        const datos = {
            contenido: archivo.buffer,
            tipo: archivo.mimetype,
            estado: 'PENDIENTE',
            observacion: null,
            fechaCarga: new Date(),
            fechaRevision: null,
            rutUsuarioCarga: rutUsuario,
            rutUsuarioRevision: null
        };
        const comprobante = await tx.comprobanteAbono.upsert({
            where: { codigoEvento },
            create: { codigoEvento, ...datos },
            update: datos,
            select: camposComprobante
        });
        return { comprobante };
    });
}

export async function rechazarComprobante(codigoEvento, observacion, rutUsuario) {
    return prisma.$transaction(async (tx) => {
        await bloquearEvento(tx, codigoEvento);
        const actualizado = await tx.comprobanteAbono.updateMany({
            where: { codigoEvento, estado: 'PENDIENTE' },
            data: {
                estado: 'RECHAZADO',
                observacion,
                rutUsuarioRevision: rutUsuario,
                fechaRevision: new Date()
            }
        });
        if (actualizado.count !== 1) throw new AppError('No hay un comprobante pendiente de revisión', 409);
        return {
            comprobante: await tx.comprobanteAbono.findUnique({
                where: { codigoEvento },
                select: camposComprobante
            })
        };
    });
}

export async function obtenerArchivoComprobante(codigoEvento) {
    const comprobante = await prisma.comprobanteAbono.findUnique({
        where: { codigoEvento },
        select: { contenido: true, tipo: true }
    });
    if (!comprobante) throw new AppError('Comprobante no encontrado', 404);
    return comprobante;
}
