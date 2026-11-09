import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  asignarTrabajador,
  desasignarTrabajador,
  listarCatalogoTrabajadores,
  listarTrabajadoresAsignados,
} from '../services/asignacionTrabajador.service.js';
import { actualizarEquiposEvento, listarEquiposEvento } from '../services/equipoEvento.service.js';
import { formatoCLP } from '../utils/presupuesto.js';

const botonPrimario =
  'h-10 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50';
const botonSecundario =
  'h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50';
const inputClase =
  'h-10 rounded-lg border border-white/10 bg-[#0a0c10] px-3 text-sm text-[#f0ece4] outline-none focus:border-[#c9a84c] disabled:opacity-50';

export default function AsignacionEvento() {
  const { codigo } = useParams();
  const codigoEvento = Number(codigo);
  const [trabajadores, setTrabajadores] = useState([]);
  const [asignados, setAsignados] = useState([]);
  const [requerimientos, setRequerimientos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [catalogoEquipos, setCatalogoEquipos] = useState([]);
  const [edicionEquipos, setEdicionEquipos] = useState({});
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState({});
  const [tarifas, setTarifas] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const obtenerDatos = useCallback(() => Promise.all([
      listarCatalogoTrabajadores(codigoEvento),
      listarTrabajadoresAsignados(codigoEvento),
      listarEquiposEvento(codigoEvento),
  ]), [codigoEvento]);

  const aplicarDatos = useCallback(([datosTrabajadores, datosAsignados, datosEquipos]) => {
    setTrabajadores(datosTrabajadores.trabajadores);
    setAsignados(datosAsignados.asignaciones);
    setRequerimientos(datosAsignados.requerimientos);
    setEquipos(datosEquipos.asignaciones);
    setCatalogoEquipos(datosEquipos.catalogo);
    setEdicionEquipos(Object.fromEntries(datosEquipos.catalogo.map((equipo) => {
      const asignacion = datosEquipos.asignaciones.find((actual) => actual.codigoEquipo === equipo.codigo);
      return [equipo.codigo, {
        cantidadUsada: String(asignacion?.cantidadUsada ?? 0),
        precioUnitarioAcordado: String(asignacion?.precioUnitarioAcordado ?? equipo.precioReferencialEvento),
      }];
    })));
  }, []);

  const cargar = useCallback(async () => {
    aplicarDatos(await obtenerDatos());
  }, [aplicarDatos, obtenerDatos]);

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
  }, [aplicarDatos, obtenerDatos]);

  const trabajadoresFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es');
    if (!termino) return trabajadores;
    return trabajadores.filter((trabajador) =>
      trabajador.nombre.toLocaleLowerCase('es').includes(termino) ||
      trabajador.especialidades.some((especialidad) => especialidad.nombre.toLocaleLowerCase('es').includes(termino))
    );
  }, [busqueda, trabajadores]);

  const ejecutar = async (accion, mensaje) => {
    setProcesando(true);
    setError('');
    setAviso('');
    try {
      await accion();
      await cargar();
      setAviso(mensaje);
    } catch (errorAccion) {
      setError(errorAccion.message);
    } finally {
      setProcesando(false);
    }
  };

  const manejarAsignacion = (trabajador) => {
    const codigoEspecialidad = Number(
      especialidadSeleccionada[trabajador.rut] ?? trabajador.especialidades[0]?.codigo
    );
    const especialidad = trabajador.especialidades.find((item) => item.codigo === codigoEspecialidad);
    const payload = { rutTrabajador: trabajador.rut, codigoEspecialidad };
    if (trabajador.esExterno) {
      const tarifa = Number(tarifas[`${trabajador.rut}-${codigoEspecialidad}`] ?? especialidad?.tarifaHoraReferencial);
      if (Number.isInteger(tarifa) && tarifa > 0) payload.tarifaHoraAcordada = tarifa;
    }
    return ejecutar(
      () => asignarTrabajador(codigoEvento, payload),
      `${trabajador.nombre} fue asignado al evento.`
    );
  };

  const manejarDesasignacion = (asignacion) => {
    if (!window.confirm(`¿Quitar a ${asignacion.nombre} del evento?`)) return;
    return ejecutar(
      () => desasignarTrabajador(codigoEvento, asignacion.rutTrabajador, asignacion.especialidad.codigo),
      `${asignacion.nombre} fue desasignado del evento.`
    );
  };

  const guardarEquipos = () => {
    let payload;
    try {
      payload = catalogoEquipos.map((equipo) => {
        const cantidadUsada = Number(edicionEquipos[equipo.codigo]?.cantidadUsada ?? 0);
        const precioUnitarioAcordado = Number(edicionEquipos[equipo.codigo]?.precioUnitarioAcordado ?? 0);
        if (!Number.isInteger(cantidadUsada) || cantidadUsada < 0) {
          throw new Error(`La cantidad de ${equipo.nombre} debe ser un entero no negativo.`);
        }
        if (!Number.isInteger(precioUnitarioAcordado) || precioUnitarioAcordado < 0) {
          throw new Error(`El precio de ${equipo.nombre} debe ser un entero no negativo.`);
        }
        return { codigoEquipo: equipo.codigo, cantidadUsada, precioUnitarioAcordado };
      });
    } catch (errorValidacion) {
      setError(errorValidacion.message);
      return;
    }
    return ejecutar(
      () => actualizarEquiposEvento(codigoEvento, payload),
      'Equipos actualizados. Las reducciones operativas no rebajan el monto ya presupuestado.'
    );
  };

  const actualizarCampoEquipo = (codigoEquipo, campo, valor) => {
    setEdicionEquipos((actuales) => ({
      ...actuales,
      [codigoEquipo]: { ...actuales[codigoEquipo], [campo]: valor },
    }));
  };

  const requeridosPendientes = requerimientos.some(({ faltantes }) => faltantes > 0);

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">Organización del evento</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">Personal y equipos · Evento #{codigoEvento}</h1>
            <p className="mt-2 text-sm text-[#f0ece4]/50">
              Asigna manualmente al personal requerido y ajusta el equipo aprobado para este evento.
            </p>
          </div>
          <Link to="/panel/eventos-organizando" className="text-sm font-semibold text-[#c9a84c] hover:underline">
            Volver a eventos en organización
          </Link>
        </header>

        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300" role="alert">
            <span>{error}</span>
            <Link to={`/panel/presupuestos/${codigoEvento}`} className="font-semibold underline">
              Revisar presupuesto
            </Link>
          </div>
        )}
        {aviso && <div className="mb-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300" role="status">{aviso}</div>}
        {cargando ? <p className="text-sm text-[#f0ece4]/50">Cargando asignaciones...</p> : (
          <div className="grid gap-7">
            <section className="rounded-xl border border-white/10 bg-[#131622] p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Trabajadores</h2>
                  <p className="mt-1 text-sm text-[#f0ece4]/50">La plantilla indica la cantidad requerida; el staff elige a cada persona desde el catálogo.</p>
                </div>
                {requeridosPendientes && (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                    Hay especialidades con personal pendiente
                  </span>
                )}
              </div>
              <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {requerimientos.map((requerimiento) => (
                  <div key={requerimiento.codigoEspecialidad} className="rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3">
                    <p className="text-sm font-medium">{requerimiento.nombre}</p>
                    <p className={`mt-1 text-xs ${requerimiento.faltantes ? 'text-amber-300' : 'text-emerald-300'}`}>
                      {requerimiento.asignados} / {requerimiento.requeridos} asignados
                      {requerimiento.faltantes > 0 ? ` · faltan ${requerimiento.faltantes}` : ''}
                    </p>
                  </div>
                ))}
                {requerimientos.length === 0 && <p className="text-sm text-[#f0ece4]/50">La plantilla no define especialidades requeridas para este evento.</p>}
              </div>

              <h3 className="mb-3 text-sm font-semibold text-[#c9a84c]">Asignados ({asignados.length})</h3>
              <div className="mb-6 overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[42rem] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-[#f0ece4]/50">
                    <tr><th className="px-3 py-3">Trabajador</th><th className="px-3 py-3">Especialidad</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3 text-right">Tarifa/hora</th><th className="px-3 py-3" /></tr>
                  </thead>
                  <tbody>
                    {asignados.map((asignacion) => (
                      <tr key={`${asignacion.rutTrabajador}-${asignacion.especialidad.codigo}`} className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-3">{asignacion.nombre}</td>
                        <td className="px-3 py-3">{asignacion.especialidad.nombre}</td>
                        <td className="px-3 py-3 text-[#f0ece4]/60">{asignacion.esExterno ? 'Externo' : 'Interno'}</td>
                        <td className="px-3 py-3 text-right">{formatoCLP(asignacion.tarifaHoraAcordada)}</td>
                        <td className="px-3 py-3 text-right">
                          <button type="button" className={botonSecundario} disabled={procesando} onClick={() => manejarDesasignacion(asignacion)}>Quitar</button>
                        </td>
                      </tr>
                    ))}
                    {asignados.length === 0 && <tr><td colSpan={5} className="px-3 py-5 text-center text-[#f0ece4]/50">Aún no hay trabajadores asignados.</td></tr>}
                  </tbody>
                </table>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-[#c9a84c]">Catálogo</h3>
                <input className={`${inputClase} w-full sm:max-w-xs`} value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre o especialidad" />
              </div>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[48rem] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-[#f0ece4]/50">
                    <tr><th className="px-3 py-3">Trabajador</th><th className="px-3 py-3">Especialidad</th><th className="px-3 py-3">Disponibilidad</th><th className="px-3 py-3 text-right">Tarifa acordada/hora</th><th className="px-3 py-3" /></tr>
                  </thead>
                  <tbody>
                    {trabajadoresFiltrados.map((trabajador) => {
                      const seleccion = Number(especialidadSeleccionada[trabajador.rut] ?? trabajador.especialidades[0]?.codigo);
                      const especialidad = trabajador.especialidades.find((item) => item.codigo === seleccion);
                      const claveTarifa = `${trabajador.rut}-${seleccion}`;
                      return (
                        <tr key={trabajador.rut} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-3">
                            <span className="block">{trabajador.nombre}</span>
                            <span className="text-xs text-[#f0ece4]/45">{trabajador.esExterno ? 'Externo' : 'Interno'}</span>
                          </td>
                          <td className="px-3 py-3">
                            <select className={`${inputClase} w-full`} value={seleccion || ''} disabled={trabajador.especialidades.length === 0} onChange={(event) => setEspecialidadSeleccionada((actual) => ({ ...actual, [trabajador.rut]: Number(event.target.value) }))}>
                              {trabajador.especialidades.map((item) => <option key={item.codigo} value={item.codigo}>{item.nombre}</option>)}
                            </select>
                          </td>
                          <td className={`px-3 py-3 ${trabajador.disponible ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {trabajador.asignadoEnEvento ? 'Ya asignado a este evento' : trabajador.disponible ? 'Disponible' : `Conflicto con evento #${trabajador.codigoEventoConflicto}`}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {trabajador.esExterno ? (
                              <input className={`${inputClase} w-36 text-right`} type="number" min="1" step="1" value={tarifas[claveTarifa] ?? especialidad?.tarifaHoraReferencial ?? 0} onChange={(event) => setTarifas((actual) => ({ ...actual, [claveTarifa]: event.target.value }))} />
                            ) : formatoCLP(0)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button type="button" className={botonPrimario} disabled={procesando || !trabajador.disponible || !especialidad} onClick={() => manejarAsignacion(trabajador)}>Asignar</button>
                          </td>
                        </tr>
                      );
                    })}
                    {trabajadoresFiltrados.length === 0 && <tr><td colSpan={5} className="px-3 py-5 text-center text-[#f0ece4]/50">No hay trabajadores que coincidan con la búsqueda.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#131622] p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Equipamiento</h2>
                <p className="mt-1 text-sm text-[#f0ece4]/50">
                  La cantidad y el precio inicial vienen del presupuesto aprobado. Las reducciones no rebajan el monto; los aumentos se agregan al saldo del segundo abono.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full min-w-[54rem] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase text-[#f0ece4]/50">
                    <tr><th className="px-3 py-3">Equipo</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3 text-right">Disponible</th><th className="px-3 py-3 text-right">Cantidad para evento</th><th className="px-3 py-3 text-right">Precio/unidad evento</th><th className="px-3 py-3 text-right">Subtotal actual</th></tr>
                  </thead>
                  <tbody>
                    {catalogoEquipos.map((equipo) => {
                      const cantidad = Number(edicionEquipos[equipo.codigo]?.cantidadUsada ?? 0);
                      const precio = Number(edicionEquipos[equipo.codigo]?.precioUnitarioAcordado ?? 0);
                      const asignacion = equipos.find((item) => item.codigoEquipo === equipo.codigo);
                      return (
                        <tr key={equipo.codigo} className="border-b border-white/5 last:border-0">
                          <td className="px-3 py-3">{equipo.nombre}{asignacion && <span className="ml-2 text-xs text-[#c9a84c]">Incluido en presupuesto</span>}</td>
                          <td className="px-3 py-3 text-[#f0ece4]/60">{equipo.esExterno ? 'Arriendo externo' : 'Propio'}</td>
                          <td className={`px-3 py-3 text-right ${equipo.disponible !== null && cantidad > equipo.disponible ? 'text-amber-300' : ''}`}>
                            {equipo.disponible === null ? '—' : equipo.disponible}
                            {equipo.disponible !== null && cantidad > equipo.disponible && (
                              <span className="block text-xs">Revisar stock</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input className={`${inputClase} w-24 text-right`} type="number" min="0" step="1" value={edicionEquipos[equipo.codigo]?.cantidadUsada ?? '0'} onChange={(event) => actualizarCampoEquipo(equipo.codigo, 'cantidadUsada', event.target.value)} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <input className={`${inputClase} w-36 text-right`} type="number" min="0" step="1" value={edicionEquipos[equipo.codigo]?.precioUnitarioAcordado ?? '0'} onChange={(event) => actualizarCampoEquipo(equipo.codigo, 'precioUnitarioAcordado', event.target.value)} />
                          </td>
                          <td className="px-3 py-3 text-right">{formatoCLP(cantidad * precio)}</td>
                        </tr>
                      );
                    })}
                    {catalogoEquipos.length === 0 && <tr><td colSpan={6} className="px-3 py-5 text-center text-[#f0ece4]/50">El catálogo de equipos está vacío.</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-3xl text-xs text-[#f0ece4]/45">Los precios referenciales de arriendo consideran todas las horas del evento; puedes modificarlos. El margen del 20% se aplica únicamente al equipamiento externo.</p>
                <button type="button" className={botonPrimario} disabled={procesando} onClick={guardarEquipos}>
                  {procesando ? 'Guardando...' : 'Guardar equipamiento'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
