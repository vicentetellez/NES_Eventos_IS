import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { avanzarEstadoEvento } from '../services/evento.service.js';
import { listarCatalogoEquipos } from '../services/equipoEvento.service.js';
import {
  actualizarPresupuesto,
  ajustarEventoPresupuesto,
  crearPresupuesto,
  descargarPdfSegundoAbono,
  enviarPresupuestoAValidacion,
  getPrecargaPresupuesto,
  getPresupuestoEvento,
  getVistaPreviaCantidadPersonas,
  rechazarPresupuesto,
  validarPresupuesto,
} from '../services/presupuesto.service.js';
import {
  CATEGORIAS_EDITABLES,
  ETIQUETAS_CATEGORIA,
  ETIQUETAS_ESTADO_PRESUPUESTO,
  estiloEstadoPresupuesto,
  formatoCLP,
  formatoFecha,
} from '../utils/presupuesto.js';

const PORCENTAJE_MARGEN_ARRIENDO = 20;
const ESTADOS_EVENTO_EDITABLES = ['COTIZANDO', 'ORGANIZANDO', 'PENDIENTE_PAGO_FINAL'];
const ESTADOS_EVENTO_AJUSTABLES = ['ORGANIZANDO', 'PENDIENTE_PAGO_FINAL'];

const inputClase =
  'h-10 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c] disabled:opacity-50';
const botonPrimario =
  'h-10 rounded-lg bg-[#c9a84c] px-5 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50';
const botonSecundario =
  'h-10 rounded-lg border border-white/10 px-5 text-xs font-semibold text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50';

let contadorLineas = 0;
const crearLinea = (base = {}) => ({
  _id: ++contadorLineas,
  categoria: base.categoria ?? 'OTRO',
  descripcion: base.descripcion ?? '',
  cantidad: String(base.cantidad ?? 1),
  precioUnitario: String(base.precioUnitario ?? 0),
  esArriendoTercero: Boolean(base.esArriendoTercero),
  codigoEspecialidad: base.codigoEspecialidad ?? null,
  codigoEquipo: base.codigoEquipo ?? null,
});

const esLineaDelSistema = (detalle) =>
  Boolean(detalle.rutTrabajador) || detalle.categoria === 'AJUSTE_EVENTO';

const aFechaInput = (fecha) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

