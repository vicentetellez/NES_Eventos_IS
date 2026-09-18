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