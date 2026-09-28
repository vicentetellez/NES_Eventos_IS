import { useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || 'No fue posible completar la solicitud.');
  return payload.data;
}

function RankingView() {
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
  const [modoDemostracion, setModoDemostracion] = useState(false);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(
      Object.entries(filtrosAplicados).filter(([, value]) => value !== '')
    );

    request(`/trabajador/ranking/demo${query.size ? `?${query}` : ''}`)
      .then((result) => {
        if (active) {
          setTrabajadores(result.trabajadores);
          setModoDemostracion(result.modoDemostracion === true);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setTrabajadores([]);
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (active) setCargando(false);
      });

    return () => { active = false; };
  }, [filtrosAplicados]);

  function updateFilter(event) {
    setFiltros({ ...filtros, [event.target.name]: event.target.value });
  }

  function clearFilters() {
    const vacios = {
      nombre: '',
      especialidad: '',
      aniosExperienciaMin: '',
      aniosExperienciaMax: '',
    };
    setCargando(true);
    setFiltros(vacios);
    setFiltrosAplicados(vacios);
  }

  return (
    <main className="main-content ranking-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">GESTIÓN DE PERSONAL</p>
          <h1>Ranking de trabajadores</h1>
          <p className="page-subtitle">Personal activo y evaluaciones registradas en la base local</p>
        </div>
        <div className="ranking-total">
          <strong>{trabajadores.length}</strong>
          <span>perfiles disponibles</span>
        </div>
      </div>

      {modoDemostracion && (
        <div className="demo-notice" role="status">
          Vista temporal con datos reales de esta base. Los perfiles sin reseñas aparecen sin puntaje y no se ordenan como evaluados.
        </div>
      )}

      <form className="ranking-filters" onSubmit={(event) => {
        event.preventDefault();
        setCargando(true);
        setFiltrosAplicados({ ...filtros });
      }}>
        <label className="ranking-filter ranking-name-filter">
          <span>Nombre</span>
          <input name="nombre" value={filtros.nombre} onChange={updateFilter} placeholder="Nombre o apellido" />
        </label>
        <label className="ranking-filter ranking-specialty-filter">
          <span>Cargo o especialidad</span>
          <input name="especialidad" value={filtros.especialidad} onChange={updateFilter} placeholder="Ej. banquetería" />
        </label>
        <label className="ranking-filter">
          <span>Experiencia desde</span>
          <input name="aniosExperienciaMin" type="number" min="0" max="80" value={filtros.aniosExperienciaMin} onChange={updateFilter} placeholder="Años" />
        </label>
        <label className="ranking-filter">
          <span>Hasta</span>
          <input name="aniosExperienciaMax" type="number" min="0" max="80" value={filtros.aniosExperienciaMax} onChange={updateFilter} placeholder="Años" />
        </label>
        <div className="ranking-filter-actions">
          <button className="primary-button" type="submit">Aplicar filtros</button>
          <button className="text-button" type="button" onClick={clearFilters}>Limpiar</button>
        </div>
      </form>

      <section className="ranking-results" aria-labelledby="ranking-results-title">
        <div className="section-toolbar">
          <div>
            <h2 id="ranking-results-title">Personal evaluado</h2>
            <p>{cargando ? 'Actualizando resultados…' : `${trabajadores.length} perfiles${modoDemostracion ? ' · datos reales de la base local' : ' · mejor valoración primero'}`}</p>
          </div>
        </div>
        {error && <p className="inline-error" role="alert">{error}</p>}
        {cargando ? (
          <div className="empty-state"><p>Cargando ranking…</p></div>
        ) : error ? (
          <div className="empty-state">
            <h3>No se pudo cargar la vista temporal</h3>
            <p>Verifica que el backend esté activo y que RANKING_DEMO_PUBLIC=true esté habilitado en desarrollo.</p>
          </div>
        ) : trabajadores.length === 0 ? (
          <div className="empty-state">
            <span className="empty-check" aria-hidden="true">—</span>
            <h3>No hay trabajadores para estos filtros</h3>
            <p>Se muestran trabajadores activos con evaluaciones y especialidades registradas.</p>
          </div>
        ) : (
          <div className="alert-table-wrap">
            <table className="alert-table ranking-table">
              <thead>
                <tr><th>#</th><th>Trabajador</th><th>Especialidades</th><th>Valoración media</th><th>Reseñas</th><th>Experiencia</th><th>Tipo</th></tr>
              </thead>
              <tbody>
                {trabajadores.map((trabajador, index) => (
                  <tr key={trabajador.rut}>
                    <td data-label="Posición"><span className={`rank-number ${trabajador.calificacionPromedio !== null && index < 3 ? 'rank-highlight' : ''}`}>{trabajador.calificacionPromedio === null ? '—' : String(index + 1).padStart(2, '0')}</span></td>
                    <td data-label="Trabajador"><span className="event-name">{trabajador.nombre}</span>{trabajador.rut && <span className="client-name">{trabajador.rut}</span>}</td>
                    <td data-label="Especialidades"><div className="specialty-list">{trabajador.especialidades.map((item) => <span className="specialty-tag" key={item.codigo}>{item.nombre}</span>)}</div></td>
                    <td data-label="Valoración media">{trabajador.calificacionPromedio === null ? <span className="unrated-label">Sin reseñas</span> : <span className="ranking-score">{trabajador.calificacionPromedio.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}</td>
                    <td data-label="Reseñas">{trabajador.totalEvaluaciones}</td>
                    <td data-label="Experiencia">{trabajador.aniosExperiencia === null ? 'No informada' : `${trabajador.aniosExperiencia} ${trabajador.aniosExperiencia === 1 ? 'año' : 'años'}`}</td>
                    <td data-label="Tipo">{trabajador.esExterno ? 'Externo' : 'Interno'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="ranking-note">La valoración considera únicamente evaluaciones registradas; los perfiles sin reseñas no reciben una puntuación.</p>
    </main>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="topbar ranking-topbar">
        <a className="brand" href="#ranking" aria-label="NES Eventos, ranking de trabajadores">
          <span className="brand-stamp">N</span>
          <span className="brand-name">NES <i>EVENTOS</i></span>
        </a>
        <span className="module-caption">GESTIÓN DE PERSONAL <i>/</i> RANKING</span>
      </header>

      <div id="ranking"><RankingView /></div>
      <footer className="footer"><span>NES EVENTOS</span><span>Gestión interna</span></footer>
    </div>
  );
}

export default App;
