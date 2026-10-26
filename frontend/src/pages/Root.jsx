import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { AuthProvider, useAuth } from '../context/AuthContext'

function RootLayout() {
	const { isAuthenticated } = useAuth()
	const { pathname } = useLocation()
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const showSidebar = isAuthenticated && pathname !== '/login' && pathname !== '/solicitud-evento' && pathname !== '/evaluar-evento' && pathname !== '/*'

	return (
		showSidebar ? (
			<div className="flex min-h-screen bg-[#0a0c10]">
				<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
				{sidebarOpen && (
					<button
						type="button"
						className="fixed inset-0 z-20 border-0 bg-black/60 md:hidden"
						aria-label="Cerrar menú"
						onClick={() => setSidebarOpen(false)}
					/>
				)}
				<main className="min-h-screen min-w-0 flex-1 bg-[#0a0c10]">
					<button
						type="button"
						className="m-3 rounded-lg border border-white/10 bg-[#131622] px-3 py-2 text-xl text-[#c9a84c] transition hover:border-[#c9a84c]/40 focus:outline-none focus:ring-2 focus:ring-[#c9a84c] md:hidden"
						aria-label="Abrir menú"
						aria-expanded={sidebarOpen}
						onClick={() => setSidebarOpen(true)}
					>
						☰
					</button>
					<Outlet />
				</main>
			</div>
		) : (
			<Outlet />
		)
	)
}

function Root() {
	return (
		<AuthProvider>
			<RootLayout />
		</AuthProvider>
	)
}

export default Root