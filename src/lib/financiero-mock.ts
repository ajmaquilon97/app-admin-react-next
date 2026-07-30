import type {
  FinancialSummary,
  FinancialFilters,
  IncomeEntry,
  Invoice,
  InvoiceStatus,
  Reversal,
  ReversalType,
  RequestReversalPayload,
  PagedResponse,
  SpaceOption,
} from "@/modules/financiero/types";

export const FIN_SPACES: SpaceOption[] = [
  { id: "1", nombre: "Cancha Sintética 1" },
  { id: "2", nombre: "Cancha Múltiple" },
  { id: "3", nombre: "Piscina Olímpica" },
  { id: "4", nombre: "Salón de Eventos VIP" },
  { id: "5", nombre: "Área de Camping" },
];

const CLIENTS = [
  { name: "Carlos Mendoza", id: "1712345678" },
  { name: "Ana Torres", id: "0923456789" },
  { name: "Equipo Tech S.A.S.", id: "1791234567001" },
  { name: "Familia Ruiz", id: "0102030405" },
  { name: "Diego Paredes", id: "1798765432" },
  { name: "Consumidor Final", id: "9999999999999" },
];

const PAYMENT_METHODS = ["Tarjeta de crédito", "Transferencia", "Efectivo"];

function simpleHash(s: string): number {
  let h = 1;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number) {
  let s = seed;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 4294967295;
  };
}

function pad(n: number, len: number) {
  return String(n).padStart(len, "0");
}

function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const IVA_RATE = 0.15;

interface FinancialRecord {
  bookingId: string;
  bookingCode: string;
  client: (typeof CLIENTS)[number];
  spaceId: string;
  spaceName: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  hasInvoice: boolean;
  invoiceStatus: InvoiceStatus | null;
  motivoRechazo: string | null;
  hasReversal: boolean;
  reversalType: ReversalType | null;
}

const INVOICE_STATUS_WEIGHTS: [InvoiceStatus, number][] = [
  ["Autorizada", 0.72],
  ["Procesando", 0.06],
  ["Recibida", 0.05],
  ["Devuelta", 0.06],
  ["No autorizada", 0.06],
  ["Error", 0.05],
];

function pickInvoiceStatus(r: number): InvoiceStatus {
  let acc = 0;
  for (const [status, weight] of INVOICE_STATUS_WEIGHTS) {
    acc += weight;
    if (r <= acc) return status;
  }
  return "Autorizada";
}

function generateRecords(): FinancialRecord[] {
  const rand = seededRandom(simpleHash("financiero-seed-v1"));
  const records: FinancialRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 48; i++) {
    const daysAgo = Math.floor(rand() * 60);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);

    const client = CLIENTS[Math.floor(rand() * CLIENTS.length)]!;
    const space = FIN_SPACES[Math.floor(rand() * FIN_SPACES.length)]!;
    const amount = Math.round((20 + rand() * 180) * 100) / 100;
    const hasInvoice = rand() > 0.15; // 85% de las reservas pagadas ya se facturaron
    const invoiceStatus = hasInvoice ? pickInvoiceStatus(rand()) : null;
    const hasReversal = invoiceStatus === "Autorizada" && rand() > 0.88;
    const reversalType: ReversalType | null = hasReversal
      ? rand() > 0.4
        ? "NotaCredito"
        : "ReversoPago"
      : null;

    let motivoRechazo: string | null = null;
    if (invoiceStatus === "Devuelta") motivoRechazo = "ARCHIVO NO CUMPLE ESTRUCTURA XML";
    if (invoiceStatus === "No autorizada")
      motivoRechazo = "ERROR EN DIFERENCIAS: la tarifa del impuesto no coincide con la parametrizada";
    if (invoiceStatus === "Error") motivoRechazo = "Timeout al conectar con el servicio del SRI";

    records.push({
      bookingId: `bk-${i + 1}`,
      bookingCode: `RES-${pad(1000 + i, 4)}`,
      client,
      spaceId: space.id,
      spaceName: space.nombre,
      amount,
      paymentMethod: PAYMENT_METHODS[Math.floor(rand() * PAYMENT_METHODS.length)]!,
      paymentDate: formatISODate(date),
      hasInvoice,
      invoiceStatus,
      motivoRechazo,
      hasReversal,
      reversalType,
    });
  }

  return records.sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
}

