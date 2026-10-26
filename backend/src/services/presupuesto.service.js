import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
import {
    calcularCotizacionInicial,
    calcularPrimerAbono,
    calcularTotales,
    crearDetalle
} from './calculoPresupuesto.service.js';

const ESTADOS_EVENTO_EDITABLES = ['COTIZANDO', 'PENDIENTE_PAGO_ABONO', 'ORGANIZANDO', 'PENDIENTE_PAGO_FINAL'];

// Los errores de validación del cálculo son TypeError: se informan como 422
async function ejecutarCalculo(funcionCalculo) {
    try {
        return await funcionCalculo();
    } catch (error) {
        if (error instanceof TypeError) {
            throw new AppError(error.message, 422);
        }
        throw error;
    }
}

export function calcularHorasTotalesEvento(evento) {
    return evento.horasEvento + (evento.horasMontajeDesmontaje ?? 0);
}

function formatearPresupuesto(presupuesto, evento) {
    const detalles = [...presupuesto.detalles].sort((a, b) => a.codigo - b.codigo);
    const { subtotal, montoMargen } = calcularTotales(detalles, presupuesto.porcentajeMargen);
    const montoAbono = evento.montoAbono ?? null;

    return {
        codigo: presupuesto.codigo,
        codigoEvento: presupuesto.codigoEvento,
        estado: presupuesto.estado,
        fechaDictamen: presupuesto.fechaDictamen,
        rutUsuarioDictamen: presupuesto.rutUsuarioDictamen,
        observacionDictamen: presupuesto.observacionDictamen,
        tarifaHoraBase: presupuesto.tarifaHoraBase,
        porcentajeMargen: presupuesto.porcentajeMargen,
        detalles,
        subtotal,
        montoMargen,
        total: presupuesto.total,
        primerAbono: calcularPrimerAbono(presupuesto.total),
        montoAbono,
        // Si el presupuesto se modificó después del primer abono, la diferencia se paga en el segundo abono
        saldoPendiente: montoAbono !== null ? presupuesto.total - montoAbono : null
    };
}

async function obtenerEventoOError(codigoEvento, cliente = prisma) {
    const evento = await cliente.evento.findUnique({ where: { codigo: codigoEvento } });
    if (!evento) {
        throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    }
    return evento;
}

async function obtenerPresupuestoDeEventoOError(codigoEvento, cliente = prisma) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigoEvento },
        include: { detalles: true, evento: true }
    });
    if (!presupuesto) {
        throw new AppError(`El evento ${codigoEvento} aún no tiene presupuesto`, 404);
    }
    return presupuesto;
}

// Recalcula y guarda el total del presupuesto a partir de sus líneas. Debe llamarse en cada cambio de líneas o margen.
export async function recalcularTotalPresupuesto(cliente, codigoPresupuesto, datosExtra = {}) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigo: codigoPresupuesto },
        include: { detalles: true }
    });
    const { total } = await ejecutarCalculo(() =>
        calcularTotales(presupuesto.detalles, datosExtra.porcentajeMargen ?? presupuesto.porcentajeMargen)
    );

    return cliente.presupuesto.update({
        where: { codigo: codigoPresupuesto },
        data: { ...datosExtra, total },
        include: { detalles: true }
    });
}

// Líneas que se cargan por primera vez al abrir el formulario de presupuesto. No guarda nada.
export async function obtenerPrecargaPresupuesto(codigoEvento) {
    const evento = await prisma.evento.findUnique({
        where: { codigo: codigoEvento },
        include: {
            tipoEvento: {
                include: {
                    plantillas: { include: { equipo: true, especialidad: true } }
                }
            },
            banqueterias: { include: { banqueteria: true } }
        }
    });

    if (!evento) {
        throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    }
    if (evento.tipoEvento && !evento.tipoEvento.activo) {
        throw new AppError('No se puede cotizar un tipo de evento inactivo', 400);
    }

    const cotizacion = await ejecutarCalculo(() => calcularCotizacionInicial({
        tipoEvento: evento.tipoEvento
            ? { tarifaHoraBaseReferencial: evento.tipoEvento.tarifaHoraBaseReferencial }
            : null,
        horasEvento: evento.horasEvento,
        horasMontajeDesmontaje: evento.horasMontajeDesmontaje ?? 0,
        cantidadPersonas: evento.cantidadPersonas,
        plantillas: evento.tipoEvento?.plantillas ?? [],
        banqueterias: evento.banqueterias
    }));

    return {
        evento: { codigo: evento.codigo, estado: evento.estado },
        tipoEvento: evento.tipoEvento
            ? { codigo: evento.tipoEvento.codigo, nombre: evento.tipoEvento.nombre }
            : null,
        cotizacion
    };
}

