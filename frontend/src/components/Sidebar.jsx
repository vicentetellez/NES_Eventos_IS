import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NES_Eventos_Logo from '../assets/Logo-NES-Eventos-Rectangular.png'
import menuConfig from '../menuConfig'

function Sidebar({ open, onClose }) {
  const { user } = useAuth()

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex h-screen w-72 flex-col border-r border-white/10 bg-[#131622] px-4 py-6 text-[#f0ece4] shadow-2xl shadow-black/40 transition-transform duration-200 md:sticky md:top-0 md:z-20 md:shrink-0 md:translate-x-0 md:shadow-none ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-2 pb-6">
        <img src={NES_Eventos_Logo} alt="NES Eventos" className="h-auto w-40 object-contain" />
        <button
          type="button"
          className="rounded p-2 text-lg text-[#f0ece4]/60 transition hover:bg-white/5 hover:text-[#c9a84c] md:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          ×
        </button>
      </div>
      <nav className="grid gap-2 pt-6">
        {menuConfig[user.rol]?.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9a84c] ${
                isActive
                  ? 'bg-[#c9a84c]/15 font-semibold text-[#c9a84c]'
                  : 'text-[#f0ece4]/65 hover:bg-white/[0.05] hover:text-[#f0ece4]'
              }`
            }
            onClick={onClose}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.title}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar