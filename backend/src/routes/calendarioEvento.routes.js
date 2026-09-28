import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    verifyRoles,
    blockIfPasswordChangeRequired,
    blockIfNotActive
} from '../middlewares/authorization.middleware.js';

import {
    normalizarFechaSchema,
    createCalendarioEventoSchema,
    getEstadoCalendarioEventoSchema
} from '../schemas/calendarioEvento.schema.js';

import {
    normalizarFechaController,
    getAllCalendarioEventosController,
    createCalendarioEventoController,
    getEstadoCalendarioEventoController
} from '../controllers/calendarioEvento.controller.js';

const router = Router();

router.get('/',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    getAllCalendarioEventosController
);

router.get('/normalizar-fecha',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(normalizarFechaSchema, 'query'),
    normalizarFechaController
);

router.get('/estado',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(getEstadoCalendarioEventoSchema, 'body'),
    getEstadoCalendarioEventoController
);

router.post('/',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(createCalendarioEventoSchema, 'body'),
    createCalendarioEventoController
);

export default router;
