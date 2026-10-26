import api from './root.service.js';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export const getBanqueteriasByStatus = async (activo) => {
  try {
    const { data } = await api.get('/banqueteria', { params: { activo } });
    return data.data.banqueteria;
  } catch (error) {
    const message = getErrorMessage(error, 'Error al obtener las banqueterías');
    if (error.response?.status === 404 && message.toLowerCase().includes('no hay banqueteria')) {
      return [];
    }
    throw new Error(message, { cause: error });
  }
};

export const getBanqueteriasPublicas = async () => {
  try {
    const { data } = await api.get('/banqueteria/publicos');
    // Tu backend devuelve: { status: "Success", message: "...", data: [...] }
    return data.data.banqueterias; 
  } catch (error) {
    // Si el backend lanzó un AppError o error de Prisma:
    // error.response.data.message contendrá la cadena exacta enviada por tu errorHandler
    const mensajeError = error.response?.data?.message || 'Error de conexión con el servidor';
    throw new Error(mensajeError, { cause: error });
  }
};

export const createBanqueteria = async (banqueteriaData) => {
  try {
    const { data } = await api.post('/banqueteria', { banqueteriaData });
    return data.data.banqueteria;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al crear la banquetería'), { cause: error });
  }
};

export const updateBanqueteria = async (codigo, banqueteriaData) => {
  try {
    const { data } = await api.patch(`/banqueteria/${codigo}`, { banqueteriaData });
    return data.data.banqueteria;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al actualizar la banquetería'), { cause: error });
  }
};

export const changeBanqueteriaStatus = async (codigo, activo) => {
  try {
    const { data } = await api.patch(`/banqueteria/${codigo}/status`, {}, {
      params: { activo },
    });
    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Error al cambiar el estado de la banquetería'), { cause: error });
  }
};