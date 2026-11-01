import { z } from 'zod';

const textoFiltroSchema = z.string().trim().min(1).max(100).optional();
const aniosExperienciaSchema = z.coerce.number().int().min(0).max(80).optional();

export const getRankingTrabajadoresSchema = z.object({
    nombre: textoFiltroSchema,
    especialidad: textoFiltroSchema,
    aniosExperienciaMin: aniosExperienciaSchema,
    aniosExperienciaMax: aniosExperienciaSchema
}).strict().superRefine((filtros, context) => {
    if (filtros.aniosExperienciaMin !== undefined
        && filtros.aniosExperienciaMax !== undefined
        && filtros.aniosExperienciaMin > filtros.aniosExperienciaMax) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['aniosExperienciaMin'],
            message: 'La experiencia mínima no puede superar la experiencia máxima.'
        });
    }
});