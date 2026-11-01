import { useMemo, useState } from 'react';
import { getEventoByCodigoEvaluacion } from '../services/evento.service.js';
import {
  createEvaluacionEvento,
  existingEvaluacionEvento,
} from '../services/evaluacionEvento.service.js';
import {
  createEvaluacionesTrabajadores,
  getTrabajadoresParaEvaluacion,
} from '../services/evaluacionTrabajador.service.js';

const PREGUNTAS_EVENTO = [
  { campo: 'calidadPuntualidad', texto: '¿El evento comenzó y se desarrolló puntualmente?' },
  { campo: 'calidadTecnica', texto: '¿La calidad técnica cumplió con sus expectativas?' },
  { campo: 'calidadAtencion', texto: '¿Recibió una atención amable y oportuna?' },
  { campo: 'fidelidadPresupuesto', texto: '¿El servicio respetó el presupuesto acordado?' },
  { campo: 'satisfaccion', texto: '¿Quedó satisfecho con la experiencia general?' },
  { campo: 'recomendacion', texto: '¿Recomendaría NES Eventos?' },
];

const botonPrimario = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#c9a84c] px-6 py-3 text-sm font-semibold text-[#0a0c10] transition hover:bg-[#d8ba68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-40';
const campoTexto = 'w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 disabled:cursor-not-allowed disabled:opacity-40';

function nombreTrabajador(trabajador) {
  const persona = trabajador.persona;
  return [persona.nombre, persona.primerApellido, persona.segundoApellido].filter(Boolean).join(' ');
}

