import { COOKIE_SECURE } from '../config/configEnv.js';
import { response } from '../helpers/responses.js';
import { 
    me,
    loginService
} from '../services/auth.service.js';


export const meController = async (req, res, next) => {
    try {
        const result = await me(req.user.rut);
        response.success(res, 200, 'Información del usuario', result);
    } catch (error) {
        next(error);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const result = await loginService(req.body);
        res.cookie('access_token', result.token,
                    {   httpOnly: true,
                        secure: COOKIE_SECURE,
                        sameSite: 'lax', 
                        maxAge: 3600000 
                    });
        response.success(res, 200, 'Login exitoso', result);
    } catch (error) {
        next(error);
    }
};

export const logoutController = async (req, res, next) => {
    try {
        res.clearCookie('access_token', 
                    { 
                        httpOnly: true, 
                        secure: COOKIE_SECURE,
                        sameSite: 'lax' 
                    });
        response.success(res, 200, 'Logout exitoso');
    } catch (error) {
        next(error);
    }
};