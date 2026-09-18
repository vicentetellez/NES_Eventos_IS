// Permitir que el ADMIN pueda listar, crear, editar y desactivar (activo: false) cuentas de tipo STAFF y ADMIN.
// Permitir que un Usuario pueda modificar su password habiendo ingresado 2 veces la contraseña actual.

import argon2 from 'argon2';
import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'
import { createPersona } from './persona.service.js'
import { ARGON2_TYPE, ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM } from '../config/configEnv.js';

// Evita dejar el sistema sin ningún ADMIN activo al degradar/desactivar una cuenta.
async function ensureNotLastActiveAdmin(rutExcluido) {
    const otrosAdminsActivos = await prisma.usuario.count({
        where: { rol: 'ADMIN', activo: true, NOT: { rut: rutExcluido } }
    });
    if (otrosAdminsActivos === 0) {
        throw new AppError('No se puede modificar: es el último ADMIN activo del sistema', 400);
    }
}


export async function getAllUsuariosByFilterStatus(filtroActivo) {
    const usuarios = await prisma.usuario.findMany({
        where: { activo: filtroActivo },
        select: {
            rol: true,
            activo: true,
            fechaRegistro: true,
            persona: {
                select: {
                    rut: true,
                    nombre: true,
                    primerApellido: true,
                    segundoApellido: true
                }
            }
        }
    });

    if (usuarios.length === 0) {
        if (filtroActivo) throw new AppError(`No hay usuarios activos registrados`, 404);
        if (!filtroActivo) throw new AppError(`No hay usuarios inactivos registrados`, 404);
    }

    return { usuarios };
}

export async function getUsuarioByRut(rut) {
    const usuario = await prisma.usuario.findUnique({
        where: { rut },
        select: {
            rol: true,
            activo: true,
            debeCambiarPassword: true,
            ultimoAcceso: true,
            fechaRegistro: true,
            persona: true
        }
    });
    if (!usuario) throw new AppError('Usuario no encontrado', 404);

    return { usuario };
}

// La logica es que cuando un ADMIN crea un usuario, primero se crea la persona asociada si se proporciona información de persona.
// Esto asegura que la persona exista antes de crear el usuario, evitando errores de integridad referencial.
// Luego se procede a crear el usuario con la referencia a la persona existente.
// Si no se proporciona información de persona, se asume que la persona ya existe en la base de datos.
export async function createUsuario(usuario, persona){
    let personaData;
    // Si viene información de persona, la creamos antes de crear el usuario.
    if (persona){
        personaData = {
            ...persona,
            fechaNacimiento: new Date(persona.fechaNacimiento)
        };
        await createPersona(personaData);
    }
    // Si no viene información de persona, verificamos que la persona ya exista en la base de datos. (Por integridad)
    const existingPersona = await prisma.persona.findUnique({
        where: { rut: usuario.rut }
    });
    if (!existingPersona) throw new AppError(`No existe persona en el sistema con el RUT ${usuario.rut}`, 404);
    
    
    // Validamos que el rut no exista previamente como un Usuario antes de intentar crearlo.
    const existingUsuario = await prisma.usuario.findUnique({
        where: { rut: usuario.rut }
    });
    if (existingUsuario) throw new AppError('El usuario ya existe', 400);


    // Si el usuario no existe, aseguramos la password entregada por el usuario
    const passwordHashed = await argon2.hash(usuario.password, {
        type: ARGON2_TYPE,
        memoryCost: ARGON2_MEMORY_COST,
        timeCost: ARGON2_TIME_COST,
        parallelism: ARGON2_PARALLELISM,
    });
    usuario.password = passwordHashed;
    // Creamos el nuevo usuario en la base de datos con la password hasheada
    const usuarioCreado = await prisma.usuario.create({ data: usuario });

    const { password: _password, rut: _rut, ...usuarioSeguro } = usuarioCreado;

    return { usuario: usuarioSeguro, persona: personaData };
}

