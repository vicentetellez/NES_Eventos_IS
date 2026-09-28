import { response } from '../helpers/responses.js';
import { calcularCotizacionInicialDesdeCatalogos } from '../services/presupuesto.service.js';

export async function calcularCotizacionInicialController(req, res, next) {
    try {
        const resultado = await calcularCotizacionInicialDesdeCatalogos(req.body);
        response.success(res, 200, 'Cálculo de cotización inicial exitoso', resultado);
    } catch (error) {
        next(error);
    }
}