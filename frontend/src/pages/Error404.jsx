import { Link } from 'react-router-dom'
import NES_Eventos_Logo from '../assets/Logo-NES-Eventos-Rectangular.png'

function Error404() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0c10] px-4 py-10 text-[#f0ece4]">
			<img
				src={NES_Eventos_Logo}
				alt="NES Eventos"
				className="mb-10 h-auto w-24 object-contain sm:w-28"
			/>
			<section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#131622] p-8 text-center shadow-2xl shadow-black/40 sm:p-10">
				<p className="text-6xl font-semibold tracking-tight text-[#c9a84c] sm:text-7xl">404</p>
				<div className="mx-auto mt-4 mb-5 h-0.5 w-10 bg-[#c9a84c]" />
				<h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
					Página no encontrada
				</h1>
				<p className="mt-3 text-sm leading-relaxed text-[#f0ece4]/50">
					La página que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio.
				</p>
				<div className="mt-8 flex flex-col items-center gap-3">
					<Link
						to="/landing"
						className="inline-flex w-full items-center justify-center rounded-lg bg-[#c9a84c] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#0a0c10] transition hover:bg-[#d8b85d]"
					>
						Volver al inicio
					</Link>
					<Link
						to="/solicitud-evento"
						className="inline-flex w-full items-center justify-center rounded-lg border border-[#c9a84c]/40 bg-[#c9a84c]/10 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-[#c9a84c] transition hover:bg-[#c9a84c]/20"
					>
						Cotizar Evento →
					</Link>
				</div>
			</section>
		</main>
	)
}

export default Error404