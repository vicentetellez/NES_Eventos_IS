import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
import { calcularTotales, crearDetalle } from './calculoPresupuesto.service.js';
import { recalcularTotalPresupuesto } from './presupuesto.service.js';

const ESTADOS_EDITABLES = ['ORGANIZANDO', 'PENDIENTE_PAGO_FINAL'];
const ESTADOS_QUE_OCUPAN_EQUIPO = ['CANCELADO', 'FINALIZADO'];

function horasTotales(evento) {
    return evento.horasEvento + (evento.horasMontajeDesmontaje ?? 0);
}

function obtenerRango(evento) {
    const inicio = evento.horaInicio.getUTCHours() * 60 + evento.horaInicio.getUTCMinutes();
    return {
        inicio,
        fin: inicio + horasTotales(evento) * 60
    };
}

function seSolapan(eventoA, eventoB) {
    const rangoA = obtenerRango(eventoA);
    const rangoB = obtenerRango(eventoB);
    return rangoA.inicio < rangoB.fin && rangoB.inicio < rangoA.fin;
}

async function obtenerEvento(cliente, codigoEvento) {
    const evento = await cliente.evento.findUnique({ where: { codigo: codigoEvento } });
    if (!evento) throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    if (!ESTADOS_EDITABLES.includes(evento.estado)) {
        throw new AppError(`No se pueden gestionar equipos cuando el evento está en ${evento.estado}`, 409);
    }
    return evento;
}

async function vincularDetallesAntiguos(cliente, presupuesto) {
    const sinVinculo = presupuesto.detalles.filter(
        (detalle) => detalle.categoria === 'EQUIPAMIENTO' && detalle.codigoEquipo === null
    );
    if (sinVinculo.length === 0) return;

    const equipos = await cliente.equipo.findMany({ select: { codigo: true, nombre: true } });
    for (const detalle of sinVinculo) {
        const candidatos = equipos.filter(({ nombre }) =>
            detalle.descripcion === nombre ||
            detalle.descripcion?.startsWith(`${nombre} (estimado por `)
        );
        if (candidatos.length === 1) {
            await cliente.detallePresupuesto.update({
                where: { codigo: detalle.codigo },
                data: { codigoEquipo: candidatos[0].codigo }
            });
        }
    }
}

export async function inicializarEquiposPresupuestados(cliente, codigoEvento) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigoEvento },
        include: { detalles: true }
    });
    if (!presupuesto || presupuesto.estado !== 'VALIDADO') {
        throw new AppError('Se requiere un presupuesto validado para inicializar los equipos del evento', 409);
    }

    await vincularDetallesAntiguos(cliente, presupuesto);
    const detalles = await cliente.detallePresupuesto.findMany({
        where: { codigoPresupuesto: presupuesto.codigo, categoria: 'EQUIPAMIENTO', codigoEquipo: { not: null } }
    });
    const codigos = [...new Set(detalles.map(({ codigoEquipo }) => codigoEquipo))];
    if (codigos.length === 0) return;

    const existentes = await cliente.eventoUtilizaEquipo.findMany({
        where: { codigoEvento, codigoEquipo: { in: codigos } },
        select: { codigoEquipo: true }
    });
    const yaInicializados = new Set(existentes.map(({ codigoEquipo }) => codigoEquipo));
    const grupos = new Map();
    for (const detalle of detalles) {
        const grupo = grupos.get(detalle.codigoEquipo) ?? {
            cantidadUsada: 0,
            precioUnitarioAcordado: detalle.precioUnitario,
            montoCobrado: 0
        };
        grupo.cantidadUsada += detalle.cantidad;
        grupo.montoCobrado += detalle.subtotal;
        grupos.set(detalle.codigoEquipo, grupo);
    }

    const nuevos = [...grupos.entries()]
        .filter(([codigoEquipo]) => !yaInicializados.has(codigoEquipo))
        .map(([codigoEquipo, valores]) => ({ codigoEvento, codigoEquipo, ...valores }));

    if (nuevos.length > 0) {
        await cliente.eventoUtilizaEquipo.createMany({ data: nuevos, skipDuplicates: true });
    }
}

async function obtenerPresupuestoAprobado(cliente, codigoEvento) {
    const presupuesto = await cliente.presupuesto.findUnique({
        where: { codigoEvento },
        include: { detalles: true }
    });
    if (!presupuesto || presupuesto.estado !== 'VALIDADO') {
        throw new AppError('El evento necesita un presupuesto validado por el gerente', 409);
    }
    return presupuesto;
}

