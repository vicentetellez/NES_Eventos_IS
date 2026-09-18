import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { passwordChangeLimiter } from "../middlewares/rateLimit.middleware.js";
import { 
    verifyRoles, 
    blockIfPasswordChangeRequired, 
    blockIfNotActive 
} from "../middlewares/authorization.middleware.js";
import { 
    rutUsuarioSchema,
    getAllUsuariosByFilterStatusSchema,
    getUsuarioByRutSchema,
    createUsuarioSchema,
    updateUsuarioSchema,
    changeUsuarioStatusSchema,
    changeOwnPasswordSchema,
    resetUsuarioPasswordSchema
} from '../schemas/usuario.schema.js';
import { 
    getAllUsuariosByFilterStatusController,
    getUsuarioByRutController,
    createUsuarioController,
    updateUsuarioController,
    changeUsuarioStatusController,
    changeOwnPasswordController,
    resetUsuarioPasswordController
} from '../controllers/usuario.controller.js';


const router = Router();


router.get('/',
            authenticateJwt,
            blockIfNotActive,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(getAllUsuariosByFilterStatusSchema, 'query'),
            getAllUsuariosByFilterStatusController);

router.get('/:rut',
            authenticateJwt,
            blockIfNotActive,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(getUsuarioByRutSchema, 'params'),
            getUsuarioByRutController);

router.post('/',
            authenticateJwt,
            blockIfNotActive,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(createUsuarioSchema, 'body'),
            createUsuarioController);

router.patch('/:rut',
            authenticateJwt,
            blockIfNotActive,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(rutUsuarioSchema, 'params'),
            validate(updateUsuarioSchema, 'body'),
            updateUsuarioController);

router.patch('/:rut/status',
            authenticateJwt,
            blockIfNotActive,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(rutUsuarioSchema, 'params'),
            validate(changeUsuarioStatusSchema, 'query'),
            changeUsuarioStatusController);

// Auto-cambio: cualquier rol autenticado, siempre disponible aunque debeCambiarPassword sea true or false.
router.patch('/me/password',
            authenticateJwt,
            blockIfNotActive,
            passwordChangeLimiter,
            validate(changeOwnPasswordSchema, 'body'),
            changeOwnPasswordController);

// Reset administrativo: solo ADMIN, para cuando un STAFF pierde su contraseña.
router.patch('/:rut/password',
            authenticateJwt,
            blockIfNotActive,
            passwordChangeLimiter,
            blockIfPasswordChangeRequired,
            verifyRoles("ADMIN"),
            validate(rutUsuarioSchema, 'params'),
            validate(resetUsuarioPasswordSchema, 'body'),
            resetUsuarioPasswordController);


export default router;