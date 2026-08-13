/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ArrowUpDown,
  Star,
  MapPin,
  Users,
  Wrench,
  Tent,
} from "lucide-react";
import type { EspacioResponse, EspacioEstado } from "@/lib/api/spaces";
import { ActivarEspacioButton } from "./ActivarEspacioButton";
import { InactivarEspacioButton } from "./InactivarEspacioButton";

// ── Mapeo transporte → dominio de vista ─────────────────────────────────────

function mapEspacio(e: EspacioResponse) {
  return {
    id: e.id,
    status: (e.estado ?? "revision") as EspacioEstado,
    image: e.imagenPortada,
    category: e.tipoEspacioNombre ?? "Espacio",
    title: e.titulo ?? "Sin nombre",
    rating: e.calificacion != null ? e.calificacion.toFixed(1) : null,
    ratingValue: e.calificacion,
    ubicacion: [e.referencia, e.ciudadNombre, e.provinciaNombre].filter(Boolean).join(" · ") || null,
    capacidad: e.maxCapacidad,
  };
}

type Space = ReturnType<typeof mapEspacio>;

type OrderKey = "recomendado" | "nombre-asc" | "nombre-desc" | "capacidad-desc" | "calificacion-desc";

const ORDER_LABELS: Record<OrderKey, string> = {
  recomendado: "Ordenar: Recomendado",
  "nombre-asc": "Nombre (A-Z)",
  "nombre-desc": "Nombre (Z-A)",
  "capacidad-desc": "Capacidad (mayor a menor)",
  "calificacion-desc": "Mejor calificados",
};

function sortSpaces(spaces: Space[], order: OrderKey): Space[] {
  if (order === "recomendado") return spaces;
  const sorted = [...spaces];
  switch (order) {
    case "nombre-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "nombre-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "capacidad-desc":
      return sorted.sort((a, b) => (b.capacidad ?? 0) - (a.capacidad ?? 0));
    case "calificacion-desc":
      return sorted.sort((a, b) => (b.ratingValue ?? 0) - (a.ratingValue ?? 0));
  }
}

