import { NODE_ENV } from '../config/configEnv.js';
import { response } from '../helpers/responses.js';
import { 
    me,
    loginService
} from '../services/auth.service.js';


export const loginController = async (req, res, next) => {
    try {
        const result = await loginService(req.body);
        res.cookie('access_token', result.token,
                    {   httpOnly: true,
                        secure: NODE_ENV === 'production', // Es true en producción si se usa HTTPS
                        sameSite: 'lax', 
                        maxAge: 3600000 
                    });
        response.success(res, 200, 'Login exitoso', result);
    } catch (error) {
        next(error);
    }
};

