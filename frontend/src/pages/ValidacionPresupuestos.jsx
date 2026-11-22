import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { avanzarEstadoEvento } from '../services/evento.service.js';
import { descargarComprobante, rechazarComprobante } from '../services/comprobanteAbono.service.js';
import { listarPresupuestos } from '../services/presupuesto.service.js';
import { formatoCLP, formatoFecha, numeroEvento } from '../utils/presupuesto.js';

export default function ValidacionPresupuestos() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [eventosPorOrganizar, setEventosPorOrganizar] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const obtenerDatos = useCallback(async () => {
    const [pendientes, validados] = await Promise.all([
      listarPresupuestos('PENDIENTE_VALIDACION'),
      listarPresupuestos('VALIDADO'),
    ]);
    return {
      pendientes: pendientes.presupuestos,
      porOrganizar: validados.presupuestos.filter(
        (presupuesto) => presupuesto.evento.estado === 'PENDIENTE_PAGO_ABONO'
      ),
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerDatos()
      .then((datos) => {
        if (!activo) return;
        setPresupuestos(datos.pendientes);
        setEventosPorOrganizar(datos.porOrganizar);
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

  const confirmarAbono = async (presupuesto) => {
    const confirmado = window.confirm(
      `¿Aprobar el comprobante del primer abono (${formatoCLP(presupuesto.evento.montoAbono)}) del evento ${numeroEvento(presupuesto.evento.numeroVisible)}? El evento pasará a ORGANIZANDO.`
    );
    if (!confirmado) return;

    setConfirmando(presupuesto.codigoEvento);
    setError('');
    setAviso('');
    try {
      await avanzarEstadoEvento(presupuesto.codigoEvento, { estadoDestino: 'ORGANIZANDO' });
      const datos = await obtenerDatos();
      setPresupuestos(datos.pendientes);
      setEventosPorOrganizar(datos.porOrganizar);
      setAviso(`Evento ${numeroEvento(presupuesto.evento.numeroVisible)} pasó a ORGANIZANDO.`);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setConfirmando(null);
    }
  };

  const rechazarAbono = async (presupuesto) => {
    const observacion = window.prompt('Indica el motivo del rechazo del comprobante:');
    if (observacion === null) return;
    if (!observacion.trim()) {
      setError('Debes indicar el motivo del rechazo.');
      return;
    }
    if (observacion.trim().length > 1000) {
      setError('El motivo no puede superar los 1000 caracteres.');
      return;
    }
    setConfirmando(presupuesto.codigoEvento);
    setError('');
    setAviso('');
    try {
      await rechazarComprobante(presupuesto.codigoEvento, observacion.trim());
      const datos = await obtenerDatos();
      setPresupuestos(datos.pendientes);
      setEventosPorOrganizar(datos.porOrganizar);
      setAviso('Comprobante rechazado. El staff podrá subir uno nuevo.');
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setConfirmando(null);
    }
  };

  const descargarAbono = async (presupuesto) => {
    setError('');
    try {
      await descargarComprobante(presupuesto.codigoEvento);
    } catch (errorAccion) {
      setError(errorAccion.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              Gerencia
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Validación de presupuestos</h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              Presupuestos enviados por el staff que esperan tu aprobación o rechazo.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#131622] px-5 py-3 sm:min-w-40">
            <strong className="block text-2xl font-semibold text-[#c9a84c]">{presupuestos.length}</strong>
            <span className="text-xs text-[#f0ece4]/50">pendientes</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
            {error}
          </div>
        )}
        {aviso && (
          <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300" role="status">
            {aviso}
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-[#f0ece4]/50">Cargando presupuestos...</p>
        ) : presupuestos.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#131622] px-5 py-4 text-sm text-[#f0ece4]/50">
            No hay presupuestos pendientes de validación.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {presupuestos.map((presupuesto) => (
              <Link
                key={presupuesto.codigo}
                to={`/panel/presupuestos/${presupuesto.codigoEvento}`}
                className="group flex flex-col justify-between rounded-xl border border-white/10 bg-[#131622] p-6 transition hover:-translate-y-1 hover:border-[#c9a84c]/50 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
              >
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#f0ece4]/50">
                    Evento {numeroEvento(presupuesto.evento.numeroVisible)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold transition-colors group-hover:text-[#c9a84c]">
                    {presupuesto.evento.clienteNombre ?? 'Cliente'}
                  </h2>
                  <p className="mt-1 text-sm text-[#f0ece4]/50">
                    {formatoFecha(presupuesto.evento.fechaEvento)} · {presupuesto.evento.cantidadPersonas} invitados
                  </p>
                </div>
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[#f0ece4]/50">Total</p>
                    <p className="text-xl font-semibold text-[#c9a84c]">{formatoCLP(presupuesto.total)}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                    Revisar →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!cargando && (
          <section className="mt-12">
            <div className="mb-4 border-b border-white/10 pb-4">
              <h2 className="text-lg font-semibold">
                Eventos por pasar a organizado{' '}
                <span className="text-sm font-normal text-[#f0ece4]/50">({eventosPorOrganizar.length})</span>
              </h2>
              <p className="mt-1 text-sm text-[#f0ece4]/50">
                Revisa el comprobante enviado por el staff. Al aprobarlo, el evento pasa a ORGANIZANDO.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131622]">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-[#f0ece4]/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Evento</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Fecha evento</th>
                    <th className="px-4 py-3 font-medium">Límite de pago</th>
                    <th className="px-4 py-3 text-right font-medium">Primer abono</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {eventosPorOrganizar.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-[#f0ece4]/50">
                        No hay eventos esperando el pago del primer abono.
                      </td>
                    </tr>
                  )}
                  {eventosPorOrganizar.map((presupuesto) => (
                    <tr key={presupuesto.codigo} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to={`/panel/presupuestos/${presupuesto.codigoEvento}`}
                          className="text-[#c9a84c] hover:underline"
                        >
                          {numeroEvento(presupuesto.evento.numeroVisible)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{presupuesto.evento.clienteNombre ?? '—'}</td>
                      <td className="px-4 py-3">{formatoFecha(presupuesto.evento.fechaEvento)}</td>
                      <td className="px-4 py-3">{formatoFecha(presupuesto.evento.fechaLimiteAbono)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#c9a84c]">
                        {formatoCLP(presupuesto.evento.montoAbono)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {presupuesto.evento.comprobante?.estado === 'PENDIENTE' ? (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" onClick={() => descargarAbono(presupuesto)} className="text-[#c9a84c] hover:underline">
                              Descargar comprobante
                            </button>
                            <button type="button" onClick={() => rechazarAbono(presupuesto)} disabled={confirmando !== null} className="text-red-300 disabled:opacity-50">
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmarAbono(presupuesto)}
                              disabled={confirmando !== null}
                              className="h-9 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {confirmando === presupuesto.codigoEvento ? 'Procesando...' : 'Aprobar y organizar'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#f0ece4]/50">
                            {presupuesto.evento.comprobante?.estado === 'RECHAZADO' ? 'Comprobante rechazado' : 'Esperando comprobante'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
