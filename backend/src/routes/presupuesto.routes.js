import { Router } from 'express';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { calcularCotizacionInicialSchema } from '../schemas/presupuesto.schema.js';
import { calcularCotizacionInicialController } from '../controllers/presupuesto.controller.js';

const router = Router();

router.post('/calcular-inicial',
    authenticateJwt,
    blockIfPasswordChangeRequired,
    blockIfNotActive,
    verifyRoles('ADMIN', 'STAFF'),
    validate(calcularCotizacionInicialSchema),
    calcularCotizacionInicialController
);

export default router;