import { Router } from 'express';
import { validate } from '../middlewares/validate.middlewares.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { loginSchema } from '../schemas/auth.schema.js';
import { 
    meController,
    loginController, 
    logoutController
} from '../controllers/auth.controller.js';


const router = Router();


router.get('/me', 
            authenticateJwt, 
            meController);
router.post('/login', 
            authLimiter,
            validate(loginSchema, 'body'), 
            loginController);
router.post('/logout', 
            authenticateJwt, 
            logoutController);

export default router;