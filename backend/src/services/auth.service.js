import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from '../config/prisma.js';
import { JWT_SECRET } from "../config/configEnv.js";
import { AppError } from "../helpers/responses.js";

export async function me(rut){
    const user = await prisma.usuario.findUniqueOrThrow({ select: { rut: true, rol: true }, where: { rut } });
    return (user);
}

export async function loginService(data){
    const user = await prisma.usuario.findUnique({ select: { rut: true, password: true, rol: true }, where: { rut: data.rut } });
    if (!user) {
        throw new AppError("RUT o contraseña incorrectos.", 401);
    }
        
    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) {
        throw new AppError("RUT o contraseña incorrectos.", 401);
    }

    const token = jwt.sign(
        { rut: user.rut },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    const userDTO = {
        rut: user.rut,
        rol: user.rol
    };

    return ({ user: userDTO, token });
}