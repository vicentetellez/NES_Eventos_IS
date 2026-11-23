import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from '../config/prisma.js';
import { JWT_SECRET } from "../config/configEnv.js";
import { AppError } from "../helpers/responses.js";

const userProfileSelect = {
    rut: true,
    rol: true,
    activo: true,
    debeCambiarPassword: true,
    ultimoAcceso: true,
    fechaRegistro: true,
    persona: true
};

export async function me(rut) {
    const user = await prisma.usuario.findUnique({
        where: { rut },
        select: userProfileSelect
    });
    return user;
}

export async function loginService(data){
    const user = await prisma.usuario.findUnique({ 
        select: { 
            rut: true, 
            password: true, 
            rol: true, 
            activo: true,
            debeCambiarPassword: true 
        },
        where: { rut: data.rut } 
    });
    if (!user) {
        throw new AppError("RUT o contraseña incorrectos.", 401);
    }
        
    const isPasswordValid = await argon2.verify(user.password, data.password);
    if (!isPasswordValid) {
        throw new AppError("RUT o contraseña incorrectos.", 401);
    }

    if (!user.activo) {
        throw new AppError("Usuario inactivo.", 403);
    }

    const userDTO = await prisma.usuario.update({
        where: { rut: user.rut },
        data: { ultimoAcceso: new Date() },
        select: userProfileSelect
    });

    const token = jwt.sign(
        { 
            rut: user.rut,
            rol: user.rol
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return ({ user: userDTO, token });
}