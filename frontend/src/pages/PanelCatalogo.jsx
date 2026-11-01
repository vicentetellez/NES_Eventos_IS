import { useCallback, useEffect, useState } from 'react';
import {
  changeCentroEventoStatus,
  createCentroEvento,
  getCentrosEventoByStatus,
  updateCentroEvento,
} from '../services/centroEvento.service.js';
import {
  changeTipoEventoStatus,
  createTipoEvento,
  getTiposEventoByStatus,
  updateTipoEvento,
} from '../services/tipoEvento.service.js';
import {
  changeBanqueteriaStatus,
  createBanqueteria,
  getBanqueteriasByStatus,
  updateBanqueteria,
} from '../services/banqueteria.service.js';
import { useAuth } from '../context/AuthContext.jsx';

const catalogs = {
  centros: {
    label: 'Centros de eventos',
    singular: 'centro de evento',
    plural: 'centros de eventos',
    icon: '🏛️',
    collectionKey: 'centroEventos',
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'direccionExacta', label: 'Dirección' },
      { name: 'capacidadPersonas', label: 'Capacidad de personas', type: 'number', required: true },
      { name: 'nombreDueno', label: 'Nombre del dueño' },
      { name: 'telefonoDueno', label: 'Teléfono de contacto', maxLength: 15 },
    ],
    load: getCentrosEventoByStatus,
    create: createCentroEvento,
    update: updateCentroEvento,
    changeStatus: changeCentroEventoStatus,
  },
  tipos: {
    label: 'Tipos de eventos',
    singular: 'tipo de evento',
    plural: 'tipos de eventos',
    icon: '✨',
    collectionKey: 'tipoEventos',
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'tarifaHoraBaseReferencial', label: 'Tarifa por hora referencial', type: 'number', required: true },
    ],
    load: getTiposEventoByStatus,
    create: createTipoEvento,
    update: updateTipoEvento,
    changeStatus: changeTipoEventoStatus,
  },
  banqueterias: {
    label: 'Banqueterías',
    singular: 'banquetería',
    plural: 'banqueterías',
    icon: '🍽️',
    collectionKey: 'banqueteria',
    fields: [
      { name: 'nombre', label: 'Nombre', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea' },
      { name: 'precioPersonaReferencial', label: 'Precio por persona referencial', type: 'number', required: true },
    ],
    load: getBanqueteriasByStatus,
    create: createBanqueteria,
    update: updateBanqueteria,
    changeStatus: changeBanqueteriaStatus,
  },
};

const emptyRecords = { true: [], false: [] };

function buildFormValues(catalog, item = {}) {
  return Object.fromEntries(catalog.fields.map(({ name }) => [name, item[name] ?? '']));
}

function buildPayload(catalog, values) {
  return Object.fromEntries(
    catalog.fields
      .filter(({ name, required }) => required || String(values[name]).trim() !== '')
      .map(({ name, type }) => [
        name,
        type === 'number' ? Number(values[name]) : String(values[name]).trim(),
      ]),
  );
}

