import api from './root.service.js';

const ejecutar = async (peticion, mensajePorDefecto) => {
  try {
    const { data } = await peticion();
    return data.data;
  } catch (error) {
    const mensajeError = error.response?.data?.message || mensajePorDefecto;
    const errorServicio = new Error(mensajeError);
    errorServicio.status = error.response?.status;
    throw errorServicio;
  }
};

export const listarPresupuestos = (estado) =>
  ejecutar(
    () => api.get('/presupuestos', { params: estado ? { estado } : {} }),
    'Error al obtener los presupuestos'
  );

export const getPrecargaPresupuesto = (codigoEvento) =>
  ejecutar(
    () => api.get(`/presupuestos/evento/${codigoEvento}/precarga`),
    'Error al obtener la plantilla del presupuesto'
  );

export const getPresupuestoEvento = (codigoEvento) =>
  ejecutar(
    () => api.get(`/presupuestos/evento/${codigoEvento}`),
    'Error al obtener el presupuesto'
  );

export const crearPresupuesto = (codigoEvento, detalles) =>
  ejecutar(
    () => api.post(`/presupuestos/evento/${codigoEvento}`, { detalles }),
    'Error al crear el presupuesto'
  );

export const actualizarPresupuesto = (codigoEvento, detalles) =>
  ejecutar(
    () => api.put(`/presupuestos/evento/${codigoEvento}`, { detalles }),
    'Error al guardar el presupuesto'
  );

export const enviarPresupuestoAValidacion = (codigoEvento) =>
  ejecutar(
    () => api.patch(`/presupuestos/evento/${codigoEvento}/enviar-validacion`),
    'Error al enviar el presupuesto a validación'
  );

export const validarPresupuesto = (codigoEvento) =>
  ejecutar(
    () => api.patch(`/presupuestos/evento/${codigoEvento}/validar`),
    'Error al validar el presupuesto'
  );

export const rechazarPresupuesto = (codigoEvento, observacion) =>
  ejecutar(
    () => api.patch(`/presupuestos/evento/${codigoEvento}/rechazar`, { observacion }),
    'Error al rechazar el presupuesto'
  );

export const ajustarEventoPresupuesto = (codigoEvento, cambios) =>
  ejecutar(
    () => api.patch(`/presupuestos/evento/${codigoEvento}/ajustar-evento`, cambios),
    'Error al ajustar el evento'
  );

export const getVistaPreviaCantidadPersonas = (codigoEvento, cantidadPersonas) =>
  ejecutar(
    () =>
      api.get(`/presupuestos/evento/${codigoEvento}/vista-previa-cantidad-personas`, {
        params: { cantidadPersonas },
      }),
    'Error al obtener la vista previa'
  );

// El PDF llega como binario: se descarga desde el servicio para que las paginas no toquen el DOM ni el backend
export const descargarPdfSegundoAbono = async (codigoEvento) => {
  try {
    const respuesta = await api.get(`/presupuestos/evento/${codigoEvento}/pdf-segundo-abono`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(respuesta.data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `segundo-abono-evento-${codigoEvento}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    let mensaje = 'Error al generar el PDF del segundo abono';
    try {
      const texto = await error.response?.data?.text();
      mensaje = JSON.parse(texto).message || mensaje;
    } catch {
      // se mantiene el mensaje por defecto
    }
    const errorServicio = new Error(mensaje);
    errorServicio.status = error.response?.status;
    throw errorServicio;
  }
};