export async function obtenerPresupuesto(codigoEvento) {
    const presupuesto = await obtenerPresupuestoDeEventoOError(codigoEvento);
    return { presupuesto: formatearPresupuesto(presupuesto, presupuesto.evento) };
}

export async function crearPresupuesto(codigoEvento, { porcentajeMargen = 0, detalles }) {
    const evento = await prisma.evento.findUnique({
        where: { codigo: codigoEvento },
        include: { tipoEvento: true, presupuesto: true }
    });

    if (!evento) {
        throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    }
    if (evento.presupuesto) {
        throw new AppError('El evento ya tiene un presupuesto. Debe modificarlo en lugar de crear otro', 409);
    }
    if (evento.estado !== 'COTIZANDO') {
        throw new AppError('El presupuesto solo se puede crear mientras el evento está en COTIZANDO', 409);
    }

    const detallesCalculados = await ejecutarCalculo(() => detalles.map(crearDetalle));
    const { total } = await ejecutarCalculo(() => calcularTotales(detallesCalculados, porcentajeMargen));

    const presupuesto = await prisma.presupuesto.create({
        data: {
            estado: 'BORRADOR',
            tarifaHoraBase: evento.tipoEvento?.tarifaHoraBaseReferencial ?? 0,
            porcentajeMargen,
            total,
            codigoEvento,
            detalles: { create: detallesCalculados }
        },
        include: { detalles: true }
    });

    return { presupuesto: formatearPresupuesto(presupuesto, evento) };
}

// Reemplaza las líneas editables y/o el margen. Las líneas administradas por el sistema (trabajadores asignados)
// no se tocan. Después de la primera validación del gerente no se vuelve a exigir validación.
export async function actualizarPresupuesto(codigoEvento, { porcentajeMargen, detalles }) {
    return prisma.$transaction(async (tx) => {
        const existente = await obtenerPresupuestoDeEventoOError(codigoEvento, tx);

        if (!ESTADOS_EVENTO_EDITABLES.includes(existente.evento.estado)) {
            throw new AppError(`No se puede modificar el presupuesto de un evento en estado ${existente.evento.estado}`, 409);
        }
        if (existente.estado === 'PENDIENTE_VALIDACION') {
            throw new AppError('El presupuesto está pendiente de validación del gerente y no se puede modificar', 409);
        }

        if (detalles !== undefined) {
            const detallesCalculados = await ejecutarCalculo(() => detalles.map(crearDetalle));
            await tx.detallePresupuesto.deleteMany({
                where: { codigoPresupuesto: existente.codigo, rutTrabajador: null }
            });
            await tx.detallePresupuesto.createMany({
                data: detallesCalculados.map((detalle) => ({ ...detalle, codigoPresupuesto: existente.codigo }))
            });
        }

        const actualizado = await recalcularTotalPresupuesto(tx, existente.codigo, {
            ...(porcentajeMargen !== undefined ? { porcentajeMargen } : {}),
            ...(existente.estado === 'RECHAZADO' ? { estado: 'BORRADOR' } : {})
        });

        return { presupuesto: formatearPresupuesto(actualizado, existente.evento) };
    });
}

async function cambiarEstadoPresupuesto(codigoEvento, estadosOrigen, datosNuevos, mensajeError) {
    const resultado = await prisma.presupuesto.updateMany({
        where: { codigoEvento, estado: { in: estadosOrigen } },
        data: datosNuevos
    });

    if (resultado.count === 0) {
        await obtenerPresupuestoDeEventoOError(codigoEvento);
        throw new AppError(mensajeError, 409);
    }

    return obtenerPresupuesto(codigoEvento);
}

export async function enviarPresupuestoAValidacion(codigoEvento) {
    const presupuesto = await obtenerPresupuestoDeEventoOError(codigoEvento);

    if (presupuesto.evento.estado !== 'COTIZANDO') {
        throw new AppError('El presupuesto solo se puede enviar a validación mientras el evento está en COTIZANDO', 409);
    }
    if (presupuesto.detalles.length === 0) {
        throw new AppError('El presupuesto no tiene líneas de detalle', 422);
    }

    return cambiarEstadoPresupuesto(
        codigoEvento,
        ['BORRADOR', 'RECHAZADO'],
        { estado: 'PENDIENTE_VALIDACION', observacionDictamen: null },
        'Solo se puede enviar a validación un presupuesto en BORRADOR o RECHAZADO'
    );
}

