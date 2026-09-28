import prisma from '../config/prisma.js';
import { AppError } from '../helpers/responses.js';
import { datosClienteNuevoCompletoSchema } from '../schemas/cliente.schema.js';

export async function getClienteByRut(rut) {
    const cliente = await prisma.cliente.findUnique({
        where: { rut },
        include: { persona: true }
    });

    if (!cliente) {
        throw new AppError(`No se encontró un cliente con el RUT especificado (${rut})`, 404);
    }

    return { cliente };
}

export async function clienteExisteParaSolicitud(rut) {
	const cliente = await prisma.cliente.findUnique({
		where: { rut },
		select: { rut: true , activo: true}
	});

    if (!cliente) {
        return { existe: false };
    }
    // Mandamos si el cliente esta activo o no para que el frontend lo maneje de mejor manera
	return { existe: true , activo: cliente.activo };
}

export async function obtenerOrCrearCliente(prismaTransaction, rut, datosClienteNuevo) {
	// Intentamos obtener el cliente por su RUT antes de crearlo. Si ya existe, lo retornamos.
    let cliente = await prismaTransaction.cliente.findUnique({
		where: { rut }
	});
    if (cliente && cliente.activo === false) throw new AppError(`El cliente con RUT ${rut} está inactivo`, 403);
	if (cliente && cliente.activo === true) return cliente;
    // Si el cliente no existe, vemos si hay una persona asociada con el mismo RUT antes de crearla.
	const persona = await prismaTransaction.persona.findUnique({
		where: { rut },
		select: { rut: true }
	});
        // SI NO EXISTE, LA CREAMOS CON LOS DATOS ENTREGADOS
	if (!persona) {
        if (!datosClienteNuevo) {
            throw new AppError("No se proporcionaron datos para crear al cliente", 400);
        }
		const resultadoValidacion = datosClienteNuevoCompletoSchema.safeParse(datosClienteNuevo);
		if (!resultadoValidacion.success) {
			throw new AppError("Los datos para crear al cliente son inválidos", 400);
		}
		const datosClienteValidados = resultadoValidacion.data;

		await prismaTransaction.persona.create({
			data: {
				rut,
				...datosClienteValidados,
				fechaNacimiento: datosClienteValidados.fechaNacimiento ? new Date(datosClienteValidados.fechaNacimiento) : undefined
			}
		});
	}

	cliente = await prismaTransaction.cliente.create({
		data: { rut }
	});

	return cliente;
}
