import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCalendarioEventos } from '../services/calendarioEvento.service';
import { getAlertasPagoPendiente, getEventosPorEstado } from '../services/evento.service';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ESTADOS_EVENTO = ['SOLICITADO', 'COTIZANDO', 'PENDIENTE_PAGO_ABONO', 'ORGANIZANDO', 'PENDIENTE_PAGO_FINAL', 'EN_PREPARACION', 'EN_EJECUCION', 'FINALIZADO', 'CANCELADO'];
const descripcionesPorEstado = {
  EN_PREPARACION: 'El evento fue pagado en su totalidad.',
  PENDIENTE_PAGO_ABONO: 'No se ha realizado el primer pago del abono.',
  ORGANIZANDO: 'Pago del primer abono realizado.',
  PENDIENTE_PAGO_FINAL: 'No se ha realizado el pago final del abono.',
  FINALIZADO: 'El cliente puede realizar la reseña del evento.',
};

const colorMap = {
  naranja: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]',
    dot: 'bg-[#c9a84c]',
    hover: 'hover:border-[#c9a84c]/50',
  },
  verde: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    dot: 'bg-emerald-400',
    hover: 'hover:border-emerald-400/50',
  },
  rojo: {
    shell: 'border-rose-400/30 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-rose-400/20 bg-rose-400/10 text-rose-300',
    dot: 'bg-rose-400',
    hover: 'hover:border-rose-400/50',
  },
  azul: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-sky-400/40 bg-sky-400/15 text-sky-300',
    dot: 'bg-sky-400',
    hover: 'hover:border-sky-400/50',
  },
};

