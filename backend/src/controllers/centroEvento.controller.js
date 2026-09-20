import { response } from '../helpers/responses.js';
import {
    getAllCentroEventosByFilterStatus,
    getCentroEventoByCodigo,
    createCentroEvento,
    updateCentroEvento,
    changeCentroEventoStatus
} from '../services/centroEvento.service.js';

export const getAllCentroEventosByFilterStatusController = async (req, res, next) => {
    try {
        const { activo } = req.validatedQuery;
        const result = await getAllCentroEventosByFilterStatus(activo);
        if (activo === true) response.success(res, 200, "Busqueda de centros de eventos activos exitosa", result);
        if (activo === false) response.success(res, 200, "Busqueda de centros de eventos inactivos exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const getCentroEventoByCodigoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const result = await getCentroEventoByCodigo(codigo);
        response.success(res, 200, "Busqueda de centro de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const createCentroEventoController = async (req, res, next) => {
    try {
        const { centroEventoData } = req.body;
        const result = await createCentroEvento(centroEventoData);
        response.success(res, 201, "Creación de centro de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const updateCentroEventoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { centroEventoData } = req.body;
        const result = await updateCentroEvento(codigo, centroEventoData);
        response.success(res, 200, "Actualización de centro de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const changeCentroEventoStatusController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { activo } = req.validatedQuery;
        const result = await changeCentroEventoStatus(codigo, activo);
        if (activo === true) response.success(res, 200, "Activación de centro de evento exitosa", result);
        if (activo === false) response.success(res, 200, "Desactivación de centro de evento exitosa", result);
    } catch (error) {
        next(error);
    }
};