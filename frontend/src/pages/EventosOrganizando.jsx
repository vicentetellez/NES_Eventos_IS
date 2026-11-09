import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { avanzarEstadoEvento } from '../services/evento.service.js';
import { descargarPdfSegundoAbono, listarPresupuestos } from '../services/presupuesto.service.js';
import { ETIQUETAS_ESTADO_PRESUPUESTO, formatoCLP, formatoFecha } from '../utils/presupuesto.js';

export default function EventosOrganizando() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const obtenerDatos = useCallback(async () => {
    const resultado = await listarPresupuestos();
    return resultado.presupuestos.filter((presupuesto) => presupuesto.evento.estado === 'ORGANIZANDO');
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerDatos()
      .then((datos) => {
        if (activo) setPresupuestos(datos);
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

  const descargarPdf = async (presupuesto) => {
    setProcesando(presupuesto.codigoEvento);
    setError('');
    setAviso('');
    try {
      await descargarPdfSegundoAbono(presupuesto.codigoEvento);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setProcesando(null);
    }
  };

  const pasarAPagoFinal = async (presupuesto) => {
    const saldo = presupuesto.total - (presupuesto.evento.montoAbono ?? 0);
    const confirmado = window.confirm(
      `¿Pasar el evento #${presupuesto.codigoEvento} a pago final? El saldo del segundo abono es ${formatoCLP(saldo)}.`
    );
    if (!confirmado) return;

    setProcesando(presupuesto.codigoEvento);
    setError('');
    setAviso('');
    try {
      await avanzarEstadoEvento(presupuesto.codigoEvento, { estadoDestino: 'PENDIENTE_PAGO_FINAL' });
      setPresupuestos(await obtenerDatos());
      setAviso(`Evento #${presupuesto.codigoEvento} pasó a PENDIENTE PAGO FINAL.`);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              Seguimiento
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Eventos en organización</h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              Eventos con el primer abono pagado. Cuando todo esté listo, pásalos a pago final para cobrar el segundo abono.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#131622] px-5 py-3 sm:min-w-40">
            <strong className="block text-2xl font-semibold text-[#c9a84c]">{presupuestos.length}</strong>
            <span className="text-xs text-[#f0ece4]/50">en organización</span>
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
          <p className="text-sm text-[#f0ece4]/50">Cargando eventos...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131622]">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-[#f0ece4]/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Evento</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Fecha evento</th>
                  <th className="px-4 py-3 font-medium">Presupuesto</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo 2.º abono</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {presupuestos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[#f0ece4]/50">
                      No hay eventos en organización.
                    </td>
                  </tr>
                )}
                {presupuestos.map((presupuesto) => (
                  <tr key={presupuesto.codigo} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/panel/presupuestos/${presupuesto.codigoEvento}`}
                        className="text-[#c9a84c] hover:underline"
                      >
                        #{presupuesto.codigoEvento}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{presupuesto.evento.clienteNombre ?? '—'}</td>
                    <td className="px-4 py-3">{formatoFecha(presupuesto.evento.fechaEvento)}</td>
                    <td className="px-4 py-3 text-[#f0ece4]/65">{ETIQUETAS_ESTADO_PRESUPUESTO[presupuesto.estado]}</td>
                    <td className="px-4 py-3 text-right">{formatoCLP(presupuesto.total)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#c9a84c]">
                      {formatoCLP(presupuesto.total - (presupuesto.evento.montoAbono ?? 0))}
                    </td>
                    <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/panel/asignacion-evento/${presupuesto.codigoEvento}`}
                        className="inline-flex h-9 items-center rounded-lg border border-[#c9a84c]/40 px-4 text-xs font-semibold text-[#c9a84c] transition hover:bg-[#c9a84c]/10"
                      >
                        Personal y equipos
                      </Link>
                      <button
                        type="button"
                        onClick={() => descargarPdf(presupuesto)}
                        disabled={procesando !== null || presupuesto.estado !== 'VALIDADO'}
                        className="h-9 rounded-lg border border-white/10 px-4 text-xs font-semibold text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        PDF 2.º abono
                      </button>
                      <button
                        type="button"
                        onClick={() => pasarAPagoFinal(presupuesto)}
                        disabled={procesando !== null || presupuesto.estado === 'PENDIENTE_VALIDACION'}
                        title={
                          presupuesto.estado === 'PENDIENTE_VALIDACION'
                            ? 'El presupuesto está pendiente de validación'
                            : undefined
                        }
                        className="h-9 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {procesando === presupuesto.codigoEvento ? 'Procesando...' : 'Pasar a pago final'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
