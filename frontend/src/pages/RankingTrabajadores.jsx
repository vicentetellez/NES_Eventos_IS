import { useEffect, useState } from 'react';
import { getRankingTrabajadores } from '../services/trabajador.service.js';

export default function RankingTrabajadores() {
  const [filtros, setFiltros] = useState({
    nombre: '',
    especialidad: '',
    aniosExperienciaMin: '',
    aniosExperienciaMax: '',
  });
  const [filtrosAplicados, setFiltrosAplicados] = useState({});
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [actualizacion, setActualizacion] = useState(0);

  useEffect(() => {
    let active = true;
    setCargando(true);
    getRankingTrabajadores(filtrosAplicados)
      .then((resultado) => {
        if (active) {
          setTrabajadores(resultado.trabajadores);
          setTotal(resultado.total ?? resultado.trabajadores.length);
          setError('');
        }
      })
      .catch((errorCarga) => {
        if (active) {
          setTrabajadores([]);
          setTotal(0);
          setError(errorCarga.message);
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => {
      active = false;
    };
  }, [filtrosAplicados, actualizacion]);

  function updateFilter(event) {
    setFiltros((actuales) => ({ ...actuales, [event.target.name]: event.target.value }));
  }

  function clearFilters() {
    const vacios = {
      nombre: '',
      especialidad: '',
      aniosExperienciaMin: '',
      aniosExperienciaMax: '',
    };
    setFiltros(vacios);
    setFiltrosAplicados(vacios);
  }

  return (
    <main className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Gestión de personal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ranking de trabajadores</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Compara el desempeño del personal con reseñas de clientes y experiencia registrada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/10 bg-[#131622] px-5 py-3 sm:min-w-40">
            <strong className="block text-2xl font-semibold text-[#c9a84c]">{total}</strong>
            <span className="text-xs text-[#f0ece4]/50">trabajadores evaluados</span>
          </div>
          <button
            type="button"
            onClick={() => setActualizacion((anterior) => anterior + 1)}
            disabled={cargando}
            className="h-11 rounded-lg border border-white/10 px-4 text-xs font-semibold text-[#f0ece4]/75 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Actualizar
          </button>
        </div>
      </header>

      <form
        className="mb-8 grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#131622] p-5 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault();
          setFiltrosAplicados({ ...filtros });
        }}
      >
        {[
          { name: 'nombre', label: 'Nombre', placeholder: 'Nombre o apellido', type: 'text' },
          { name: 'especialidad', label: 'Cargo o especialidad', placeholder: 'Ej. banquetería', type: 'text' },
          { name: 'aniosExperienciaMin', label: 'Experiencia desde', placeholder: 'Años', type: 'number' },
          { name: 'aniosExperienciaMax', label: 'Experiencia hasta', placeholder: 'Años', type: 'number' },
        ].map(({ name, label, placeholder, type }) => (
          <label key={name} className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65">
            {label}
            <input
              name={name}
              type={type}
              min={type === 'number' ? 0 : undefined}
              max={type === 'number' ? 80 : undefined}
              value={filtros[name]}
              onChange={updateFilter}
              placeholder={placeholder}
              className="h-10 w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c]"
            />
          </label>
        ))}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button
            className="h-10 flex-1 rounded-lg bg-[#c9a84c] px-4 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:opacity-50"
            type="submit"
          >
            Aplicar filtros
          </button>
          <button
            className="h-10 rounded-lg border border-white/10 px-4 text-xs font-semibold text-[#f0ece4]/70 transition hover:border-[#c9a84c]/50 hover:text-[#f0ece4]"
            type="button"
            onClick={clearFilters}
          >
            Limpiar
          </button>
        </div>
      </form>

      <section aria-labelledby="ranking-results-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="ranking-results-title" className="text-lg font-semibold">Personal evaluado</h2>
            <p className="mt-1 text-xs text-[#f0ece4]/45">
              {cargando ? 'Actualizando resultados…' : `${trabajadores.length} perfiles · mejor valoración primero`}
            </p>
          </div>
        </div>
        {error && (
          <p className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        {cargando ? (
          <div className="flex min-h-48 items-center justify-center rounded-xl border border-white/10 bg-[#131622] text-sm text-[#f0ece4]/50">
            <p className="animate-pulse">Cargando ranking…</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-white/10 bg-[#131622] px-6 py-12 text-center">
            <h3 className="font-semibold text-[#f0ece4]">No se pudo cargar el ranking</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#f0ece4]/50">
              Verifica tu conexión e inténtalo nuevamente.
            </p>
            <button
              type="button"
              onClick={() => setActualizacion((anterior) => anterior + 1)}
              className="mt-5 rounded-lg bg-[#c9a84c] px-4 py-2 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d]"
            >
              Reintentar
            </button>
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#131622] px-6 py-12 text-center">
            <span className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a84c]/30 text-lg text-[#c9a84c]" aria-hidden="true">—</span>
            <h3 className="font-semibold text-[#f0ece4]">
              {Object.values(filtrosAplicados).some(Boolean) ? 'No hay coincidencias para estos filtros' : 'Aún no hay trabajadores rankeables'}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#f0ece4]/50">
              Se requiere un trabajador activo, con especialidad asignada y al menos una evaluación registrada en la base.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131622]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-[#f0ece4]/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Puesto</th>
                  <th className="px-4 py-3 font-medium">Trabajador</th>
                  <th className="px-4 py-3 font-medium">Cargo / especialidad</th>
                  <th className="px-4 py-3 font-medium">Valoración media</th>
                  <th className="px-4 py-3 font-medium">Reseñas</th>
                  <th className="px-4 py-3 font-medium">Experiencia</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.07]">
                {trabajadores.map((trabajador, index) => (
                  <tr key={trabajador.rut} className="transition-colors hover:bg-white/[0.025]">
                    <td className="px-4 py-4" data-label="Puesto">
                      <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'border border-[#c9a84c]/30 bg-[#c9a84c]/10 text-[#c9a84c]' : 'text-[#f0ece4]/45'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-4" data-label="Trabajador">
                      <span className="block font-medium text-[#f0ece4]">{trabajador.nombre}</span>
                      {trabajador.rut && <span className="mt-1 block text-xs text-[#f0ece4]/40">{trabajador.rut}</span>}
                    </td>
                    <td className="px-4 py-4" data-label="Cargo o especialidad">
                      <div className="flex flex-wrap gap-1.5">
                        {trabajador.especialidades.map((item) => (
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#f0ece4]/65" key={item.codigo}>
                            {item.nombre}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4" data-label="Valoración media">
                      <span className="font-semibold text-[#c9a84c]">
                        {trabajador.calificacionPromedio.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="ml-1 text-xs font-normal text-[#f0ece4]/40">/ 5</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#f0ece4]/70" data-label="Reseñas">{trabajador.totalEvaluaciones}</td>
                    <td className="px-4 py-4 text-[#f0ece4]/70" data-label="Experiencia">
                      {trabajador.aniosExperiencia === null
                        ? 'No informada'
                        : `${trabajador.aniosExperiencia} ${trabajador.aniosExperiencia === 1 ? 'año' : 'años'}`}
                    </td>
                    <td className="px-4 py-4 text-[#f0ece4]/70" data-label="Tipo">
                      {trabajador.esExterno ? 'Externo' : 'Interno'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </main>
  );
}
