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
    throw new Error(mensajeError, { cause: error });
  }
};

export const getAlertasPagoPendiente = async (diasAnticipacion = 3) => {
  try {
    const { data } = await api.get('/evento/alertas/pagos-pendientes', {
      params: { diasAnticipacion },
    });
    const resultado = data?.data;

    if (!Array.isArray(resultado?.alertas)) {
      throw new Error('El servidor no entregó las alertas de pagos pendientes.');
    }

    return resultado;
  } catch (error) {
    const mensajeError = error.response?.data?.message
      || error.message
      || 'Error al obtener las alertas de pagos pendientes';
    throw new Error(mensajeError, { cause: error });
  }
};

export const avanzarEstadoEvento = async (codigoEvento, payload) => {
  try {
    const { data } = await api.patch(`/evento/${codigoEvento}/avanzar-estado`, payload);
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al cambiar el estado del evento';
    throw new Error(mensajeError, { cause: error });
  }
};

export const getEstadisticasPublicas = async () => {
  try {
    const { data } = await api.get('/evento/estadisticas-publicas');
    return data.data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al obtener las estadísticas';
    throw new Error(mensajeError, { cause: error });
  }
};

export const solicitudEvento = async (payload) => {
  try {
    const { data } = await api.post('/evento/solicitud', payload);
    return data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || 'Error al enviar la solicitud de evento';
    throw new Error(mensajeError, { cause: error });
  }
};

export const getEventoByCodigoEvaluacion = async (codigoEvaluacion) => {
  try {
    const { data } = await api.get(`/evento/evaluacion/${encodeURIComponent(codigoEvaluacion)}`);
    const evento = data?.data?.evento;
    if (!evento) throw new Error('No se encontró el evento asociado al código.');
    return evento;
  } catch (error) {
    const mensajeError = error.response?.data?.message || error.message || 'Error al obtener el evento';
    throw new Error(mensajeError, { cause: error });
  }
};