// ── Componentes ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: EspacioEstado }) {
  const config = {
    activo:   { dot: "bg-success", label: "Activo",      text: "text-text-main", border: "" },
    inactivo: { dot: "bg-gray-400", label: "Inactivo",   text: "text-text-main", border: "border border-gray-200" },
    revision: { dot: "bg-warning",  label: "En Revisión", text: "text-warning",   border: "border border-warning/20" },
  }[status];

  return (
    <div className={`absolute left-3 top-3 flex items-center rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-md ${config.border}`}>
      <span className={`mr-1.5 h-2 w-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
    </div>
  );
}

function SpaceCard({ space }: { space: Space }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-surface shadow-soft transition-all duration-300 hover:shadow-card">
      {/* Imagen / cover */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        {space.image ? (
          <img
            src={space.image}
            alt={space.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tent className="h-12 w-12 text-gray-300" />
          </div>
        )}
        <StatusBadge status={space.status} />
        {/* Menú de opciones — comentado: sin funcionalidad definida (ver conversación /espacios). */}
        {/* <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-main shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </button> */}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-secondary">
            {space.category}
          </span>
          {space.rating && (
            <div className="flex items-center text-xs font-medium text-text-muted">
              <Star className="mr-1 h-3 w-3 fill-warning text-warning" />
              {space.rating}
            </div>
          )}
        </div>

        <h3 className="mb-2 modal-title leading-tight">{space.title}</h3>

        {space.status === "activo" && (
          <>
            {space.ubicacion && (
              <div className="mb-3 flex items-center text-sm text-text-muted">
                <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 opacity-70" />
                <span className="truncate">{space.ubicacion}</span>
              </div>
            )}
            <div className="mt-auto flex items-center gap-3 rounded-xl bg-background p-3">
              <Users className="h-4 w-4 flex-shrink-0 text-text-muted opacity-70" />
              <span className="text-sm text-text-muted">
                Capacidad: <span className="font-semibold text-text-main">{space.capacidad} personas</span>
              </span>
            </div>
          </>
        )}

        {space.status === "inactivo" && (
          <>
            <div className="mb-4 flex items-center text-sm font-medium text-error">
              <Wrench className="mr-1.5 h-4 w-4" />
              En Mantenimiento
            </div>
            <div className="mt-auto flex h-[68px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
              <p className="text-center text-xs font-medium text-text-muted">
                Reservas pausadas. Actívalo cuando esté listo.
              </p>
            </div>
          </>
        )}

        {space.status === "revision" && (
          <>
            <div className="mt-auto flex h-[68px] flex-col items-center justify-center rounded-xl bg-warning/5 p-3">
              <p className="text-center text-xs font-medium text-warning">
                Nuestro equipo está verificando tu espacio.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <Link
          href="/tarifas"
          className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
        >
          Ver tarifas
        </Link>
        <div className="flex items-center gap-4">
          {space.status === "activo" && <InactivarEspacioButton espacioId={space.id} />}
          {space.status === "inactivo" && <ActivarEspacioButton espacioId={space.id} />}
          <Link
            href={`/espacios/${space.id}/editar`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Editar
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
      <Tent className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="subtitle">No tienes espacios aún</h3>
      <p className="mt-1 text-sm text-text-muted">Crea tu primer espacio para empezar a recibir reservas.</p>
      <Link
        href="/espacios/crear"
        className="mt-6 flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover"
      >
        <Plus className="mr-2 h-4 w-4" />
        Crear Espacio
      </Link>
    </div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
      <Search className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="subtitle">Sin resultados</h3>
      <p className="mt-1 text-sm text-text-muted">Ningún espacio coincide con tu búsqueda o filtros.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-6 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

// ── Browser (cliente) ────────────────────────────────────────────────────────

export function EspaciosBrowser({ espacios }: { espacios: EspacioResponse[] }) {
  const spaces = useMemo(() => espacios.map(mapEspacio), [espacios]);

  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EspacioEstado | "">("");
  const [order, setOrder] = useState<OrderKey>("recomendado");

  const filteredSpaces = useMemo(() => {
    let result = spaces;

    if (estado) {
      result = result.filter((s) => s.status === estado);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (s) => s.title.toLowerCase().includes(q) || (s.ubicacion?.toLowerCase().includes(q) ?? false),
      );
    }

    return sortSpaces(result, order);
  }, [spaces, estado, search, order]);

  const clearFilters = () => {
    setSearch("");
    setEstado("");
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="page-title">Mis Espacios</h1>
          <p className="mt-1 max-w-lg text-sm text-text-muted">
            Administra la información, visibilidad y disponibilidad de todas tus áreas recreativas y salones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle de vista Grid/List — comentado: sin layout de lista implementado. */}
          {/* <div className="hidden rounded-lg border border-gray-200 bg-white p-1 sm:flex">
            <button className="rounded bg-background p-1.5 text-primary shadow-sm">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-text-muted transition-colors hover:text-primary">
              <List className="h-4 w-4" />
            </button>
          </div> */}
          <Link
            href="/espacios/crear"
            className="flex flex-1 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover md:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Espacio
          </Link>
        </div>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-surface p-4 shadow-soft xl:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-text-muted" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ubicación..."
            className="block w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 xl:pb-0">
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EspacioEstado | "")}
            className="min-w-[130px] cursor-pointer rounded-xl border border-gray-200 bg-surface px-4 py-2.5 pr-8 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-secondary/50"
          >
            <option value="">Estado: Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="revision">En Revisión</option>
          </select>

          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as OrderKey)}
              className="min-w-[190px] cursor-pointer rounded-xl border border-gray-200 bg-surface py-2.5 pl-9 pr-3 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-secondary/50"
            >
              {(Object.keys(ORDER_LABELS) as OrderKey[]).map((key) => (
                <option key={key} value={key}>
                  {ORDER_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de espacios */}
      <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {spaces.length === 0 ? (
          <EmptyState />
        ) : filteredSpaces.length === 0 ? (
          <NoResultsState onClear={clearFilters} />
        ) : (
          filteredSpaces.map((space) => <SpaceCard key={space.id} space={space} />)
        )}
      </div>
    </div>
  );
}
