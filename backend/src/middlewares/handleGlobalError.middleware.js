import { response } from '../helpers/responses.js';

export const errorHandler = (err, req, res, next) => {
    if (!err) {
        return response.success(res, 200, 'No error');
    }

    // ERRORES DE PRISMA ORM
    if (err.code === 'P2002') {
        return response.clientError(res, 409, `Conflicto: ya existe un registro con el mismo valor para ${err.meta?.target}`);
    }
    if (err.code === 'P2025') {
        return response.clientError(res, 404, 'El recurso solicitado no fue encontrado en la base de datos');
    }
    if (err.code === 'P2003') {
        return response.clientError(res, 400, 'La relación indicada no es válida (clave foránea inexistente)');
    }
    
    // ERRORES CONOCIDOS
    if (err.name === 'AppError') {
        return response.clientError(res, err.statusCode, err.message);
    }

    // ERRORES DESCONOCIDOS
    // Extraemos el contexto de la petición para saber dónde y quién provocó el error
    const context = {
        method: req.method,
        url: req.originalUrl,
        userId: req.user ? req.user.rut : 'Anónimo', // Si usas un middleware que inyecte req.user
        ip: req.ip
    };
    // Logueamos en la consola del servidor el stack completo y el contexto
    console.error('--- [SERVER ERROR LOG] ---');
    console.error(`Contexto: ${context.method} ${context.url} | Usuario ID: ${context.userId} | IP: ${context.ip}`);
    console.error('Stack Trace del Error:');
    console.error(err.stack || err); // .stack muestra la línea exacta del código donde explotó
    console.error('---------------------------');
    if (process.env.NODE_ENV === 'development') {
        // En desarrollo nos interesa ver el detalle directo en Postman/Navegador para arreglarlo rápido
        return res.status(500).json({
            status: 'error',
            message: err.message || 'Error interno del servidor',
            stack: err.stack, // Revelamos el stack solo en desarrollo
            context
        });
    }

    return response.serverError(res, 500, 'Error interno del servidor');
};