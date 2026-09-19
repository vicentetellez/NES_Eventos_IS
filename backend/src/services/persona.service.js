import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js'

export async function createPersona(data){
    const existingPersona = await prisma.persona.findUnique({
        where: { rut: data.rut }
    });
    // Si la persona no existe, procedemos a crearla.
    if (!existingPersona){
        const persona = await prisma.persona.create({ data });
        return { persona };
    }
    return { existingPersona };
}