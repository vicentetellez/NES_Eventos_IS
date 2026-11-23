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