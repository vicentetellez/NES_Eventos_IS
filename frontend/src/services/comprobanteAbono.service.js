import api from './root.service.js';

const ejecutar = async (peticion, mensaje) => {
  try {
    const { data } = await peticion();
    return data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || mensaje, { cause: error });
  }
};

export const subirComprobante = (codigoEvento, archivo) => {
  const datos = new FormData();
  datos.append('comprobante', archivo);
  return ejecutar(
    () => api.post(`/evento/${codigoEvento}/comprobante-abono`, datos, {
      headers: { 'Content-Type': undefined },
    }),
    'No se pudo subir el comprobante'
  );
};

export const rechazarComprobante = (codigoEvento, observacion) =>
  ejecutar(
    () => api.patch(`/evento/${codigoEvento}/comprobante-abono/rechazar`, { observacion }),
    'No se pudo rechazar el comprobante'
  );

export const descargarComprobante = async (codigoEvento) => {
  try {
    const respuesta = await api.get(`/evento/${codigoEvento}/comprobante-abono/archivo`, { responseType: 'blob' });
    const url = URL.createObjectURL(respuesta.data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = respuesta.data.type === 'image/png' ? 'comprobante.png' : 'comprobante.pdf';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('No se pudo descargar el comprobante', { cause: error });
  }
};
