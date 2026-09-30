import { useEffect, useMemo, useState } from 'react';
import '../styles/style.css';
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
    shell: 'border-black bg-[#f3e8cc] text-[#744c1a]',
    pill: 'bg-[#f5c76a] text-[#53320d]',
    dot: 'bg-[#f59e0b]',
  },
  verde: {
    shell: 'border-black bg-[#dfeee2] text-[#254a35]',
    pill: 'bg-[#99d9a8] text-[#123f2a]',
    dot: 'bg-[#22c55e]',
  },
  rojo: {
    shell: 'border-black bg-[#f6dddd] text-[#6e1f1f]',
    pill: 'bg-[#f59a9a] text-[#4a1212]',
    dot: 'bg-[#ef4444]',
  },
  azul: {
    shell: 'border-black bg-[#e5eefb] text-[#213d63]',
    pill: 'bg-[#9dbae9] text-[#1e345f]',
    dot: 'bg-[#4f8ef7]',
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
    if (!eventos.length) return;

    const hoy = new Date();
    const hayEventoEnMesActual = eventos.some((evento) => {
      const fecha = normalizarFecha(evento?.fechaEvento);
      return fecha && fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth();
    });

    if (!hayEventoEnMesActual) {
      setViewDate(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    }
  }, [eventos]);

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
    fetchCalendario();
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

  useEffect(() => {
    if (!eventosAMostrar.length) return;

    const fechaActual = new Date();
    const mesTieneEventos = eventosAMostrar.some((evento) => {
      const fecha = normalizarFecha(evento?.fechaEvento);
      return fecha && fecha.getFullYear() === fechaActual.getFullYear() && fecha.getMonth() === fechaActual.getMonth();
    });

    if (mesTieneEventos) {
      setViewDate(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1));
    }
  }, [eventosAMostrar]);

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

  const fetchCalendario = async () => {
    try {
      setError('');
      let calendario = await getCalendarioEventos();

      if (!calendario.length) {
        const respuestasEstado = await Promise.all(ESTADOS_EVENTO.map(async (estado) => getEventosPorEstado(estado)));
        calendario = respuestasEstado.flat();
      }

      setEventos(normalizarEventosCalendario(calendario));
    } catch (fetchError) {
      setError(fetchError.message || 'No se pudo cargar el calendario');
    }
  };

  const cambiarMes = (delta) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white p-2 text-[#393939] md:p-5">
      <div className="mx-auto w-full max-w-[900px] border-2 border-black bg-[#f7f6f2] p-2 shadow-[0_1px_5px_rgba(0,0,0,0.12)] md:p-3">
        <div className="mb-4 border-b-2 border-black pb-5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#77736d]">Sesión activa</div>
          <div className="text-[18px] font-semibold tracking-[0.02em] text-[#292929]">{user?.rut || DEFAULT_RUT}</div>
        </div>

        <div className="mx-auto w-full border-2 border-black bg-[#f8f7f4] p-1.5 md:p-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <button type="button" onClick={() => cambiarMes(-1)} className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#e9e7e1] text-[18px] leading-none text-[#595650] shadow-[0_1px_1px_rgba(0,0,0,0.12)]">‹</button>
            <div className="text-[15px] font-semibold text-[#4a4843]">{monthNames[currentMonth]} {currentYear}</div>
            <button type="button" onClick={() => cambiarMes(1)} className="flex h-8 w-8 items-center justify-center border-2 border-black bg-[#e9e7e1] text-[18px] leading-none text-[#595650] shadow-[0_1px_1px_rgba(0,0,0,0.12)]">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 px-0.5 text-center text-[10px] font-semibold text-[#57544e] md:gap-1">
              {dayNames.map((day) => (
                <div key={day} className="py-1">{day}</div>
              ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5 px-0.5 md:gap-1">
              {calendarDays.map((day) => (
                <div key={day.key} className={`min-h-[58px] p-1.5 md:min-h-[72px] ${day.inMonth ? 'border-2 border-black bg-[#fbfaf7]' : 'border border-black bg-[#f0efeb] text-[#aaa7a1]'} ${day.isToday ? '!border-2 !border-black !bg-[#d5e9ee] ring-1 ring-inset ring-black' : ''}`}>
                  <div className="mb-1 text-[11px] font-medium">{day.dayNumber}</div>
                  <div className="space-y-1">
                    {day.eventosDelDia.slice(0, 2).map((evento, index) => {
                      const color = evento?.estadoCalendario?.color || 'naranja';
                      const classes = colorMap[color] || colorMap.naranja;
                      return (
                        <div key={`${evento.codigo}-${index}`} className={`flex items-center border border-[#66645f] px-1 py-0.5 text-[9px] font-semibold ${classes.pill}`}>
                          <span className={`mr-1 inline-block h-2 w-2 rounded-[1px] ${classes.dot}`} />
                          <span className="truncate">#{evento.codigo}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t-2 border-black pt-3 text-[10px] text-[#5e5b55]">
            {Object.entries(colorMap).map(([color, config]) => (
              <div key={color} className="inline-flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-[1px] ${config.dot}`} />
                <span className="capitalize">{color}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {eventosAMostrar.length === 0 ? (
              <div className="col-span-full rounded-sm border border-[#b7bcb4] bg-[#efefee] p-4 text-center text-sm text-[#555]">No hay eventos con estado en el calendario.</div>
            ) : (
              eventosAMostrar.map((evento) => {
                const color = evento.estadoCalendario?.color || 'naranja';
                const classes = colorMap[color] || colorMap.naranja;

                return (
                  <article key={evento.codigo} className={`min-h-[188px] border-2 border-black p-3 ${classes.shell}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 text-[9px] font-semibold uppercase ${classes.pill}`}>{color}</span>
                      <strong className="text-[12px] font-semibold">#{evento.codigo}</strong>
                    </div>

                    <h3 className="mb-2 text-[13px] font-bold leading-tight">{evento.codigoEvaluacion || 'Sin código'}</h3>
                    <div className="space-y-1 text-[11px] leading-4 text-[#333]">
                      <p><span className="font-semibold">Estado:</span> {evento.estado}</p>
                      <p><span className="font-semibold">Fecha:</span> {formatearFecha(evento.fechaEvento)}</p>
                      <p><span className="font-semibold">Abono:</span> {formatearFecha(evento.fechaPagoAbono)}</p>
                      <p><span className="font-semibold">Pago final:</span> {formatearFecha(evento.fechaPagoFinal)}</p>
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-[#4d4d4d]">{evento.estadoCalendario?.motivo}</p>
                  </article>
                );
              })
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-sm border border-red-200 bg-red-100 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

