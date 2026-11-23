import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTiposEventoPublicos } from '../services/tipoEvento.service';
import { getCentrosEventoPublicos } from '../services/centroEvento.service';
import { getBanqueteriasPublicas } from '../services/banqueteria.service';
import { getEstadisticasPublicas } from '../services/evento.service';
import NES_Eventos_Logo from '../assets/Logo-NES-Eventos-Rectangular.png';

const getIconForTipo = (nombre = '') => {
  const n = nombre.toLowerCase();
  if (n.includes('matrimonio') || n.includes('boda')) return '💍';
  if (n.includes('aniversario')) return '🥂';
  if (n.includes('corporativ') || n.includes('empresa')) return '🏛';
  if (n.includes('gala') || n.includes('cena')) return '🕯️';
  if (n.includes('licenciatura') || n.includes('titulac') || n.includes('academ')) return '🎓';
  if (n.includes('seminario') || n.includes('congreso')) return '🎤';
  if (n.includes('concierto') || n.includes('show') || n.includes('artistic')) return '🎶';
  if (n.includes('arriendo') || n.includes('mobiliario')) return '🏗️';
  return '✨';
};

function CotizarButton({ className = '' }) {
  return (
    <Link
      to="/solicitud-evento"
      className={`inline-flex items-center gap-2 px-6 py-3 bg-[#c9a84c] hover:bg-[#b8973b] text-[#0a0c10] font-bold text-sm tracking-wider uppercase rounded transition-colors ${className}`}
    >
      Cotizar Evento →
    </Link>
  );
}

export default function Landing() {
  const [stats, setStats] = useState(null);
  const [tiposEvento, setTiposEvento] = useState([]);
  const [centrosEvento, setCentrosEvento] = useState([]);
  const [banqueterias, setBanqueterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const [statsData, tipos, centros, banquetes] = await Promise.all([
          getEstadisticasPublicas().catch(() => null),
          getTiposEventoPublicos().catch(() => []),
          getCentrosEventoPublicos().catch(() => []),
          getBanqueteriasPublicas().catch(() => []),
        ]);
        setStats(statsData);
        setTiposEvento(Array.isArray(tipos) ? tipos : []);
        setCentrosEvento(Array.isArray(centros) ? centros : []);
        setBanqueterias(Array.isArray(banquetes) ? banquetes : []);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  const statCards = [
    { label: 'Eventos realizados', value: stats?.eventosRealizados, suffix: '' },
    { label: 'Clientes que nos recomiendan', value: stats?.satisfaccionPromedio, suffix: '%' },
    { label: 'Centros de eventos', value: stats?.centrosEvento, suffix: '' },
    { label: 'Tipos de banquetería', value: stats?.banqueterias, suffix: '' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0c10] text-[#f0ece4]">
      {/* Header */}
      <header className="relative flex items-center justify-center px-6 sm:px-10 py-4 border-b border-white/[0.07] bg-[#0a0c10]/95 backdrop-blur-md sticky top-0 z-10">
        {/* Imagen perfectamente centrada */}
        <img 
          src={NES_Eventos_Logo} 
          alt="NES Eventos" 
          className="block h-auto w-20 object-contain sm:w-24" 
        />
        {/* Botón alineado a la derecha de forma absoluta */}
        <div className="absolute right-6 sm:right-10">
          <Link
            to="/login"
            className="px-4 py-2 border border-white/20 hover:bg-white/5 text-[#f0ece4]/70 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
          >
            Ingresar
          </Link>
        </div>
      </header>
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-16 pb-14 sm:pt-24 sm:pb-20">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9a84c] mb-4">
          Región del Biobío, Chile
        </p>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight max-w-3xl leading-tight">
          Producción integral de eventos que se recuerdan
        </h1>
        <p className="mt-5 max-w-xl text-sm sm:text-base text-[#f0ece4]/55 leading-relaxed">
          Matrimonios, eventos corporativos, galas y celebraciones. Coordinamos recinto,
          banquetería y producción completa para que tú solo disfrutes.
        </p>
        <CotizarButton className="mt-8" />
      </section>

      {/* Mini dashboard */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, suffix }) => (
            <div
              key={label}
              className="bg-[#131622] border border-white/10 rounded-lg p-5 text-center"
            >
              <p className="text-3xl sm:text-4xl font-semibold text-[#c9a84c]">
                {loading ? '…' : value != null ? `${value}${suffix}` : '—'}
              </p>
              <p className="mt-2 text-[11px] sm:text-xs uppercase tracking-wider text-[#f0ece4]/45">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tipos de evento */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Tipos de evento que producimos</h2>
          <div className="w-10 h-0.5 bg-[#c9a84c] mt-3 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tiposEvento.map((t) => (
              <div
                key={t.codigo}
                className="bg-[#131622] border border-white/10 rounded-lg p-5 flex flex-col items-center text-center gap-3 hover:border-[#c9a84c]/40 transition-colors"
              >
                <span className="text-3xl">{getIconForTipo(t.nombre)}</span>
                <p className="text-sm font-medium">{t.nombre}</p>
                {t.descripcion && (
                  <p className="text-xs text-[#f0ece4]/45 leading-relaxed">{t.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banquetería */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Banquetería a tu medida</h2>
          <div className="w-10 h-0.5 bg-[#c9a84c] mt-3 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banqueterias.map((b) => (
              <div
                key={b.codigo}
                className="bg-[#131622] border border-white/10 rounded-lg p-5 hover:border-[#c9a84c]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-[#c9a84c]">{b.nombre}</p>
                  {b.precioPersonaReferencial != null && (
                    <span className="text-xs text-[#f0ece4]/50 whitespace-nowrap">
                      ${Number(b.precioPersonaReferencial).toLocaleString('es-CL')} p/p
                    </span>
                  )}
                </div>
                {b.descripcion && (
                  <p className="mt-2 text-xs text-[#f0ece4]/50 leading-relaxed">{b.descripcion}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Centros de eventos */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">Centros de eventos asociados</h2>
          <div className="w-10 h-0.5 bg-[#c9a84c] mt-3 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {centrosEvento.map((c) => (
              <div
                key={c.codigo}
                className="bg-[#131622] border border-white/10 rounded-lg p-5 hover:border-[#c9a84c]/40 transition-colors"
              >
                <p className="text-sm font-semibold">{c.nombre}</p>
                {c.capacidadPersonas != null && (
                  <p className="mt-1.5 text-xs text-[#c9a84c]/80">
                    Hasta {Number(c.capacidadPersonas).toLocaleString('es-CL')} personas
                  </p>
                )}
                {c.direccionExacta && (
                  <p className="mt-1 text-xs text-[#f0ece4]/45">{c.direccionExacta}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTAs finales */}
      <section className="px-6 sm:px-10 pb-20">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-8 border-t border-white/[0.07] pt-14 text-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">¿Listo para cotizar tu evento?</h2>
            <p className="mt-3 text-sm text-[#f0ece4]/50 max-w-md">
              Completa el formulario en 4 pasos y te contactaremos con una cotización formal.
            </p>
            <CotizarButton className="mt-6" />
          </div>

          <Link
            to="/evaluar-evento"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/10 font-semibold text-sm tracking-wider uppercase rounded transition-colors"
          >
            ¿Tuviste un evento con nosotros y nos quieres evaluar? Vamos →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] px-6 sm:px-10 py-6 text-center">
        <p className="text-xs text-[#f0ece4]/30">
          NES Eventos — Producción integral de eventos · Región del Biobío
        </p>
      </footer>
    </div>
  );
}
