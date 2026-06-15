"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Lightbulb,
  Car,
  Shirt,
  Users,
  Coffee,
  Plus,
  UploadCloud,
  MapPin,
  Crosshair,
  Trash2,
  Star,
} from "lucide-react";

const TOTAL_STEPS = 5;
const STEP_LABELS = ["General", "Ubicación", "Extras", "Imágenes", "Config"];

const FEATURES = [
  { id: "iluminacion", label: "Iluminación LED", icon: Lightbulb },
  { id: "parqueadero", label: "Parqueadero", icon: Car },
  { id: "vestidores", label: "Vestidores", icon: Shirt },
  { id: "graderios", label: "Graderíos", icon: Users },
  { id: "cafeteria", label: "Bar / Cafetería", icon: Coffee },
];

export function CrearEspacioWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(["iluminacion", "vestidores"])
  );
  const [approvalAuto, setApprovalAuto] = useState(true);
  const [publishNow, setPublishNow] = useState(false);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Topbar del wizard */}
      <header className="h-16 bg-surface border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/mis-espacios")}
            className="mr-4 text-text-muted hover:text-primary transition-colors flex items-center text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver
          </button>
          <div className="h-5 w-px bg-gray-200 mx-4 hidden md:block" />
          <h1 className="text-lg font-bold text-text-main hidden md:block">
            Registrar Nuevo Espacio
          </h1>
        </div>
        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-text-main hover:bg-gray-50 transition-colors">
          Guardar Borrador
        </button>
      </header>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto bg-background pb-24">
        <div className="w-full max-w-4xl mx-auto px-4 py-8">

          {/* Stepper */}
          <div className="mb-10">
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

          {/* Card del formulario */}
          <div className="bg-surface rounded-2xl shadow-card border border-gray-100 p-6 md:p-10">

            {/* PASO 1: Información General */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-main">Información General</h2>
                  <p className="text-sm text-text-muted mt-1">Comencemos con los detalles básicos para identificar tu espacio.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Nombre del espacio <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cancha Sintética Norte #1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  />
                  <p className="text-xs text-text-muted mt-1.5">Un nombre claro ayuda a los clientes a identificarlo rápidamente.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Categoría <span className="text-error">*</span>
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors cursor-pointer">
                    <option value="" disabled>Selecciona una categoría...</option>
                    <option value="canchas">Canchas Deportivas</option>
                    <option value="salones">Salones de Eventos</option>
                    <option value="piscinas">Piscinas</option>
                    <option value="camping">Áreas de Camping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Descripción Corta <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Cancha de fútbol 7 con césped de última generación."
                    maxLength={80}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  />
                  <p className="text-xs text-text-muted mt-1.5 text-right">0 / 80</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Descripción Completa</label>
                  <textarea
                    rows={4}
                    placeholder="Detalla todo lo que hace increíble a tu espacio..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors resize-none"
                  />
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
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Provincia</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors">
                      <option>Guayas</option>
                      <option>Pichincha</option>
                      <option>Manabí</option>
                      <option>Azuay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-main mb-1.5">Ciudad</label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary appearance-none bg-white transition-colors">
                      <option>Guayaquil</option>
                      <option>Samborondón</option>
                      <option>Durán</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Dirección Exacta</label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Francisco de Orellana y Calle 14"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Fijar en el Mapa</label>
                  <div className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden flex items-center justify-center group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80"
                      alt="Mapa"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-secondary/10" />
                    <div className="relative z-10 text-error flex flex-col items-center transform transition-transform group-hover:-translate-y-2">
                      <MapPin className="w-10 h-10 fill-white" />
                      <div className="w-3 h-1 bg-black/20 rounded-full mt-1 blur-[1px]" />
                    </div>
                    <button className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm border border-gray-100 flex items-center text-text-main hover:text-primary transition-colors">
                      <Crosshair className="w-4 h-4 mr-2 text-text-muted" /> Usar mi ubicación
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 3: Características */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-main">Características y Servicios</h2>
                  <p className="text-sm text-text-muted mt-1">Selecciona todo lo que incluye tu espacio.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {FEATURES.map(({ id, label, icon: Icon }) => {
                    const checked = selectedFeatures.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleFeature(id)}
                        className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all h-28 bg-white hover:border-secondary/50
                          ${checked ? "border-secondary bg-secondary/5" : "border-gray-200"}`}
                      >
                        <Icon className={`w-6 h-6 mb-2 transition-colors ${checked ? "text-secondary" : "text-text-muted"}`} />
                        <span className="text-sm font-medium text-text-main">{label}</span>
                      </button>
                    );
                  })}
                  <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all hover:border-primary hover:bg-gray-50 h-28 cursor-pointer">
                    <Plus className="w-6 h-6 mb-2 text-text-muted" />
                    <span className="text-sm font-medium text-text-muted">Agregar Otro</span>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 4: Imágenes */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-text-main">Galería de Fotos</h2>
                  <p className="text-sm text-text-muted mt-1">Sube fotos de alta calidad. Los espacios con buenas fotos reciben más reservas.</p>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-10 flex flex-col items-center justify-center text-center hover:border-secondary hover:bg-secondary/5 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-main">Arrastra y suelta tus fotos aquí</h3>
                  <p className="text-sm text-text-muted mt-2 mb-6">Formatos soportados: JPG, PNG, WEBP (Max. 5MB)</p>
                  <button className="bg-white border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-medium text-text-main shadow-sm hover:text-primary hover:border-gray-300 transition-colors">
                    Explorar archivos
                  </button>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text-main mb-4">Fotos subidas (2)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="relative rounded-xl overflow-hidden group h-32 border-2 border-secondary">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1574629810360-7efbb1925713?auto=format&fit=crop&w=300&q=80"
                        alt="Foto espacio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button className="w-8 h-8 bg-white/20 hover:bg-error rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded">PORTADA</div>
                    </div>
                    <div className="relative rounded-xl overflow-hidden group h-32 bg-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1518605368461-1e1e38ce8ba4?auto=format&fit=crop&w=300&q=80"
                        alt="Foto espacio"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button className="w-8 h-8 bg-white/20 hover:bg-white hover:text-primary rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
                          <Star className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 bg-white/20 hover:bg-error rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PASO 5: Configuración */}
            {step === 5 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-text-main">Configuración Inicial</h2>
                  <p className="text-sm text-text-muted mt-1">Establece las reglas de precio y operativas base.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">
                    Precio Base <span className="text-error">*</span>
                  </label>
                  <div className="relative max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-text-muted font-medium">$</span>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-8 pr-20 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors text-lg font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <select className="h-full py-0 pl-2 pr-4 border-transparent bg-transparent text-text-muted focus:ring-0 text-sm cursor-pointer">
                        <option>/ hora</option>
                        <option>/ día</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Capacidad Máxima</label>
                  <div className="relative max-w-sm">
                    <input
                      type="number"
                      defaultValue={14}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-text-muted text-sm">personas</span>
                    </div>
                  </div>
                </div>
                <hr className="border-gray-100" />
                <div className="space-y-6">
                  {[
                    {
                      label: "Aprobación Inmediata",
                      desc: "Las reservas se confirman automáticamente si hay disponibilidad.",
                      value: approvalAuto,
                      onChange: setApprovalAuto,
                    },
                    {
                      label: "Publicar inmediatamente",
                      desc: "El espacio estará visible en la app para los clientes.",
                      value: publishNow,
                      onChange: setPublishNow,
                    },
                  ].map(({ label, desc, value, onChange }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-main">{label}</h4>
                        <p className="text-xs text-text-muted mt-1">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20
                          ${value ? "bg-secondary" : "bg-gray-200"}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform
                            ${value ? "translate-x-5" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer de navegación fijo */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-soft z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className={`px-6 py-3 rounded-xl border border-gray-200 text-text-main font-medium hover:bg-gray-50 transition-colors
              ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
          >
            Anterior
          </button>

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              className="px-8 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center"
            >
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          ) : (
            <button className="px-8 py-3 rounded-xl bg-secondary text-white font-medium hover:bg-secondary/90 transition-colors shadow-sm flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" /> Finalizar y Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
