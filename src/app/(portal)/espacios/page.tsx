/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  MoreHorizontal,
  Star,
  MapPin,
  Users,
  Wrench,
  Info,
  Tent,
} from "lucide-react";
import { verifySession } from "@/lib/dal";
import { getSessionTokens } from "@/lib/session";
import { getMisEspacios, type EspacioResponse, type EspacioEstado } from "@/lib/spaces-api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrecio(porHora: number | null, porDia: number | null): { texto: string; sufijo: string } | null {
  if (porHora != null) return { texto: `$${porHora.toFixed(2)}`, sufijo: "/hora" };
  if (porDia != null) return { texto: `$${porDia.toFixed(2)}`, sufijo: "/día" };
  return null;
}

function mapEspacio(e: EspacioResponse) {
  return {
    id: e.id,
    status: (e.estado ?? "revision") as EspacioEstado,
    image: e.imagenPortada,
    category: e.tipoEspacioNombre ?? "Espacio",
    title: e.titulo ?? "Sin nombre",
    rating: e.calificacion != null ? e.calificacion.toFixed(1) : null,
    precio: formatPrecio(e.precioPorHora, e.precioPorDia),
    ubicacion: [e.referencia, e.ciudad, e.provincia].filter(Boolean).join(" · ") || null,
    capacidad: e.maxCapacidad,
  };
}

type Space = ReturnType<typeof mapEspacio>;

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
  const ctaLabel = space.status === "activo" ? "Administrar" : space.status === "inactivo" ? "Activar" : "Completar";

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
        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-main shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </button>
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

        <h3 className="mb-2 text-lg font-bold leading-tight text-text-main">{space.title}</h3>

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
            <div className="mb-4 flex items-center text-sm text-text-muted">
              <Info className="mr-1.5 h-4 w-4 opacity-70" />
              Faltan documentos
            </div>
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
        {space.precio ? (
          <span className={`text-sm font-semibold ${space.status === "inactivo" ? "text-text-muted line-through" : "text-text-main"}`}>
            {space.precio.texto}
            <span className="text-xs font-normal text-text-muted">{space.precio.sufijo}</span>
          </span>
        ) : (
          <span className="text-sm font-semibold text-text-muted">Por definir</span>
        )}
        <Link
          href={`/espacios/${space.id}/editar`}
          className="text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-16 text-center">
      <Tent className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="text-lg font-semibold text-text-main">No tienes espacios aún</h3>
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

// ── Página ────────────────────────────────────────────────────────────────────

export default async function MisEspaciosPage() {
  await verifySession();
  const tokens = await getSessionTokens();

  let spaces: Space[] = [];
  if (tokens) {
    try {
      const raw = await getMisEspacios(tokens.accessToken);
      console.log("[espacios] raw de mis-espacios:", JSON.stringify(raw.map((e) => ({ id: e.id, titulo: e.titulo, estado: e.estado })), null, 2));
      spaces = raw.map(mapEspacio);
      console.log("[espacios] spaces mapeados:", JSON.stringify(spaces.map((s) => ({ id: s.id, title: s.title, status: s.status })), null, 2));
    } catch (err) {
      console.error("[espacios] error al cargar mis-espacios:", err);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">Mis Espacios</h1>
          <p className="mt-1 max-w-lg text-sm text-text-muted">
            Administra la información, visibilidad y disponibilidad de todas tus áreas recreativas y salones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg border border-gray-200 bg-white p-1 sm:flex">
            <button className="rounded bg-background p-1.5 text-primary shadow-sm">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-text-muted transition-colors hover:text-primary">
              <List className="h-4 w-4" />
            </button>
          </div>
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
            placeholder="Buscar por nombre o ubicación..."
            className="block w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
        </div>

        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1 xl:pb-0">
          <select className="min-w-[130px] cursor-pointer rounded-xl border border-gray-200 bg-surface px-4 py-2.5 pr-8 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-secondary/50">
            <option value="">Estado: Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
            <option value="revision">En Revisión</option>
          </select>
          <button className="flex items-center justify-center whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-gray-50">
            <ArrowUpDown className="mr-2 h-4 w-4 text-text-muted" /> Ordenar
          </button>
        </div>
      </div>

      {/* Grid de espacios */}
      <div className="grid grid-cols-1 gap-6 pb-10 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {spaces.length > 0
          ? spaces.map((space) => <SpaceCard key={space.id} space={space} />)
          : <EmptyState />}
      </div>
    </div>
  );
}
