import { response } from '../helpers/responses.js';
import {
    getAllBanqueteriasByFilterStatus,
    getBanqueteriaByCodigo,
    createBanqueteria,
    updateBanqueteria,
    changeBanqueteriaStatus
} from '../services/banqueteria.service.js';

export const getAllBanqueteriasByFilterStatusController = async (req, res, next) => {
    try {
        const { activo } = req.validatedQuery;
        const result = await getAllBanqueteriasByFilterStatus(activo);
        if (activo === true) response.success(res, 200, "Busqueda de banqueterias activas exitosa", result);
        if (activo === false) response.success(res, 200, "Busqueda de banqueterias inactivas exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const getBanqueteriaByCodigoController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const result = await getBanqueteriaByCodigo(codigo);
        response.success(res, 200, "Busqueda de banqueteria exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const createBanqueteriaController = async (req, res, next) => {
    try {
        const { banqueteriaData } = req.body;
        const result = await createBanqueteria(banqueteriaData);
        response.success(res, 201, "Creación de banqueteria exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const updateBanqueteriaController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { banqueteriaData } = req.body;
        const result = await updateBanqueteria(codigo, banqueteriaData);
        response.success(res, 200, "Actualización de banqueteria exitosa", result);
    } catch (error) {
        next(error);
    }
};

export const changeBanqueteriaStatusController = async (req, res, next) => {
    try {
        const { codigo } = req.validatedParams;
        const { activo } = req.validatedQuery;
        const result = await changeBanqueteriaStatus(codigo, activo);
        if (activo === true) response.success(res, 200, "Activación de banqueteria exitosa", result);
        if (activo === false) response.success(res, 200, "Desactivación de banqueteria exitosa", result);
    } catch (error) {
        next(error);
    }
};