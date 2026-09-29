	import { useEffect, useState } from 'react'
	import api from '../services/root.service.js'

	const pesos = (valor) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(valor)
	const mensajeError = (error) => error.response?.data?.message || error.response?.data?.error || error.message || 'Ocurrió un error al procesar la solicitud.'

	export default function Presupuesto() {
		const [sesion, setSesion] = useState(false)
		const [comprobandoSesion, setComprobandoSesion] = useState(true)
		const [rut, setRut] = useState('')
		const [password, setPassword] = useState('')
		const [codigoEvento, setCodigoEvento] = useState('')
		const [evento, setEvento] = useState(null)
		const [detallesExtra, setDetallesExtra] = useState([])
		const [cotizacion, setCotizacion] = useState(null)
		const [error, setError] = useState('')
		const [ocupado, setOcupado] = useState(false)

		useEffect(() => {
			let activo = true
			api.get('/auth/me')
				.then(() => { if (activo) setSesion(true) })
				.catch(() => { if (activo) setSesion(false) })
				.finally(() => { if (activo) setComprobandoSesion(false) })
			return () => { activo = false }
		}, [])

		async function iniciarSesion(e) {
			e.preventDefault()
			setOcupado(true)
			setError('')
			try {
				await api.post('/auth/login', { rut, password })
				setSesion(true)
				setPassword('')
			} catch (loginError) {
				setError(mensajeError(loginError))
			} finally {
				setOcupado(false)
			}
		}

		async function cerrarSesion() {
			try { await api.post('/auth/logout') } finally {
				setSesion(false)
				setEvento(null)
				setCotizacion(null)
			}
		}

		async function buscarEvento(e) {
			e.preventDefault()
			setOcupado(true)
			setError('')
			setEvento(null)
			setCotizacion(null)
			try {
				const { data } = await api.get(`/evento/${Number(codigoEvento)}`)
				const resultado = data.data.evento
				setEvento(resultado.evento ?? resultado)
			} catch (busquedaError) {
				setError(mensajeError(busquedaError))
			} finally {
				setOcupado(false)
			}
		}

		async function calcular(e) {
			e.preventDefault()
			if (!evento?.codigoTipoEvento) {
				setError('Este evento no tiene un tipo vinculado al catálogo y no se puede calcular automáticamente.')
				return
			}
			setOcupado(true)
			setError('')
			try {
				const { data } = await api.post('/presupuestos/calcular-inicial', {
					codigoTipoEvento: evento.codigoTipoEvento,
					horasEvento: evento.horasEvento,
					horasMontajeDesmontaje: evento.horasMontajeDesmontaje ?? 0,
					cantidadPersonas: evento.cantidadPersonas,
					detallesAdicionales: detallesExtra
						.filter((detalle) => detalle.descripcion.trim())
						.map((detalle) => ({
							categoria: detalle.categoria,
							descripcion: detalle.descripcion.trim(),
							cantidad: Number(detalle.cantidad),
							precioUnitario: Number(detalle.precioUnitario),
						})),
				})
				setCotizacion(data.data.cotizacion)
			} catch (calculoError) {
				setError(mensajeError(calculoError))
			} finally {
				setOcupado(false)
			}
		}

		if (comprobandoSesion) return <main className="min-h-screen p-8 text-sm text-slate-600">Comprobando sesión...</main>

		if (!sesion) return (
			<main className="min-h-screen bg-white px-4 py-12 text-slate-800 sm:px-6">
				<section className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-5 shadow-sm">
					<h1 className="mb-5 text-2xl font-bold">Ingreso de personal</h1>
					<form onSubmit={iniciarSesion} className="grid gap-3">
						<label className="grid gap-1 text-sm">RUT<input value={rut} onChange={(e) => setRut(e.target.value)} className="rounded border border-slate-300 p-2" required /></label>
						<label className="grid gap-1 text-sm">Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded border border-slate-300 p-2" required /></label>
						{error && <p className="text-sm text-red-700">{error}</p>}
						<button className="justify-self-start rounded bg-slate-700 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={ocupado}>{ocupado ? 'Ingresando...' : 'Ingresar'}</button>
					</form>
				</section>
			</main>
		)

		const cliente = evento?.cliente?.persona
		const nombreCliente = cliente ? [cliente.nombre, cliente.primerApellido, cliente.segundoApellido].filter(Boolean).join(' ') : 'Sin información de cliente'
		const tipoNombre = evento?.tipoEvento?.nombre || evento?.tipoEventoCliente || 'Tipo no especificado'
		const centroNombre = evento?.centroEvento?.nombre || evento?.centroEventoCliente || 'Centro no especificado'

		return (
			<main className="min-h-screen bg-white px-4 py-10 text-slate-800 sm:px-6">
				<section className="mx-auto w-full max-w-5xl border border-slate-200 bg-white px-4 pb-7 pt-4 shadow-sm sm:px-5">
					<div className="mb-6 flex items-center justify-between gap-4">
						<h1 className="m-0 text-2xl font-bold tracking-normal">Presupuesto de Evento</h1>
						<button type="button" onClick={cerrarSesion} className="text-sm text-slate-600 underline">Salir</button>
					</div>

					<form onSubmit={buscarEvento} className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<label htmlFor="codigo-evento" className="grid flex-1 gap-1 text-sm font-semibold">Código del evento
							<input id="codigo-evento" type="number" min="1" step="1" value={codigoEvento} onChange={(e) => { setCodigoEvento(e.target.value); setEvento(null); setCotizacion(null) }} className="min-h-11 rounded border border-slate-300 px-3 font-normal" placeholder="Ej. 1" required />
						</label>
						<button type="submit" disabled={ocupado || !codigoEvento} className="min-h-11 rounded bg-slate-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{ocupado ? 'Buscando...' : 'Buscar evento'}</button>
					</form>

					{error && <p role="alert" className="mt-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

					{evento && <>
						<section className="mt-6 border-t border-slate-200 pt-5">
							<h2 className="mb-4 text-lg font-bold">Información del evento</h2>
							<dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
								<div><dt className="text-slate-500">Cliente</dt><dd className="font-medium">{nombreCliente}</dd></div>
								<div><dt className="text-slate-500">RUT</dt><dd className="font-medium">{cliente?.rut || evento.rutCliente}</dd></div>
								<div><dt className="text-slate-500">Estado</dt><dd className="font-medium">{evento.estado}</dd></div>
								<div><dt className="text-slate-500">Tipo de evento</dt><dd className="font-medium">{tipoNombre}</dd></div>
								<div><dt className="text-slate-500">Fecha</dt><dd className="font-medium">{String(evento.fechaEvento).slice(0, 10)}</dd></div>
								<div><dt className="text-slate-500">Hora de inicio</dt><dd className="font-medium">{String(evento.horaInicio).slice(11, 16)}</dd></div>
								<div><dt className="text-slate-500">Centro</dt><dd className="font-medium">{centroNombre}</dd></div>
								<div><dt className="text-slate-500">Personas</dt><dd className="font-medium">{evento.cantidadPersonas}</dd></div>
								<div><dt className="text-slate-500">Horas evento</dt><dd className="font-medium">{evento.horasEvento}</dd></div>
								<div><dt className="text-slate-500">Horas montaje/desmontaje</dt><dd className="font-medium">{evento.horasMontajeDesmontaje ?? 0}</dd></div>
							</dl>
							{!evento.codigoTipoEvento && <p className="mt-4 text-sm text-amber-800">El tipo de este evento no está vinculado al catálogo; no se puede calcular con las tarifas automáticas.</p>}
						</section>

						<section className="mt-6 border-t border-slate-200 pt-5">
							<div className="mb-4 flex items-center justify-between gap-3">
								<h2 className="m-0 text-lg font-bold">Costos adicionales</h2>
								<button type="button" onClick={() => setDetallesExtra((actuales) => [...actuales, { categoria: 'TRANSPORTE', descripcion: '', cantidad: 1, precioUnitario: 0 }])} className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100">+ Agregar concepto</button>
							</div>
							<div className="grid gap-3">
								{detallesExtra.map((detalle, indice) => <div key={indice} className="grid gap-3 rounded border border-slate-200 p-3 sm:grid-cols-2 lg:grid-cols-4">
									<label className="grid gap-1 text-sm">Categoría<select value={detalle.categoria} onChange={(e) => setDetallesExtra((actuales) => actuales.map((item, i) => i === indice ? { ...item, categoria: e.target.value } : item))} className="min-h-10 rounded border border-slate-300 bg-white px-2">{['TRANSPORTE', 'EQUIPAMIENTO', 'PERSONAL', 'BANQUETERIA', 'DECORACION', 'OTRO'].map((cat) => <option key={cat}>{cat}</option>)}</select></label>
									<label className="grid gap-1 text-sm">Descripción<input value={detalle.descripcion} onChange={(e) => setDetallesExtra((actuales) => actuales.map((item, i) => i === indice ? { ...item, descripcion: e.target.value } : item))} className="min-h-10 rounded border border-slate-300 px-2" /></label>
									<label className="grid gap-1 text-sm">Cantidad<input type="number" min="1" value={detalle.cantidad} onChange={(e) => setDetallesExtra((actuales) => actuales.map((item, i) => i === indice ? { ...item, cantidad: e.target.value } : item))} className="min-h-10 rounded border border-slate-300 px-2" /></label>
									<label className="grid gap-1 text-sm">Precio unitario<input type="number" min="0" value={detalle.precioUnitario} onChange={(e) => setDetallesExtra((actuales) => actuales.map((item, i) => i === indice ? { ...item, precioUnitario: e.target.value } : item))} className="min-h-10 rounded border border-slate-300 px-2" /></label>
									<button type="button" onClick={() => setDetallesExtra((actuales) => actuales.filter((_, i) => i !== indice))} className="justify-self-start text-xs text-red-700 underline lg:col-span-4">Quitar concepto</button>
								</div>)}
							</div>
							<button type="button" onClick={calcular} disabled={ocupado || !evento.codigoTipoEvento} className="mt-5 rounded bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{ocupado ? 'Calculando...' : 'Calcular presupuesto'}</button>
						</section>
					</>}

					{cotizacion && <section className="mt-7 border-t-2 border-slate-700 pt-5" aria-live="polite">
						<div className="flex flex-wrap items-end justify-between gap-3"><div><p className="m-0 text-sm text-slate-500">Presupuesto estimado · {tipoNombre}</p><p className="mb-0 mt-1 text-3xl font-bold">{pesos(cotizacion.total)}</p></div><p className="m-0 text-sm text-slate-600">Horas consideradas: {cotizacion.horasTotales}</p></div>
						<div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">{cotizacion.detalles.map((detalle, indice) => <div key={indice} className="flex justify-between gap-4 py-3 text-sm"><div><p className="m-0 font-semibold">{detalle.categoria.replaceAll('_', ' ')} · {detalle.descripcion}</p><p className="m-0 mt-1 text-xs text-slate-500">{detalle.cantidad} × {pesos(detalle.precioUnitario)}</p></div><strong className="whitespace-nowrap">{pesos(detalle.subtotal)}</strong></div>)}</div>
						<div className="mt-4 space-y-2 text-sm"><p className="m-0 flex justify-between gap-4">Primer abono (50%) <strong>{pesos(cotizacion.primerAbono)}</strong></p><p className="m-0 flex justify-between gap-4">Saldo inicial <strong>{pesos(cotizacion.saldoInicial)}</strong></p></div>
						<p className="mb-0 mt-4 text-xs text-slate-500">Previsualización; el presupuesto todavía no se guarda.</p>
					</section>}
				</section>
			</main>
		)
	}