export default function ResenaEvento() {
  const [codigo, setCodigo] = useState('');
  const [evento, setEvento] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [paso, setPaso] = useState(0);
  const [respuestasEvento, setRespuestasEvento] = useState({});
  const [comentarioEvento, setComentarioEvento] = useState('');
  const [respuestasTrabajadores, setRespuestasTrabajadores] = useState({});
  const [especialidadesAbiertas, setEspecialidadesAbiertas] = useState({});
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);

  const totalTrabajadores = useMemo(
    () => especialidades.reduce((total, especialidad) => total + especialidad.trabajadores.length, 0),
    [especialidades]
  );
  const preguntasRespondidas = PREGUNTAS_EVENTO.filter(
    ({ campo }) => typeof respuestasEvento[campo] === 'boolean'
  ).length;
  const evaluacionesManualesPendientes = Object.values(respuestasTrabajadores)
    .filter((respuesta) => respuesta.evaluarManualmente && typeof respuesta.calificacion !== 'number').length;
  const evaluacionesTrabajadoresListas = totalTrabajadores - evaluacionesManualesPendientes;

  async function acceder(event) {
    event.preventDefault();
    setCargando(true);
    setError('');
    try {
      const codigoEvaluacion = codigo.trim().toUpperCase();
      const eventoEncontrado = await getEventoByCodigoEvaluacion(codigoEvaluacion);
      const evaluacionExiste = await existingEvaluacionEvento(codigoEvaluacion);
      if (evaluacionExiste) {
        throw new Error('Este evento ya tiene una evaluación registrada.');
      }
      const especialidadesEncontradas = await getTrabajadoresParaEvaluacion(eventoEncontrado.codigo);
      setEvento(eventoEncontrado);
      setEspecialidades(especialidadesEncontradas);
    } catch (errorSolicitud) {
      setError(errorSolicitud.message);
      setEvento(null);
      setEspecialidades([]);
    } finally {
      setCargando(false);
    }
  }

  function actualizarEvaluacionTrabajador(codigoEspecialidad, rutTrabajador, cambios) {
    const clave = `${codigoEspecialidad}:${rutTrabajador}`;
    setRespuestasTrabajadores((actuales) => ({
      ...actuales,
      [clave]: { ...actuales[clave], ...cambios },
    }));
  }

  function cambiarEvaluacionManual(codigoEspecialidad, rutTrabajador, evaluarManualmente) {
    const clave = `${codigoEspecialidad}:${rutTrabajador}`;
    setRespuestasTrabajadores((actuales) => ({
      ...actuales,
      [clave]: evaluarManualmente
        ? { ...actuales[clave], evaluarManualmente: true }
        : { evaluarManualmente: false },
    }));
  }

  async function enviarResena() {
    if (!evento || totalTrabajadores === 0 || evaluacionesManualesPendientes > 0) return;

    setEnviando(true);
    setError('');
    try {
      const respuestasPositivas = PREGUNTAS_EVENTO.filter(({ campo }) => respuestasEvento[campo]).length;
      const puntajeTotal = Number(((respuestasPositivas / PREGUNTAS_EVENTO.length) * 100).toFixed(2));
      const evaluacionesTrabajadores = especialidades.flatMap((especialidad) =>
        especialidad.trabajadores.map((trabajador) => {
          const respuesta = respuestasTrabajadores[`${especialidad.codigo}:${trabajador.rut}`];
          const evaluacionManual = respuesta?.evaluarManualmente === true;
          return {
            calificacion: evaluacionManual
              ? respuesta.calificacion
              : Number((puntajeTotal / 20).toFixed(2)),
            esAutogenerado: !evaluacionManual,
            ...(evaluacionManual && respuesta.comentarioEspecifico?.trim()
              ? { comentarioEspecifico: respuesta.comentarioEspecifico.trim() }
              : {}),
            codigoEvento: evento.codigo,
            codigoEspecialidad: especialidad.codigo,
            rutTrabajador: trabajador.rut,
          };
        })
      );

      await createEvaluacionesTrabajadores(evaluacionesTrabajadores);
      await createEvaluacionEvento({
        ...respuestasEvento,
        puntajeTotal,
        ...(comentarioEvento.trim() ? { comentarioAdicional: comentarioEvento.trim() } : {}),
        codigoEvento: evento.codigo,
      });
      setEnviado(true);
    } catch (errorSolicitud) {
      setError(errorSolicitud.message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0c10] px-4 py-12 text-[#f0ece4]">
        <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#131622] px-7 py-14 text-center shadow-2xl shadow-black/30 sm:px-14">
          <span className="mx-auto mb-7 grid size-14 place-items-center rounded-full border border-[#c9a84c]/60 text-2xl text-[#c9a84c]" aria-hidden="true">✓</span>
          <p className="mb-3 text-xs font-bold tracking-[0.24em] text-[#c9a84c]">RESEÑA ENVIADA</p>
          <h1 className="font-serif text-3xl leading-tight sm:text-5xl">¡Gracias por compartir tu experiencia!</h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#f0ece4]/60">
            Tu opinión nos ayuda a mejorar cada evento y reconocer el trabajo de nuestro equipo.
          </p>
        </section>
      </main>
    );
  }

  if (!evento) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-[#0a0c10] px-4 py-10 text-[#f0ece4] sm:justify-center">
        <header className="mb-9 flex items-center gap-3 text-sm tracking-[0.24em]">
          <span className="grid size-10 place-items-center border border-[#c9a84c]/70 font-serif text-xl text-[#c9a84c]">N</span>
          <span>NES <strong className="font-bold">EVENTOS</strong></span>
        </header>
        <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#131622] p-7 shadow-2xl shadow-black/30 sm:p-11">
          <p className="mb-3 text-xs font-bold tracking-[0.22em] text-[#c9a84c]">TU OPINIÓN IMPORTA</p>
          <h1 className="font-serif text-3xl leading-tight sm:text-4xl">Cuéntanos cómo estuvo tu evento</h1>
          <p className="mb-8 mt-4 text-sm leading-6 text-[#f0ece4]/60">
            Ingresa el código de evaluación que recibiste para comenzar tu reseña.
          </p>
          <form onSubmit={acceder}>
            <label className="mb-2 block text-sm font-medium text-[#f0ece4]/80" htmlFor="codigo-evento">
              Código del evento
            </label>
            <input
              id="codigo-evento"
              className={`${campoTexto} tracking-[0.16em]`}
              value={codigo}
              onChange={(event) => setCodigo(event.target.value.toUpperCase())}
              placeholder="EV-ABC123"
              maxLength={10}
              autoComplete="off"
              required
            />
            {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
            <button className={`${botonPrimario} mt-5 w-full`} disabled={cargando}>
              {cargando ? 'Verificando código…' : 'Comenzar reseña'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-[#f0ece4]/40">La encuesta solo está disponible para eventos finalizados.</p>
        </section>
        <footer className="mt-9 text-center text-[10px] font-semibold tracking-[0.2em] text-[#f0ece4]/35">
          NES EVENTOS <span className="px-2 text-[#c9a84c]">·</span> CADA DETALLE CUENTA
        </footer>
      </main>
    );
  }

  const porcentaje = paso === 0
    ? Math.round((preguntasRespondidas / PREGUNTAS_EVENTO.length) * 50)
    : 50 + (totalTrabajadores ? Math.round((evaluacionesTrabajadoresListas / totalTrabajadores) * 50) : 0);

  return (
    <main className="min-h-screen bg-[#0a0c10] px-3 py-6 text-[#f0ece4] sm:px-6 sm:py-8">
      <header className="mb-7 flex items-center justify-center gap-3 text-sm tracking-[0.24em]">
        <span className="grid size-9 place-items-center border border-[#c9a84c]/70 font-serif text-xl text-[#c9a84c]">N</span>
        <span>NES <strong className="font-bold">EVENTOS</strong></span>
      </header>
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-4 rounded-xl border border-white/10 bg-[#131622] px-5 py-4">
          <div className="mb-3 flex justify-between text-[10px] font-bold tracking-[0.16em] text-[#f0ece4]/55">
            <span>{paso === 0 ? 'RESEÑA DEL EVENTO' : 'RESEÑA DEL EQUIPO'}</span>
            <span>PASO {paso + 1} DE 2</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#c9a84c] transition-[width] duration-300" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>

        {paso === 0 ? (
          <section className="rounded-xl border border-white/10 bg-[#131622] p-5 shadow-xl shadow-black/20 sm:p-9">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#c9a84c]">EVENTO · #{evento.codigo}</p>
            <h1 className="font-serif text-3xl sm:text-4xl">¿Cómo fue tu experiencia?</h1>
            <p className="mb-7 mt-3 text-sm leading-6 text-[#f0ece4]/55">Responde estas preguntas sobre el servicio que recibiste.</p>
            <div>
              {PREGUNTAS_EVENTO.map(({ campo, texto }, index) => (
                <fieldset className="border-t border-white/10 py-5" key={campo}>
                  <legend className="flex gap-3 text-sm font-medium leading-6 text-[#f0ece4]/90">
                    <span className="font-bold text-[#c9a84c]">{String(index + 1).padStart(2, '0')}</span>
                    {texto}
                  </legend>
                  <div className="mt-4 flex gap-3 pl-7">
                    {[{ label: 'Sí', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
                      <label key={label} className={`flex min-w-24 cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition ${respuestasEvento[campo] === value ? 'border-[#c9a84c]/70 bg-[#c9a84c]/10 text-[#f0ece4]' : 'border-white/10 text-[#f0ece4]/60 hover:border-white/20'}`}>
                        <input
                          className="accent-[#c9a84c]"
                          type="radio"
                          name={campo}
                          value={String(value)}
                          checked={respuestasEvento[campo] === value}
                          onChange={() => setRespuestasEvento((actuales) => ({ ...actuales, [campo]: value }))}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <label className="mb-2 mt-2 block text-sm font-medium text-[#f0ece4]/80" htmlFor="comentario-evento">
              ¿Quieres agregar un comentario? <span className="font-normal text-[#f0ece4]/40">Opcional</span>
            </label>
            <textarea
              id="comentario-evento"
              className={`${campoTexto} resize-y`}
              value={comentarioEvento}
              onChange={(event) => setComentarioEvento(event.target.value)}
              placeholder="Comparte cualquier detalle adicional…"
              rows={3}
            />
            <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
              <span className="text-xs text-[#f0ece4]/50">{preguntasRespondidas} de {PREGUNTAS_EVENTO.length} respuestas</span>
              <button
                className={botonPrimario}
                type="button"
                onClick={() => { setError(''); setPaso(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={preguntasRespondidas !== PREGUNTAS_EVENTO.length}
              >
                Siguiente <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-white/10 bg-[#131622] p-5 shadow-xl shadow-black/20 sm:p-9">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#c9a84c]">
              PASO 2 · {totalTrabajadores} {totalTrabajadores === 1 ? 'TRABAJADOR' : 'TRABAJADORES'}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl">Evalúa a nuestro equipo</h1>
            <p className="mb-7 mt-3 text-sm leading-6 text-[#f0ece4]/55">
              Elige una especialidad para ver su equipo. Las personas que no evalúes manualmente recibirán la calificación del evento, convertida a escala de 1 a 5.
            </p>
            {especialidades.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 px-5 py-8 text-center text-sm text-[#f0ece4]/55">
                No hay trabajadores evaluables registrados para este evento.
              </div>
            ) : (
              <div className="space-y-3">
                {especialidades.map((especialidad) => (
                  <section className="rounded-lg border border-white/10 p-4 sm:p-5" key={especialidad.codigo}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#c9a84c]">{especialidad.nombre}</h2>
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-[#f0ece4]/75">
                        <input
                          className="size-4 accent-[#c9a84c]"
                          type="checkbox"
                          checked={especialidadesAbiertas[especialidad.codigo] === true}
                          aria-expanded={especialidadesAbiertas[especialidad.codigo] === true}
                          onChange={(event) => setEspecialidadesAbiertas((actuales) => ({
                            ...actuales,
                            [especialidad.codigo]: event.target.checked,
                          }))}
                        />
                        Desea evaluar un trabajador en específico
                      </label>
                    </div>
                    {especialidadesAbiertas[especialidad.codigo] && (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        {especialidad.trabajadores.map((trabajador) => {
                          const clave = `${especialidad.codigo}:${trabajador.rut}`;
                          const respuesta = respuestasTrabajadores[clave] || {};
                          const evaluacionManual = respuesta.evaluarManualmente === true;
                          return (
                            <article className={`rounded-lg border p-4 transition ${evaluacionManual ? 'border-[#c9a84c]/30 bg-[#0a0c10]' : 'border-white/10 bg-white/[0.02]'}`} key={clave}>
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#c9a84c]/10 font-serif text-lg text-[#c9a84c]" aria-hidden="true">
                                  {nombreTrabajador(trabajador).charAt(0)}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <h3 className="truncate text-sm font-semibold text-[#f0ece4]">{nombreTrabajador(trabajador)}</h3>
                                  <p className="mt-1 text-xs text-[#f0ece4]/45">{especialidad.nombre}</p>
                                </div>
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-[#f0ece4]/55">
                                  <input
                                    className="size-4 accent-[#c9a84c]"
                                    type="checkbox"
                                    checked={evaluacionManual}
                                    onChange={(event) => cambiarEvaluacionManual(especialidad.codigo, trabajador.rut, event.target.checked)}
                                  />
                                  {evaluacionManual ? 'Evaluación manual' : 'Bloqueado'}
                                </label>
                              </div>
                              <fieldset className="mt-5" disabled={!evaluacionManual}>
                                <legend className="mb-3 text-xs font-medium text-[#f0ece4]/70">¿Cómo calificas su trabajo?</legend>
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((rating) => (
                                    <label key={rating} className={`grid size-10 cursor-pointer place-items-center rounded-lg border text-sm font-semibold transition ${respuesta.calificacion === rating ? 'border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c]' : 'border-white/10 text-[#f0ece4]/60 hover:border-white/20'} ${!evaluacionManual ? 'cursor-not-allowed opacity-40' : ''}`}>
                                      <input
                                        className="sr-only"
                                        type="radio"
                                        name={`rating-${clave}`}
                                        value={rating}
                                        checked={respuesta.calificacion === rating}
                                        onChange={() => actualizarEvaluacionTrabajador(especialidad.codigo, trabajador.rut, { calificacion: rating })}
                                      />
                                      {rating}
                                    </label>
                                  ))}
                                </div>
                                <div className="mt-2 flex w-60 max-w-full justify-between text-[10px] text-[#f0ece4]/40">
                                  <span>Necesita mejorar</span><span>Excelente</span>
                                </div>
                              </fieldset>
                              <label className="mb-2 mt-4 block text-xs font-medium text-[#f0ece4]/70" htmlFor={`comentario-${clave}`}>
                                Comentario <span className="font-normal text-[#f0ece4]/40">Opcional</span>
                              </label>
                              <textarea
                                id={`comentario-${clave}`}
                                className={`${campoTexto} resize-y text-xs`}
                                rows={2}
                                value={respuesta.comentarioEspecifico || ''}
                                disabled={!evaluacionManual}
                                onChange={(event) => actualizarEvaluacionTrabajador(especialidad.codigo, trabajador.rut, { comentarioEspecifico: event.target.value })}
                                placeholder={evaluacionManual ? 'Deja un comentario para esta persona…' : 'Desbloquea a la persona para agregar un comentario'}
                              />
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </section>
                ))}
              </div>
            )}
            {error && <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button
                className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-[#f0ece4]/75 transition hover:border-white/25 hover:text-[#f0ece4]"
                type="button"
                onClick={() => { setError(''); setPaso(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <span aria-hidden="true">←</span> Atrás
              </button>
              <button
                className={botonPrimario}
                type="button"
                onClick={enviarResena}
                disabled={enviando || totalTrabajadores === 0 || evaluacionesManualesPendientes > 0}
              >
                {enviando ? 'Guardando reseña…' : 'Enviar reseña'}
              </button>
            </div>
            {totalTrabajadores === 0 ? (
              <p className="mt-3 text-right text-xs text-[#f0ece4]/45" role="alert">
                No se puede enviar: el evento no tiene trabajadores con especialidad evaluable.
              </p>
            ) : evaluacionesManualesPendientes > 0 && (
              <p className="mt-3 text-right text-xs text-[#f0ece4]/45">
                Completa la calificación de cada trabajador desbloqueado ({evaluacionesTrabajadoresListas}/{totalTrabajadores} listas).
              </p>
            )}
          </section>
        )}
      </section>
      <footer className="mx-auto mt-9 text-center text-[10px] font-semibold tracking-[0.2em] text-[#f0ece4]/35">
        NES EVENTOS <span className="px-2 text-[#c9a84c]">·</span> CADA DETALLE CUENTA
      </footer>
    </main>
  );
}
