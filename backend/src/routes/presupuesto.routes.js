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
    actualizarPresupuestoSchema,
    ajustarEventoSchema,
    crearPresupuestoSchema,
    listarPresupuestosSchema,
    rechazarPresupuestoSchema,
    vistaPreviaCantidadPersonasSchema
} from '../schemas/presupuesto.schema.js';
import {
    actualizarPresupuestoController,
    ajustarEventoYPresupuestoController,
    crearPresupuestoController,
    descargarPdfSegundoAbonoController,
    enviarPresupuestoAValidacionController,
    listarPresupuestosController,
    obtenerPrecargaPresupuestoController,
    obtenerPresupuestoController,
    obtenerVistaPreviaCantidadPersonasController,
    rechazarPresupuestoController,
    validarPresupuestoController
} from '../controllers/presupuesto.controller.js';

const router = Router();

const autenticado = [authenticateJwt, blockIfPasswordChangeRequired, blockIfNotActive];

// verifyRoles('STAFF') también habilita al GERENTE (hereda lo que puede hacer el staff)
router.get('/',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(listarPresupuestosSchema, 'query'),
    listarPresupuestosController
);

router.get('/evento/:codigo/precarga',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    obtenerPrecargaPresupuestoController
);

router.get('/evento/:codigo/vista-previa-cantidad-personas',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(vistaPreviaCantidadPersonasSchema, 'query'),
    obtenerVistaPreviaCantidadPersonasController
);

router.get('/evento/:codigo/pdf-segundo-abono',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    descargarPdfSegundoAbonoController
);

router.get('/evento/:codigo',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    obtenerPresupuestoController
);

router.post('/evento/:codigo',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(crearPresupuestoSchema),
    crearPresupuestoController
);

router.put('/evento/:codigo',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(actualizarPresupuestoSchema),
    actualizarPresupuestoController
);

router.patch('/evento/:codigo/ajustar-evento',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    validate(ajustarEventoSchema),
    ajustarEventoYPresupuestoController
);

router.patch('/evento/:codigo/enviar-validacion',
    ...autenticado,
    verifyRoles('ADMIN', 'STAFF'),
    validate(codigoEventoSchema, 'params'),
    enviarPresupuestoAValidacionController
);

router.patch('/evento/:codigo/validar',
    ...autenticado,
    verifyRoles('GERENTE'),
    validate(codigoEventoSchema, 'params'),
    validarPresupuestoController
);

router.patch('/evento/:codigo/rechazar',
    ...autenticado,
    verifyRoles('GERENTE'),
    validate(codigoEventoSchema, 'params'),
    validate(rechazarPresupuestoSchema),
    rechazarPresupuestoController
);

export default router;
