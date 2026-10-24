import { responses} from '../helpers/responses.js';
import { getEvaluacionEventoBycodigo, createEvaluacionEvento } from '../services/evaluacionEvento.service.js';
export const existingEvaluacionEventoController = async (req, res, next) => {
    try {
        const {codigoEvaluacion} = req.validatedParams;
        const existe = await existingEvaluacionEvento(codigoEvaluacion);
        response.success(res, 200, 'Consulta de evaluación existente exitosa', existe);
    } catch(error) {
        next(error);
    }
};

export const createEvaluacionEventoController = async (req, res, next) => {
    try{
        const {evaluacionEventoData} = req.body;
        const result = await createEvaluacionEvento(evaluacionEventoData);
        responses.success(res, 201, "Creacion de evaluacion del evento exitosa", result);
    }catch(error){
        next(error);
    }
};

export const getEvaluacionEventoBycodigoController = async (req, res, next) => {
    try {
        const {codigo} = req.validatedParams;
        const result = await getEvaluacionEventoBycodigo(codigo);
        responses.success(res, 200, "Busqueda de evaluacion del evento exitosa", result);
    }catch(error){
        next(error);
    }
};