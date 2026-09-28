import { response } from '../helpers/responses.js';
import {
    clienteExisteParaSolicitud
} from '../services/cliente.service.js';

export const clienteExisteParaSolicitudController = async (req, res, next) => {
    try {
        const { rut } = req.validatedParams;
        const result = await clienteExisteParaSolicitud(rut);
        response.success(res, 200, "Verificación de existencia de cliente para solicitud exitosa", result);
    } catch (error) {
        next(error);
    }
};