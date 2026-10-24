import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';

export async function existingEvaluacionEvento(codigoEvaluacion){
    const evento = await prisma.evento.findUnique({
        where: {codigoEvaluacion},
        select: {codigo: true}
    });
    if(!evento) throw new AppError('Evento no encontrado',404);

    
    const evaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where: {codigoEvento: evento.codigo},
        select: {codigo: true}
    });
    return evaluacionEvento !== null;
}

export async function createEvaluacionEvento(evaluacionEvento){
    const existingEvaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where : {codigo: evaluacionEvento.codigo}
    });
    if(existingEvaluacionEvento) throw new AppError('La evaluacion del evento ya existe',400);

    const newEvaluacionEvento = await prisma.evaluacionEvento.create({
        data: evaluacionEvento
    });

    return {evaluacionEvento: newEvaluacionEvento};
}

export async function getEvaluacionEventoBycodigo(codigo){
    const evaluacionEvento = await prisma.evaluacionEvento.findUnique({
        where: {codigo}
    });
    if(!evaluacionEvento) throw new AppError('Evaluacion del evento no encontrada',404);
    return {evaluacionEvento};
}