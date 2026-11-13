import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeOwnPassword } from '../services/auth.service.js';

const inputClass = 'w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 text-sm text-[#f0ece4] outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/20 disabled:opacity-50';

export default function PasswordChangeForm({ onSuccess }) {
  const { markPasswordChanged } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setSaving(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Tu contraseña se actualizó correctamente.');
      markPasswordChanged();
      onSuccess?.();
    } catch (changeError) {
      setError(changeError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
      <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65 sm:col-span-2">
        Contraseña actual
        <input type="password" autoComplete="current-password" minLength={8} maxLength={100} required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} disabled={saving} />
      </label>
      <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65">
        Nueva contraseña
        <input type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} disabled={saving} />
      </label>
      <label className="grid content-start gap-2 text-xs font-medium text-[#f0ece4]/65">
        Confirmar nueva contraseña
        <input type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} disabled={saving} />
      </label>
      {error && <p className="sm:col-span-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      {success && <p className="sm:col-span-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200" role="status">{success}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-semibold text-[#0a0c10] transition hover:bg-[#d8b85d] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? 'Actualizando…' : 'Actualizar contraseña'}
        </button>
      </div>
    </form>
  );
}
