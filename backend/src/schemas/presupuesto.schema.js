import { z } from 'zod';

const detalleAdicionalSchema = z.object({
    categoria: z.enum([
        'PERSONAL',
        'EQUIPAMIENTO',
        'TRANSPORTE',
        'BANQUETERIA',
        'DECORACION',
        'OTRO'
    ]),
    descripcion: z.string().min(1).max(500),
    cantidad: z.number().int().positive(),
    precioUnitario: z.number().int().nonnegative()
}).strict();

export const calcularCotizacionInicialSchema = z.object({
    codigoTipoEvento: z.number().int().positive(),
    horasEvento: z.number().int().positive(),
    horasMontaje: z.number().int().nonnegative().default(0),
    horasDesmontaje: z.number().int().nonnegative().default(0),
    cantidadPersonas: z.number().int().positive(),
    detallesAdicionales: z.array(detalleAdicionalSchema).default([])
}).strict();