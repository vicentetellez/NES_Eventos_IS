import { response } from '../helpers/responses.js';
import {
    normalizarFecha,
    getEstadoCalendarioEvento,
    getAllCalendarioEventos,
    createCalendarioEvento
} from '../services/calendarioEvento.service.js';

export const normalizarFechaController = async (req, res, next) => {
    try {
        const { fecha } = req.validatedQuery;
        const result = await normalizarFecha(fecha);
        response.success(res, 200, 'Normalizacion de fecha exitosa', result);
    } catch (error) {
        next(error);
    }
};

export const getAllCalendarioEventosController = async (req, res, next) => {
    try {
        const result = await getAllCalendarioEventos();
        response.success(res, 200, 'Obtencion de calendarios exitosa', result);
    } catch (error) {
        next(error);
    }
};

export const createCalendarioEventoController = async (req, res, next) => {
    try {
        const { calendarioEventoData } = req.body;
        const result = await createCalendarioEvento(calendarioEventoData.codigoEvento, calendarioEventoData);
        response.success(res, 201, 'Creacion de calendario de evento exitosa', result);
    } catch (error) {
        next(error);
    }
};

export const getEstadoCalendarioEventoController = async (req, res, next) => {
    try {
        const { evento } = req.body;
        const result = await getEstadoCalendarioEvento(evento);
        response.success(res, 200, 'Obtencion de estado del calendario exitosa', result);
    } catch (error) {
        next(error);
    }
};