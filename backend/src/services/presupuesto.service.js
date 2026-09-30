import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
import { calcularCotizacionInicial } from './calculoPresupuesto.service.js';

export async function calcularCotizacionInicialDesdeCatalogos(datosSolicitud) {
    const { codigoTipoEvento, ...datosCalculo } = datosSolicitud;
    const tipoEvento = await prisma.tipoEvento.findUnique({
        where: { codigo: codigoTipoEvento },
        include: {
            plantillas: {
                include: {
                    equipo: true,
                    especialidad: true
                }
            }
        }
    });

    if (!tipoEvento) {
        throw new AppError('Tipo de evento no encontrado', 404);
    }
    if (!tipoEvento.activo) {
        throw new AppError('No se puede cotizar un tipo de evento inactivo', 400);
    }

    const tipoEventoParaCalculo = {
        tarifaHoraBaseReferencial: tipoEvento.tarifaHoraBaseReferencial
    };

    let cotizacion;
    try {
        cotizacion = calcularCotizacionInicial({
            ...datosCalculo,
            tipoEvento: tipoEventoParaCalculo,
            plantillas: tipoEvento.plantillas
        });
    } catch (error) {
        if (error instanceof TypeError) {
            throw new AppError(error.message, 422);
        }
        throw error;
    }

    return {
        tipoEvento: {
            codigo: tipoEvento.codigo,
            nombre: tipoEvento.nombre
        },
        cotizacion
    };
}