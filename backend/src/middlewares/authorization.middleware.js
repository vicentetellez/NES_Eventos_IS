import { AppError } from '../helpers/responses.js';
import prisma from '../config/prisma.js';

export function verifyRoles(...rolesPermitidos) {
    return (req, res, next) => {
        try {
            const userRole = req.user.rol || null;
            if (!userRole) {
                return next(new AppError("Token invalido o expirado", 401));
            }

            if (!rolesPermitidos.includes(userRole)) {
                const validRolesNames = rolesPermitidos.join(", ");
                return next(new AppError(`Acceso denegado: se necesitan privilegios de ${validRolesNames}`, 403));
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

// Bloquea cualquier acción hasta que el usuario cambie una contraseña provisoria (asignada por un reset de ADMIN).
export async function blockIfPasswordChangeRequired(req, res, next) {
    try {
        const usuario = await prisma.usuario.findUnique({
            where: { rut: req.user.rut },
            select: { debeCambiarPassword: true }
        });
        if (!usuario) return next(new AppError("Sesión inválida", 401));

        if (usuario.debeCambiarPassword) {
            return next(new AppError("Debe cambiar su contraseña provisoria antes de continuar", 403));
        }
        next();
    } catch (error) {
        next(error);
    }
}
}