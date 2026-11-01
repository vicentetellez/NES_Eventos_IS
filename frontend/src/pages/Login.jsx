import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NES_Eventos_Logo from '../assets/Logo-NES-Eventos-Rectangular.png'

function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/home')
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(rut, password)
    setLoading(false)

    if (!result.success) {
      setError(result.message || 'No fue posible iniciar sesión')
      return
    }

    navigate('/home')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0c10] px-4 py-10 text-[#f0ece4]">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131622] p-7 shadow-2xl shadow-black/40 sm:p-10">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#c9a84c]">
            Plataforma de
          </p>
          <img
            src={NES_Eventos_Logo}
            alt="NES Eventos"
            className="mx-auto mb-6 h-auto w-36 object-contain"
          />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Iniciar sesión
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="rut" className="block text-sm font-medium text-[#f0ece4]/80">RUT</label>
            <input
              id="rut"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-[#f0ece4]/80">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-[#0a0c10] px-4 py-3 pr-12 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c]"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-1 text-[#f0ece4]/60 transition hover:text-[#c9a84c]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M2 12C2 12 5.5 6 12 6C18.5 6 22 12 22 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M2 12C2 12 5.5 18 12 18C18.5 18 22 12 22 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  {showPassword ? (
                    <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  ) : null}
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default Login