import { responses} from '../helpers/responses.js';
import { getEvaluacionEventoBycodigo, createEvaluacionEvento } from '../services/evaluacionEvento.service.js';

export const createEvaluacionEventoController = async (req, res, next) => {
    try{
        const {evaluacionEventoData} = req.body;
        const result = await createEvaluacionEvento(evaluacionEventoData);
        responses.success(res, 201, "Creacion de evaluacion del evento exitosa", result);
    }catch(error){
        next(error);
    }
};
