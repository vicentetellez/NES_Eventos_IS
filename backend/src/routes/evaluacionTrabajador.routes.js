import { Router } from 'express';
import {
    createEvaluacionTrabajadorController,
    getTrabajadoresParaEvaluacionController
} from '../controllers/evaluacionTrabajador.controller.js';
import { validate } from '../middlewares/validate.middlewares.js';
import {
    codigoEvaluacionTrabajadorSchema,
    createEvaluacionTrabajadorSchema
} from '../schemas/evaluacionTrabajador.schema.js';

const router = Router();

router.post(
    '/',
    validate(createEvaluacionTrabajadorSchema, 'body'),
    createEvaluacionTrabajadorController
);

router.get(
    '/evento/:codigoEvento',
    validate(codigoEvaluacionTrabajadorSchema, 'params'),
    getTrabajadoresParaEvaluacionController
);

export default router;
