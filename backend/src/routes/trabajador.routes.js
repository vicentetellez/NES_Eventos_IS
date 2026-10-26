import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';
import { getRankingTrabajadoresSchema } from '../schemas/trabajador.schema.js';
import { RANKING_DEMO_PUBLIC } from '../config/configEnv.js';
import {
    getRankingTrabajadoresController,
    getRankingTrabajadoresDemoController
} from '../controllers/trabajador.controller.js';

const router = Router();

function allowLocalDemoRequest(req, res, next) {
    const remoteAddress = req.socket.remoteAddress?.replace(/^::ffff:/, '');
    if (remoteAddress !== '127.0.0.1' && remoteAddress !== '::1') {
        return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    next();
}

if (RANKING_DEMO_PUBLIC) {
    router.get('/ranking/demo',
        allowLocalDemoRequest,
        validate(getRankingTrabajadoresSchema, 'query'),
        getRankingTrabajadoresDemoController);
}

router.get('/ranking',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(getRankingTrabajadoresSchema, 'query'),
    getRankingTrabajadoresController);

export default router;