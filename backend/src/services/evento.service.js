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

const transicionesPermitidas = {
    SOLICITADO: ['COTIZANDO', 'CANCELADO'],
    COTIZANDO: ['PENDIENTE_PAGO_ABONO', 'CANCELADO'],
    PENDIENTE_PAGO_ABONO: ['ORGANIZANDO', 'CANCELADO'],
    ORGANIZANDO: ['PENDIENTE_PAGO_FINAL', 'CANCELADO'],
    PENDIENTE_PAGO_FINAL: ['EN_PREPARACION', 'CANCELADO'],
    EN_PREPARACION: ['EN_EJECUCION', 'CANCELADO'],
    EN_EJECUCION: ['FINALIZADO', 'CANCELADO'],
    FINALIZADO: [],
    CANCELADO: []
};

export async function avanzarEstadoEvento(codigoEvento, estadoDestino, rutUsuario){
    const evento = await prisma.evento.findUnique({ 
        where: { codigo: codigoEvento } 
    });

    if (!evento){
        throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    }

    if (!transicionesPermitidas[evento.estado].includes(estadoDestino)) {
        throw new AppError(`No se puede cambiar de ${evento.estado} a ${estadoDestino}`, 400);
    }
   
    if (estadoDestino === 'ORGANIZANDO') {
        evento.estado = estadoDestino;
        evento.rutUsuarioPagoAbono = rutUsuario;
        evento.fechaPagoAbono = new Date();
    }
    else if (estadoDestino === 'EN_PREPARACION') {
        evento.estado = estadoDestino;
        evento.rutUsuarioPagoFinal = rutUsuario;
        evento.fechaPagoFinal = new Date();
    }
    else {
        evento.estado = estadoDestino;
    }

    const updatedEvento = await prisma.evento.update({
        where: { codigo: codigoEvento },
        data: { estado: estadoDestino,
                rutUsuarioPagoAbono: evento.rutUsuarioPagoAbono,
                rutUsuarioPagoFinal: evento.rutUsuarioPagoFinal,
                fechaPagoAbono: evento.fechaPagoAbono,
                fechaPagoFinal: evento.fechaPagoFinal }
    });
    return updatedEvento;
};













// AQUI PA ABAJO VA LA LOGICA DE CREAR UN EVENTO MEDIANTE RUTA PUBLICA
async function crearEventoTransaccion(prismaTransaction, rutCliente, datosClienteNuevo, datosEventoNuevo) {
    // Primero vemos lo del cliente
    // Llamamos a los servicios de cliente para verificar si el cliente ya existe o crear uno nuevo
    const cliente = await obtenerOrCrearCliente(prismaTransaction, rutCliente, datosClienteNuevo);
    // Llamamos a la función para crear el evento con los datos del cliente ya verificados o creados
    const evento = await crearEventoEnTransaccion(prismaTransaction, rutCliente, datosEventoNuevo);

    return evento;
}
async function asignarBanqueteriasTransaccion(prismaTransaction, codigoEvento, listaBanqueterias) {
    // Llamamos a los servicios de banqueteria para asignar los banquetes
    const banquete = await crearAsignacionesBanqueteria(prismaTransaction, codigoEvento, listaBanqueterias);
    
    return banquete;
}

// funcion publica para la creacion de una solicitud de evento mediante el formulario del cliente
export async function solicitudEvento(rutCliente, datosClienteNuevo, datosEventoNuevo, listaBanqueterias) {
    return prisma.$transaction(async (x) => {
        // Primero vamos a llamar la funcion orquestadora de ver los datos del cliente y del evento
        const nuevoEvento = await crearEventoTransaccion(x, rutCliente, datosClienteNuevo, datosEventoNuevo);

        // Después llamamos la funcion orquestadora de las banqueterias, para asignarlas al evento
        const banquetesAsignados = await asignarBanqueteriasTransaccion(x, nuevoEvento.codigo, listaBanqueterias);

        return { nuevoEvento, banquetesAsignados };
    });
}