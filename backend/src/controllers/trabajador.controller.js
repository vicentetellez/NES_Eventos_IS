import { response } from '../helpers/responses.js';
import { getRankingTrabajadores } from '../services/trabajador.service.js';

export const getRankingTrabajadoresController = async (req, res, next) => {
    try {
        const resultado = await getRankingTrabajadores(req.validatedQuery);
        response.success(res, 200, 'Ranking de trabajadores obtenido correctamente', resultado);
    } catch (error) {
        next(error);
    }
};

export const getRankingTrabajadoresDemoController = async (req, res, next) => {
    try {
        const resultado = await getRankingTrabajadores(req.validatedQuery, {
            incluirRut: false,
            modoDemostracion: true
        });
        response.success(res, 200, 'Vista previa local del personal obtenida correctamente', resultado);
    } catch (error) {
        next(error);
    }
};