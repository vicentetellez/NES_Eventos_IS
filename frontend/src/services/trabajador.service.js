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

    return resultado;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || 'Error al obtener el ranking de trabajadores',
    );
  }
};