export default function PresupuestoEvento() {
  const { codigo } = useParams();
  const codigoEvento = Number(codigo);
  const { user } = useAuth();

  const [presupuesto, setPresupuesto] = useState(null);
  const [evento, setEvento] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [catalogoEquipos, setCatalogoEquipos] = useState([]);
  const [cambiosSinGuardar, setCambiosSinGuardar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const [observacionRechazo, setObservacionRechazo] = useState('');
  const [fechaLimiteAbono, setFechaLimiteAbono] = useState('');
  const [ajuste, setAjuste] = useState({ cantidadPersonas: '', horasEvento: '', horasMontajeDesmontaje: '' });
  const [vistaPrevia, setVistaPrevia] = useState(null);

  const obtenerDatos = useCallback(async () => {
    try {
      const resultado = await getPresupuestoEvento(codigoEvento);
      return { presupuesto: resultado.presupuesto, evento: resultado.evento, lineas: resultado.presupuesto.detalles };
    } catch (errorPresupuesto) {
      if (errorPresupuesto.status !== 404) throw errorPresupuesto;
      // Aún no existe: se parte de la plantilla del tipo de evento
      const precarga = await getPrecargaPresupuesto(codigoEvento);
      return { presupuesto: null, evento: precarga.evento, lineas: precarga.cotizacion.detalles };
    }
  }, [codigoEvento]);

  const aplicarDatos = useCallback((datos) => {
    setPresupuesto(datos.presupuesto);
    setEvento(datos.evento);
    setLineas(datos.lineas
      .filter((d) => !esLineaDelSistema(d))
      .map((detalle) => crearLinea(
        detalle.categoria === 'EQUIPAMIENTO' && !detalle.codigoEquipo
          ? { ...detalle, cantidad: 1, precioUnitario: detalle.subtotal, esArriendoTercero: false }
          : detalle
      )));
    setCambiosSinGuardar(datos.presupuesto === null);
    setAjuste({
      cantidadPersonas: String(datos.evento.cantidadPersonas),
      horasEvento: String(datos.evento.horasEvento),
      horasMontajeDesmontaje: String(datos.evento.horasMontajeDesmontaje),
    });
    setVistaPrevia(null);
  }, []);

  const cargar = useCallback(async () => {
    aplicarDatos(await obtenerDatos());
  }, [obtenerDatos, aplicarDatos]);

  useEffect(() => {
    let activo = true;

    obtenerDatos()
      .then((datos) => {
        if (activo) aplicarDatos(datos);
      })
      .catch((errorCarga) => {
        if (activo) setError(errorCarga.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [obtenerDatos, aplicarDatos]);

  useEffect(() => {
    let activo = true;
    listarCatalogoEquipos(codigoEvento)
      .then(({ equipos }) => {
        if (activo) setCatalogoEquipos(equipos);
      })
      .catch((errorCarga) => {
        if (activo) setError(errorCarga.message);
      });
    return () => {
      activo = false;
    };
  }, [codigoEvento]);

  const lineasSistema = useMemo(
    () => (presupuesto ? presupuesto.detalles.filter(esLineaDelSistema) : []),
    [presupuesto]
  );

  const totales = useMemo(() => {
    const subtotalesEditables = lineas.map((linea) => ({
      categoria: linea.categoria,
      esArriendoTercero: linea.esArriendoTercero,
      codigoEquipo: linea.codigoEquipo,
      subtotal: (Number(linea.cantidad) || 0) * (Number(linea.precioUnitario) || 0),
    }));
    const todas = [...subtotalesEditables, ...lineasSistema];
    const subtotal = todas.reduce((suma, linea) => suma + linea.subtotal, 0);
    const baseMargen = todas
      .filter((linea) => linea.categoria === 'EQUIPAMIENTO' && linea.codigoEquipo && linea.esArriendoTercero)
      .reduce((suma, linea) => suma + linea.subtotal, 0);
    const montoMargen = Math.round((baseMargen * PORCENTAJE_MARGEN_ARRIENDO) / 100);
    const total = subtotal + montoMargen;
    return { subtotal, montoMargen, total, primerAbono: Math.round(total / 2) };
  }, [lineas, lineasSistema]);

  const montoAbono = evento && presupuesto ? presupuesto.montoAbono : null;
  const saldoPendiente = montoAbono !== null && montoAbono !== undefined ? totales.total - montoAbono : null;

  const estadoEvento = evento?.estado;
  const fechaHoy = aFechaInput(new Date());
  const fechaMaximaAbono = useMemo(() => {
    if (!evento?.fechaEvento) return undefined;
    const [anio, mes, dia] = String(evento.fechaEvento).slice(0, 10).split('-').map(Number);
    return aFechaInput(new Date(anio, mes - 1, dia - 1));
  }, [evento]);
  const estadoPresupuesto = presupuesto?.estado;
  const eventoEditable = ESTADOS_EVENTO_EDITABLES.includes(estadoEvento);
  const puedeEditar = Boolean(
    evento &&
      eventoEditable &&
      estadoPresupuesto !== 'PENDIENTE_VALIDACION' &&
      (presupuesto || estadoEvento === 'COTIZANDO')
  );
  const puedeEnviarValidacion =
    Boolean(presupuesto) &&
    estadoEvento === 'COTIZANDO' &&
    ['BORRADOR', 'RECHAZADO'].includes(estadoPresupuesto);
  const puedeValidar = user?.rol === 'GERENTE' && estadoPresupuesto === 'PENDIENTE_VALIDACION';
  const puedeAvanzarAbono = estadoPresupuesto === 'VALIDADO' && estadoEvento === 'COTIZANDO';
  const puedeDescargarPdf =
    estadoPresupuesto === 'VALIDADO' &&
    montoAbono !== null &&
    montoAbono !== undefined &&
    ['ORGANIZANDO', 'PENDIENTE_PAGO_FINAL', 'EN_PREPARACION', 'EN_EJECUCION', 'FINALIZADO'].includes(estadoEvento);
  const puedeGestionarAsignaciones =
    estadoPresupuesto === 'VALIDADO' &&
    ['ORGANIZANDO', 'PENDIENTE_PAGO_FINAL'].includes(estadoEvento);
  const puedeAjustar =
    Boolean(presupuesto) &&
    ESTADOS_EVENTO_AJUSTABLES.includes(estadoEvento) &&
    estadoPresupuesto !== 'PENDIENTE_VALIDACION';

  const actualizarLinea = (id, cambios) => {
    setLineas((actuales) => actuales.map((linea) => (linea._id === id ? { ...linea, ...cambios } : linea)));
    setCambiosSinGuardar(true);
  };

  const agregarLinea = () => {
    setLineas((actuales) => [...actuales, crearLinea()]);
    setCambiosSinGuardar(true);
  };

  const quitarLinea = (id) => {
    setLineas((actuales) => actuales.filter((linea) => linea._id !== id));
    setCambiosSinGuardar(true);
  };

  const construirDetalles = () => {
    const codigosEquipo = lineas
      .filter((linea) => linea.categoria === 'EQUIPAMIENTO' && linea.codigoEquipo)
      .map((linea) => linea.codigoEquipo);
    if (new Set(codigosEquipo).size !== codigosEquipo.length) {
      throw new Error('Un equipo del catálogo no puede repetirse en varias líneas.');
    }

    return lineas.map((linea, indice) => {
      const esEquipoManual = linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo;
      const cantidad = esEquipoManual ? 1 : Number(linea.cantidad);
      const precioUnitario = Number(linea.precioUnitario);
      if (!linea.descripcion.trim()) throw new Error(`La línea ${indice + 1} necesita una descripción.`);
      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error(`La cantidad de la línea ${indice + 1} debe ser un entero mayor que cero.`);
      }
      if (!Number.isInteger(precioUnitario) || precioUnitario < 0) {
        throw new Error(`El precio de la línea ${indice + 1} debe ser un entero igual o mayor que cero.`);
      }
      return {
        categoria: linea.categoria,
        descripcion: linea.descripcion.trim(),
        cantidad,
        precioUnitario,
        ...(linea.categoria === 'EQUIPAMIENTO'
          ? { esArriendoTercero: esEquipoManual ? false : linea.esArriendoTercero }
          : {}),
        ...(linea.codigoEspecialidad ? { codigoEspecialidad: linea.codigoEspecialidad } : {}),
        ...(linea.categoria === 'EQUIPAMIENTO' && linea.codigoEquipo ? { codigoEquipo: linea.codigoEquipo } : {}),
      };
    });
  };

  const ejecutarAccion = async (accion, mensajeOk) => {
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      await accion();
      await cargar();
      setAviso(mensajeOk);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setProcesando(false);
    }
  };

  const guardar = async () => {
    const detalles = construirDetalles();
    if (!presupuesto) {
      await crearPresupuesto(codigoEvento, detalles);
    } else {
      await actualizarPresupuesto(codigoEvento, detalles);
    }
  };

  const manejarGuardar = () => ejecutarAccion(guardar, 'Presupuesto guardado correctamente.');

  const manejarEnviarValidacion = () =>
    ejecutarAccion(async () => {
      if (cambiosSinGuardar) await guardar();
      await enviarPresupuestoAValidacion(codigoEvento);
    }, 'Presupuesto enviado a validación del gerente.');

  const manejarDescargarPdf = () => ejecutarAccion(() => descargarPdfSegundoAbono(codigoEvento), 'PDF del segundo abono descargado.');

  const manejarValidar = () =>
    ejecutarAccion(() => validarPresupuesto(codigoEvento), 'Presupuesto validado correctamente.');

  const manejarRechazar = () =>
    ejecutarAccion(async () => {
      await rechazarPresupuesto(codigoEvento, observacionRechazo.trim());
      setObservacionRechazo('');
    }, 'Presupuesto rechazado. El staff podrá corregirlo.');

  const manejarAvanzarAbono = () =>
    ejecutarAccion(
      () =>
        avanzarEstadoEvento(codigoEvento, {
          estadoDestino: 'PENDIENTE_PAGO_ABONO',
          fechaLimiteAbono,
        }),
      'Evento en espera del pago del primer abono.'
    );

  const cambiosDeAjuste = () => {
    const cambios = {};
    ['cantidadPersonas', 'horasEvento', 'horasMontajeDesmontaje'].forEach((campo) => {
      const valor = Number(ajuste[campo]);
      if (valor !== evento[campo]) cambios[campo] = valor;
    });
    return cambios;
  };

  const manejarVistaPrevia = async () => {
    setProcesando(true);
    setError('');
    setVistaPrevia(null);
    try {
      const nuevaCantidad = Number(ajuste.cantidadPersonas);
      const [actual, nueva] = await Promise.all([
        getVistaPreviaCantidadPersonas(codigoEvento, evento.cantidadPersonas),
        getVistaPreviaCantidadPersonas(codigoEvento, nuevaCantidad),
      ]);
      setVistaPrevia({
        cantidadPersonas: nuevaCantidad,
        diferencia: nueva.propuesta.total - actual.propuesta.total,
      });
    } catch (errorVista) {
      setError(errorVista.message);
    } finally {
      setProcesando(false);
    }
  };

  const manejarAplicarAjuste = () => {
    const cambios = cambiosDeAjuste();
    if (Object.keys(cambios).length === 0) {
      setError('Modifica la cantidad de invitados o las horas para aplicar un ajuste.');
      return;
    }
    return ejecutarAccion(
      () => ajustarEventoPresupuesto(codigoEvento, cambios),
      'Ajuste aplicado. La diferencia se cobrará en el segundo abono.'
    );
  };

  if (cargando && !evento) {
    return (
      <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-sm text-[#f0ece4]/50 sm:px-8">
        Cargando presupuesto...
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error || 'No se pudo cargar el evento.'}
        </div>
        <Link to="/panel/presupuestos" className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
          ← Volver a presupuestos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          to={user?.rol === 'GERENTE' && estadoPresupuesto === 'PENDIENTE_VALIDACION' ? '/panel/validacion-presupuestos' : '/panel/presupuestos'}
          className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c] hover:underline"
        >
          ← Volver
        </Link>

        <header className="mb-8 mt-4 flex flex-col justify-between gap-4 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              Presupuesto del evento #{evento.codigo}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {evento.clienteNombre ?? 'Cliente'}
            </h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              {formatoFecha(evento.fechaEvento)} · {evento.cantidadPersonas} invitados · {evento.horasEvento} h de evento ·{' '}
              {evento.horasMontajeDesmontaje} h de montaje/desmontaje
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {puedeGestionarAsignaciones && (
              <Link
                to={`/panel/asignacion-evento/${codigoEvento}`}
                className="rounded-lg border border-[#c9a84c]/40 px-3 py-2 text-xs font-semibold text-[#c9a84c] transition hover:bg-[#c9a84c]/10"
              >
                Personal y equipos
              </Link>
            )}
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-[#f0ece4]/70">
              Evento: {estadoEvento.replaceAll('_', ' ')}
            </span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                estadoPresupuesto ? estiloEstadoPresupuesto[estadoPresupuesto] : estiloEstadoPresupuesto.BORRADOR
              }`}
            >
              {estadoPresupuesto ? ETIQUETAS_ESTADO_PRESUPUESTO[estadoPresupuesto] : 'Sin guardar'}
            </span>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
            {error}
          </div>
        )}
        {aviso && (
          <div className="mb-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300" role="status">
            {aviso}
          </div>
        )}
        {estadoPresupuesto === 'RECHAZADO' && presupuesto.observacionDictamen && (
          <div className="mb-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            <strong className="block text-xs uppercase tracking-wider text-red-300">Motivo del rechazo</strong>
            {presupuesto.observacionDictamen}
          </div>
        )}
        {estadoPresupuesto === 'PENDIENTE_VALIDACION' && (
          <div className="mb-5 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-3 text-sm text-[#f0ece4]/75" role="status">
            El presupuesto está esperando la validación del gerente y no se puede modificar.
          </div>
        )}
        {!presupuesto && estadoEvento !== 'COTIZANDO' && (
          <div className="mb-5 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-3 text-sm text-[#f0ece4]/75" role="status">
            Este evento no está en cotización, por lo que no se puede crear un presupuesto.
          </div>
        )}
        {!presupuesto && estadoEvento === 'COTIZANDO' && (
          <div className="mb-5 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-3 text-sm text-[#f0ece4]/75" role="status">
            Plantilla cargada según el tipo de evento. Ajusta las líneas necesarias y guarda para crear el presupuesto.
          </div>
        )}

        <section className="mb-8 rounded-xl border border-white/10 bg-[#131622] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Detalle del presupuesto</h2>
            {puedeEditar && (
              <button type="button" className={botonSecundario} onClick={agregarLinea} disabled={procesando}>
                + Agregar línea
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-[#f0ece4]/50">
                <tr>
                  <th className="px-2 py-3 font-medium">Categoría</th>
                  <th className="px-2 py-3 font-medium">Descripción</th>
                  <th className="w-24 px-2 py-3 font-medium">Cantidad</th>
                  <th className="w-36 px-2 py-3 font-medium">P. unitario / monto total</th>
                  <th className="px-2 py-3 text-center font-medium" title="Equipo arrendado a terceros (+20% de margen)">
                    Arriendo
                  </th>
                  <th className="px-2 py-3 text-right font-medium">Subtotal</th>
                  {puedeEditar && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {lineas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 text-center text-[#f0ece4]/50">
                      No hay líneas editables.
                    </td>
                  </tr>
                )}
                {lineas.map((linea) => (
                  <tr key={linea._id} className="border-b border-white/5 align-top">
                    <td className="px-2 py-2">
                      <select
                        value={linea.categoria}
                        disabled={!puedeEditar}
                        onChange={(e) =>
                          actualizarLinea(linea._id, {
                            categoria: e.target.value,
                            esArriendoTercero: e.target.value === 'EQUIPAMIENTO' ? linea.esArriendoTercero : false,
                            codigoEquipo: e.target.value === 'EQUIPAMIENTO' ? linea.codigoEquipo : null,
                          })
                        }
                        className={inputClase}
                      >
                        {CATEGORIAS_EDITABLES.map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {ETIQUETAS_CATEGORIA[categoria]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="grid gap-2">
                        <input
                          type="text"
                          value={linea.descripcion}
                          disabled={!puedeEditar}
                          maxLength={500}
                          onChange={(e) => actualizarLinea(linea._id, { descripcion: e.target.value })}
                          className={inputClase}
                          placeholder="Descripción"
                        />
                        {linea.categoria === 'EQUIPAMIENTO' && (
                          <select
                            value={linea.codigoEquipo ?? ''}
                            disabled={!puedeEditar}
                            onChange={(e) => {
                              const codigoEquipo = Number(e.target.value) || null;
                              const equipo = catalogoEquipos.find((item) => item.codigo === codigoEquipo);
                              const horas = (evento?.horasEvento ?? 0) + (evento?.horasMontajeDesmontaje ?? 0);
                              const montoActual = (Number(linea.cantidad) || 0) * (Number(linea.precioUnitario) || 0);
                              actualizarLinea(linea._id, {
                                codigoEquipo,
                                esArriendoTercero: Boolean(equipo?.esExterno),
                                ...(!codigoEquipo ? { cantidad: '1', precioUnitario: String(montoActual) } : {}),
                                ...(!linea.descripcion.trim() && equipo ? { descripcion: equipo.nombre } : {}),
                                ...(Number(linea.precioUnitario) === 0 && equipo?.esExterno
                                  ? { precioUnitario: String((equipo.arriendoHoraReferencial ?? 0) * horas) }
                                  : {}),
                              });
                            }}
                            className={inputClase}
                          >
                            <option value="">Extra manual · no reserva inventario</option>
                            {catalogoEquipos.map((equipo) => (
                              <option key={equipo.codigo} value={equipo.codigo}>
                                {equipo.nombre}{equipo.esExterno ? ' · arriendo externo' : ' · propio'}
                              </option>
                            ))}
                          </select>
                        )}
                        {linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo && (
                          <span className="text-xs text-[#f0ece4]/45">
                            Ingresa el monto total a cobrar. Este extra no reserva stock ni aplica margen de arriendo.
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo ? '1' : linea.cantidad}
                        disabled={!puedeEditar || (linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo)}
                        onChange={(e) => actualizarLinea(linea._id, { cantidad: e.target.value })}
                        className={inputClase}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={linea.precioUnitario}
                        disabled={!puedeEditar}
                        onChange={(e) => actualizarLinea(linea._id, {
                          precioUnitario: e.target.value,
                          ...(linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo ? { cantidad: '1' } : {}),
                        })}
                        className={inputClase}
                        placeholder={linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo ? 'Monto total' : 'Precio unitario'}
                        aria-label={linea.categoria === 'EQUIPAMIENTO' && !linea.codigoEquipo ? 'Monto total a cobrar' : 'Precio unitario'}
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={linea.esArriendoTercero}
                        disabled={!puedeEditar || linea.categoria !== 'EQUIPAMIENTO' || !linea.codigoEquipo}
                        onChange={(e) => actualizarLinea(linea._id, { esArriendoTercero: e.target.checked })}
                        className="mt-3 h-4 w-4 accent-[#c9a84c]"
                        aria-label="Equipo arrendado a terceros del catálogo"
                      />
                    </td>
                    <td className="px-2 py-2 pt-4 text-right">
                      {formatoCLP((Number(linea.cantidad) || 0) * (Number(linea.precioUnitario) || 0))}
                    </td>
                    {puedeEditar && (
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => quitarLinea(linea._id)}
                          className="h-10 w-8 text-lg text-[#f0ece4]/50 transition hover:text-red-300"
                          aria-label="Quitar línea"
                        >
                          ×
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lineasSistema.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#f0ece4]/50">
                Líneas del sistema (trabajadores asignados y ajustes)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <tbody>
                    {lineasSistema.map((detalle) => (
                      <tr key={detalle.codigo} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-2 text-[#f0ece4]/50">{ETIQUETAS_CATEGORIA[detalle.categoria]}</td>
                        <td className="px-3 py-2">{detalle.descripcion}</td>
                        <td className="px-3 py-2 text-right text-[#f0ece4]/50">
                          {detalle.cantidad} × {formatoCLP(detalle.precioUnitario)}
                        </td>
                        <td className="px-3 py-2 text-right">{formatoCLP(detalle.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <dl className="ml-auto mt-6 grid max-w-sm gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#f0ece4]/50">Costos</dt>
              <dd>{formatoCLP(totales.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#f0ece4]/50">Margen arriendos ({PORCENTAJE_MARGEN_ARRIENDO}%)</dt>
              <dd>{formatoCLP(totales.montoMargen)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="text-[#c9a84c]">{formatoCLP(totales.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#f0ece4]/50">
                {montoAbono ? 'Primer abono (50%)' : 'Primer abono preliminar (50%)'}
              </dt>
              <dd>{formatoCLP(montoAbono ?? totales.primerAbono)}</dd>
            </div>
            {saldoPendiente !== null && (
              <div className="flex justify-between">
                <dt className="text-[#f0ece4]/50">Saldo del segundo abono</dt>
                <dd className="font-semibold text-[#c9a84c]">{formatoCLP(saldoPendiente)}</dd>
              </div>
            )}
          </dl>
          {cambiosSinGuardar && puedeEditar && (
            <p className="mt-3 text-right text-xs text-[#f0ece4]/50">
              Los totales son una estimación hasta guardar los cambios.
            </p>
          )}
        </section>

        {(puedeEditar || puedeEnviarValidacion || puedeDescargarPdf) && (
          <div className="mb-8 flex flex-wrap gap-3">
            {puedeDescargarPdf && (
              <button
                type="button"
                className={botonSecundario}
                onClick={manejarDescargarPdf}
                disabled={procesando || cambiosSinGuardar}
                title={cambiosSinGuardar ? 'Guarda los cambios antes de generar el PDF' : undefined}
              >
                Descargar PDF del segundo abono
              </button>
            )}
            {puedeEditar && (
              <button type="button" className={botonPrimario} onClick={manejarGuardar} disabled={procesando}>
                {presupuesto ? 'Guardar cambios' : 'Crear presupuesto'}
              </button>
            )}
            {puedeEnviarValidacion && (
              <button type="button" className={botonSecundario} onClick={manejarEnviarValidacion} disabled={procesando}>
                Enviar a validación del gerente
              </button>
            )}
          </div>
        )}

        {puedeValidar && (
          <section className="mb-8 rounded-xl border border-[#c9a84c]/30 bg-[#131622] p-5">
            <h2 className="mb-1 text-lg font-semibold">Validación del gerente</h2>
            <p className="mb-4 text-sm text-[#f0ece4]/50">
              Revisa el detalle y valida el presupuesto, o recházalo indicando el motivo.
            </p>
            <label className="grid gap-2 text-xs font-medium text-[#f0ece4]/65">
              Motivo del rechazo (obligatorio para rechazar)
              <textarea
                rows={3}
                maxLength={1000}
                value={observacionRechazo}
                onChange={(e) => setObservacionRechazo(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2 text-sm text-[#f0ece4] outline-none focus:border-[#c9a84c]"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className={botonPrimario} onClick={manejarValidar} disabled={procesando}>
                Validar presupuesto
              </button>
              <button
                type="button"
                className="h-10 rounded-lg border border-red-400/40 px-5 text-xs font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={manejarRechazar}
                disabled={procesando || !observacionRechazo.trim()}
              >
                Rechazar
              </button>
            </div>
          </section>
        )}

        {puedeAvanzarAbono && (
          <section className="mb-8 rounded-xl border border-white/10 bg-[#131622] p-5">
            <h2 className="mb-1 text-lg font-semibold">Solicitar el primer abono</h2>
            <p className="mb-4 text-sm text-[#f0ece4]/50">
              Presupuesto validado. Al continuar queda congelado y se fija el primer abono en{' '}
              <strong className="text-[#c9a84c]">{formatoCLP(presupuesto.primerAbono)}</strong>.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <label className="grid gap-2 text-xs font-medium text-[#f0ece4]/65">
                Fecha límite de pago
                <input
                  type="date"
                  value={fechaLimiteAbono}
                  min={fechaHoy}
                  max={fechaMaximaAbono}
                  onChange={(e) => setFechaLimiteAbono(e.target.value)}
                  className={inputClase}
                />
              </label>
              <button
                type="button"
                className={botonPrimario}
                onClick={manejarAvanzarAbono}
                disabled={procesando || !fechaLimiteAbono || cambiosSinGuardar}
              >
                Pasar a pendiente de pago
              </button>
            </div>
          </section>
        )}

        {puedeAjustar && (
          <section className="mb-8 rounded-xl border border-white/10 bg-[#131622] p-5">
            <h2 className="mb-1 text-lg font-semibold">Cambios del cliente tras el primer abono</h2>
            <p className="mb-4 text-sm text-[#f0ece4]/50">
              Solo se pueden aumentar los invitados y las horas. La diferencia se suma al presupuesto y se cobra en el
              segundo abono, sin nueva validación del gerente.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { campo: 'cantidadPersonas', etiqueta: 'Invitados' },
                { campo: 'horasEvento', etiqueta: 'Horas del evento' },
                { campo: 'horasMontajeDesmontaje', etiqueta: 'Horas de montaje/desmontaje' },
              ].map(({ campo, etiqueta }) => (
                <label key={campo} className="grid gap-2 text-xs font-medium text-[#f0ece4]/65">
                  {etiqueta} (actual: {evento[campo]})
                  <input
                    type="number"
                    min={evento[campo]}
                    step={1}
                    value={ajuste[campo]}
                    onChange={(e) => {
                      setAjuste({ ...ajuste, [campo]: e.target.value });
                      setVistaPrevia(null);
                    }}
                    className={inputClase}
                  />
                </label>
              ))}
            </div>
            {vistaPrevia && (
              <p className="mt-4 rounded-lg border border-[#c9a84c]/25 bg-[#c9a84c]/10 px-4 py-3 text-sm text-[#f0ece4]/80">
                Con {vistaPrevia.cantidadPersonas} invitados, el costo estimado cambia en{' '}
                <strong className="text-[#c9a84c]">{formatoCLP(vistaPrevia.diferencia)}</strong>. No incluye cambios de
                horas ni banquetería.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className={botonSecundario}
                onClick={manejarVistaPrevia}
                disabled={procesando || Number(ajuste.cantidadPersonas) <= evento.cantidadPersonas}
              >
                Vista previa de invitados
              </button>
              <button type="button" className={botonPrimario} onClick={manejarAplicarAjuste} disabled={procesando}>
                Aplicar cambio y cobrar diferencia
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
