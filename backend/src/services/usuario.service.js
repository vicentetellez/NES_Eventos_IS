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

export async function updateUsuario(rut, usuario, persona){
    // Validamos que el usuario exista antes de intentar actualizarlo
    const existingUsuario = await prisma.usuario.findUnique({
        where: { rut }
    });
    if (!existingUsuario) throw new AppError('Usuario no encontrado', 404);

    // Si se está degradando el rol de un ADMIN, evitamos dejar el sistema sin administradores
    if (existingUsuario.rol === 'ADMIN' && usuario?.rol && usuario.rol !== 'ADMIN') {
        await ensureNotLastActiveAdmin(rut);
    }
    
    // Si el rut esta asociado a un usuario existente, podemos proceder con la actualización
    let updatedUsuario;
    let updatedPersona;
    // Modificamos sus datos de usuario si se enviaron
    if (usuario){
        const usuarioActualizado = await prisma.usuario.update({
            where: { rut },
            data: usuario
        });
        const { password: _password, ...usuarioActualizadoSeguro } = usuarioActualizado;
        updatedUsuario = usuarioActualizadoSeguro;
    }
    // Modificamos sus datos de persona si se enviaron
    if (persona){
        updatedPersona = await prisma.persona.update({
            where: { rut },
            data: persona
        });
    }

    // Retornamos el usuario actualizado junto con la persona asociada
    return { usuario: updatedUsuario, datoModificadoUsuario: usuario, persona: updatedPersona, datoModificadoPersona: persona };

}

export async function changeUsuarioStatus(rut, activo){
    // Validamos que el usuario exista antes de intentar cambiar su estado
    const existingUsuario = await prisma.usuario.findUnique({
        where: { rut }
    });
    if (!existingUsuario) throw new AppError('Usuario no encontrado', 404);
    // Validamos si se quiere cambiar a un estado que ya tiene el usuario
    if (existingUsuario.activo === activo){
        if (activo) throw new AppError('El usuario ya está activo', 400);
        if (!activo) throw new AppError('El usuario ya está inactivo', 400);
    }
    // Evitamos desactivar al último ADMIN activo del sistema
    if (existingUsuario.rol === 'ADMIN' && activo === false) {
        await ensureNotLastActiveAdmin(rut);
    }
    await prisma.usuario.update({
        where: { rut },
        data: { activo: activo }
    });
}

// Auto-cambio: el propio usuario cambia su password acreditando la actual (req.user.rut).
export async function changeOwnPassword(rut, currentPassword, newPassword){
    const existingUsuario = await prisma.usuario.findUnique({
        where: { rut }
    });
    if (!existingUsuario) throw new AppError('Usuario no encontrado', 404);

    // Acreditamos que quien cambia la password conoce la actual
    const isCurrentPasswordValid = await argon2.verify(existingUsuario.password, currentPassword);
    if (!isCurrentPasswordValid) throw new AppError('La contraseña actual es incorrecta', 401);

    // Validamos que la nueva password no sea igual a la actual
    if (currentPassword === newPassword) throw new AppError('La nueva password no puede ser igual a la actual', 400);

    const passwordHashed = await argon2.hash(newPassword, {
        type: ARGON2_TYPE,
        memoryCost: ARGON2_MEMORY_COST,
        timeCost: ARGON2_TIME_COST,
        parallelism: ARGON2_PARALLELISM,
    });

    await prisma.usuario.update({
        where: { rut },
        data: { password: passwordHashed, debeCambiarPassword: false }
    });
}

// Reset administrativo: un ADMIN restablece la password de otro usuario sin acreditar la actual.
export async function resetUsuarioPassword(rut, newPassword, callerRut){
    // El reset administrativo no reemplaza el auto-cambio: evita que un ADMIN se resetee a sí mismo sin currentPassword
    if (rut === callerRut) throw new AppError('Para cambiar tu propia contraseña usa el endpoint de auto-cambio', 400);

    // Validamos que el usuario exista antes de intentar cambiar su password
    const existingUsuario = await prisma.usuario.findUnique({
        where: { rut }
    });
    if (!existingUsuario) throw new AppError('Usuario no encontrado', 404);

    // Validamos que la nueva password no sea igual a la actual
    const isSamePassword = await argon2.verify(existingUsuario.password, newPassword);
    if (isSamePassword) throw new AppError('La nueva password no puede ser igual a la actual', 400);

    // Hasheamos la nueva password antes de actualizarla en la base de datos
    const passwordHashed = await argon2.hash(newPassword, {
        type: ARGON2_TYPE,
        memoryCost: ARGON2_MEMORY_COST,
        timeCost: ARGON2_TIME_COST,
        parallelism: ARGON2_PARALLELISM,
    });

    // La password es provisoria: se obliga a cambiarla en el próximo login
    await prisma.usuario.update({
        where: { rut },
        data: { password: passwordHashed, debeCambiarPassword: true }
    });
}