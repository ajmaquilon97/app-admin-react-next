"use server";

import { redirect } from "next/navigation";
import { getSessionTokens } from "@/lib/session";
import * as pricingApi from "@/lib/pricing/api";
import type {
  EspacioPricing,
  FechaEspecial,
  Promocion,
} from "@/lib/pricing/types";

function toFechaEspecial(fe: pricingApi.FechaEspecialResponseApi): FechaEspecial {
  return { id: fe.id, fecha: fe.fecha, descripcion: fe.descripcion, precio: fe.precio, modalidad: fe.modalidad };
}

function toPromocion(p: pricingApi.PromocionResponseApi): Promocion {
  return {
    id: p.id,
    nombre: p.nombre,
    tipo: p.tipo,
    valor: p.valor,
    activa: p.activa,
    condicion: p.condicion ?? "",
  };
}

function toEspacioPricing(resp: pricingApi.EspacioPricingResponseApi): EspacioPricing {
  return {
    espacioId: resp.espacioId,
    modalidades: {
      hora: { activa: resp.horaActiva, precio: resp.horaPrecio },
      jornada: { activa: resp.jornadaActiva, precio: resp.jornadaPrecio },
      evento: { activa: resp.eventoActiva, precio: resp.eventoPrecio },
    },
    tarifasPorDia: resp.tarifasPorDia.map((d) => ({ dia: d.dia, activo: d.activo, precio: d.precio })),
    // El backend omite estos arreglos del JSON (en vez de mandar []) cuando están vacíos.
    fechasEspeciales: (resp.fechasEspeciales ?? []).map(toFechaEspecial),
    promociones: (resp.promociones ?? []).map(toPromocion),
  };
}

async function requireAccessToken(): Promise<string> {
  const tokens = await getSessionTokens();
  if (!tokens) redirect("/login");
  return tokens.accessToken;
}

export async function getPricing(espacioId: number): Promise<EspacioPricing> {
  const accessToken = await requireAccessToken();
  const resp = await pricingApi.getEspacioTarifas(espacioId, accessToken);
  return toEspacioPricing(resp);
}

/** Guarda solo modalidades + tarifa por día — fechas especiales y promociones tienen su propio CRUD. */
export async function savePricing(
  espacioId: number,
  data: Pick<EspacioPricing, "modalidades" | "tarifasPorDia">,
): Promise<EspacioPricing> {
  const accessToken = await requireAccessToken();
  // El backend exige que todo día activo tenga precio propio — la UI lo trata
  // como opcional (vacío = usa el precio de "Por Hora"), así que se resuelve
  // ese valor real aquí antes de enviarlo.
  const precioBase = data.modalidades.hora.precio;
  const resp = await pricingApi.saveEspacioTarifas(
    espacioId,
    {
      horaActiva: data.modalidades.hora.activa,
      horaPrecio: data.modalidades.hora.precio,
      jornadaActiva: data.modalidades.jornada.activa,
      jornadaPrecio: data.modalidades.jornada.precio,
      eventoActiva: data.modalidades.evento.activa,
      eventoPrecio: data.modalidades.evento.precio,
      tarifasPorDia: data.tarifasPorDia.map((d) => ({
        dia: d.dia,
        activo: d.activo,
        precio: d.activo ? (d.precio ?? precioBase) : d.precio,
      })),
    },
    accessToken,
  );
  return toEspacioPricing(resp);
}

export async function addFechaEspecial(
  espacioId: number,
  fe: Omit<FechaEspecial, "id">,
): Promise<FechaEspecial> {
  const accessToken = await requireAccessToken();
  const resp = await pricingApi.addFechaEspecial(espacioId, fe, accessToken);
  return toFechaEspecial(resp);
}

export async function deleteFechaEspecial(espacioId: number, feId: string): Promise<void> {
  const accessToken = await requireAccessToken();
  await pricingApi.deleteFechaEspecial(espacioId, feId, accessToken);
}

export async function addPromocion(
  espacioId: number,
  promo: Omit<Promocion, "id">,
): Promise<Promocion> {
  const accessToken = await requireAccessToken();
  const resp = await pricingApi.addPromocion(espacioId, promo, accessToken);
  return toPromocion(resp);
}

export async function togglePromocion(
  espacioId: number,
  promoId: string,
  activa: boolean,
): Promise<Promocion> {
  const accessToken = await requireAccessToken();
  const resp = await pricingApi.togglePromocion(espacioId, promoId, activa, accessToken);
  return toPromocion(resp);
}

export async function deletePromocion(espacioId: number, promoId: string): Promise<void> {
  const accessToken = await requireAccessToken();
  await pricingApi.deletePromocion(espacioId, promoId, accessToken);
}
