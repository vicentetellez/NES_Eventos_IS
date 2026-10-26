import { response } from "../helpers/responses.js";
import { getTrabajadoresParaEvaluacionByCodigoEvento, createEvaluacionTrabajadores} from "../services/evaluacionTrabajador.service.js";

export const createEvaluacionTrabajadorController = async (req, res, next) => {
    try{
        const {evaluacionesTrabajadores} = req.body;
        const result = await createEvaluacionTrabajadores(evaluacionesTrabajadores);
        response.success(res, 201, "Creacion de evaluaciones de trabajadores exitosa", result);
    }catch(error){
        next(error);
    }
};

export const getTrabajadoresParaEvaluacionController = async (req, res, next) => {
    try {
        const {codigoEvento} = req.validatedParams;
        const result = await getTrabajadoresParaEvaluacionByCodigoEvento(codigoEvento);
        response.success(res, 200, "Busqueda de trabajadores por especialidad exitosa", result);
    }catch(error){
        next(error);
    }
};