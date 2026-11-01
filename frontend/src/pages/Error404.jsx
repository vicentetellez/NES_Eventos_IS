import { Link } from 'react-router-dom'

function Error404() {
	return (
		<div className="public-shell">
			<section className="page-card center-card">
				<h1>404</h1>
				<p className="subtitle">La página solicitada no existe.</p>
				<Link to="/login" className="btn-primary">Volver al inicio</Link>
			</section>
		</div>
	)
}

export default Error404