import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/configEnv.js";
import { AppError } from "../helpers/responses.js";


export function authenticateJwt(req, res, next) {
    const authHeader = req.cookies?.access_token;

    if (!authHeader)
        return next(new AppError("Token no proporcionado", 401));

    const token = authHeader;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError("Token inválido o expirado", 403));
    }
};