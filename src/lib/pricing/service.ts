import type { EspacioPricing, FechaEspecial, Promocion, EspacioOption, Modalidad } from "./types";

// ── Mock store (en memoria) ────────────────────────────────────────────────────
// TODO: reemplazar por llamadas HTTP cuando el backend implemente el módulo de tarifas

const DIAS_DEFAULT = Array.from({ length: 7 }, (_, i) => ({
  dia: i,
  activo: i < 5,
  precio: null as number | null,
}));

const store = new Map<number, EspacioPricing>();

function defaultPricing(espacioId: number): EspacioPricing {
  return {
    espacioId,
    modalidades: {
      hora: { activa: true, precio: null },
      jornada: { activa: false, precio: null },
      evento: { activa: false, precio: null },
    },
    tarifasPorDia: DIAS_DEFAULT.map((d) => ({ ...d })),
    fechasEspeciales: [],
    promociones: [],
  };
}

export const pricingService = {
  async getPricing(espacioId: number): Promise<EspacioPricing> {
    await delay(300);
    if (!store.has(espacioId)) store.set(espacioId, defaultPricing(espacioId));
    return structuredClone(store.get(espacioId)!);
  },

  async savePricing(data: EspacioPricing): Promise<EspacioPricing> {
    await delay(400);
    store.set(data.espacioId, structuredClone(data));
    return structuredClone(data);
  },

  async addFechaEspecial(espacioId: number, fe: Omit<FechaEspecial, "id">): Promise<FechaEspecial> {
    await delay(300);
    const pricing = store.get(espacioId) ?? defaultPricing(espacioId);
    const nueva: FechaEspecial = { ...fe, id: crypto.randomUUID() };
    pricing.fechasEspeciales.push(nueva);
    store.set(espacioId, pricing);
    return nueva;
  },

  async deleteFechaEspecial(espacioId: number, feId: string): Promise<void> {
    await delay(200);
    const pricing = store.get(espacioId);
    if (!pricing) return;
    pricing.fechasEspeciales = pricing.fechasEspeciales.filter((f) => f.id !== feId);
    store.set(espacioId, pricing);
  },

  async addPromocion(espacioId: number, promo: Omit<Promocion, "id">): Promise<Promocion> {
    await delay(300);
    const pricing = store.get(espacioId) ?? defaultPricing(espacioId);
    const nueva: Promocion = { ...promo, id: crypto.randomUUID() };
    pricing.promociones.push(nueva);
    store.set(espacioId, pricing);
    return nueva;
  },

  async togglePromocion(espacioId: number, promoId: string, activa: boolean): Promise<void> {
    await delay(200);
    const pricing = store.get(espacioId);
    if (!pricing) return;
    const p = pricing.promociones.find((x) => x.id === promoId);
    if (p) p.activa = activa;
    store.set(espacioId, pricing);
  },

  async deletePromocion(espacioId: number, promoId: string): Promise<void> {
    await delay(200);
    const pricing = store.get(espacioId);
    if (!pricing) return;
    pricing.promociones = pricing.promociones.filter((p) => p.id !== promoId);
    store.set(espacioId, pricing);
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
