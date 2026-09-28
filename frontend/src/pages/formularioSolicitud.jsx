import { useState, useEffect } from 'react';
import { getTiposEventoPublicos } from '../services/tipoEvento.service';
import { getCentrosEventoPublicos } from '../services/centroEvento.service';
import { getBanqueteriasPublicas } from '../services/banqueteria.service';
import { clienteExisteParaSolicitud } from '../services/cliente.service';
import { solicitudEvento } from '../services/evento.service';

// ─── Asignador automático de Íconos ──────────────────────────────────────────
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

const DURATION_OPTIONS = ["2 horas", "3 horas", "4 horas", "5 horas", "6 horas", "7 horas", "8+ horas"];

const EMPTY_FORM = {
  eventType: "", eventSubtype: "", date: "", timeStart: "", duration: "",
  guests: "", venue: "", venueAddress: "", menu: "", allergies: "",
  alcohol: "", audiovisual: "", decoration: "", notes: "",
  name: "", email: "", phone: "", rut: "", terms: false,
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function FormularioSolicitud() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const [form, setForm] = useState(EMPTY_FORM);
  const [isExistingClient, setIsExistingClient] = useState(false);

  // Estados para catálogos
  const [tiposEvento, setTiposEvento] = useState([]);
  const [centrosEvento, setCentrosEvento] = useState([]);
  const [banqueterias, setBanqueterias] = useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    async function cargarCatalogosFormulario() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [dataTipos, dataCentros, dataBanqueterias] = await Promise.all([
          getTiposEventoPublicos(),
          getCentrosEventoPublicos(),
          getBanqueteriasPublicas()
        ]);

        setTiposEvento(Array.isArray(dataTipos) ? dataTipos : []);
        setCentrosEvento(Array.isArray(dataCentros) ? dataCentros : []);
        setBanqueterias(Array.isArray(dataBanqueterias) ? dataBanqueterias : []);
      } catch (err) {
        setErrorMessage(err.message || 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    }

    cargarCatalogosFormulario();
  }, []);

  const update = (partial) => setForm((f) => ({ ...f, ...partial }));

  const canNext = () => {
    if (step === 1) return !!form.eventType;
    if (step === 2) return !!(form.date && form.timeStart && form.duration && form.guests);
    if (step === 3) return true;
    if (step === 4) {
      if (!form.rut || !form.terms) return false;
      if (isExistingClient) return true;
      return !!(form.name && form.email && form.phone);
    }
    return false;
  };

  // ─── Mapeo de datos para Backend / Zod ──────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      const cantidadPersonas = parseInt(form.guests, 10) || 1;
      const horasEvento = parseInt(form.duration, 10) || 1;

      // 1. Objeto datosEventoNuevo
      const datosEventoNuevo = {
        fechaEvento: form.date,
        horaInicio: form.timeStart,
        horasEvento,
        cantidadPersonas,
      };

      // Mapeo condicional Tipo de Evento (Zod: uno u otro)
      if (form.eventType === "otro") {
        datosEventoNuevo.tipoEventoCliente = form.eventSubtype.trim() || "Otro tipo de evento";
      } else {
        datosEventoNuevo.codigoTipoEvento = Number(form.eventType);
      }

      // Mapeo condicional Centro de Eventos (Zod: uno u otro)
      if (form.venue === "custom") {
        datosEventoNuevo.centroEventoCliente = form.venueAddress.trim() || "Recinto propio del cliente";
      } else {
        datosEventoNuevo.codigoCentroEvento = Number(form.venue);
      }

      // Campos opcionales (solo incluir si tienen texto para no fallar .min(1))
      if (form.allergies && form.allergies.trim()) {
        datosEventoNuevo.restriccionesAlimentarias = form.allergies.trim();
      }

      if (form.alcohol && form.alcohol.trim()) {
        datosEventoNuevo.comentariosAlcohol = form.alcohol.trim();
      }

      // Consolidar comentarios adicionales
      const extras = [];
      if (form.audiovisual) extras.push(`Audiovisual: ${form.audiovisual}`);
      if (form.decoration) extras.push(`Decoración: ${form.decoration}`);
      if (form.notes && form.notes.trim()) extras.push(form.notes.trim());

      if (extras.length > 0) {
        datosEventoNuevo.comentariosAdicionales = extras.join(" | ");
      }

      // 2. Objeto eventoData
      const eventoData = {
        rutCliente: form.rut.trim(),
        datosEventoNuevo,
      };

      // Si es cliente nuevo, construir datosClienteNuevo
      if (!isExistingClient) {
        const partesNombre = form.name.trim().split(" ");
        const nombre = partesNombre[0] || "Cliente";
        const primerApellido = partesNombre[1] || "SinApellido";
        const segundoApellido = partesNombre.slice(2).join(" ");

        eventoData.datosClienteNuevo = {
          nombre,
          primerApellido,
          ...(segundoApellido ? { segundoApellido } : {}),
          telefono: form.phone.trim(),
          email: form.email.trim(),
        };
      }

      // 3. Array de banqueterias
      const listaBanqueterias = [];
      if (form.menu) {
        listaBanqueterias.push({
          codigoBanquete: Number(form.menu),
          cantidadRequerida: cantidadPersonas,
        });
      }

      // Payload Final
      const payload = {
        eventoData,
        banqueterias: listaBanqueterias,
      };

      await solicitudEvento(payload);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || 'Ocurrió un error al procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    "¿Qué tipo de evento estás planeando?",
    "Detalles del evento",
    "Servicios y requerimientos",
    "Datos de contacto",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1923] text-[#f0ece4]">
        <div className="text-xl font-medium animate-pulse">Cargando catálogo de opciones...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f1923]">
        <div className="max-w-md w-full p-6 rounded border border-red-500/30 bg-red-500/10 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error al cargar el formulario</h2>
          <p className="text-sm text-red-200/70 mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f1923]">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-xl">
            <SuccessScreen 
              data={form} 
              tiposEvento={tiposEvento}
              onReset={() => { 
                setForm(EMPTY_FORM); 
                setStep(1); 
                setSubmitted(false);
                setIsExistingClient(false);
              }} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f1923] text-[#f0ece4]">
      <Header />

      <div className="flex-1 flex items-start justify-center px-6 py-10 pb-16">
        <div className="w-full max-w-2xl">
          <Steps current={step} />

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-md p-6 sm:p-10 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#f0ece4] mb-1">
              {stepTitles[step - 1]}
            </h2>
            <div className="w-10 h-0.5 bg-[#c9a84c] mb-6" />

            {step === 1 && <Step1 data={form} set={update} tiposEvento={tiposEvento} />}
            {step === 2 && <Step2 data={form} set={update} centrosEvento={centrosEvento} />}
            {step === 3 && <Step3 data={form} set={update} banqueterias={banqueterias} />}
            {step === 4 && (
              <Step4 
                data={form} 
                set={update} 
                tiposEvento={tiposEvento}
                centrosEvento={centrosEvento}
                banqueterias={banqueterias}
                isExistingClient={isExistingClient}
                setIsExistingClient={setIsExistingClient}
              />
            )}

            {submitError && (
              <div className="mt-6 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {submitError}
              </div>
            )}

            {/* Navegación */}
            <div className="flex items-center justify-between mt-9 pt-4 border-t border-white/5">
              <div>
                {step > 1 && (
                  <button 
                    disabled={submitting}
                    className="px-4 py-2 border border-white/20 hover:bg-white/5 disabled:opacity-50 text-[#f0ece4]/70 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    ← Anterior
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-[#f0ece4]/25 tracking-widest">
                  {step} / 4
                </span>
                {step < 4 ? (
                  <button
                    disabled={!canNext()}
                    onClick={() => setStep((s) => s + 1)}
                    className="px-5 py-2.5 bg-[#c9a84c] hover:bg-[#b8973b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f1923] font-semibold text-xs tracking-wider uppercase rounded transition-colors"
                  >
                    Continuar →
                  </button>
                ) : (
                  <button
                    disabled={!canNext() || submitting}
                    onClick={handleSubmit}
                    className="px-5 py-2.5 bg-[#c9a84c] hover:bg-[#b8973b] disabled:opacity-40 disabled:cursor-not-allowed text-[#0f1923] font-semibold text-xs tracking-wider uppercase rounded transition-colors flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-[#0f1923] border-t-transparent rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar solicitud'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Header Component ─────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.07] bg-[#0f1923]/95 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#c9a84c] flex items-center justify-center text-sm font-bold text-[#0f1923] rounded-sm">
          N
        </div>
        <div>
          <p className="text-base font-semibold text-[#f0ece4] leading-tight">NES Eventos</p>
          <p className="text-[10px] text-[#f0ece4]/35 tracking-widest uppercase leading-tight">Concepción, Biobío</p>
        </div>
      </div>
      <div className="text-xs text-[#f0ece4]/35 tracking-wider hidden sm:block">
        Inscripción de evento
      </div>
    </header>
  );
}

// ─── Steps Indicator ─────────────────────────────────────────────────────────
function Steps({ current }) {
  const labels = ["Tipo de evento", "Detalles", "Requerimientos", "Contacto"];
  return (
    <div className="flex items-center mb-10">
      {labels.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={i} className={`flex items-center ${i < labels.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1.5 min-w-[48px]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  done 
                    ? 'bg-[#c9a84c] text-[#0f1923] border-2 border-[#c9a84c]' 
                    : active 
                    ? 'bg-[#c9a84c]/15 text-[#c9a84c] border-2 border-[#c9a84c]' 
                    : 'bg-transparent text-[#f0ece4]/35 border-2 border-white/15'
                }`}
              >
                {done ? "✓" : idx}
              </div>
              <span
                className={`text-[10px] font-medium tracking-wider uppercase whitespace-nowrap ${
                  active ? "text-[#c9a84c]" : done ? "text-[#c9a84c]/60" : "text-[#f0ece4]/30"
                }`}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${done ? "bg-[#c9a84c]" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ──────────────────────────────────────────────────────────────────
function Step1({ data, set, tiposEvento }) {
  return (
    <div>
      <p className="text-xs sm:text-sm text-[#f0ece4]/50 mb-7 tracking-wide">
        Selecciona la categoría que mejor describe tu celebración.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {tiposEvento.map((ev) => {
          const isSelected = String(data.eventType) === String(ev.codigo);
          return (
            <button
              key={ev.codigo}
              type="button"
              onClick={() => set({ eventType: ev.codigo, eventSubtype: "" })}
              className={`flex flex-col items-center text-center p-3.5 rounded border transition-all ${
                isSelected
                  ? "bg-[#c9a84c]/15 border-[#c9a84c] text-[#c9a84c]"
                  : "bg-white/[0.03] border-white/10 text-[#f0ece4]/70 hover:border-white/30 hover:bg-white/[0.06]"
              }`}
            >
              <span className="text-2xl mb-1">{getIconForTipo(ev.nombre)}</span>
              <span className="text-xs font-semibold text-[#f0ece4] mb-1">{ev.nombre}</span>
              <span className="text-[10px] text-[#f0ece4]/35 leading-tight">
                {ev.descripcion || 'Sin descripción'}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => set({ eventType: "otro" })}
          className={`col-span-full flex items-center justify-center gap-3 p-3.5 rounded border transition-all text-left ${
            data.eventType === "otro"
              ? "bg-[#c9a84c]/15 border-[#c9a84c] text-[#c9a84c]"
              : "bg-white/[0.03] border-white/10 text-[#f0ece4]/70 hover:border-white/30 hover:bg-white/[0.06]"
          }`}
        >
          <span className="text-2xl shrink-0">✨</span>
          <div>
            <span className="text-xs font-semibold block text-[#f0ece4]">Otro</span>
            <span className="text-[10px] text-[#f0ece4]/35 leading-tight">
              Cuéntanos tu idea y te ayudamos a hacerlo realidad!!
            </span>
          </div>
        </button>
      </div>

      {data.eventType === "otro" && (
        <div className="mt-5">
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            Describe tu evento
          </label>
          <input
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
            placeholder="Ej: Fiesta de fin de año para empresa..."
            value={data.eventSubtype}
            onChange={(e) => set({ eventSubtype: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 2 ──────────────────────────────────────────────────────────────────
function Step2({ data, set, centrosEvento }) {
  const guestCount = parseInt(data.guests, 10) || 0;
  const hasGuests = guestCount > 0;

  const filteredVenues = centrosEvento.filter((c) => {
    const cap = c.capacidad || c.capacidadMax || 9999;
    return cap >= guestCount;
  });

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs sm:text-sm text-[#f0ece4]/50 mb-1 tracking-wide">
        Cuéntanos cuándo y dónde será tu evento. Solo atendemos en la Región del Biobío.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            Fecha del evento *
          </label>
          <input
            type="date"
            className="w-full bg-[#131f2c] border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c] transition-colors dark:[color-scheme:dark]"
            value={data.date}
            min={new Date(Date.now() + 60 * 24 * 3600000).toISOString().split("T")[0]}
            onChange={(e) => set({ date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            Hora de inicio *
          </label>
          <input
            type="time"
            className="w-full bg-[#131f2c] border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c] transition-colors dark:[color-scheme:dark]"
            value={data.timeStart}
            onChange={(e) => set({ timeStart: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            Duración estimada *
          </label>
          <div className="relative">
            <select
              className="w-full bg-[#131f2c] border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c] transition-colors appearance-none cursor-pointer"
              value={data.duration}
              onChange={(e) => set({ duration: e.target.value })}
            >
              <option value="" className="bg-[#0f1923]">Seleccionar...</option>
              {DURATION_OPTIONS.map((d) => (
                <option key={d} value={d} className="bg-[#0f1923]">{d}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c] pointer-events-none text-xs">▾</span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            N° de invitados *
          </label>
          <input
            type="number"
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
            placeholder="Ej: 80"
            min={1}
            value={data.guests}
            onChange={(e) => set({ guests: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
          Centro de eventos / Recinto
        </label>
        <div className="relative">
          <select
            className={`w-full bg-[#131f2c] border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c] transition-colors appearance-none ${
              hasGuests ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40"
            }`}
            value={data.venue}
            disabled={!hasGuests}
            onChange={(e) => set({ venue: e.target.value, venueAddress: "" })}
          >
            <option value="" className="bg-[#0f1923]">
              {hasGuests ? "Seleccionar recinto..." : "Ingresa primero el N° de invitados"}
            </option>
            {filteredVenues.map((v) => {
              const cap = v.capacidad || v.capacidadMax;
              return (
                <option key={v.codigo} value={v.codigo} className="bg-[#0f1923]">
                  {v.nombre} {cap ? `— hasta ${cap.toLocaleString("es-CL")} personas` : ''}
                </option>
              );
            })}
            <option value="custom" className="bg-[#0f1923]">Detállanos un recinto si ya tienes uno elegido</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c] pointer-events-none text-xs">▾</span>
        </div>
      </div>

      {data.venue === "custom" && (
        <div>
          <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
            Dirección del recinto *
          </label>
          <input
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
            placeholder="Calle, número, comuna — Concepción, Biobío"
            value={data.venueAddress}
            onChange={(e) => set({ venueAddress: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 3 ──────────────────────────────────────────────────────────────────
function Step3({ data, set, banqueterias }) {
  const toggle = (field, val) => {
    set({ [field]: data[field] === val ? "" : val });
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs sm:text-sm text-[#f0ece4]/50 tracking-wide">
        Indica los servicios y detalles especiales que necesitas para tu evento.
      </p>

      <div>
        <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
          Tipo de menú / servicio gastronómico
        </label>
        <div className="relative">
          <select
            className="w-full bg-[#131f2c] border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] focus:outline-none focus:border-[#c9a84c] transition-colors appearance-none cursor-pointer"
            value={data.menu}
            onChange={(e) => set({ menu: e.target.value })}
          >
            <option value="" className="bg-[#0f1923]">Seleccionar banquetería o menú...</option>
            {banqueterias.map((b) => (
              <option key={b.codigo} value={b.codigo} className="bg-[#0f1923]">
                {b.nombre}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c] pointer-events-none text-xs">▾</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
          Alergias o restricciones alimentarias
        </label>
        <input
          className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
          placeholder="Ej: 5 personas celíacas, 3 vegetarianas..."
          value={data.allergies}
          onChange={(e) => set({ allergies: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { field: "alcohol", label: "Servicio de alcohol", opts: ["Sí, incluir", "No incluir"] },
          { field: "audiovisual", label: "Equipos audiovisuales", opts: ["Sí, incluir", "No necesito"] },
          { field: "decoration", label: "Decoración temática", opts: ["Sí, incluir", "Solo lo básico"] },
        ].map(({ field, label, opts }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
              {label}
            </label>
            <div className="flex gap-2">
              {opts.map((opt) => {
                const active = data[field] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(field, opt)}
                    className={`flex-1 py-2 px-2 border text-xs font-medium rounded-sm transition-all text-center ${
                      active
                        ? "border-[#c9a84c] bg-[#c9a84c]/15 text-[#c9a84c]"
                        : "border-white/12 bg-white/[0.03] text-[#f0ece4]/50 hover:border-white/25"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
          Observaciones o requerimientos adicionales
        </label>
        <textarea
          rows={4}
          className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors leading-relaxed resize-y"
          placeholder="Cuéntanos cualquier detalle especial de tu evento, solicitudes específicas, etc."
          value={data.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

// ─── Step 4 ──────────────────────────────────────────────────────────────────
function Step4({ data, set, tiposEvento, centrosEvento, banqueterias, isExistingClient, setIsExistingClient }) {
  const [checkingRut, setCheckingRut] = useState(false);

  const consultarRut = async (rutIngresado) => {
    const rutLimpio = rutIngresado.trim();
    if (!rutLimpio || rutLimpio.length < 8) {
      setIsExistingClient(false);
      return;
    }

    try {
      setCheckingRut(true);
      const res = await clienteExisteParaSolicitud(rutLimpio);
      setIsExistingClient(!!res?.existe);
    } catch (err) {
      console.error('Error verificando RUT:', err);
      setIsExistingClient(false);
    } finally {
      setCheckingRut(false);
    }
  };

  const handleRutChange = (e) => {
    set({ rut: e.target.value });
    if (isExistingClient) setIsExistingClient(false);
  };

  const tipoSel = tiposEvento.find((e) => String(e.codigo) === String(data.eventType));
  const eventLabel = tipoSel ? tipoSel.nombre : (data.eventSubtype || "—");

  const centroSel = centrosEvento.find((c) => String(c.codigo) === String(data.venue));
  const venueLabel = data.venue === "custom" 
    ? (data.venueAddress || "Recinto propio") 
    : (centroSel ? centroSel.nombre : "—");

  const menuSel = banqueterias.find((b) => String(b.codigo) === String(data.menu));
  const menuLabel = menuSel ? menuSel.nombre : "—";

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs sm:text-sm text-[#f0ece4]/50 tracking-wide">
        Ingresa tu RUT para verificar tus datos de contacto.
      </p>

      <div>
        <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
          RUT *
        </label>
        <div className="relative flex items-center">
          <input
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
            placeholder="12.345.678-9"
            value={data.rut}
            onChange={handleRutChange}
            onBlur={(e) => consultarRut(e.target.value)}
          />
          {checkingRut && (
            <span className="absolute right-3 text-xs text-[#c9a84c] animate-pulse">
              Verificando...
            </span>
          )}
        </div>
      </div>

      {isExistingClient ? (
        <div className="bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded p-4 flex items-start gap-3 my-1">
          <span className="text-xl">✨</span>
          <div>
            <h4 className="text-sm font-semibold text-[#c9a84c]">¡Bienvenido de nuevo!</h4>
            <p className="text-xs text-[#f0ece4]/80 mt-1 leading-relaxed">
              Tenemos registros en el sistema asociados a este RUT, no hace falta que ingreses tus datos personales.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
              Nombre completo *
            </label>
            <input
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
              placeholder="Tu nombre y apellido"
              value={data.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
                Correo electrónico *
              </label>
              <input
                type="email"
                className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
                placeholder="tucorreo@email.com"
                value={data.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#f0ece4]/60 uppercase tracking-wider mb-2">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                className="w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-sm text-[#f0ece4] placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
                placeholder="+56 9 XXXX XXXX"
                value={data.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      {/* Resumen */}
      <div className="bg-white/[0.04] border border-white/10 rounded p-4 mt-1">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#f0ece4]/35 mb-3">
          Resumen de tu solicitud
        </p>
        <div className="flex flex-col gap-2">
          {[
            ["Tipo de evento", eventLabel],
            ["Fecha", data.date ? new Date(data.date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "—"],
            ["Hora inicio", data.timeStart || "—"],
            ["Duración", data.duration || "—"],
            ["Invitados", data.guests ? `${data.guests} personas` : "—"],
            ["Recinto", venueLabel],
            ["Menú / Banquetería", menuLabel],
          ].map(([key, val]) => (
            <div key={key} className="flex justify-between items-center gap-4 text-xs">
              <span className="text-[#f0ece4]/40">{key}</span>
              <span className="text-[#f0ece4] font-medium text-right">{val}</span>
            </div>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={data.terms}
          onChange={(e) => set({ terms: e.target.checked })}
          className="mt-0.5 accent-[#c9a84c] w-4 h-4 shrink-0 rounded"
        />
        <span className="text-xs text-[#f0ece4]/50 leading-relaxed">
          Acepto que NES Eventos contacte al correo y teléfono indicados para coordinar la cotización.
        </span>
      </label>
    </div>
  );
}

// ─── Pantalla de Éxito ────────────────────────────────────────────────────────
function SuccessScreen({ data, tiposEvento, onReset }) {
  const tipoSel = tiposEvento.find((e) => String(e.codigo) === String(data.eventType));
  const eventLabel = tipoSel ? tipoSel.nombre : data.eventSubtype;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-18 h-18 rounded-full bg-[#c9a84c]/15 border-2 border-[#c9a84c] flex items-center justify-center text-3xl text-[#c9a84c] mb-6">
        ✓
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold text-[#f0ece4] mb-2.5">
        Solicitud enviada con éxito
      </h2>
      <p className="text-sm text-[#f0ece4]/50 max-w-md leading-relaxed mb-8">
        Gracias{data.name ? `, ${data.name}` : ''}. Hemos recibido tu solicitud para un{" "}
        <strong className="text-[#c9a84c]">{eventLabel}</strong>. Nuestro equipo revisará los detalles y te
        contactará a la brevedad con la cotización formal.
      </p>
      <button 
        onClick={onReset}
        className="px-4 py-2 border border-white/20 hover:bg-white/5 text-[#f0ece4]/70 text-xs font-semibold uppercase tracking-wider rounded transition-colors"
      >
        Enviar otra solicitud
      </button>
    </div>
  );
}