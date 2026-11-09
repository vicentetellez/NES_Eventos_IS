import { Router } from 'express';
import {
    createEvaluacionEventoController,
    existingEvaluacionEventoController,
    getEvaluacionEventoBycodigoController,
    getResenasEventosController
} from '../controllers/evaluacionEvento.controller.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { codigoEvaluacionEventoIdSchema, createEvaluacionEventoSchema } from '../schemas/evaluacionEvento.schema.js';
import { codigoEvaluacionEventoSchema } from '../schemas/evento.schema.js';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';

const router = Router();

router.get(
    '/resenas',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    getResenasEventosController
);

router.post(
    '/',
    validate(createEvaluacionEventoSchema, 'body'),
    createEvaluacionEventoController
);

router.get(
    '/existing/:codigoEvaluacion',
    validate(codigoEvaluacionEventoSchema, 'params'),
    existingEvaluacionEventoController
);

router.get(
    '/:codigo',
    validate(codigoEvaluacionEventoIdSchema, 'params'),
    getEvaluacionEventoBycodigoController
);

export default router;
