export const formatoCLP = (valor) =>
  valor === null || valor === undefined
    ? '—'
    : new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(valor);

export const formatoFecha = (fecha) => {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-CL', { timeZone: 'UTC' });
};

export const ETIQUETAS_ESTADO_PRESUPUESTO = {
  BORRADOR: 'Borrador',
  PENDIENTE_VALIDACION: 'Pendiente de validación',
  VALIDADO: 'Validado',
  RECHAZADO: 'Rechazado',
};

export const ETIQUETAS_CATEGORIA = {
  BASE_EVENTO: 'Base del evento',
  PERSONAL: 'Personal',
  EQUIPAMIENTO: 'Equipamiento',
  TRANSPORTE: 'Transporte',
  BANQUETERIA: 'Banquetería',
  DECORACION: 'Decoración',
  OTRO: 'Otro',
  AJUSTE_EVENTO: 'Ajuste del evento',
};

export const CATEGORIAS_EDITABLES = [
  'BASE_EVENTO',
  'PERSONAL',
  'EQUIPAMIENTO',
  'TRANSPORTE',
  'BANQUETERIA',
  'DECORACION',
  'OTRO',
];

export const estiloEstadoPresupuesto = {
  BORRADOR: 'border-white/15 bg-white/5 text-[#f0ece4]/70',
  PENDIENTE_VALIDACION: 'border-[#c9a84c]/40 bg-[#c9a84c]/10 text-[#c9a84c]',
  VALIDADO: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  RECHAZADO: 'border-red-400/30 bg-red-400/10 text-red-300',
};
