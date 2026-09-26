import rateLimit from 'express-rate-limit';

// Configuración del limitador específico para endpoints sensibles
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //  Ventana de tiempo: 15 minutos
    max: 8, // Límite: Máximo 8 intentos por IP dentro de los 15 minutos
  
    // Mensaje y código de estado que recibirá el cliente al superar el límite
    message: {
        status: 429,
        message: 'Demasiados intentos de inicio de sesión. Por favor, inténtalo de nuevo en 15 minutos.'
    },
  
    standardHeaders: true,   
    legacyHeaders: false, 
});

// Limitador para endpoints de cambio/reseteo de contraseña (previene fuerza bruta sobre currentPassword)
export const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Ventana de tiempo: 15 minutos
    max: 6, // Límite: Máximo 6 intentos por IP dentro de los 15 minutos

    message: {
        status: 429,
        message: 'Demasiados intentos de cambio de contraseña. Por favor, inténtalo de nuevo en 15 minutos.'
    },

    standardHeaders: true,
    legacyHeaders: false,
});

export const solicitudEventoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 4,
    message: {
        status: 429,
        message: 'Demasiadas solicitudes de evento. Inténtalo nuevamente en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});