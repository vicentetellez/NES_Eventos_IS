import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import menuConfig from '../menuConfig';

export default function Home() {
  const { user } = useAuth();
  const cards = menuConfig[user.rol] || [];

  return (
    <div className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-white/10 pb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Panel de control
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          ¡Hola, <span className="text-[#c9a84c]">{user.persona.nombre || 'Bienvenido'}</span>!
          </h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Rol: <span className="font-semibold uppercase tracking-wider text-[#c9a84c]">{user.rol}</span>
            <span className="mx-2 text-white/20">·</span>
            Selecciona una opción para comenzar.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group flex min-h-56 flex-col justify-between rounded-xl border border-white/10 bg-[#131622] p-6 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-1 hover:border-[#c9a84c]/50 hover:bg-[#171b29] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
            >
              <div>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 text-2xl">
                  {card.icon}
                </div>
                <h2 className="mb-2 text-lg font-semibold text-[#f0ece4] transition-colors group-hover:text-[#c9a84c]">
                  {card.title}
                </h2>
                <p className="text-sm leading-relaxed text-[#f0ece4]/50">
                  {card.text}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c9a84c]">
                Ingresar <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}