async function obtenerStockDisponible(cliente, evento, equipo) {
    if (equipo.esExterno || equipo.stockTotal === null) return null;

    const asignaciones = await cliente.eventoUtilizaEquipo.findMany({
        where: {
            codigoEquipo: equipo.codigo,
            codigoEvento: { not: evento.codigo },
            evento: {
                fechaEvento: evento.fechaEvento,
                estado: { notIn: ESTADOS_QUE_OCUPAN_EQUIPO }
            }
        },
        select: {
            cantidadUsada: true,
            evento: {
                select: {
                    codigo: true,
                    horaInicio: true,
                    horasEvento: true,
                    horasMontajeDesmontaje: true
                }
            }
        }
    });

    const usados = asignaciones
        .filter(({ evento: otroEvento }) => seSolapan(evento, otroEvento))
        .reduce((total, { cantidadUsada }) => total + cantidadUsada, 0);
    return Math.max(equipo.stockTotal - (equipo.stockNoDisponible ?? 0) - usados, 0);
}

function formatoAsignacion(asignacion) {
    const subtotalActual = asignacion.cantidadUsada * asignacion.precioUnitarioAcordado;
    return {
        codigoEquipo: asignacion.codigoEquipo,
        nombre: asignacion.equipo.nombre,
        esExterno: asignacion.equipo.esExterno,
        stockTotal: asignacion.equipo.stockTotal,
        cantidadUsada: asignacion.cantidadUsada,
        precioUnitarioAcordado: asignacion.precioUnitarioAcordado,
        montoCobrado: asignacion.montoCobrado,
        subtotalActual
    };
}

export async function listarCatalogoEquipos(codigoEvento) {
    const evento = await prisma.evento.findUnique({ where: { codigo: codigoEvento } });
    if (!evento) throw new AppError(`Evento con código ${codigoEvento} no encontrado`, 404);
    const equipos = await prisma.equipo.findMany({
        orderBy: { nombre: 'asc' },
        select: {
            codigo: true,
            nombre: true,
            esExterno: true,
            stockTotal: true,
            arriendoHoraReferencial: true
        }
    });
    return { equipos };
}

export async function listarEquiposEvento(codigoEvento) {
    return prisma.$transaction(async (tx) => {
        const evento = await obtenerEvento(tx, codigoEvento);
        await obtenerPresupuestoAprobado(tx, codigoEvento);
        await inicializarEquiposPresupuestados(tx, codigoEvento);

        const asignaciones = await tx.eventoUtilizaEquipo.findMany({
            where: { codigoEvento },
            include: { equipo: { select: { codigo: true, nombre: true, esExterno: true, stockTotal: true } } },
            orderBy: { equipo: { nombre: 'asc' } }
        });
        const catalogo = await tx.equipo.findMany({
            orderBy: { nombre: 'asc' },
            select: {
                codigo: true,
                nombre: true,
                esExterno: true,
                stockTotal: true,
                stockNoDisponible: true,
                arriendoHoraReferencial: true
            }
        });
        const cantidadesDisponibles = await Promise.all(
            catalogo.map(async (equipo) => [
                equipo.codigo,
                await obtenerStockDisponible(tx, evento, equipo)
            ])
        );
        const disponiblesPorCodigo = new Map(cantidadesDisponibles);
        const asignadosPorCodigo = new Map(
            asignaciones.map(({ codigoEquipo, cantidadUsada }) => [codigoEquipo, cantidadUsada])
        );

        return {
            asignaciones: asignaciones.map(formatoAsignacion),
            catalogo: catalogo.map((equipo) => ({
                ...equipo,
                disponible: disponiblesPorCodigo.get(equipo.codigo) === null
                    ? null
                    : disponiblesPorCodigo.get(equipo.codigo) + (asignadosPorCodigo.get(equipo.codigo) ?? 0),
                precioReferencialEvento: equipo.arriendoHoraReferencial === null
                    ? 0
                    : equipo.arriendoHoraReferencial * horasTotales(evento)
            }))
        };
    });
}

