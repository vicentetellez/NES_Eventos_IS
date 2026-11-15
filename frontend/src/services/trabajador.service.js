import api from './root.service.js';

export const getRankingTrabajadores = async (filtros = {}) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filtros).filter(([, value]) => value !== ''),
    );
    const { data } = await api.get('/trabajador/ranking', { params });
    const resultado = data?.data;

    if (!Array.isArray(resultado?.trabajadores)) {
      throw new Error('El servidor no entregó el ranking de trabajadores.');
    }
    if (!Array.isArray(resultado?.especialidadesDisponibles)) {
      throw new Error('El servidor no entregó la lista de cargos o especialidades.');
    }

    return resultado;
  } catch (error) {
    const mensaje = error.response?.data?.message
      || error.message
      || 'Error al obtener el ranking de trabajadores';
    throw new Error(mensaje, { cause: error });
  }
};
