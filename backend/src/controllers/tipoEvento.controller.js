import { response } from '../helpers/responses.js';
import {
    getAllTipoEventosByFilterStatus,
    getTipoEventoByCodigo,
    createTipoEvento,
    updateTipoEvento,
    changeTipoEventoStatus
} from '../services/tipoEvento.service.js';

export const getAllTipoEventosByFilterStatusController = async (req, res, next) => {
    try {
        const { activo } = req.validatedQuery;
        const result = await getAllTipoEventosByFilterStatus(activo);
        if (activo === true) response.success(res, 200, "Busqueda de tipos de eventos activos exitosa", result);
        if (activo === false) response.success(res, 200, "Busqueda de tipos de eventos inactivos exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const getTipoEventoByCodigoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const result = await getTipoEventoByCodigo(codigo);
        response.success(res, 200, "Busqueda de tipo de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const createTipoEventoController = async (req, res, next) => {
    try {
        const { tipoEventoData } = req.body;
        const result = await createTipoEvento(tipoEventoData);
        response.success(res, 201, "Creación de tipo de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const updateTipoEventoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { tipoEventoData } = req.body;
        const result = await updateTipoEvento(codigo, tipoEventoData);
        response.success(res, 200, "Actualización de tipo de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const changeTipoEventoStatusController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { activo } = req.validatedQuery;
        const result = await changeTipoEventoStatus(codigo, activo);
        if (activo === true) response.success(res, 200, "Activación de tipo de evento exitosa", result);
        if (activo === false) response.success(res, 200, "Desactivación de tipo de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};