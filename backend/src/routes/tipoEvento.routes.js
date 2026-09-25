import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
    verifyRoles, 
    blockIfPasswordChangeRequired, 
    blockIfNotActive 
} from "../middlewares/authorization.middleware.js";
import {
    codigoTipoEventoSchema,
    getAllTipoEventosByFilterStatusSchema,
    createTipoEventoSchema,
    updateTipoEventoSchema,
    changeTipoEventoStatusSchema
} from '../schemas/tipoEvento.schema.js';
import { 
    getAllTipoEventosByFilterStatusController,
    getTiposEventoPublicosController,
    getTipoEventoByCodigoController,
    createTipoEventoController,
    updateTipoEventoController,
    changeTipoEventoStatusController
} from '../controllers/tipoEvento.controller.js';

const router = Router();

router.get('/publicos', getTiposEventoPublicosController);

router.get('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(getAllTipoEventosByFilterStatusSchema, 'query'),
            getAllTipoEventosByFilterStatusController);

router.get('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoTipoEventoSchema, 'params'),
            getTipoEventoByCodigoController);

router.post('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(createTipoEventoSchema, 'body'),
            createTipoEventoController);

router.patch('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoTipoEventoSchema, 'params'),
            validate(updateTipoEventoSchema, 'body'),
            updateTipoEventoController);

router.patch('/:codigo/status',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoTipoEventoSchema, 'params'),
            validate(changeTipoEventoStatusSchema, 'query'),
            changeTipoEventoStatusController);

export default router;