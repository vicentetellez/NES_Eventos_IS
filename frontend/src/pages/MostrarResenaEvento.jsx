import { useEffect, useState } from 'react';
import { getResenasEventos } from '../services/evaluacionEvento.service.js';

const criteriosEvento = [
  ['calidadPuntualidad', 'Puntualidad'],
  ['calidadTecnica', 'Calidad técnica'],
  ['calidadAtencion', 'Atención'],
  ['fidelidadPresupuesto', 'Fidelidad al presupuesto'],
  ['satisfaccion', 'Satisfacción'],
  ['recomendacion', 'Lo recomendaría']
];

const formatoFecha = new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' });

function mostrarFecha(fecha) {
  return formatoFecha.format(new Date(fecha));
}

function formatoCalificacion(calificacion) {
  return Number(calificacion).toLocaleString('es-CL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
}

function ResenasEventos() {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [eventosAbiertos, setEventosAbiertos] = useState({});
  const [especialidadesAbiertas, setEspecialidadesAbiertas] = useState({});

  useEffect(() => {
    let active = true;

    getResenasEventos()
      .then((resultado) => {
        if (active) {
          setResenas(resultado);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => { active = false; };
  }, []);

  const alternarEvento = (codigo) => {
    setEventosAbiertos((actuales) => ({ ...actuales, [codigo]: !actuales[codigo] }));
  };

  const alternarEspecialidad = (codigoEvento, codigoEspecialidad) => {
    const clave = `${codigoEvento}-${codigoEspecialidad}`;
    setEspecialidadesAbiertas((actuales) => ({ ...actuales, [clave]: !actuales[clave] }));
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
              Experiencia de clientes
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reseñas de eventos</h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              Reseñas registradas y evaluaciones de los trabajadores participantes.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#131622] px-5 py-3 sm:min-w-36">
            <strong className="block text-2xl font-semibold text-[#c9a84c]">{resenas.length}</strong>
            <span className="text-xs text-[#f0ece4]/50">eventos reseñados</span>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-white/10 bg-[#131622] text-sm text-[#f0ece4]/50">
            <p className="animate-pulse">Cargando reseñas…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-white/10 bg-[#131622] px-6 py-12 text-center">
            <h2 className="font-semibold text-[#f0ece4]">No se pudieron cargar las reseñas</h2>
            <p className="mt-2 text-sm text-[#f0ece4]/50">Intenta recargar la página.</p>
          </div>
        ) : resenas.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#131622] px-6 py-12 text-center">
            <h2 className="font-semibold text-[#f0ece4]">Todavía no hay reseñas de eventos</h2>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              Las reseñas de clientes aparecerán aquí cuando se registren.
            </p>
          </div>
        ) : (
          <section aria-label="Todas las reseñas de eventos" className="grid gap-5">
            {resenas.map((resena) => {
              const { evento } = resena;
              const eventoAbierto = eventosAbiertos[evento.codigo] === true;
              const totalTrabajadores = evento.especialidades.reduce(
                (total, especialidad) => total + especialidad.trabajadores.length,
                0
              );

              return (
                <article key={resena.codigo} className="overflow-hidden rounded-xl border border-white/10 bg-[#131622]">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                          {evento.codigoEvaluacion}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold">{evento.nombre}</h2>
                        <p className="mt-1 text-sm text-[#f0ece4]/55">
                          {evento.cliente}
                          {evento.centro ? ` · ${evento.centro}` : ''}
                        </p>
                        <p className="mt-2 text-xs text-[#f0ece4]/40">
                          Evento: {mostrarFecha(evento.fechaEvento)} · Reseña: {mostrarFecha(resena.fechaRegistro)}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/[0.07] px-4 py-3 text-center">
                        <strong className="block text-2xl font-semibold text-[#c9a84c]">
                          {formatoCalificacion(resena.puntajeTotal)}
                          <span className="ml-1 text-sm font-normal text-[#f0ece4]/50">/ 5</span>
                        </strong>
                        <span className="text-xs text-[#f0ece4]/50">evaluación general</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {criteriosEvento.map(([campo, etiqueta]) => (
                        <div key={campo} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.035] px-3 py-2 text-xs">
                          <span className="text-[#f0ece4]/65">{etiqueta}</span>
                          <span className={resena[campo] ? 'font-medium text-emerald-300' : 'font-medium text-[#f0ece4]/40'}>
                            {resena[campo] ? 'Sí' : 'No'}
                          </span>
                        </div>
                      ))}
                    </div>

                    {resena.comentarioAdicional && (
                      <blockquote className="mt-4 border-l-2 border-[#c9a84c]/50 pl-3 text-sm leading-relaxed text-[#f0ece4]/75">
                        “{resena.comentarioAdicional}”
                      </blockquote>
                    )}

                    <button
                      type="button"
                      className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-[#f0ece4]/80 transition hover:border-[#c9a84c]/40 hover:text-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
                      onClick={() => alternarEvento(evento.codigo)}
                      aria-expanded={eventoAbierto}
                    >
                      {eventoAbierto ? 'Ocultar trabajadores' : 'Ver trabajadores por especialidad'}
                      <span className="text-xs text-[#f0ece4]/45">
                        ({totalTrabajadores})
                      </span>
                      <span aria-hidden="true">{eventoAbierto ? '⌃' : '⌄'}</span>
                    </button>
                  </div>

                  {eventoAbierto && (
                    <div className="border-t border-white/10 bg-black/10 p-4 sm:p-6">
                      {evento.especialidades.length === 0 ? (
                        <p className="text-sm text-[#f0ece4]/50">
                          Este evento no tiene trabajadores con especialidades evaluables asignados.
                        </p>
                      ) : (
                        <div className="grid gap-3">
                          {evento.especialidades.map((especialidad) => {
                            const clave = `${evento.codigo}-${especialidad.codigo}`;
                            const especialidadAbierta = especialidadesAbiertas[clave] === true;

                            return (
                              <section key={especialidad.codigo} className="overflow-hidden rounded-lg border border-white/10">
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#c9a84c]"
                                  onClick={() => alternarEspecialidad(evento.codigo, especialidad.codigo)}
                                  aria-expanded={especialidadAbierta}
                                >
                                  <span className="font-medium">{especialidad.nombre}</span>
                                  <span className="flex items-center gap-3 text-xs text-[#f0ece4]/50">
                                    {especialidad.trabajadores.length} trabajadores
                                    <span aria-hidden="true">{especialidadAbierta ? '⌃' : '⌄'}</span>
                                  </span>
                                </button>

                                {especialidadAbierta && (
                                  <ul className="divide-y divide-white/[0.07] border-t border-white/10">
                                    {especialidad.trabajadores.map((trabajador) => (
                                      <li key={trabajador.rut} className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-start">
                                        <div>
                                          <p className="text-sm font-medium">{trabajador.nombre}</p>
                                          {trabajador.evaluacion?.comentarioEspecifico && (
                                            <p className="mt-1 text-sm text-[#f0ece4]/55">
                                              {trabajador.evaluacion.comentarioEspecifico}
                                            </p>
                                          )}
                                        </div>
                                        {trabajador.evaluacion ? (
                                          <span className="shrink-0 text-sm font-semibold text-[#c9a84c]">
                                            {formatoCalificacion(trabajador.evaluacion.calificacion)} / 5
                                          </span>
                                        ) : (
                                          <span className="shrink-0 text-xs text-[#f0ece4]/40">
                                            Sin reseña individual
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </section>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default ResenasEventos;