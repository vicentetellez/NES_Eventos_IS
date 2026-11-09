import { Router } from 'express';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { codigoEventoSchema } from '../schemas/evento.schema.js';
import { actualizarEquiposEventoSchema } from '../schemas/equipoEvento.schema.js';
import {
    actualizarEquiposEventoController,
    listarCatalogoEquiposController,
    listarEquiposEventoController
} from '../controllers/equipoEvento.controller.js';

const router = Router();
const autenticado = [authenticateJwt, blockIfPasswordChangeRequired, blockIfNotActive];

router.get('/:codigo/equipos/catalogo',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    listarCatalogoEquiposController
);

router.get('/:codigo/equipos',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    listarEquiposEventoController
);

router.put('/:codigo/equipos',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(actualizarEquiposEventoSchema),
    actualizarEquiposEventoController
);

export default router;
