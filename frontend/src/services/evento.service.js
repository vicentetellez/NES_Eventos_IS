import api from './root.service.js';

export const getEventosPorEstado = async (estado) => {
  try {
    const { data } = await api.get('/evento', {
      params: { estado },
    });

    return Array.isArray(data?.data?.eventos)
      ? data.data.eventos
      : Array.isArray(data?.eventos)
        ? data.eventos
        : [];
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener los eventos';
    throw new Error(mensajeError);
  }
};

export const solicitudEvento = async (payload) => {
  try {
    const { data } = await api.post('/evento/solicitud', payload);
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al enviar la solicitud de evento';
    throw new Error(mensajeError);
  }
};