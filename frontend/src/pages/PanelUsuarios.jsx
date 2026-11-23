import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { changeUsuarioStatus, getUsuariosByStatus, resetUsuarioPassword } from '../services/usuario.service.js';

const inputClass = 'w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 text-sm text-[#f0ece4] outline-none focus:border-[#c9a84c] disabled:opacity-50';
const buttonClass = 'rounded-lg bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#0a0c10] hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50';

export default function PanelUsuarios() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const isAdmin = user?.rol === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    Promise.all([getUsuariosByStatus(true), getUsuariosByStatus(false)])
      .then(([activeUsers, inactiveUsers]) => {
        if (active) setUsuarios([...activeUsers, ...inactiveUsers]);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#0a0c10] p-6 text-[#f0ece4]">
        <p role="alert">Solo un administrador puede gestionar usuarios.</p>
      </main>
    );
  }

  const selectUser = (usuario) => {
    setSelected(usuario);
    setPassword('');
    setConfirmation('');
    setError('');
    setNotice('');
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    try {
      await resetUsuarioPassword(selected.persona.rut, password);
      setNotice(`Contraseña restablecida para ${selected.persona.rut}. El usuario deberá cambiarla al iniciar sesión.`);
      setSelected(null);
      setPassword('');
      setConfirmation('');
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (usuario) => {
    const rut = usuario.persona.rut;
    const nuevoEstado = !usuario.activo;
    const isOwnAccount = rut === (user.rut || user.persona?.rut);
    if (isOwnAccount && !nuevoEstado && !window.confirm('Al desactivar tu cuenta se cerrará tu sesión. ¿Deseas continuar?')) return;

    setError('');
    setNotice('');
    setChangingStatus(rut);
    try {
      await changeUsuarioStatus(rut, nuevoEstado);
      setUsuarios((current) => current.map((item) =>
        item.persona.rut === rut ? { ...item, activo: nuevoEstado } : item
      ));
      if (isOwnAccount && !nuevoEstado) {
        const result = await logout();
        if (!result.success) {
          setError(`Tu cuenta fue desactivada, pero no se pudo cerrar la sesión: ${result.message}`);
          return;
        }
        navigate('/login', { replace: true });
        return;
      }
      setNotice(`Usuario ${rut} ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setChangingStatus(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-semibold">Usuarios del sistema</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/60">Consulta las cuentas, cambia su estado y restablece contraseñas temporales.</p>
        </header>
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-400/10 p-4 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-400/10 p-4 text-sm text-emerald-200">{notice}</p>}
        {loading ? <p role="status">Cargando usuarios...</p> : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#131622]">
            {usuarios.length === 0 ? <p className="p-5">No hay usuarios registrados.</p> : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[#f0ece4]/60">
                  <tr><th className="p-4">Nombre</th><th className="p-4">RUT</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4">Acción</th></tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.persona.rut} className="border-b border-white/5">
                      <td className="p-4">{[usuario.persona.nombre, usuario.persona.primerApellido, usuario.persona.segundoApellido].filter(Boolean).join(' ')}</td>
                      <td className="p-4">{usuario.persona.rut}</td>
                      <td className="p-4">{usuario.rol}</td>
                      <td className="p-4">
                        <span className="mb-2 block text-[#f0ece4]/60">{usuario.activo ? 'Activo' : 'Inactivo'}</span>
                        {usuario.persona.rut === (user.rut || user.persona?.rut) ? (
                          <span className="text-[#f0ece4]/50">Usa mi perfil (ADMIN)</span>
                        ) : (    
                        <button
                          type="button"
                          className={buttonClass}
                          disabled={saving || changingStatus !== null}
                          aria-label={`${usuario.activo ? 'Desactivar' : 'Activar'} usuario ${usuario.persona.rut}`}
                          onClick={() => handleToggleStatus(usuario)}
                        >
                          {changingStatus === usuario.persona.rut ? 'Actualizando...' : usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        )}
                      </td>
                      <td className="p-4">
                        {usuario.persona.rut === (user.rut || user.persona?.rut) ? (
                          <span className="text-[#f0ece4]/50">Usa mi perfil (ADMIN)</span>
                        ) : (
                          <button type="button" className={buttonClass} disabled={saving || changingStatus !== null} onClick={() => selectUser(usuario)}>
                            Restablecer contraseña
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {selected && (
          <section className="mt-6 rounded-xl border border-white/10 bg-[#131622] p-5" aria-labelledby="reset-title">
            <h2 id="reset-title" className="text-lg font-semibold">Restablecer contraseña de {selected.persona.rut}</h2>
            <p className="mt-2 text-sm text-[#f0ece4]/60">Ingresa una contraseña temporal de 8 a 100 caracteres. El usuario deberá cambiarla al iniciar sesión.</p>
            <form onSubmit={handleReset} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">Contraseña temporal
                <input className={inputClass} type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={password} onChange={(event) => setPassword(event.target.value)} disabled={saving} />
              </label>
              <label className="grid gap-2 text-sm">Confirmar contraseña
                <input className={inputClass} type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={saving} />
              </label>
              <div className="flex gap-3 sm:col-span-2">
                <button className={buttonClass} type="submit" disabled={saving || changingStatus !== null}>{saving ? 'Restableciendo...' : 'Confirmar restablecimiento'}</button>
                <button type="button" className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50" disabled={saving || changingStatus !== null} onClick={() => selectUser(null)}>Cancelar</button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
