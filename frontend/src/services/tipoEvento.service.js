import api from './root.service.js';

export const getTiposEventoPublicos = async () => {
  try {
    const { data } = await api.get('/tipo-evento/publicos');
    return data.data.tipoEventos;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener los tipos de evento';
    throw new Error(mensajeError);
  }
};