const RECORDS = generateRecords();

function accessKeyFor(bookingId: string): string {
  const h = simpleHash(bookingId).toString().padStart(9, "0").slice(0, 9);
  return `2807202601120516292600110010010${h}${h.slice(0, 5)}`.slice(0, 49);
}

function toIncomeEntry(r: FinancialRecord, idx: number): IncomeEntry {
  return {
    id: `inc-${idx}`,
    bookingId: r.bookingId,
    bookingCode: r.bookingCode,
    clientName: r.client.name,
    spaceId: r.spaceId,
    spaceName: r.spaceName,
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    paymentDate: r.paymentDate,
    invoiceStatus: r.invoiceStatus,
    invoiceId: r.hasInvoice ? `fac-${idx}` : null,
  };
}

function toInvoice(r: FinancialRecord, idx: number): Invoice | null {
  if (!r.hasInvoice || !r.invoiceStatus) return null;
  const subtotal = Math.round((r.amount / (1 + IVA_RATE)) * 100) / 100;
  const iva = Math.round((r.amount - subtotal) * 100) / 100;
  const autorizada = r.invoiceStatus === "Autorizada";
  return {
    id: `fac-${idx}`,
    bookingId: r.bookingId,
    bookingCode: r.bookingCode,
    numeroComprobante: `001-001-${pad(idx + 1, 9)}`,
    claveAcceso: accessKeyFor(r.bookingId),
    clientName: r.client.name,
    clientIdentification: r.client.id,
    fechaEmision: r.paymentDate,
    fechaAutorizacion: autorizada ? r.paymentDate : null,
    estado: r.invoiceStatus,
    subtotal,
    iva,
    total: r.amount,
    ridePdfUrl: autorizada ? `/mock/facturas/${r.bookingCode}.pdf` : null,
    motivoRechazo: r.motivoRechazo,
  };
}

function toReversal(r: FinancialRecord, idx: number): Reversal | null {
  if (!r.hasReversal || !r.reversalType) return null;
  const estados: ReversalStatusPick[] = ["Completado", "Autorizado", "Procesando", "Rechazado"];
  const estado = estados[idx % estados.length]!;
  return {
    id: `rev-${idx}`,
    tipo: r.reversalType,
    facturaId: r.reversalType === "NotaCredito" ? `fac-${idx}` : null,
    bookingId: r.bookingId,
    bookingCode: r.bookingCode,
    clientName: r.client.name,
    monto: r.amount,
    motivo: r.reversalType === "NotaCredito" ? "Anulación por cancelación de reserva" : "Reembolso al cliente por cancelación",
    estado,
    fechaSolicitud: r.paymentDate,
    fechaResolucion: estado === "Procesando" ? null : r.paymentDate,
    claveAcceso: r.reversalType === "NotaCredito" && estado !== "Rechazado" ? accessKeyFor(`${r.bookingId}-nc`) : null,
  };
}

type ReversalStatusPick = "Procesando" | "Autorizado" | "Rechazado" | "Completado";

const INCOME = RECORDS.map(toIncomeEntry);
const INVOICES = RECORDS.map(toInvoice).filter((v): v is Invoice => v !== null);
const REVERSALS = RECORDS.map(toReversal).filter((v): v is Reversal => v !== null);

function paginate<T>(items: T[], page = 1, pageSize = 10): PagedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

