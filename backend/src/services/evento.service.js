import crypto from 'node:crypto';
import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'
import { obtenerOrCrearCliente } from './cliente.service.js';
import { crearAsignacionesBanqueteria } from './banqueteria.service.js';

// Lo que devuelva va a poder variar un un futuro, va a depender de lo que mostremos en el front xd
export async function getAllEventosByFilterEstado(estado) {
    const eventos = await prisma.evento.findMany({
        select: {
            codigo: true,
            codigoEvaluacion: true,
            fechaEvento: true,
            cliente: {
                select: {
                    persona: {
                        select: {
                            rut: true,
                            nombre: true,
                        }
                    }
                }
            }
        },
        where: {
            estado: estado
        }
    });
    if (!eventos || eventos.length === 0) {
        throw new AppError(`No se encontraron eventos con el estado especificado (${estado})`, 404);
    }

    return ({ eventos });
};

export async function getEventoByCodigo(codigo) {
    const evento = await prisma.evento.findUnique({
        where: {
            codigo: codigo
        },
        select: {
            cliente: {
                select: {
                    persona: {
                        select: {
                            rut: true,
                            nombre: true,
                        }
                    }
                }
            }
        }
    });

    if (!evento) {
        throw new AppError(`No se encontró un evento con el código especificado (${codigo})`, 404);
    }
    return ({ evento });
}

export async function getEventoByCodigoEvaluacion(codigoEvaluacion) {
    const evento = await prisma.evento.findUnique({
        select: { codigo: true },
        where: { codigoEvaluacion }
    });

    if (!evento) {
        throw new AppError(`No se encontró un evento con el código de evaluación especificado (${codigoEvaluacion})`, 404);
    }

    return ({ evento });
}

// Genera un código legible tipo: "EV-8A3F2B"
function generarCodigoEvaluacionUnico(){
  const bytes = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EV-${bytes}`;
}

async function crearEventoEnTransaccion(prismaTransaction, rutCliente, datosEventoNuevo) {
    let codigoEvaluacion, existe;

    do {
        codigoEvaluacion = generarCodigoEvaluacionUnico();
        existe = await prismaTransaction.evento.findUnique({ 
            where: { codigoEvaluacion } 
        });
    } while(existe);

    const newEvento = await prismaTransaction.evento.create({
        data: {
            ...datosEventoNuevo,
            rutCliente,
            estado: 'SOLICITADO',
            codigoEvaluacion: codigoEvaluacion,
            fechaEvento: new Date(datosEventoNuevo.fechaEvento),
            horaInicio: new Date(`2000-01-01T${datosEventoNuevo.horaInicio}:00Z`),
        }
    });
    return newEvento;
}

export async function updateEvento(codigo, datosEvento) {
    const updatedEvento = await prisma.evento.update({
        where: { codigo },
        data: datosEvento
    });

    if (!updatedEvento) {
        throw new AppError(`No se encontró un evento con el código especificado (${codigo})`, 404);
    }

    return ({ evento: updatedEvento, datoModificado: datosEvento });
}

export async function deleteEvento(codigo) {
    const deletedEvento = await prisma.evento.delete({
        where: { codigo }
    });

    if (!deletedEvento) {
        throw new AppError(`No se encontró un evento con el código especificado (${codigo})`, 404);
    }

    return ({ evento: deletedEvento });
}
