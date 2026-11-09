import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeOwnPassword } from '../services/auth.service.js';

const campoContrasena =
  'w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 disabled:opacity-50';

const fechaCompleta = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long',
  timeStyle: 'short'
});

function mostrarFecha(fecha) {
  if (!fecha) return 'No disponible';
  const valor = new Date(fecha);
  return Number.isNaN(valor.getTime()) ? 'No disponible' : fechaCompleta.format(valor);
}

function Perfil() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const persona = user?.persona;
  const nombreCompleto = [
    persona?.nombre,
    persona?.primerApellido,
    persona?.segundoApellido
  ].filter(Boolean).join(' ');

  const actualizarContrasena = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Tu contraseña se actualizó correctamente.');
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 border-b border-white/10 pb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Cuenta personal
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mi perfil</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Consulta tus datos y administra tu contraseña de acceso.
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#131622]" aria-labelledby="profile-details-title">
          <div className="flex flex-col gap-5 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="grid size-16 shrink-0 place-items-center rounded-full border border-[#c9a84c]/25 bg-[#c9a84c]/10 text-2xl text-[#c9a84c]" aria-hidden="true">
              {persona?.nombre?.charAt(0)?.toUpperCase() || '👤'}
            </div>
            <div>
              <h2 id="profile-details-title" className="text-xl font-semibold">
                {nombreCompleto || 'Usuario'}
              </h2>
              <p className="mt-1 text-sm text-[#f0ece4]/50">{user?.rol || 'Rol no disponible'}</p>
            </div>
          </div>

          <dl className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
            {[
              ['RUT', persona?.rut],
              ['Correo electrónico', persona?.email],
              ['Teléfono', persona?.telefono],
              ['Fecha de nacimiento', persona?.fechaNacimiento
                ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(persona.fechaNacimiento))
                : null],
              ['Cuenta creada', mostrarFecha(user?.fechaRegistro)],
              ['Último acceso', mostrarFecha(user?.ultimoAcceso)]
            ].map(([label, value]) => (
              <div key={label} className="bg-[#131622] px-5 py-4 sm:px-7">
                <dt className="text-xs font-medium text-[#f0ece4]/45">{label}</dt>
                <dd className="mt-1 break-words text-sm text-[#f0ece4]/85">{value || 'No disponible'}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 bg-[#131622] p-5 sm:p-7" aria-labelledby="change-password-title">
          <div className="mb-6">
            <h2 id="change-password-title" className="text-lg font-semibold">Cambiar contraseña</h2>
            <p className="mt-1 text-sm text-[#f0ece4]/50">
              La contraseña nueva debe tener entre 8 y 100 caracteres.
            </p>
          </div>

          <form className="grid gap-5 sm:grid-cols-2" onSubmit={actualizarContrasena}>
            <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65 sm:col-span-2">
              Contraseña actual
              <input
                type="password"
                autoComplete="current-password"
                minLength={8}
                maxLength={100}
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={campoContrasena}
                disabled={savingPassword}
              />
            </label>
            <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65">
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={campoContrasena}
                disabled={savingPassword}
              />
            </label>
            <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65">
              Confirmar nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={100}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={campoContrasena}
                disabled={savingPassword}
              />
            </label>

            {passwordError && (
              <p className="sm:col-span-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="sm:col-span-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">
                {passwordSuccess}
              </p>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0a0c10] transition hover:bg-[#d8b85d] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default Perfil;
