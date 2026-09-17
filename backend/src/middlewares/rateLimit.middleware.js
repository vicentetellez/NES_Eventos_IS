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