export async function actualizarEquiposEvento(codigoEvento, { equipos }) {
    return prisma.$transaction(async (tx) => {
        const evento = await obtenerEvento(tx, codigoEvento);
        const presupuesto = await obtenerPresupuestoAprobado(tx, codigoEvento);
        await inicializarEquiposPresupuestados(tx, codigoEvento);

        const codigosSolicitados = equipos.map(({ codigoEquipo }) => codigoEquipo);
        const catalogo = await tx.equipo.findMany({
            where: { codigo: { in: codigosSolicitados } },
            select: {
                codigo: true,
                nombre: true,
                esExterno: true,
                stockTotal: true,
                stockNoDisponible: true,
                arriendoHoraReferencial: true
            }
        });
        if (catalogo.length !== codigosSolicitados.length) {
            throw new AppError('Uno o más equipos no existen en el catálogo', 404);
        }

        const actuales = await tx.eventoUtilizaEquipo.findMany({ where: { codigoEvento } });
        const actualesPorCodigo = new Map(actuales.map((asignacion) => [asignacion.codigoEquipo, asignacion]));
        const catalogoPorCodigo = new Map(catalogo.map((equipo) => [equipo.codigo, equipo]));
        const solicitadosPorCodigo = new Map(equipos.map((equipo) => [equipo.codigoEquipo, equipo]));
        const listaCompleta = new Set([...actualesPorCodigo.keys(), ...solicitadosPorCodigo.keys()]);
        const aumentos = [];

        for (const codigoEquipo of listaCompleta) {
            const equipo = catalogoPorCodigo.get(codigoEquipo) ??
                await tx.equipo.findUnique({ where: { codigo: codigoEquipo } });
            if (!equipo) throw new AppError(`Equipo ${codigoEquipo} no encontrado`, 404);

            const actual = actualesPorCodigo.get(codigoEquipo);
            const solicitado = solicitadosPorCodigo.get(codigoEquipo);
            const cantidadUsada = solicitado?.cantidadUsada ?? 0;
            const precioReferencial = equipo.esExterno && equipo.arriendoHoraReferencial !== null
                ? equipo.arriendoHoraReferencial * horasTotales(evento)
                : 0;
            const precioUnitarioAcordado = solicitado?.precioUnitarioAcordado ??
                actual?.precioUnitarioAcordado ??
                precioReferencial;
            if (equipo.esExterno && cantidadUsada > 0 && precioUnitarioAcordado === 0) {
                throw new AppError(`Debe indicar un precio para el arriendo de ${equipo.nombre}`, 422);
            }
            const disponible = await obtenerStockDisponible(tx, evento, equipo);
            const aumentoCantidad = cantidadUsada - (actual?.cantidadUsada ?? 0);
            if (disponible !== null && aumentoCantidad > 0 && aumentoCantidad > disponible) {
                throw new AppError(
                    `Stock insuficiente para ${equipo.nombre}: hay ${disponible} unidades disponibles para este horario`,
                    409
                );
            }

            const montoCobradoAnterior = actual?.montoCobrado ?? 0;
            const valorActual = cantidadUsada * precioUnitarioAcordado;
            if (!Number.isSafeInteger(valorActual) || valorActual > 2147483647) {
                throw new AppError(`El subtotal de ${equipo.nombre} excede el monto máximo permitido`, 422);
            }
            const aumentoCobro = Math.max(valorActual - montoCobradoAnterior, 0);
            const montoCobrado = montoCobradoAnterior + aumentoCobro;

            if (actual) {
                await tx.eventoUtilizaEquipo.update({
                    where: { codigoEquipo_codigoEvento: { codigoEquipo, codigoEvento } },
                    data: { cantidadUsada, precioUnitarioAcordado, montoCobrado }
                });
            } else if (cantidadUsada > 0) {
                await tx.eventoUtilizaEquipo.create({
                    data: { codigoEvento, codigoEquipo, cantidadUsada, precioUnitarioAcordado, montoCobrado }
                });
            }

            if (aumentoCobro > 0) {
                aumentos.push(crearDetalle({
                    categoria: 'AJUSTE_EVENTO',
                    descripcion: `Aumento de equipo: ${equipo.nombre} (${cantidadUsada} unidades)`,
                    cantidad: 1,
                    precioUnitario: aumentoCobro,
                    codigoEquipo,
                    esArriendoTercero: equipo.esExterno
                }));
            }
        }

        if (aumentos.length > 0) {
            await tx.detallePresupuesto.createMany({
                data: aumentos.map((detalle) => ({ ...detalle, codigoPresupuesto: presupuesto.codigo }))
            });
        }

        const presupuestoActualizado = await recalcularTotalPresupuesto(tx, presupuesto.codigo);
        const asignaciones = await tx.eventoUtilizaEquipo.findMany({
            where: { codigoEvento },
            include: { equipo: { select: { codigo: true, nombre: true, esExterno: true, stockTotal: true } } },
            orderBy: { equipo: { nombre: 'asc' } }
        });

        return {
            asignaciones: asignaciones.map(formatoAsignacion),
            montoAjuste: aumentos.reduce((total, detalle) => total + detalle.subtotal, 0),
            totalPresupuesto: presupuestoActualizado.total,
            margenArriendoAgregado: calcularTotales(aumentos).montoMargen
        };
    });
}
