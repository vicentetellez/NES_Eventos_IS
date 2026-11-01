import api from './root.service.js';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const getTiposEventoByStatus = async (activo) => {
  try {
    const { data } = await api.get('/tipo-evento', { params: { activo } });
    return data.data.tipoEventos;
  } catch (error) {
    const message = getErrorMessage(error, 'Error al obtener los tipos de evento');
    if (error.response?.status === 404 && message.toLowerCase().includes('no hay tipos de eventos')) {
      return [];
    }
    throw new Error(message, { cause: error });
  }
};

export const getTiposEventoPublicos = async () => {
  try {
    const { data } = await api.get('/tipo-evento/publicos');
    return data.data.tipoEventos;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener los tipos de evento';
    throw new Error(mensajeError, { cause: error });
  }
};

export const createTipoEvento = async (tipoEventoData) => {
  try {
    const { data } = await api.post('/tipo-evento', { tipoEventoData });
    return data.data.tipoEvento;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear el tipo de evento'), { cause: error });
  }
};

export const updateTipoEvento = async (codigo, tipoEventoData) => {
  try {
    const { data } = await api.patch(`/tipo-evento/${codigo}`, { tipoEventoData });
    return data.data.tipoEvento;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar el tipo de evento'), { cause: error });
  }
};

export const changeTipoEventoStatus = async (codigo, activo) => {
  try {
    const { data } = await api.patch(`/tipo-evento/${codigo}/status`, {}, {
      params: { activo },
    });
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al cambiar el estado del tipo de evento'), { cause: error });
  }
};