const normalizarFecha = (fecha) => {
  if (!fecha) return null;
  const parsed = new Date(fecha);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const calcularEstadoCalendario = (evento) => {
  const estadoEvento = (evento?.estado ?? '').toUpperCase();
  const fechaPagoAbono = normalizarFecha(evento?.fechaPagoAbono);
  const fechaPagoFinal = normalizarFecha(evento?.fechaPagoFinal);
  const fechaEvento = normalizarFecha(evento?.fechaEvento);

  if (!fechaEvento) return { visible: false, color: null };

  if (estadoEvento === 'FINALIZADO' && fechaPagoAbono && fechaPagoFinal) {
    return { visible: true, color: 'azul' };
  }

  if (fechaPagoAbono && fechaPagoFinal) {
    return { visible: true, color: 'verde' };
  }

  if (fechaPagoAbono && !fechaPagoFinal) {
    const hoy = new Date();
    const fechaLimiteRojo = new Date(fechaEvento);
    fechaLimiteRojo.setDate(fechaEvento.getDate() - 14);

    if (hoy >= fechaLimiteRojo && hoy < fechaEvento) {
      return { visible: true, color: 'rojo' };
    }

    return { visible: true, color: 'naranja' };
  }

  return { visible: false, color: null };
};

const normalizarEventosCalendario = (lista) => {
  if (!Array.isArray(lista)) return [];
  return lista
    .map((evento) => {
      const estadoCalendario = evento?.estadoCalendario && Object.keys(evento.estadoCalendario).length > 0 ? evento.estadoCalendario : calcularEstadoCalendario(evento);
      return { ...evento, estadoCalendario };
    })
    .filter((evento) => evento?.estadoCalendario?.visible === true);
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleDateString('es-CL');
};

const formatearEstado = (estado) => {
  if (!estado) return '';
  return estado
    .replaceAll('_', ' ')
    .toLocaleLowerCase('es-CL')
    .replace(/^./u, (letra) => letra.toLocaleUpperCase('es-CL'))
    .replace('preparacion', 'preparación')
    .replace('ejecucion', 'ejecución');
};

export default function CalendarioEvento() {
  const { isAuthenticated, user } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState('');
  const [viewDate, setViewDate] = useState(new Date());
  const [alertasPago, setAlertasPago] = useState([]);
  const [alertasCargando, setAlertasCargando] = useState(true);
  const [errorAlertas, setErrorAlertas] = useState('');
  const [actualizarAlertas, setActualizarAlertas] = useState(0);
  const puedeVerAlertas = ['ADMIN', 'STAFF'].includes(user?.rol);

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let activo = true;
    setError('');
    getCalendarioEventos()
      .then(async (calendario) => {
        if (calendario.length > 0) return calendario;
        const respuestasEstado = await Promise.all(ESTADOS_EVENTO.map((estado) => getEventosPorEstado(estado)));
        return respuestasEstado.flat();
      })
      .then((calendario) => {
        if (!activo) return;
        setError('');
        setEventos(normalizarEventosCalendario(calendario));
      })
      .catch((fetchError) => {
        if (activo) setError(fetchError.message || 'No se pudo cargar el calendario');
      });

    return () => { activo = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !puedeVerAlertas) return undefined;

    let activo = true;
    getAlertasPagoPendiente()
      .then((resultado) => {
        if (activo) {
          setAlertasPago(resultado.alertas);
          setErrorAlertas('');
        }
      })
      .catch((fetchError) => {
        if (activo) {
          setAlertasPago([]);
          setErrorAlertas(fetchError.message || 'No se pudieron cargar las alertas de pago.');
        }
      })
      .finally(() => {
        if (activo) setAlertasCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [actualizarAlertas, isAuthenticated, puedeVerAlertas]);

  const refrescarAlertas = () => {
    setAlertasCargando(true);
    setActualizarAlertas((anterior) => anterior + 1);
  };

  const eventosConEstado = useMemo(() => normalizarEventosCalendario(eventos), [eventos]);

  const eventosOrdenados = useMemo(
    () => [...eventosConEstado].sort((a, b) => {
      const fechaA = a?.fechaEvento ? new Date(a.fechaEvento).getTime() : Number.MAX_SAFE_INTEGER;
      const fechaB = b?.fechaEvento ? new Date(b.fechaEvento).getTime() : Number.MAX_SAFE_INTEGER;
      return fechaA - fechaB;
    }),
    [eventosConEstado]
  );

  const eventosAMostrar = eventosOrdenados.length > 0 ? eventosOrdenados : eventos;

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const today = new Date();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startOffset = firstDayOfMonth.getDay();

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    const date = new Date(currentYear, currentMonth, dayNumber);
    const inMonth = date.getMonth() === currentMonth;
    const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();

    return {
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      date,
      inMonth,
      isToday,
      dayNumber: date.getDate(),
      eventosDelDia: eventosAMostrar.filter((evento) => {
        const eventDate = normalizarFecha(evento?.fechaEvento);
        if (!eventDate) return false;
        return eventDate.getFullYear() === date.getFullYear() && eventDate.getMonth() === date.getMonth() && eventDate.getDate() === date.getDate();
      }),
    };
  });

  const cambiarMes = (delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0a0c10] px-3 py-6 text-[#f0ece4] sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 rounded-xl border border-white/10 bg-[#131622] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a84c]">Gestión de eventos</p>
            <h1 className="font-serif text-3xl sm:text-4xl">Calendario</h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">Agenda, pagos y estado de los eventos</p>
          </div>
        </header>

        {puedeVerAlertas && (
          <section
            className="mb-6 rounded-xl border border-[#c9a84c]/25 bg-[#131622] p-5 sm:p-6"
            aria-labelledby="alertas-pago-title"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c]">
                  Seguimiento de abonos
                </p>
                <h2 id="alertas-pago-title" className="mt-1 text-lg font-semibold">
                  Alertas de pagos pendientes
                  {!alertasCargando && !errorAlertas && (
                    <span className="ml-2 rounded-full bg-[#c9a84c]/15 px-2 py-0.5 align-middle text-xs text-[#c9a84c]">
                      {alertasPago.length}
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-xs text-[#f0ece4]/50">
                  Abonos que vencen dentro de 3 días o cuya fecha límite ya pasó.
                </p>
              </div>
              <button
                type="button"
                onClick={refrescarAlertas}
                disabled={alertasCargando}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#f0ece4]/75 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Actualizar alertas
              </button>
            </div>

            {alertasCargando ? (
              <p className="rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-5 text-sm text-[#f0ece4]/50" role="status">
                Cargando alertas de pago…
              </p>
            ) : errorAlertas ? (
              <div className="rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-200" role="alert">
                <p>{errorAlertas}</p>
                <button
                  type="button"
                  onClick={refrescarAlertas}
                  className="mt-3 font-semibold underline underline-offset-4"
                >
                  Reintentar
                </button>
              </div>
            ) : alertasPago.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-5 text-sm text-[#f0ece4]/55">
                No hay abonos próximos a vencer ni vencidos.
              </p>
            ) : (
              <ul className="grid gap-3 lg:grid-cols-2">
                {alertasPago.map((alerta) => {
                  const vencido = alerta.estadoAlerta === 'VENCIDO';
                  const plazo = alerta.diasRestantes === 0
                    ? 'Vence hoy'
                    : vencido
                      ? `Vencido hace ${Math.abs(alerta.diasRestantes)} ${Math.abs(alerta.diasRestantes) === 1 ? 'día' : 'días'}`
                      : `Vence en ${alerta.diasRestantes} ${alerta.diasRestantes === 1 ? 'día' : 'días'}`;

                  return (
                    <li
                      key={alerta.codigoEvento}
                      className="rounded-lg border border-white/10 bg-[#0a0c10] p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-[#f0ece4]">
                          {alerta.nombreEvento}
                          <span className="ml-2 text-xs font-normal text-[#f0ece4]/40">
                            #{alerta.codigoEvento}
                          </span>
                        </h3>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${vencido ? 'border-rose-400/25 bg-rose-400/10 text-rose-300' : 'border-[#c9a84c]/25 bg-[#c9a84c]/10 text-[#c9a84c]'}`}>
                          {plazo}
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
                        <dt className="text-[#f0ece4]/45">Cliente</dt>
                        <dd className="col-span-1 text-right text-[#f0ece4]/80 sm:col-span-3">{alerta.nombreCliente}</dd>
                        <dt className="text-[#f0ece4]/45">Fecha del evento</dt>
                        <dd className="text-right text-[#f0ece4]/80">{formatearFecha(alerta.fechaEvento)}</dd>
                        <dt className="text-[#f0ece4]/45">Fecha límite</dt>
                        <dd className="text-right text-[#f0ece4]/80">{formatearFecha(alerta.fechaLimiteAbono)}</dd>
                        <dt className="text-[#f0ece4]/45">Monto pendiente</dt>
                        <dd className="col-span-1 text-right font-semibold text-[#c9a84c] sm:col-span-3">
                          {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(alerta.montoPendiente)}
                        </dd>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <section className="rounded-xl border border-white/10 bg-[#131622] p-3 shadow-2xl shadow-black/20 sm:p-6" aria-label="Calendario de eventos">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="grid size-10 place-items-center rounded-lg border border-white/10 bg-[#0a0c10] text-2xl leading-none text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#c9a84c]"
            >‹</button>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c]">Agenda</p>
              <h2 className="mt-1 text-lg font-semibold sm:text-xl">{monthNames[currentMonth]} {currentYear}</h2>
            </div>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="grid size-10 place-items-center rounded-lg border border-white/10 bg-[#0a0c10] text-2xl leading-none text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#c9a84c]"
            >›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#f0ece4]/45 sm:gap-2">
            {dayNames.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((day) => (
              <div
                key={day.key}
                className={`min-h-[58px] rounded-md border p-1.5 transition sm:min-h-[92px] sm:p-2 ${day.inMonth ? 'border-white/10 bg-[#0a0c10]' : 'border-white/5 bg-white/[0.02] text-[#f0ece4]/25'} ${day.isToday ? '!border-[#c9a84c]/70 bg-[#c9a84c]/[0.08] ring-1 ring-inset ring-[#c9a84c]/30' : ''}`}
              >
                <div className={`mb-1 text-[11px] font-medium ${day.isToday ? 'text-[#c9a84c]' : ''}`}>{day.dayNumber}</div>
                <div className="space-y-1">
                  {day.eventosDelDia.slice(0, 2).map((evento, index) => {
                    const color = evento?.estadoCalendario?.color || 'naranja';
                    const classes = colorMap[color] || colorMap.naranja;
                    return (
                      <div key={`${evento.codigo}-${index}`} className={`flex items-center gap-1 rounded border px-1 py-0.5 text-[9px] font-semibold ${classes.pill}`}>
                        <span className={`inline-block size-1.5 shrink-0 rounded-full ${classes.dot}`} />
                        <span className="truncate">#{evento.codigo}</span>
                      </div>
                    );
                  })}
                  {day.eventosDelDia.length > 2 && (
                    <p className="text-[9px] text-[#f0ece4]/45">+{day.eventosDelDia.length - 2} más</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[10px] text-[#f0ece4]/55">
            {Object.entries(colorMap).map(([color, config]) => (
              <div key={color} className="inline-flex items-center gap-2">
                <span className={`inline-block size-2 rounded-full ${config.dot}`} />
                <span className="capitalize">{color}</span>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Eventos en calendario</h2>
                <p className="mt-1 text-xs text-[#f0ece4]/45">{eventosAMostrar.length} eventos visibles</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {eventosAMostrar.length === 0 ? (
                <div className="col-span-full rounded-lg border border-dashed border-white/15 bg-[#0a0c10] p-8 text-center">
                  <p className="text-sm font-medium text-[#f0ece4]/75">No hay eventos en el calendario</p>
                  <p className="mt-2 text-xs text-[#f0ece4]/40">Los eventos que cumplan las condiciones aparecerán aquí.</p>
                </div>
              ) : (
                eventosAMostrar.map((evento) => {
                  const color = evento.estadoCalendario?.color || 'naranja';
                  const classes = colorMap[color] || colorMap.naranja;

                  return (
                    <article key={evento.codigo} className={`rounded-lg border p-4 transition ${classes.hover} ${classes.shell}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${classes.pill}`}>{color}</span>
                        <strong className="text-xs font-semibold text-[#f0ece4]/55">#{evento.codigo}</strong>
                      </div>

                      <h3 className="mb-4 text-sm font-semibold text-[#c9a84c]">{evento.codigoEvaluacion || 'Sin código'}</h3>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <dt className="text-[#f0ece4]/45">Estado</dt>
                        <dd className="text-right font-medium">{formatearEstado(evento.estado)}</dd>
                        <dt className="text-[#f0ece4]/45">Fecha</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaEvento)}</dd>
                        <dt className="text-[#f0ece4]/45">Abono</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaPagoAbono)}</dd>
                        <dt className="text-[#f0ece4]/45">Pago final</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaPagoFinal)}</dd>
                      </dl>
                      {descripcionesPorEstado[evento.estado?.toUpperCase()] && (
                        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#f0ece4]/50">
                          {descripcionesPorEstado[evento.estado.toUpperCase()]}
                        </p>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" role="alert">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