export async function validarPresupuesto(codigoEvento, rutUsuario) {
    return cambiarEstadoPresupuesto(
        codigoEvento,
        ['PENDIENTE_VALIDACION'],
        { estado: 'VALIDADO', fechaDictamen: new Date(), rutUsuarioDictamen: rutUsuario, observacionDictamen: null },
        'Solo se puede validar un presupuesto que esté pendiente de validación'
    );
}

export async function rechazarPresupuesto(codigoEvento, rutUsuario, observacion) {
    return cambiarEstadoPresupuesto(
        codigoEvento,
        ['PENDIENTE_VALIDACION'],
        { estado: 'RECHAZADO', fechaDictamen: new Date(), rutUsuarioDictamen: rutUsuario, observacionDictamen: observacion },
        'Solo se puede rechazar un presupuesto que esté pendiente de validación'
    );
}

function buscarLineaGenerica(cliente, codigoPresupuesto, codigoEspecialidad) {
    return cliente.detallePresupuesto.findFirst({
        where: { codigoPresupuesto, categoria: 'PERSONAL', codigoEspecialidad, rutTrabajador: null },
        orderBy: { codigo: 'asc' }
    });
}

// Al asignar un trabajador: se descuenta una plaza estimada de la línea genérica de la especialidad y,
// si es externo (tarifa acordada > 0), se agrega su línea. Los internos no se cobran (cubiertos por la tarifa base).
export async function agregarLineaPersonalAsignado(cliente, { codigoEvento, trabajador, especialidad, tarifaHoraAcordada }) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigoEvento },
        include: { evento: true }
    });
    if (!presupuesto) return;

    const horasTotales = calcularHorasTotalesEvento(presupuesto.evento);
    const generica = await buscarLineaGenerica(cliente, presupuesto.codigo, especialidad.codigo);

    if (generica) {
        if (generica.cantidad <= 1) {
            await cliente.detallePresupuesto.delete({ where: { codigo: generica.codigo } });
        } else {
            await cliente.detallePresupuesto.update({
                where: { codigo: generica.codigo },
                data: {
                    cantidad: generica.cantidad - 1,
                    subtotal: (generica.cantidad - 1) * generica.precioUnitario
                }
            });
        }
    }

    if (tarifaHoraAcordada > 0) {
        const detalle = await ejecutarCalculo(() => crearDetalle({
            categoria: 'PERSONAL',
            descripcion: `${especialidad.nombre} - ${trabajador.nombreCompleto} (${horasTotales} h a tarifa acordada)`,
            cantidad: 1,
            precioUnitario: tarifaHoraAcordada * horasTotales,
            codigoEspecialidad: especialidad.codigo,
            rutTrabajador: trabajador.rut
        }));
        await cliente.detallePresupuesto.create({
            data: { ...detalle, codigoPresupuesto: presupuesto.codigo }
        });
    }

    await recalcularTotalPresupuesto(cliente, presupuesto.codigo);
}

// Inversa de agregarLineaPersonalAsignado
export async function quitarLineaPersonalAsignado(cliente, { codigoEvento, rutTrabajador, especialidad }) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigoEvento },
        include: { evento: true }
    });
    if (!presupuesto) return;

    await cliente.detallePresupuesto.deleteMany({
        where: {
            codigoPresupuesto: presupuesto.codigo,
            codigoEspecialidad: especialidad.codigo,
            rutTrabajador
        }
    });

    const generica = await buscarLineaGenerica(cliente, presupuesto.codigo, especialidad.codigo);
    if (generica) {
        await cliente.detallePresupuesto.update({
            where: { codigo: generica.codigo },
            data: {
                cantidad: generica.cantidad + 1,
                subtotal: (generica.cantidad + 1) * generica.precioUnitario
            }
        });
    } else if (!especialidad.esPersonalFijo && especialidad.tarifaHoraReferencial > 0) {
        const horasTotales = calcularHorasTotalesEvento(presupuesto.evento);
        const detalle = await ejecutarCalculo(() => crearDetalle({
            categoria: 'PERSONAL',
            descripcion: `${especialidad.nombre} (estimado por ${horasTotales} horas)`,
            cantidad: 1,
            precioUnitario: especialidad.tarifaHoraReferencial * horasTotales,
            codigoEspecialidad: especialidad.codigo
        }));
        await cliente.detallePresupuesto.create({
            data: { ...detalle, codigoPresupuesto: presupuesto.codigo }
        });
    }

    await recalcularTotalPresupuesto(cliente, presupuesto.codigo);
}
