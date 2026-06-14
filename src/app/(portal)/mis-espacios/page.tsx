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
  CalendarClock,
  Wrench,
  Info,
  Tent,
} from "lucide-react";

type Space = {
  id: number;
  status: "activo" | "inactivo" | "revision";
  image?: string;
  category: string;
  categoryColor: string;
  title: string;
  rating?: string;
  price: string;
  cta: string;
} & (
  | {
      status: "activo";
      meta: { icon: "map" | "users"; text: string };
      occupancyLabel: string;
      occupancy: number;
      occupancyColor: string;
      nextDate: string;
    }
  | { status: "inactivo"; subtitle: string; note: string }
  | { status: "revision"; subtitle: string; note: string }
);

const SPACES: Space[] = [
  {
    id: 1,
    status: "activo",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbb1925713?auto=format&fit=crop&w=600&q=80",
    category: "Canchas Deportivas",
    categoryColor: "text-secondary",
    title: "Cancha Sintética #1 (Fútbol 7)",
    rating: "4.8",
    meta: { icon: "map", text: "Sede Principal Norte" },
    nextDate: "Hoy, 18:00",
    occupancyLabel: "Ocupación Hoy",
    occupancy: 75,
    occupancyColor: "bg-secondary",
    price: "$35.00",
    cta: "Administrar",
  },
  {
    id: 2,
    status: "activo",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80",
    category: "Salones de Eventos",
    categoryColor: "text-secondary",
    title: 'Salón Imperial "El Lago"',
    rating: "5.0",
    meta: { icon: "users", text: "Capacidad: 250 pers." },
    nextDate: "Sab, 22 Oct",
    occupancyLabel: "Ocupación Mes",
    occupancy: 40,
    occupancyColor: "bg-primary",
    price: "$450.00",
    cta: "Administrar",
  },
  {
    id: 3,
    status: "inactivo",
    image:
      "https://images.unsplash.com/photo-1576013551627-11dc71bc0bf9?auto=format&fit=crop&w=600&q=80",
    category: "Piscinas",
    categoryColor: "text-text-muted",
    title: "Piscina Familiar Semiolímpica",
    subtitle: "En Mantenimiento",
    note: "Reservas pausadas hasta 25 de Octubre",
    price: "$15.00",
    cta: "Activar",
  },
  {
    id: 4,
    status: "revision",
    category: "Áreas de Camping",
    categoryColor: "text-warning",
    title: "Parcela A - Vista al Río",
    subtitle: "Faltan documentos",
    note: "Nuestro equipo está verificando tu espacio.",
    price: "Por definir",
    cta: "Completar",
  },
];

function StatusBadge({ status }: { status: Space["status"] }) {
  const config = {
    activo: { dot: "bg-success", label: "Activo", text: "text-text-main", border: "" },
    inactivo: { dot: "bg-gray-400", label: "Inactivo", text: "text-text-main", border: "border border-gray-200" },
    revision: { dot: "bg-warning", label: "En Revisión", text: "text-warning", border: "border border-warning/20" },
  }[status];

  return (
    <div
      className={`absolute left-3 top-3 flex items-center rounded-full bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-md ${config.border}`}
    >
      <span className={`mr-1.5 h-2 w-2 rounded-full ${config.dot}`} />
      <span className={`text-xs font-semibold ${config.text}`}>
        {config.label}
      </span>
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
        <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-main shadow-sm backdrop-blur-md transition-colors hover:bg-white hover:text-primary">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-center justify-between">
          <span
            className={`text-xs font-medium uppercase tracking-wider ${space.categoryColor}`}
          >
            {space.category}
          </span>
          {space.rating && (
            <div className="flex items-center text-xs font-medium text-text-muted">
              <Star className="mr-1 h-3 w-3 fill-warning text-warning" />{" "}
              {space.rating}
            </div>
          )}
        </div>

        <h3 className="mb-2 text-lg font-bold leading-tight text-text-main">
          {space.title}
        </h3>

        {space.status === "activo" && (
          <>
            <div className="mb-4 flex items-center text-sm text-text-muted">
              {space.meta.icon === "map" ? (
                <MapPin className="mr-1.5 h-4 w-4 opacity-70" />
              ) : (
                <Users className="mr-1.5 h-4 w-4 opacity-70" />
              )}
              {space.meta.text}
            </div>
            <div className="mt-auto flex flex-col gap-2 rounded-xl bg-background p-3">
              <div className="flex items-center text-xs font-medium text-text-muted">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Próx: {space.nextDate}
              </div>
              <div className="w-full">
                <div className="mb-1 flex justify-between text-[10px] font-semibold text-text-muted">
                  <span>{space.occupancyLabel}</span>
                  <span className="text-primary">{space.occupancy}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-1.5 rounded-full ${space.occupancyColor}`}
                    style={{ width: `${space.occupancy}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {space.status === "inactivo" && (
          <>
            <div className="mb-4 flex items-center text-sm font-medium text-error">
              <Wrench className="mr-1.5 h-4 w-4" />
              {space.subtitle}
            </div>
            <div className="mt-auto flex h-[68px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3">
              <p className="text-center text-xs font-medium text-text-muted">
                {space.note}
              </p>
            </div>
          </>
        )}

        {space.status === "revision" && (
          <>
            <div className="mb-4 flex items-center text-sm text-text-muted">
              <Info className="mr-1.5 h-4 w-4 opacity-70" />
              {space.subtitle}
            </div>
            <div className="mt-auto flex h-[68px] flex-col items-center justify-center rounded-xl bg-warning/5 p-3">
              <p className="text-center text-xs font-medium text-warning">
                {space.note}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-5 py-3">
        <span
          className={`text-sm font-semibold ${
            space.status === "inactivo"
              ? "text-text-muted line-through"
              : space.status === "revision"
                ? "text-text-muted"
                : "text-text-main"
          }`}
        >
          {space.price}
          {space.status === "activo" && (
            <span className="text-xs font-normal text-text-muted">
              {space.id === 2 ? " /día" : " /hora"}
            </span>
          )}
        </span>
        <button className="text-sm font-medium text-primary transition-colors hover:text-primary-hover">
          {space.cta}
        </button>
      </div>
    </div>
  );
}

export default function MisEspaciosPage() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            Mis Espacios
          </h1>
          <p className="mt-1 max-w-lg text-sm text-text-muted">
            Administra la información, visibilidad y disponibilidad de todas tus
            áreas recreativas y salones.
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
            href="/mis-espacios/crear"
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
          <select className="min-w-[140px] cursor-pointer rounded-xl border border-gray-200 bg-surface px-4 py-2.5 pr-8 text-sm font-medium text-text-main focus:outline-none focus:ring-2 focus:ring-secondary/50">
            <option value="">Categoría: Todas</option>
            <option value="deportes">Canchas Deportivas</option>
            <option value="eventos">Salones de Eventos</option>
            <option value="piscinas">Piscinas</option>
          </select>
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
        {SPACES.map((space) => (
          <SpaceCard key={space.id} space={space} />
        ))}
      </div>
    </div>
  );
}
