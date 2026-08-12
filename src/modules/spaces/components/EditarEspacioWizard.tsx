"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Info,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/definitions";
import type { LatLng } from "@/components/ui/MapPicker";
import type { TipoEspacio, EspacioResponse } from "@/lib/spaces-api";
import type { ProvinciaCatalogo } from "@/lib/catalogos-api";
import { updateEspacio } from "../actions/spaces";
import { getArchetype } from "@/lib/domain";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { GalleryUploader } from "@/components/ui/GalleryUploader";

const MapPicker = dynamic(
  () => import("@/components/ui/MapPicker").then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="w-full h-64 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" /> },
);

const TOTAL_STEPS = 3;
const STEP_LABELS = ["General", "Ubicación", "Configuración"];

function parseCoordsFromLink(link: string | null): LatLng | null {
  if (!link) return null;
  const m = link.match(/q=([^,&]+),([^&\s]+)/);
  if (!m) return null;
  const lat = parseFloat(m[1]!);
  const lng = parseFloat(m[2]!);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export function EditarEspacioWizard({
  user,
  espacio,
  tiposEspacios,
  provincias,
}: {
  user: SessionUser;
  espacio: EspacioResponse;
  tiposEspacios: TipoEspacio[];
  provincias: ProvinciaCatalogo[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<import("../actions/spaces").UpdateEspacioState>(undefined);
  const [pending, startTransition] = useTransition();

  // — Paso 1: General —
  const [titulo, setTitulo] = useState(espacio.titulo ?? "");
  const [tipoEspacioId, setTipoEspacioId] = useState<string>(
    espacio.tipoEspacioId.toString(),
  );
  const [descripcion, setDescripcion] = useState(espacio.descripcion ?? "");
  const [imagenPortada, setImagenPortada] = useState(espacio.imagenPortada ?? "");
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>(
    espacio.imagenesGaleria ?? [],
  );

  // — Paso 2: Ubicación —
  const [provinciaId, setProvinciaId] = useState<number | null>(
    espacio.provinciaId ?? provincias[0]?.id ?? null
  );
  const [ciudadId, setCiudadId] = useState<number | null>(espacio.ciudadId ?? null);
  const [referencia, setReferencia] = useState(espacio.referencia ?? "");
  const [coords, setCoords] = useState<LatLng | null>(
    espacio.latitud != null && espacio.longitud != null
      ? { lat: espacio.latitud, lng: espacio.longitud }
      : parseCoordsFromLink(espacio.linkUbicacion),
  );

  const linkUbicacion = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : (espacio.linkUbicacion ?? "");

  // — Paso 3: Configuración —
  const [validarAforo, setValidarAforo] = useState(espacio.validarAforo);
  const [maxCapacidad, setMaxCapacidad] = useState(String(espacio.maxCapacidad ?? 20));

  const tipoSeleccionado = tiposEspacios.find((t) => t.id.toString() === tipoEspacioId);
  const archetype = getArchetype(tipoSeleccionado);
  const esCupoCompartido = archetype === "cupo_compartido";
  // Piscinas (cupo compartido) requieren control de aforo siempre — el toggle se deshabilita.
  const effectiveValidarAforo = esCupoCompartido ? true : validarAforo;

  const provinciaSeleccionada = provincias.find((p) => p.id === provinciaId);
  const ciudadesDisponibles = provinciaSeleccionada?.ciudades ?? [];

  const handleProvinciaChange = (id: number) => {
    setProvinciaId(id);
    const ciudades = provincias.find((p) => p.id === id)?.ciudades ?? [];
    setCiudadId(ciudades[0]?.id ?? null);
  };

  const canAdvanceStep1 =
    titulo.trim().length >= 3 && !!tipoEspacioId && descripcion.trim().length >= 10;
  const canAdvanceStep2 = !!(provinciaId && ciudadId && referencia.trim().length >= 5);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const handleFinalSubmit = () => {
    const formData = new FormData();
    formData.set("propietarioId", user.id);
    formData.set("titulo", titulo);
    formData.set("descripcion", descripcion);
    formData.set("tipoEspacioId", tipoEspacioId);
    formData.set("imagenPortada", imagenPortada);
    formData.set("imagenesGaleria", JSON.stringify(imagenesGaleria));
    if (provinciaId != null) formData.set("provinciaId", String(provinciaId));
    if (ciudadId != null) formData.set("ciudadId", String(ciudadId));
    formData.set("referencia", referencia);
    formData.set("linkUbicacion", linkUbicacion);
    if (coords) {
      formData.set("latitud", String(coords.lat));
      formData.set("longitud", String(coords.lng));
    }
    formData.set("validarAforo", String(effectiveValidarAforo));
    formData.set("maxCapacidad", maxCapacidad);
    // PUT reemplaza el EspacioRequest completo — sin esto, editar el espacio
    // borraría el modo de confirmación configurado en Configuración > Reservas.
    formData.set("modoConfirmacion", espacio.modoConfirmacion ?? "");

    startTransition(async () => {
      const result = await updateEspacio(espacio.id, formData);
      if (result?.error) setState(result);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <header className="h-16 bg-surface border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => router.push("/espacios")}
            className="mr-4 text-text-muted hover:text-primary transition-colors flex items-center text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
          </button>
          <div className="h-5 w-px bg-gray-200 mx-4 hidden md:block" />
          <h1 className="modal-title hidden md:block">
            Editar Espacio — {espacio.titulo}
          </h1>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto bg-background pb-24">
        <div className="w-full max-w-3xl mx-auto px-4 py-8">

          {/* Stepper */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-secondary -z-10 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              {STEP_LABELS.map((label, i) => {
                const num = i + 1;
                const done = num < step;
                const active = num === step;
                return (
                  <div key={num} className="flex flex-col items-center relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ring-4 ring-background
                        ${done || active ? "bg-secondary text-white" : "bg-surface border-2 border-gray-200 text-text-muted"}`}
                    >
                      {done ? <Check className="w-5 h-5" /> : num}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center absolute -bottom-6 whitespace-nowrap
                        ${active ? "font-semibold text-text-main" : done ? "font-medium text-text-main" : "font-medium text-text-muted"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="bg-surface rounded-2xl shadow-card border border-gray-100 p-6 md:p-10 space-y-6">

              {/* Aviso: al guardar, el espacio vuelve a revisión */}
              <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5 text-sm text-warning">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  Al guardar los cambios, este espacio volverá a estado <strong>En Revisión</strong> hasta
                  que el equipo de soporte lo apruebe nuevamente.
                </span>
              </div>

              {/* Error global */}
              {state?.error != null && (
                <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* PASO 1: Información General */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="section-title">Información General</h2>
                    <p className="text-sm text-text-muted mt-1">Detalles básicos para identificar tu espacio.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Nombre del espacio <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ej. Cancha Sintética Norte #1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                    />
                    <p className="text-xs text-text-muted mt-1.5">Mínimo 3 caracteres.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Tipo de espacio <span className="text-error">*</span>
                    </label>
                    <select
                      value={tipoEspacioId}
                      onChange={(e) => setTipoEspacioId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors cursor-pointer"
                    >
                      {tiposEspacios.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre ?? t.codigo ?? `Tipo ${t.id}`}
                        </option>
                      ))}
                    </select>
                    {tipoSeleccionado && (
                      <p className="text-xs text-text-muted mt-1.5">
                        {esCupoCompartido
                          ? "Este tipo se reserva por cupo — los usuarios compran entradas y comparten el espacio."
                          : "Este tipo se reserva por franja horaria completa."}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Imagen de portada
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                      Recomendado: 16:9, mínimo 800×450 px.
                    </p>
                    <ImageUploader value={imagenPortada} onChange={setImagenPortada} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Imágenes adicionales
                      <span className="ml-2 text-xs font-normal text-text-muted">Hasta 7 imágenes</span>
                    </label>
                    <GalleryUploader value={imagenesGaleria} onChange={setImagenesGaleria} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Descripción <span className="text-error">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Detalla todo lo que hace especial a tu espacio..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors resize-none"
                    />
                    <p className="text-xs text-text-muted mt-1.5">Mínimo 10 caracteres.</p>
                  </div>
                </div>
              )}

              {/* PASO 2: Ubicación */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="section-title">Ubicación</h2>
                    <p className="text-sm text-text-muted mt-1">¿Dónde se encuentra exactamente este espacio?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-text-main mb-1.5">
                        Provincia <span className="text-error">*</span>
                      </label>
                      <select
                        value={provinciaId ?? ""}
                        onChange={(e) => handleProvinciaChange(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors"
                      >
                        {provincias.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-main mb-1.5">
                        Ciudad <span className="text-error">*</span>
                      </label>
                      <select
                        value={ciudadId ?? ""}
                        onChange={(e) => setCiudadId(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors"
                      >
                        {ciudadesDisponibles.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Dirección / Referencia <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={referencia}
                      onChange={(e) => setReferencia(e.target.value)}
                      placeholder="Ej. Av. Francisco de Orellana y Calle 14"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Ubicación en el mapa
                    </label>
                    <p className="text-xs text-text-muted mb-2">
                      Haz clic en el mapa para actualizar la ubicación exacta.
                    </p>
                    <MapPicker value={coords} onChange={setCoords} />
                    {coords ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                        <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                        <span>Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}</span>
                        <a
                          href={linkUbicacion}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-secondary hover:underline font-medium"
                        >
                          Ver en Google Maps ↗
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted italic">
                        Ninguna ubicación seleccionada.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 3: Configuración */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="section-title">Configuración</h2>
                    <p className="text-sm text-text-muted mt-1">Capacidad y reglas operativas.</p>
                  </div>

                  {/* Capacidad */}
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      {esCupoCompartido ? "Aforo máximo simultáneo" : "Capacidad máxima"}
                    </label>
                    <div className="relative max-w-xs">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="number"
                        min={1}
                        value={maxCapacidad}
                        onChange={(e) => setMaxCapacidad(e.target.value)}
                        className="w-full pl-10 pr-20 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">personas</span>
                    </div>
                    {esCupoCompartido && (
                      <p className="text-xs text-text-muted mt-1.5">
                        Cantidad máxima de personas que pueden estar dentro del espacio al mismo tiempo. Se usará para controlar la venta de entradas por día.
                      </p>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* Validar aforo */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-text-main">Validar aforo</h4>
                      <p className="text-xs text-text-muted mt-1">
                        {esCupoCompartido
                          ? "El control de aforo es obligatorio para espacios de cupo compartido."
                          : "Controla que el número de asistentes no supere la capacidad máxima."}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={esCupoCompartido}
                      onClick={() => setValidarAforo((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-70
                        ${effectiveValidarAforo ? "bg-secondary" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                          ${effectiveValidarAforo ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </button>
                  </div>

                  {/* Resumen */}
                  <div className="bg-background rounded-2xl border border-gray-200 p-5 space-y-3 text-sm">
                    <p className="font-semibold text-text-main">Resumen de cambios</p>
                    <div className="grid grid-cols-2 gap-y-2 text-text-muted">
                      <span className="font-medium text-text-main">Nombre</span>
                      <span>{titulo}</span>
                      <span className="font-medium text-text-main">Tipo</span>
                      <span>{tipoSeleccionado?.nombre ?? "—"}</span>
                      <span className="font-medium text-text-main">Ubicación</span>
                      <span>
                        {ciudadesDisponibles.find((c) => c.id === ciudadId)?.nombre ?? "—"},{" "}
                        {provinciaSeleccionada?.nombre ?? "—"}
                      </span>
                      <span className="font-medium text-text-main">
                        {esCupoCompartido ? "Aforo simultáneo" : "Capacidad"}
                      </span>
                      <span>{maxCapacidad} personas</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer fijo */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-soft z-30">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className={`px-6 py-3 rounded-xl border border-gray-200 text-text-main font-medium hover:bg-gray-50 transition-colors
                    ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
                >
                  Anterior
                </button>

                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    disabled={
                      (step === 1 && !canAdvanceStep1) ||
                      (step === 2 && !canAdvanceStep2)
                    }
                    onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
                    className="px-8 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={pending}
                    className="px-8 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/90 transition-colors shadow-sm flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {pending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Guardar cambios</>
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
