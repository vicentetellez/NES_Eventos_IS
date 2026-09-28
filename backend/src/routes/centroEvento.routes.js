import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
    verifyRoles, 
    blockIfPasswordChangeRequired, 
    blockIfNotActive 
} from "../middlewares/authorization.middleware.js";
import {
    codigoCentroEventoSchema,
    getAllCentroEventosByFilterStatusSchema,
    createCentroEventoSchema,
    updateCentroEventoSchema,
    changeCentroEventoStatusSchema
} from '../schemas/centroEvento.schema.js';
import { 
    getAllCentroEventosByFilterStatusController,
    getCentrosEventoPublicosController,
    getCentroEventoByCodigoController,
    createCentroEventoController,
    updateCentroEventoController,
    changeCentroEventoStatusController
} from '../controllers/centroEvento.controller.js';

const router = Router();

router.get('/publicos', getCentrosEventoPublicosController);

router.get('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(getAllCentroEventosByFilterStatusSchema, 'query'),
            getAllCentroEventosByFilterStatusController);

router.get('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoCentroEventoSchema, 'params'),
            getCentroEventoByCodigoController);

router.post('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(createCentroEventoSchema, 'body'),
            createCentroEventoController);

router.patch('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoCentroEventoSchema, 'params'),
            validate(updateCentroEventoSchema, 'body'),
            updateCentroEventoController);

router.patch('/:codigo/status',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoCentroEventoSchema, 'params'),
            validate(changeCentroEventoStatusSchema, 'query'),
            changeCentroEventoStatusController);

export default router;