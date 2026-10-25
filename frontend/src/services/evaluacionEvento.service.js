import api from './root.service.js';

export const existingEvaluacionEvento = async (codigoEvaluacion) => {
  try {
    const { data } = await api.get(`/evaluacion-evento/existing/${encodeURIComponent(codigoEvaluacion)}`);
    const existe = data?.data;
    if (typeof existe !== 'boolean') {
      throw new Error('El servidor no devolvió el estado de la evaluación.');
    }
    return existe;
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error al consultar la evaluación existente';
    throw new Error(mensajeError);
  }
};

export const createEvaluacionEvento = async (evaluacionEventoData) => {
  try {
    const { data } = await api.post('/evaluacion-evento', { evaluacionEventoData });
    const evaluacionEvento = data?.data?.evaluacionEvento;
    if (!evaluacionEvento) throw new Error('El servidor no confirmó el registro de la evaluación del evento.');
    return evaluacionEvento;
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error al guardar la evaluación del evento';
    throw new Error(mensajeError);
  }
};
