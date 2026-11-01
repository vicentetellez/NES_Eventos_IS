import { Router } from 'express';
import { authenticateJwt } from '../middlewares/authentication.middleware.js';
import {
    blockIfNotActive,
    blockIfPasswordChangeRequired,
    verifyRoles
} from '../middlewares/authorization.middleware.js';
import { validate } from '../middlewares/validate.middlewares.js';
import { codigoEventoSchema } from '../schemas/evento.schema.js';
import {
    asignarTrabajadorSchema,
    catalogoTrabajadoresQuerySchema,
    desasignarTrabajadorParamsSchema
} from '../schemas/asignacionTrabajador.schema.js';
import {
    asignarTrabajadorController,
    desasignarTrabajadorController,
    listarCatalogoTrabajadoresController,
    listarTrabajadoresAsignadosController
} from '../controllers/asignacionTrabajador.controller.js';

const router = Router();

const autenticado = [authenticateJwt, blockIfPasswordChangeRequired, blockIfNotActive];

router.get('/:codigo/trabajadores/catalogo',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(catalogoTrabajadoresQuerySchema, 'query'),
    listarCatalogoTrabajadoresController
);

router.get('/:codigo/trabajadores',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    listarTrabajadoresAsignadosController
);

router.post('/:codigo/trabajadores',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(asignarTrabajadorSchema),
    asignarTrabajadorController
);

router.delete('/:codigo/trabajadores/:rut/:codigoEspecialidad',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(desasignarTrabajadorParamsSchema, 'params'),
    desasignarTrabajadorController
);

export default router;
