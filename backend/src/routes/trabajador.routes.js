import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';
import { getRankingTrabajadoresSchema } from '../schemas/trabajador.schema.js';
import { getRankingTrabajadoresController } from '../controllers/trabajador.controller.js';

const router = Router();

router.get('/ranking',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(getRankingTrabajadoresSchema, 'query'),
    getRankingTrabajadoresController);

export default router;