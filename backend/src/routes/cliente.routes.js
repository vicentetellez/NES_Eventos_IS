import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import {
    rutClienteSchema
} from '../schemas/cliente.schema.js';
import { 
    clienteExisteParaSolicitudController
} from '../controllers/cliente.controller.js';

const router = Router();

router.get('/existe-para-solicitud/:rut', 
            validate(rutClienteSchema, 'params'), 
            clienteExisteParaSolicitudController
            );

export default router;