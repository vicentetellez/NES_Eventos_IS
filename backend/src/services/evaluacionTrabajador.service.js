import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
export async function getTrabajadoresParaEvaluacionByCodigoEvento(codigoEvento){
    const evento = await prisma.evento.findUnique({
        where: {codigo: codigoEvento},
        select: {estado: true}
    });
    if(!evento) throw new AppError('Evento no encontrado',404);
    if(evento.estado !== 'FINALIZADO') {
        throw new AppError('Solo se pueden evaluar trabajadores en eventos finalizados',400);
    }

    const participaciones = await prisma.trabajadorParticipaEvento.findMany({
        where: {
            codigoEvento,
            especialidad: {is: {esEvaluable: true}}
        },
        include: {
            especialidad: {
                select: {codigo: true, nombre: true}
            },
            trabajador: {
                include: {persona: true}
            }
        }
    });

    const especialidadesPorCodigo = new Map();
    for (const participacion of participaciones) {
        const {especialidad, trabajador} = participacion;
        if (!especialidadesPorCodigo.has(especialidad.codigo)) {
            especialidadesPorCodigo.set(especialidad.codigo, {
                codigo: especialidad.codigo,
                nombre: especialidad.nombre,
                trabajadores: []
            });
        }
        especialidadesPorCodigo.get(especialidad.codigo).trabajadores.push(trabajador);
    }

    const especialidades = [...especialidadesPorCodigo.values()]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    return {especialidades};
}


