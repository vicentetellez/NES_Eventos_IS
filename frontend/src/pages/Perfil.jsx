import { useAuth } from '../context/AuthContext';
import PasswordChangeForm from '../components/PasswordChangeForm';

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

  const persona = user?.persona;
  const nombreCompleto = [
    persona?.nombre,
    persona?.primerApellido,
    persona?.segundoApellido
  ].filter(Boolean).join(' ');

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
          <PasswordChangeForm />
        </section>
      </div>
    </main>
  );
}

export default Perfil;
