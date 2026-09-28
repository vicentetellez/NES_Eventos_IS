import api from './root.service.js';

export const getCentrosEventoPublicos = async () => {
  try {
    const { data } = await api.get('/centro-evento/publicos');
    return data.data.centroEventos;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener los centros de evento';
    throw new Error(mensajeError);
  }
};