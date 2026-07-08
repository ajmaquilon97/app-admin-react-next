import "server-only";

const API_BASE_URL = process.env.API_BASE_URL;

function apiUrl(path: string): string {
  if (!API_BASE_URL) throw new Error("API_BASE_URL no está configurada.");
  return `${API_BASE_URL}${path}`;
}

export type EstadoReserva = "confirmada" | "pendiente_pago" | "finalizada" | "cancelada";

export type ReservaResponse = {
  id: number;
  espacioId: number;
  espacioTitulo: string | null;
  usuarioId: string | null;
  usuarioNombre: string | null;
  usuarioCorreo: string | null;
  fechaInicio: string;
  fechaFin: string;
  totalHoras: number;
  estado: EstadoReserva | null;
  monto: number | null;
  fechaCreacion: string;
};

export type ReservasPaged = {
  content: ReservaResponse[] | null;
  totalElements: number;
  totalPages: number;
  number: number;
};

export type DashboardStats = {
  totalEspacios: number;
  reservasHoy: number;
  pendientesPago: number;
  ingresosMes: number;
  reservasPorMes: { mes: string; total: number }[] | null;
};

export async function getDashboardStats(accessToken: string): Promise<DashboardStats> {
  const url = apiUrl("/api/dashboard/stats");
  console.log("[dashboard-api] GET", url);
  console.log("[dashboard-api] token:", accessToken);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  console.log("[dashboard-api] GET /api/dashboard/stats →", res.status);
  if (!res.ok) throw new Error("No se pudieron cargar las estadísticas del dashboard.");
  return res.json() as Promise<DashboardStats>;
}

export async function getReservas(
  accessToken: string,
  params?: {
    fechaDesde?: string;
    fechaHasta?: string;
    estado?: EstadoReserva;
    page?: number;
    size?: number;
  },
): Promise<ReservasPaged> {
  const qs = new URLSearchParams();
  if (params?.fechaDesde) qs.set("fechaDesde", params.fechaDesde);
  if (params?.fechaHasta) qs.set("fechaHasta", params.fechaHasta);
  if (params?.estado) qs.set("estado", params.estado);
  if (params?.page !== undefined) qs.set("page", String(params.page));
  if (params?.size !== undefined) qs.set("size", String(params.size));

  const query = qs.toString();
  const url = apiUrl(`/api/reservas${query ? `?${query}` : ""}`);
  console.log("[dashboard-api] GET", url);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  console.log("[dashboard-api] GET /api/reservas →", res.status);
  if (!res.ok) throw new Error("No se pudieron cargar las reservas.");
  return res.json() as Promise<ReservasPaged>;
}
