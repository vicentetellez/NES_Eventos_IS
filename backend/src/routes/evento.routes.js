import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { solicitudEventoLimiter } from '../middlewares/rateLimit.middleware.js';
import { 
    verifyRoles, 
    blockIfPasswordChangeRequired, 
    blockIfNotActive 
} from "../middlewares/authorization.middleware.js";
import {
    codigoEventoSchema,
    codigoEvaluacionEventoSchema,
    avanzarEstadoEventoSchema,
    getAllEventosByFilterEstadoSchema,
    getAlertasPagoPendienteSchema,
    solicitudEventoSchema,
    updateEventoSchema
} from '../schemas/evento.schema.js';
import {
    getAllEventosByFilterEstadoController,
    getAlertasPagoPendienteController,
    getEventoByCodigoController,
    getEventoByCodigoEvaluacionController,
    solicitudEventoController,
    updateEventoController,
    deleteEventoController,
    avanzarEstadoEventoController
} from '../controllers/evento.controller.js';

const router = Router();

router.get('/alertas/pagos-pendientes',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(getAlertasPagoPendienteSchema, 'query'),
            getAlertasPagoPendienteController);

router.post('/solicitud',
            solicitudEventoLimiter,
            validate(solicitudEventoSchema, 'body'),
            solicitudEventoController);

router.get('/', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(getAllEventosByFilterEstadoSchema, 'query'),
            getAllEventosByFilterEstadoController);

router.get('/:codigo', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            validate(codigoEventoSchema, 'params'),
            getEventoByCodigoController);

router.get('/evaluacion/:codigoEvaluacion', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            validate(codigoEvaluacionEventoSchema, 'params'),
            getEventoByCodigoEvaluacionController);

router.patch('/:codigo', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoEventoSchema, 'params'),
            validate(updateEventoSchema, 'body'),
            updateEventoController);
            
router.delete('/:codigo', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN'),
            validate(codigoEventoSchema, 'params'),
            deleteEventoController);

router.patch('/:codigo/avanzar-estado', 
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoEventoSchema, 'params'),
            validate(avanzarEstadoEventoSchema, 'body'),
            avanzarEstadoEventoController);

export default router;