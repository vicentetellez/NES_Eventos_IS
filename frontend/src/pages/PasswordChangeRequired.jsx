import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordChangeForm from '../components/PasswordChangeForm';
import logo from '../assets/Logo-NES-Eventos-Rectangular.png';

export default function PasswordChangeRequired() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLogoutError('');
    setLoggingOut(true);
    const result = await logout();
    setLoggingOut(false);
    if (!result.success) {
      setLogoutError(result.message);
      return;
    }
    navigate('/login', { replace: true });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 py-10 text-[#f0ece4]">
      <img src={logo} alt="NES Eventos" className="mb-10 h-auto w-24 object-contain sm:w-28" />
      <section className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#131622] p-8 shadow-2xl shadow-black/40 sm:p-10">
        <h1 className="text-center text-xl font-semibold text-[#c9a84c] sm:text-2xl">Cambio de contraseña obligatorio</h1>
        <p className="mt-4 mb-6 text-center text-sm text-[#f0ece4]/60">
          Debes cambiar tu contraseña provisoria antes de acceder al sistema. La nueva contraseña debe tener entre 8 y 100 caracteres.
        </p>
        <PasswordChangeForm onSuccess={() => navigate('/home', { replace: true })} />
        {logoutError && <p role="alert" className="mt-4 text-sm text-red-300">{logoutError}</p>}
        <button type="button" onClick={handleLogout} disabled={loggingOut} className="mt-6 text-sm text-[#f0ece4]/70 underline hover:text-[#c9a84c] disabled:opacity-50">
          {loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </section>
    </main>
  );
}
