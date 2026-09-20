import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { 
    verifyRoles, 
    blockIfPasswordChangeRequired, 
    blockIfNotActive 
} from "../middlewares/authorization.middleware.js";
import {
    codigoBanqueteriaSchema,
    getAllBanqueteriasByFilterStatusSchema,
    createBanqueteriaSchema,
    updateBanqueteriaSchema,
    changeBanqueteriaStatusSchema
} from '../schemas/banqueteria.schema.js';
import { 
    getAllBanqueteriasByFilterStatusController,
    getBanqueteriaByCodigoController,
    createBanqueteriaController,
    updateBanqueteriaController,
    changeBanqueteriaStatusController
} from '../controllers/banqueteria.controller.js';

const router = Router();

router.get('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(getAllBanqueteriasByFilterStatusSchema, 'query'),
            getAllBanqueteriasByFilterStatusController);

router.get('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoBanqueteriaSchema, 'params'),
            getBanqueteriaByCodigoController);

router.post('/',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(createBanqueteriaSchema, 'body'),
            createBanqueteriaController);

router.patch('/:codigo',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoBanqueteriaSchema, 'params'),
            validate(updateBanqueteriaSchema, 'body'),
            updateBanqueteriaController);

router.patch('/:codigo/status',
            authenticateJwt,
            blockIfPasswordChangeRequired,
            blockIfNotActive,
            verifyRoles('ADMIN', 'STAFF'),
            validate(codigoBanqueteriaSchema, 'params'),
            validate(changeBanqueteriaStatusSchema, 'query'),
            changeBanqueteriaStatusController);

export default router;