import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { avanzarEstadoEvento, getEventosPorEstado } from '../services/evento.service.js';
import { listarPresupuestos } from '../services/presupuesto.service.js';
import {
  ETIQUETAS_ESTADO_PRESUPUESTO,
  estiloEstadoPresupuesto,
  formatoCLP,
  formatoFecha,
} from '../utils/presupuesto.js';

const FILTROS = ['TODOS', 'BORRADOR', 'PENDIENTE_VALIDACION', 'VALIDADO', 'RECHAZADO'];

export default function Presupuestos() {
  const navigate = useNavigate();
  const [presupuestos, setPresupuestos] = useState([]);
  const [eventosPorCotizar, setEventosPorCotizar] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [iniciando, setIniciando] = useState(null);
  const [filtro, setFiltro] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // El backend responde 404 cuando no hay eventos en ese estado
  const obtenerDatos = useCallback(async () => {
    const [resultadoPresupuestos, cotizando, solicitados] = await Promise.all([
      listarPresupuestos(),
      getEventosPorEstado('COTIZANDO').catch(() => []),
      getEventosPorEstado('SOLICITADO').catch(() => []),
    ]);
    return { resultadoPresupuestos, cotizando, solicitados };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerDatos()
      .then(({ resultadoPresupuestos, cotizando, solicitados }) => {
        if (!activo) return;
        setPresupuestos(resultadoPresupuestos.presupuestos);
        setEventosPorCotizar(cotizando);
        setSolicitudes(solicitados);
        setError('');
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
  }, [obtenerDatos]);

  const iniciarCotizacion = async (evento) => {
    const nombre = evento.cliente?.persona?.nombre ?? 'el cliente';
    if (!window.confirm(`¿Iniciar la cotización del evento #${evento.codigo} de ${nombre}?`)) return;

    setIniciando(evento.codigo);
    setError('');
    try {
      await avanzarEstadoEvento(evento.codigo, { estadoDestino: 'COTIZANDO' });
      navigate(`/panel/presupuestos/${evento.codigo}`);
    } catch (errorAccion) {
      setError(errorAccion.message);
      setIniciando(null);
    }
  };

  const sinPresupuesto = useMemo(() => {
    const conPresupuesto = new Set(presupuestos.map((presupuesto) => presupuesto.codigoEvento));
    return eventosPorCotizar.filter((evento) => !conPresupuesto.has(evento.codigo));
  }, [presupuestos, eventosPorCotizar]);

  const visibles = presupuestos.filter(
    (presupuesto) => filtro === 'TODOS' || presupuesto.estado === filtro
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Cotizaciones
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Presupuestos de eventos</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Elabora el presupuesto de los eventos en cotización y revisa el estado de los ya creados.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-[#f0ece4]/50">Cargando presupuestos...</p>
        ) : (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold">
                Solicitudes nuevas{' '}
                <span className="text-sm font-normal text-[#f0ece4]/50">({solicitudes.length})</span>
              </h2>
              {solicitudes.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-[#131622] px-5 py-4 text-sm text-[#f0ece4]/50">
                  No hay solicitudes nuevas.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {solicitudes.map((evento) => (
                    <div key={evento.codigo} className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#131622] p-5">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[#f0ece4]/50">
                          Evento {evento.codigoEvaluacion}
                        </p>
                        <p className="mt-1 text-base font-semibold">{evento.cliente?.persona?.nombre ?? 'Cliente'}</p>
                        <p className="mt-1 text-sm text-[#f0ece4]/50">Fecha: {formatoFecha(evento.fechaEvento)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => iniciarCotizacion(evento)}
                        disabled={iniciando !== null}
                        className="mt-4 h-10 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {iniciando === evento.codigo ? 'Iniciando...' : 'Iniciar cotización'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-10">
              <h2 className="mb-4 text-lg font-semibold">
                Eventos por cotizar{' '}
                <span className="text-sm font-normal text-[#f0ece4]/50">({sinPresupuesto.length})</span>
              </h2>
              {sinPresupuesto.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-[#131622] px-5 py-4 text-sm text-[#f0ece4]/50">
                  No hay eventos esperando un presupuesto.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sinPresupuesto.map((evento) => (
                    <Link
                      key={evento.codigo}
                      to={`/panel/presupuestos/${evento.codigo}`}
                      className="group rounded-xl border border-white/10 bg-[#131622] p-5 transition hover:border-[#c9a84c]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                    >
                      <p className="text-xs uppercase tracking-wider text-[#f0ece4]/50">
                        Evento {evento.codigoEvaluacion}
                      </p>
                      <p className="mt-1 text-base font-semibold group-hover:text-[#c9a84c]">
                        {evento.cliente?.persona?.nombre ?? 'Cliente'}
                      </p>
                      <p className="mt-1 text-sm text-[#f0ece4]/50">Fecha: {formatoFecha(evento.fechaEvento)}</p>
                      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                        Crear presupuesto →
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-lg font-semibold">Presupuestos creados</h2>
                <label className="flex items-center gap-2 text-xs text-[#f0ece4]/65">
                  Estado
                  <select
                    value={filtro}
                    onChange={(evento) => setFiltro(evento.target.value)}
                    className="h-10 rounded-lg border border-white/10 bg-[#131622] px-3 text-sm text-[#f0ece4] outline-none focus:border-[#c9a84c]"
                  >
                    {FILTROS.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado === 'TODOS' ? 'Todos' : ETIQUETAS_ESTADO_PRESUPUESTO[estado]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131622]">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-[#f0ece4]/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Evento</th>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Estado evento</th>
                      <th className="px-4 py-3 font-medium">Presupuesto</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-[#f0ece4]/50">
                          No hay presupuestos para mostrar.
                        </td>
                      </tr>
                    )}
                    {visibles.map((presupuesto) => (
                      <tr key={presupuesto.codigo} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3">#{presupuesto.codigoEvento}</td>
                        <td className="px-4 py-3">{presupuesto.evento.clienteNombre ?? '—'}</td>
                        <td className="px-4 py-3">{formatoFecha(presupuesto.evento.fechaEvento)}</td>
                        <td className="px-4 py-3 text-[#f0ece4]/65">
                          {presupuesto.evento.estado.replaceAll('_', ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${estiloEstadoPresupuesto[presupuesto.estado]}`}
                          >
                            {ETIQUETAS_ESTADO_PRESUPUESTO[presupuesto.estado]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#c9a84c]">
                          {formatoCLP(presupuesto.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/panel/presupuestos/${presupuesto.codigoEvento}`}
                            className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c] hover:underline"
                          >
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
