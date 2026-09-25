import { response } from '../helpers/responses.js';
import {
    getAllEventosByFilterEstado,
    getEventoByCodigo,
    getEventoByCodigoEvaluacion,
    updateEvento,
    deleteEvento,
} from '../services/evento.service.js';

export const getAllEventosByFilterEstadoController = async (req, res, next) => {
    try {
        const { estado } = req.validatedQuery;
        const eventos = await getAllEventosByFilterEstado(estado);
        response.success(res, 200, `Eventos con estado ${estado} obtenidos correctamente`, eventos);
    } catch (error) {
        next(error);
    }
};

export const getEventoByCodigoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const evento = await getEventoByCodigo(codigo);
        response.success(res, 200, `Evento con código ${codigo} obtenido correctamente`, evento);
    } catch (error) {
        next(error);
    }
};

export const getEventoByCodigoEvaluacionController = async (req, res, next) => {
    try {
        const { codigoEvaluacion } = req.validatedParams;
        const evento = await getEventoByCodigoEvaluacion(codigoEvaluacion);
        response.success(res, 200, `Evento con código ${codigoEvaluacion} obtenido correctamente`, evento);
    } catch (error) {
        next(error);
    }
};

export const updateEventoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { eventoData } = req.body;
        const updatedEvento = await updateEvento(codigo, eventoData);
        response.success(res, 200, `Evento con código ${codigo} actualizado correctamente`, updatedEvento);
    } catch (error) {
        next(error);
    }
};

export const deleteEventoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const deletedEvento = await deleteEvento(codigo);
        response.success(res, 200, `Evento con código ${codigo} eliminado correctamente`, deletedEvento);
    } catch (error) {
        next(error);
    }
};
