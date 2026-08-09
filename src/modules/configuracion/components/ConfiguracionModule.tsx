"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PerfilTab } from "./PerfilTab";
import { NegocioTab } from "./NegocioTab";
import { ReservasConfigTab } from "./ReservasConfigTab";
import type { EspacioOption } from "../types";
import type { ProvinciaCatalogo } from "@/lib/catalogos-api";

type Tab = "perfil" | "negocio" | "reservas";

const TABS: { id: Tab; label: string }[] = [
  { id: "perfil", label: "Perfil" },
  { id: "negocio", label: "Negocio" },
  { id: "reservas", label: "Reservas" },
];

function ConfiguracionModuleInner({
  espacios,
  provincias,
}: {
  espacios: EspacioOption[];
  provincias: ProvinciaCatalogo[];
}) {
  const [tab, setTab] = useState<Tab>("perfil");

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="mb-8">
          <h1 className="page-title">Configuración</h1>
          <p className="text-text-muted mt-1 text-sm">
            Administra tu perfil, tu negocio y cómo se aceptan las reservas.
          </p>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-[#1E3A5F] text-primary"
                  : "border-transparent text-text-muted hover:text-text-main"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "perfil" && <PerfilTab />}
        {tab === "negocio" && <NegocioTab provincias={provincias} />}
        {tab === "reservas" && <ReservasConfigTab espacios={espacios} />}
      </div>
    </div>
  );
}

export function ConfiguracionModule({
  espacios,
  provincias,
}: {
  espacios: EspacioOption[];
  provincias: ProvinciaCatalogo[];
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <ConfiguracionModuleInner espacios={espacios} provincias={provincias} />
    </QueryClientProvider>
  );
}
