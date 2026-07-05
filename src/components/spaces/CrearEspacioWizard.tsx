"use client";

import { useState, useActionState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/definitions";
import type { LatLng } from "@/components/ui/MapPicker";

// Leaflet necesita el DOM — se carga solo en el cliente
const MapPicker = dynamic(
  () => import("@/components/ui/MapPicker").then((m) => m.MapPicker),
  { ssr: false, loading: () => <div className="w-full h-64 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" /> }
);
import type { TipoEspacio } from "@/lib/spaces-api";
import { createEspacio } from "@/actions/spaces";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { GalleryUploader } from "@/components/ui/GalleryUploader";

const TOTAL_STEPS = 3;
const STEP_LABELS = ["General", "Ubicación", "Configuración"];

const REGIONES_ECUADOR: { nombre: string; ciudades: string[] }[] = [
  { nombre: "Guayas",    ciudades: ["Guayaquil", "Samborondón", "Durán", "Daule", "Milagro"] },
  { nombre: "Pichincha", ciudades: ["Quito", "Sangolquí", "Cayambe", "Machachi"] },
  { nombre: "Manabí",    ciudades: ["Manta", "Portoviejo", "Chone", "Bahía de Caráquez"] },
  { nombre: "Azuay",     ciudades: ["Cuenca", "Gualaceo", "Paute"] },
];

export function CrearEspacioWizard({
  user,
  tiposEspacios,
}: {
  user: SessionUser;
  tiposEspacios: TipoEspacio[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, action, pending] = useActionState(createEspacio, undefined);

  // — Paso 1: General —
  const [titulo, setTitulo] = useState("");
  const [tipoEspacioId, setTipoEspacioId] = useState<string>(
    tiposEspacios[0]?.id.toString() ?? ""
  );
  const [descripcion, setDescripcion] = useState("");
  const [imagenPortada, setImagenPortada] = useState("");
  const [imagenesGaleria, setImagenesGaleria] = useState<string[]>([]);

  // — Paso 2: Ubicación —
  const [provincia, setProvincia] = useState("Guayas");
  const [ciudad, setCiudad] = useState("Guayaquil");
  const [referencia, setReferencia] = useState("");
  const [coords, setCoords] = useState<LatLng | null>(null);

  // Genera el link de Google Maps desde las coordenadas seleccionadas
  const linkUbicacion = coords
    ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
    : "";

  // — Paso 3: Configuración —
  const [validarAforo, setValidarAforo] = useState(false);
  const [maxCapacidad, setMaxCapacidad] = useState("20");

  const ciudadesDisponibles =
    REGIONES_ECUADOR.find((r) => r.nombre === provincia)?.ciudades ?? [];

  const handleProvinciaChange = (p: string) => {
    setProvincia(p);
    const ciudades = REGIONES_ECUADOR.find((r) => r.nombre === p)?.ciudades ?? [];
    setCiudad(ciudades[0] ?? "");
  };

  const canAdvanceStep1 = titulo.trim().length >= 3 && tipoEspacioId && descripcion.trim().length >= 10;
  const canAdvanceStep2 = !!(provincia && ciudad && referencia.trim().length >= 5);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

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
          <h1 className="text-lg font-bold text-text-main hidden md:block">
            Registrar Nuevo Espacio
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

          {/* Form — todos los campos siempre en el DOM para que el FormData los capture */}
          <form action={action}>
            {/* Campos ocultos globales */}
            <input type="hidden" name="propietarioId" value={user.id} />
            <input type="hidden" name="titulo" value={titulo} />
            <input type="hidden" name="descripcion" value={descripcion} />
            <input type="hidden" name="tipoEspacioId" value={tipoEspacioId} />
            <input type="hidden" name="imagenPortada" value={imagenPortada} />
            <input type="hidden" name="imagenesGaleria" value={JSON.stringify(imagenesGaleria)} />
            <input type="hidden" name="provincia" value={provincia} />
            <input type="hidden" name="ciudad" value={ciudad} />
            <input type="hidden" name="referencia" value={referencia} />
            <input type="hidden" name="linkUbicacion" value={linkUbicacion} />
            <input type="hidden" name="validarAforo" value={String(validarAforo)} />
            <input type="hidden" name="maxCapacidad" value={maxCapacidad} />

            <div className="bg-surface rounded-2xl shadow-card border border-gray-100 p-6 md:p-10 space-y-6">

              {/* Error global */}
              {state?.error && (
                <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{state.error}</span>
                </div>
              )}

              {/* PASO 1: Información General */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-text-main">Información General</h2>
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
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Imagen de portada
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                      Esta imagen aparecerá en la tarjeta del espacio. Recomendado: 16:9, mínimo 800×450 px.
                    </p>
                    <ImageUploader value={imagenPortada} onChange={setImagenPortada} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Imágenes adicionales
                      <span className="ml-2 text-xs font-normal text-text-muted">Hasta 7 imágenes</span>
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                      Muestra distintos ángulos y detalles del espacio. Puedes seleccionar varias a la vez.
                    </p>
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
                    <h2 className="text-2xl font-bold text-text-main">Ubicación</h2>
                    <p className="text-sm text-text-muted mt-1">¿Dónde se encuentra exactamente este espacio?</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-text-main mb-1.5">
                        Provincia <span className="text-error">*</span>
                      </label>
                      <select
                        value={provincia}
                        onChange={(e) => handleProvinciaChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors"
                      >
                        {REGIONES_ECUADOR.map((r) => (
                          <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-main mb-1.5">
                        Ciudad <span className="text-error">*</span>
                      </label>
                      <select
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors"
                      >
                        {ciudadesDisponibles.map((c) => (
                          <option key={c} value={c}>{c}</option>
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
                      placeholder="Ej. Av. Francisco de Orellana y Calle 14, frente al parque"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Ubicación en el mapa
                    </label>
                    <p className="text-xs text-text-muted mb-2">
                      Haz clic en el mapa para fijar la ubicación exacta del espacio.
                    </p>
                    <MapPicker value={coords} onChange={setCoords} />
                    {coords ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                        <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                        <span>
                          Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
                        </span>
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
                        Ninguna ubicación seleccionada aún.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* PASO 3: Configuración */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-text-main">Configuración</h2>
                    <p className="text-sm text-text-muted mt-1">Establece la capacidad y las reglas operativas.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">
                      Capacidad máxima
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
                  </div>

                  <hr className="border-gray-100" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-text-main">Validar aforo</h4>
                      <p className="text-xs text-text-muted mt-1">
                        Controla que el número de asistentes no supere la capacidad máxima.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setValidarAforo((v) => !v)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20
                        ${validarAforo ? "bg-secondary" : "bg-gray-200"}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                          ${validarAforo ? "translate-x-5" : "translate-x-0.5"}`}
                      />
                    </button>
                  </div>

                  {/* Resumen antes de enviar */}
                  <div className="bg-background rounded-2xl border border-gray-200 p-5 space-y-3 text-sm">
                    <p className="font-semibold text-text-main">Resumen del espacio</p>
                    <div className="grid grid-cols-2 gap-y-2 text-text-muted">
                      <span className="font-medium text-text-main">Nombre</span>
                      <span>{titulo}</span>
                      <span className="font-medium text-text-main">Tipo</span>
                      <span>{tiposEspacios.find((t) => t.id.toString() === tipoEspacioId)?.nombre ?? "—"}</span>
                      <span className="font-medium text-text-main">Ubicación</span>
                      <span>{ciudad}, {provincia}</span>
                      <span className="font-medium text-text-main">Capacidad</span>
                      <span>{maxCapacidad} personas</span>
                      <span className="font-medium text-text-main">Imagen portada</span>
                      <span>{imagenPortada ? "✓ Cargada" : "Sin imagen"}</span>
                      <span className="font-medium text-text-main">Galería</span>
                      <span>{imagenesGaleria.length > 0 ? `${imagenesGaleria.length} imagen${imagenesGaleria.length > 1 ? "es" : ""}` : "Sin imágenes"}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer de navegación fijo */}
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
                    type="submit"
                    disabled={pending}
                    className="px-8 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/90 transition-colors shadow-sm flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {pending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-2" /> Finalizar y Guardar</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
