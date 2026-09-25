import { useEffect, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const formatMoney = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});
const formatDate = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'medium',
  timeZone: 'UTC',
});

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

function Login({ onLogin, error, loading }) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');

  function submit(event) {
    event.preventDefault();
    onLogin({ rut, password });
  }

  return (
    <main className="login-shell">
      <div className="login-mark" aria-hidden="true">NES</div>
      <section className="login-panel">
        <p className="eyebrow">GESTIÓN DE EVENTOS</p>
        <h1>Control de pagos</h1>
        <p className="login-copy">Ingresa con tu cuenta de personal para revisar los abonos pendientes.</p>
        <form onSubmit={submit}>
          <label htmlFor="rut">RUT</label>
          <input id="rut" autoComplete="username" value={rut} onChange={(event) => setRut(event.target.value)} placeholder="12.345.678-9" required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-button" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </section>
      <p className="login-foot">NES EVENTOS <span>·</span> PERSONAL AUTORIZADO</p>
    </main>
  );
}

function AccessMessage({ title, children, onLogout }) {
  return (
    <main className="login-shell">
      <section className="login-panel access-message">
        <p className="eyebrow">ACCESO RESTRINGIDO</p>
        <h1>{title}</h1>
        <p className="login-copy">{children}</p>
        <button className="secondary-button" onClick={onLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [alertas, setAlertas] = useState([]);
  const [diasAnticipacion, setDiasAnticipacion] = useState(3);
  const [filtro, setFiltro] = useState('TODAS');
  const [error, setError] = useState('');
  const [actualizado, setActualizado] = useState(null);

  useEffect(() => {
    request('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setSessionChecked(true));
  }, []);

  useEffect(() => {
    if (!user || user.debeCambiarPassword || !['ADMIN', 'STAFF'].includes(user.rol)) return undefined;
    let active = true;
    const loadAlerts = async () => {
      try {
        const result = await request(`/evento/alertas/pagos-pendientes?diasAnticipacion=${diasAnticipacion}`);
        if (active) {
          setAlertas(result.alertas);
          setActualizado(new Date());
          setError('');
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      }
    };
    loadAlerts();
    const timer = window.setInterval(loadAlerts, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [user, diasAnticipacion]);

  async function login(credentials) {
    setLoading(true);
    setLoginError('');
    try {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
      setUser(result.user);
    } catch (loginFailure) {
      setLoginError(loginFailure.message);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setAlertas([]);
      setLoginError('');
    }
  }

  async function refreshAlerts() {
    try {
      const result = await request(`/evento/alertas/pagos-pendientes?diasAnticipacion=${diasAnticipacion}`);
      setAlertas(result.alertas);
      setActualizado(new Date());
      setError('');
    } catch (refreshError) {
      setError(refreshError.message);
    }
  }

  if (!sessionChecked) return <main className="loading-screen"><span className="loading-mark">NES</span></main>;
  if (!user) return <Login onLogin={login} error={loginError} loading={loading} />;
  if (user.debeCambiarPassword) {
    return <AccessMessage title="Cambia tu contraseña" onLogout={logout}>Tu cuenta debe actualizar la contraseña antes de acceder a la gestión de pagos.</AccessMessage>;
  }
  if (!['ADMIN', 'STAFF'].includes(user.rol)) {
    return <AccessMessage title="Vista para personal" onLogout={logout}>Esta consulta está disponible para cuentas ADMIN y STAFF.</AccessMessage>;
  }

  const vencidos = alertas.filter((alerta) => alerta.estadoAlerta === 'VENCIDO').length;
  const porVencer = alertas.length - vencidos;
  const alertasFiltradas = filtro === 'TODAS' ? alertas : alertas.filter((alerta) => alerta.estadoAlerta === filtro);

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="NES Eventos, inicio">
          <span className="brand-stamp">N</span>
          <span className="brand-name">NES <i>EVENTOS</i></span>
        </a>
        <div className="account-area">
          <div className="account-copy">
            <span className="account-role">{user.rol === 'ADMIN' ? 'Administración' : 'Personal'}</span>
            <span className="account-id">{user.rut}</span>
          </div>
          <button className="logout-button" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <main className="main-content" id="inicio">
        <div className="page-heading">
          <div>
            <p className="eyebrow">SEGUIMIENTO FINANCIERO</p>
            <h1>Pagos que requieren atención</h1>
            <p className="page-subtitle">Abonos pendientes de eventos confirmados</p>
          </div>
          <div className="heading-actions">
            <label className="window-select">
              <span>Avisar con</span>
              <select value={diasAnticipacion} onChange={(event) => setDiasAnticipacion(Number(event.target.value))}>
                <option value={0}>0 días</option>
                <option value={3}>3 días</option>
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
                <option value={30}>30 días</option>
              </select>
            </label>
            <button className="primary-button refresh-button" onClick={refreshAlerts} title="Actualizar alertas">
              <span aria-hidden="true">↻</span> Actualizar
            </button>
          </div>
        </div>

        <section className="summary-strip" aria-label="Resumen de alertas">
          <div className="summary-item"><span className="summary-label">Avisos activos</span><strong>{alertas.length}</strong></div>
          <div className="summary-item summary-overdue"><span className="summary-label">Vencidos</span><strong>{vencidos}</strong></div>
          <div className="summary-item summary-upcoming"><span className="summary-label">Por vencer</span><strong>{porVencer}</strong></div>
          <div className="summary-update"><span className="live-dot" />{actualizado ? `Actualizado ${actualizado.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : 'Sin actualizar'}</div>
        </section>

        <section className="alerts-section" aria-labelledby="alerts-title">
          <div className="section-toolbar">
            <div><h2 id="alerts-title">Alertas de abono</h2><p>{alertasFiltradas.length} {alertasFiltradas.length === 1 ? 'evento' : 'eventos'}</p></div>
            <div className="filter-tabs" role="group" aria-label="Filtrar alertas">
              {[
                ['TODAS', 'Todas'],
                ['VENCIDO', 'Vencidas'],
                ['POR_VENCER', 'Por vencer'],
              ].map(([value, label]) => (
                <button key={value} className={filtro === value ? 'filter-tab active' : 'filter-tab'} onClick={() => setFiltro(value)} aria-pressed={filtro === value}>{label}</button>
              ))}
            </div>
          </div>

          {error && <p className="inline-error" role="alert">{error}</p>}
          {alertasFiltradas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-check" aria-hidden="true">✓</span>
              <h3>{alertas.length === 0 ? 'Sin pagos por atender' : 'No hay avisos en este filtro'}</h3>
              <p>{alertas.length === 0 ? 'Los eventos que se acerquen a su fecha límite aparecerán aquí.' : 'Prueba con otra categoría para revisar las alertas activas.'}</p>
            </div>
          ) : (
            <div className="alert-table-wrap">
              <table className="alert-table">
                <thead><tr><th>Evento y cliente</th><th>Fecha del evento</th><th>Fecha límite</th><th>Monto pendiente</th><th>Estado</th></tr></thead>
                <tbody>
                  {alertasFiltradas.map((alerta) => (
                    <tr key={alerta.codigoEvento}>
                      <td data-label="Evento y cliente"><span className="event-name">{alerta.nombreEvento}</span><span className="client-name">{alerta.nombreCliente}</span></td>
                      <td data-label="Fecha del evento">{formatDate.format(new Date(alerta.fechaEvento))}</td>
                      <td data-label="Fecha límite">
                        <span className="deadline-date">{formatDate.format(new Date(alerta.fechaLimiteAbono))}</span>
                        <span className="deadline-note">{alerta.diasRestantes < 0 ? `${Math.abs(alerta.diasRestantes)} ${Math.abs(alerta.diasRestantes) === 1 ? 'día' : 'días'} de atraso` : alerta.diasRestantes === 0 ? 'Vence hoy' : `En ${alerta.diasRestantes} días`}</span>
                      </td>
                      <td data-label="Monto pendiente" className="amount-cell">{formatMoney.format(alerta.montoPendiente)}</td>
                      <td data-label="Estado"><span className={`status-badge ${alerta.estadoAlerta === 'VENCIDO' ? 'status-late' : 'status-soon'}`}><span className="status-dot" />{alerta.estadoAlerta === 'VENCIDO' ? 'Vencido' : 'Por vencer'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <footer className="footer"><span>NES EVENTOS</span><span>Gestión interna</span></footer>
    </div>
  );
}

export default App;
