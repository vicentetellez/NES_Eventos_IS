import { z } from 'zod';

export const actualizarEquiposEventoSchema = z.object({
    equipos: z.array(z.object({
        codigoEquipo: z.number().int().positive(),
        cantidadUsada: z.number().int().nonnegative().max(2147483647),
        precioUnitarioAcordado: z.number().int().nonnegative().max(2147483647).optional()
    }).strict()).max(200)
}).strict().superRefine(({ equipos }, context) => {
    const codigos = equipos.map(({ codigoEquipo }) => codigoEquipo);
    if (new Set(codigos).size !== codigos.length) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['equipos'],
            message: 'No se puede repetir un equipo en la lista.'
        });
    }
});