export default function PanelCatalogo() {
  const { user } = useAuth();
  const [selectedKey, setSelectedKey] = useState('centros');
  const [showInactive, setShowInactive] = useState(false);
  const [recordsByStatus, setRecordsByStatus] = useState(emptyRecords);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const catalog = catalogs[selectedKey];
  const canManage = user && ['GERENTE', 'ADMIN'].includes(user.rol);
  const activeRecords = recordsByStatus.true;
  const inactiveRecords = recordsByStatus.false;
  const visibleRecords = showInactive ? inactiveRecords : activeRecords;

  const loadCatalog = useCallback(async (selectedCatalog) => {
    try {
      const [active, inactive] = await Promise.all([
        selectedCatalog.load(true),
        selectedCatalog.load(false),
      ]);
      setRecordsByStatus({
        true: Array.isArray(active) ? active : [],
        false: Array.isArray(inactive) ? inactive : [],
      });
    } catch (loadError) {
      setRecordsByStatus(emptyRecords);
      setError(loadError.message || `No se pudieron cargar ${selectedCatalog.plural}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return undefined;

    let active = true;
    const selectedCatalog = catalogs[selectedKey];
    Promise.all([
      selectedCatalog.load(true),
      selectedCatalog.load(false),
    ])
      .then(([activeRecordsResult, inactiveRecordsResult]) => {
        if (active) {
          setRecordsByStatus({
            true: Array.isArray(activeRecordsResult) ? activeRecordsResult : [],
            false: Array.isArray(inactiveRecordsResult) ? inactiveRecordsResult : [],
          });
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) {
          setRecordsByStatus(emptyRecords);
          setError(loadError.message || `No se pudieron cargar ${selectedCatalog.plural}.`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManage, selectedKey]);

  if (!canManage) {
    return (
      <main className="min-h-screen bg-[#0a0c10] p-6 text-[#f0ece4]">
        <section className="mx-auto max-w-xl rounded-xl border border-white/10 bg-[#131622] p-8 text-center">
          <h1 className="text-xl font-semibold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Solo GERENTE y ADMIN pueden gestionar los catálogos.
          </p>
        </section>
      </main>
    );
  }

  const startCreate = () => {
    setEditingItem(null);
    setFormValues(buildFormValues(catalog));
    setError('');
    setNotice('');
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormValues(buildFormValues(catalog, item));
    setError('');
    setNotice('');
  };

  const closeForm = () => {
    setEditingItem(null);
    setFormValues({});
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = buildPayload(catalog, formValues);
      if (editingItem) {
        await catalog.update(editingItem.codigo, payload);
      } else {
        await catalog.create(payload);
      }
      closeForm();
      setNotice(`${catalog.singular} ${editingItem ? 'actualizado' : 'agregado'} correctamente.`);
      setLoading(true);
      await loadCatalog(catalog);
    } catch (saveError) {
      setError(saveError.message || `No se pudo guardar ${catalog.singular}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setError('');
    setNotice('');
    try {
      await catalog.changeStatus(item.codigo, !item.activo);
      setNotice(`${catalog.singular} ${item.activo ? 'desactivado' : 'activado'} correctamente.`);
      setLoading(true);
      await loadCatalog(catalog);
    } catch (statusError) {
      setError(statusError.message || `No se pudo cambiar el estado de ${catalog.singular}.`);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0c10] px-4 py-8 text-[#f0ece4] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a84c]">
            Administración
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Gestión de catálogos</h1>
          <p className="mt-2 text-sm text-[#f0ece4]/50">
            Administra centros de eventos, tipos de eventos y servicios de banquetería.
          </p>
        </header>

        <nav className="mb-7 flex flex-wrap gap-2" aria-label="Catálogos">
          {Object.entries(catalogs).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setShowInactive(false);
                setNotice('');
                setError('');
                if (key !== selectedKey) setLoading(true);
                setSelectedKey(key);
              }}
              aria-pressed={selectedKey === key}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                selectedKey === key
                  ? 'border-[#c9a84c]/50 bg-[#c9a84c]/10 text-[#c9a84c]'
                  : 'border-white/10 bg-[#131622] text-[#f0ece4]/60 hover:border-white/20 hover:text-[#f0ece4]'
              }`}
            >
              <span className="mr-2" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label={`Resumen de ${catalog.plural}`}>
          {[
            { label: catalog.label, value: activeRecords.length + inactiveRecords.length, accent: false },
            { label: 'Activos', value: activeRecords.length, accent: true },
            { label: 'Desactivados', value: inactiveRecords.length, accent: false },
          ].map((stat) => (
            <article key={stat.label} className="rounded-xl border border-white/10 bg-[#131622] p-5">
              <p className="text-sm text-[#f0ece4]/50">{stat.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${stat.accent ? 'text-[#c9a84c]' : 'text-[#f0ece4]'}`}>
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        {error && (
          <p className="mb-5 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="mb-5 rounded-lg border border-[#c9a84c]/20 bg-[#c9a84c]/10 px-4 py-3 text-sm text-[#f0ece4]" role="status">
            {notice}
          </p>
        )}

        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#131622]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowInactive((current) => !current)}
                className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-[#f0ece4]/75 transition hover:border-[#c9a84c]/40 hover:text-[#c9a84c]"
              >
                Ver {showInactive ? 'activos' : 'desactivados'}
              </button>
              <span className="text-xs text-[#f0ece4]/40">
                {showInactive ? 'Elementos desactivados' : 'Elementos activos'}
              </span>
            </div>
            <button
              type="button"
              onClick={startCreate}
              className="rounded-lg bg-[#c9a84c] px-4 py-2.5 text-xs font-bold text-[#0a0c10] transition hover:bg-[#d8b85d]"
            >
              Agregar {catalog.singular} +
            </button>
          </div>

          {loading ? (
            <div className="px-5 py-14 text-center text-sm text-[#f0ece4]/50" role="status">
              Cargando {catalog.plural}…
            </div>
          ) : visibleRecords.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-medium text-[#f0ece4]/75">
                No hay {showInactive ? 'elementos desactivados' : 'elementos activos'} en {catalog.plural}.
              </p>
              {!showInactive && <p className="mt-2 text-sm text-[#f0ece4]/40">Puedes agregar uno con el botón superior.</p>}
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {visibleRecords.map((item) => (
                <li key={item.codigo} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#f0ece4]">{item.nombre}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                        item.activo
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-white/[0.07] text-[#f0ece4]/45'
                      }`}>
                        {item.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#f0ece4]/45">{getItemDetails(catalog, item)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label={`Modificar ${item.nombre}`}
                      className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#f0ece4]/70 transition hover:border-[#c9a84c]/40 hover:text-[#c9a84c]"
                    >
                      <span aria-hidden="true">✏️</span>
                      <span className="ml-2">Modificar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(item)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        item.activo
                          ? 'border-red-400/20 text-red-200 hover:bg-red-400/10'
                          : 'border-[#c9a84c]/25 text-[#c9a84c] hover:bg-[#c9a84c]/10'
                      }`}
                    >
                      {item.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {Object.keys(formValues).length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="presentation">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="catalog-form-title"
              className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#131622] p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a84c]">
                    {editingItem ? 'Modificar' : 'Nuevo registro'}
                  </p>
                  <h2 id="catalog-form-title" className="text-xl font-semibold">
                    {editingItem ? `Modificar ${catalog.singular}` : `Agregar ${catalog.singular}`}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Cerrar formulario"
                  className="rounded p-1 text-2xl leading-none text-[#f0ece4]/50 hover:text-[#c9a84c]"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                {catalog.fields.map((field) => (
                  <label key={field.name} className="block space-y-2 text-sm font-medium text-[#f0ece4]/75">
                    {field.label}{field.required && ' *'}
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formValues[field.name]}
                        onChange={(event) => setFormValues((values) => ({ ...values, [field.name]: event.target.value }))}
                        required={field.required}
                        rows={3}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2.5 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c]"
                      />
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formValues[field.name]}
                        onChange={(event) => setFormValues((values) => ({ ...values, [field.name]: event.target.value }))}
                        required={field.required}
                        min={field.type === 'number' ? '0' : undefined}
                        step={field.type === 'number' ? '1' : undefined}
                        maxLength={field.maxLength}
                        className="w-full rounded-lg border border-white/10 bg-[#0a0c10] px-3 py-2.5 text-sm text-[#f0ece4] outline-none transition placeholder:text-[#f0ece4]/30 focus:border-[#c9a84c]"
                      />
                    )}
                  </label>
                ))}
                {error && (
                  <p className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200" role="alert">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-[#f0ece4]/65 hover:text-[#f0ece4]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[#c9a84c] px-5 py-2.5 text-sm font-bold text-[#0a0c10] transition hover:bg-[#d8b85d] disabled:cursor-wait disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : editingItem ? 'Guardar cambios' : 'Agregar'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function getItemDetails(catalog, item) {
  if (catalog.collectionKey === 'centroEventos') {
    return [
      item.direccionExacta,
      item.capacidadPersonas != null ? `${item.capacidadPersonas} personas` : null,
      item.nombreDueno,
      item.telefonoDueno,
    ].filter(Boolean).join(' · ');
  }

  if (catalog.collectionKey === 'tipoEventos') {
    return [
      item.descripcion,
      item.tarifaHoraBaseReferencial != null
        ? `Tarifa/hora: ${formatCurrency(item.tarifaHoraBaseReferencial)}`
        : null,
    ].filter(Boolean).join(' · ');
  }

  return [
    item.descripcion,
    item.precioPersonaReferencial != null
      ? `Precio/persona: ${formatCurrency(item.precioPersonaReferencial)}`
      : null,
  ].filter(Boolean).join(' · ');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}