function inRange(dateStr: string, from?: string, to?: string) {
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getFinancialSummary(): Promise<FinancialSummary> {
  await delay(400);
  const now = new Date();
  const monthStart = formatISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const ingresosMes = INCOME.filter((i) => i.paymentDate >= monthStart).reduce((s, i) => s + i.amount, 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return formatISODate(d);
  });
  const serieIngresos = days.map((fecha) => ({
    fecha,
    monto: INCOME.filter((i) => i.paymentDate === fecha).reduce((s, i) => s + i.amount, 0),
  }));

  return {
    ingresosMes: Math.round(ingresosMes * 100) / 100,
    variacionIngresos: 8.4,
    facturasAutorizadas: INVOICES.filter((f) => f.estado === "Autorizada").length,
    facturasConError: INVOICES.filter((f) => ["Devuelta", "No autorizada", "Error"].includes(f.estado)).length,
    totalReversado: Math.round(REVERSALS.reduce((s, r) => s + r.monto, 0) * 100) / 100,
    serieIngresos,
  };
}

export async function getIncome(filters: FinancialFilters = {}): Promise<PagedResponse<IncomeEntry>> {
  await delay(400);
  let items = INCOME;
  if (filters.spaceId) items = items.filter((i) => i.spaceId === filters.spaceId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter((i) => i.clientName.toLowerCase().includes(q) || i.bookingCode.toLowerCase().includes(q));
  }
  items = items.filter((i) => inRange(i.paymentDate, filters.dateFrom, filters.dateTo));
  return paginate(items, filters.page, filters.pageSize ?? 10);
}

export async function getInvoices(filters: FinancialFilters = {}): Promise<PagedResponse<Invoice>> {
  await delay(400);
  let items = INVOICES;
  if (filters.status) items = items.filter((f) => f.estado === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (f) =>
        f.clientName.toLowerCase().includes(q) ||
        f.numeroComprobante.toLowerCase().includes(q) ||
        f.bookingCode.toLowerCase().includes(q),
    );
  }
  items = items.filter((f) => inRange(f.fechaEmision, filters.dateFrom, filters.dateTo));
  return paginate(items, filters.page, filters.pageSize ?? 10);
}

export async function getReversals(filters: FinancialFilters = {}): Promise<PagedResponse<Reversal>> {
  await delay(400);
  let items = REVERSALS;
  if (filters.status) items = items.filter((r) => r.tipo === filters.status || r.estado === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter((r) => r.clientName.toLowerCase().includes(q) || r.bookingCode.toLowerCase().includes(q));
  }
  items = items.filter((r) => inRange(r.fechaSolicitud, filters.dateFrom, filters.dateTo));
  return paginate(items, filters.page, filters.pageSize ?? 10);
}

export async function retryInvoice(id: string): Promise<Invoice> {
  await delay(600);
  const invoice = INVOICES.find((f) => f.id === id);
  if (!invoice) throw new Error("Factura no encontrada");
  invoice.estado = "Procesando";
  invoice.motivoRechazo = null;
  return { ...invoice };
}

export async function requestReversal(payload: RequestReversalPayload): Promise<Reversal> {
  await delay(600);
  const record = RECORDS.find((r) => r.bookingId === payload.bookingId);
  const reversal: Reversal = {
    id: `rev-new-${Date.now()}`,
    tipo: payload.tipo,
    facturaId: payload.tipo === "NotaCredito" ? (record ? `fac-${RECORDS.indexOf(record)}` : null) : null,
    bookingId: payload.bookingId,
    bookingCode: record?.bookingCode ?? payload.bookingId,
    clientName: record?.client.name ?? "—",
    monto: payload.monto,
    motivo: payload.motivo,
    estado: "Procesando",
    fechaSolicitud: formatISODate(new Date()),
    fechaResolucion: null,
    claveAcceso: null,
  };
  REVERSALS.unshift(reversal);
  return reversal;
}

export async function getFinancieroSpaces(): Promise<SpaceOption[]> {
  await delay(200);
  return [...FIN_SPACES];
}
