import { useEffect, useMemo, useState } from 'react';
import { login } from '../services/auth.service';
import { getCalendarioEventos } from '../services/calendarioEvento.service';
import { getEventosPorEstado } from '../services/evento.service';

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const ESTADOS_EVENTO = ['SOLICITADO', 'COTIZANDO', 'PENDIENTE_PAGO_ABONO', 'ORGANIZANDO', 'PENDIENTE_PAGO_FINAL', 'EN_PREPARACION', 'EN_EJECUCION', 'FINALIZADO', 'CANCELADO'];
const DEFAULT_RUT = '11111111-1';
const DEFAULT_PASSWORD = 'admin123';

const colorMap = {
  naranja: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]',
    dot: 'bg-[#c9a84c]',
  },
  verde: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  rojo: {
    shell: 'border-white/10 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-rose-400/20 bg-rose-400/10 text-rose-300',
    dot: 'bg-rose-400',
  },
  azul: {
    shell: 'border-[#c9a84c]/30 bg-[#131622] text-[#f0ece4]',
    pill: 'border border-[#c9a84c]/40 bg-[#c9a84c]/15 text-[#c9a84c]',
    dot: 'bg-[#c9a84c]',
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

  if (!fechaEvento) return { visible: false, color: null, motivo: 'Sin fecha del evento' };

  if (estadoEvento === 'FINALIZADO' && fechaPagoAbono && fechaPagoFinal) {
    return { visible: true, color: 'azul', motivo: 'El evento está finalizado con fechaPagoAbono y fechaPagoFinal, por lo tanto el cliente podrá realizar la reseña' };
  }

  if (fechaPagoAbono && fechaPagoFinal) {
    return { visible: true, color: 'verde', motivo: 'El evento tiene fechaPagoAbono y fechaPagoFinal, por lo tanto está en verde' };
  }

  if (fechaPagoAbono && !fechaPagoFinal) {
    const hoy = new Date();
    const fechaLimiteRojo = new Date(fechaEvento);
    fechaLimiteRojo.setDate(fechaEvento.getDate() - 14);

    if (hoy >= fechaLimiteRojo && hoy < fechaEvento) {
      return { visible: true, color: 'rojo', motivo: 'Falta fechaPagoFinal y queda menos de dos semanas para el evento' };
    }

    return { visible: true, color: 'naranja', motivo: 'El evento tiene fechaPagoAbono, por lo tanto va en naranja' };
  }

  return { visible: false, color: null, motivo: 'El evento no cumple las condiciones del calendario' };
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

export default function CalendarioEvento() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { rut: DEFAULT_RUT };
  });
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState('');
  const [viewDate, setViewDate] = useState(new Date());

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    const autoLogin = async () => {
      if (token) return;
      try {
        const authData = await login({ rut: DEFAULT_RUT, password: DEFAULT_PASSWORD });
        if (authData?.token) {
          setToken(authData.token);
          setUser(authData.user ?? { rut: DEFAULT_RUT });
        }
      } catch (loginError) {
        setError(loginError.message || 'No se pudo iniciar la sesión automática');
      }
    };

    autoLogin();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let activo = true;
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
  }, [token]);

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
          <div className="rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f0ece4]/45">Sesión activa</div>
            <div className="text-sm font-semibold tracking-[0.02em] text-[#f0ece4]">{user?.rut || DEFAULT_RUT}</div>
          </div>
        </header>

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
                    <article key={evento.codigo} className={`rounded-lg border p-4 transition hover:border-[#c9a84c]/30 ${classes.shell}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${classes.pill}`}>{color}</span>
                        <strong className="text-xs font-semibold text-[#f0ece4]/55">#{evento.codigo}</strong>
                      </div>

                      <h3 className="mb-4 text-sm font-semibold text-[#c9a84c]">{evento.codigoEvaluacion || 'Sin código'}</h3>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <dt className="text-[#f0ece4]/45">Estado</dt>
                        <dd className="text-right font-medium">{evento.estado}</dd>
                        <dt className="text-[#f0ece4]/45">Fecha</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaEvento)}</dd>
                        <dt className="text-[#f0ece4]/45">Abono</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaPagoAbono)}</dd>
                        <dt className="text-[#f0ece4]/45">Pago final</dt>
                        <dd className="text-right">{formatearFecha(evento.fechaPagoFinal)}</dd>
                      </dl>
                      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#f0ece4]/50">{evento.estadoCalendario?.motivo}</p>
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
