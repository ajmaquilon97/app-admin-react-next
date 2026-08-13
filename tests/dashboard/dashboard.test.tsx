/**
 * Módulo de dashboard.
 *
 * Es un Server Component sin interacción: recibe datos ya formateados por
 * `api/loader.ts` y los pinta. Por eso las pruebas se reparten en dos frentes:
 * los helpers de formato —que son la lógica real, y deliberadamente trabajan en
 * UTC para no desplazar las horas que el backend ya devuelve en la zona del
 * negocio— y el render de cada tarjeta, incluidos sus estados vacíos.
 */

import { screen } from "@testing-library/react";
import { MapPin } from "lucide-react";
import {
  MESES_CORTOS,
  utcParts,
  pad2,
  formatHHMM,
  todayUTCStr,
  isoToDateStr,
  formatMoney,
  initials,
} from "@/modules/dashboard/utils/format";
import {
  AVATAR_TONES,
  ESTADO_MAP,
  KPI_SHELLS,
  EMPTY_KPIS,
} from "@/modules/dashboard/constants";
import { DashboardModule } from "@/modules/dashboard";
import { DashboardKPIs } from "@/modules/dashboard/components/DashboardKPIs";
import { ReservasChart } from "@/modules/dashboard/components/ReservasChart";
import { UpcomingBookings } from "@/modules/dashboard/components/UpcomingBookings";
import { RecentBookingsTable } from "@/modules/dashboard/components/RecentBookingsTable";
import type { DashboardData } from "@/modules/dashboard";
import type { Kpi } from "@/modules/dashboard/types";
import { renderWithQuery } from "../helpers/render";

describe("formato de fechas en UTC", () => {
  /**
   * El backend ya devuelve las horas en la zona del negocio. Convertirlas a la
   * zona del navegador las desplazaría, así que se leen en UTC a propósito.
   */
  it("utcParts lee día, mes, hora y minuto sin aplicar zona horaria", () => {
    expect(utcParts("2026-03-10T14:05:00Z")).toEqual({
      day: 10,
      month: 2, // 0-based
      hours: 14,
      minutes: 5,
    });
  });

  it("pad2 rellena con cero a la izquierda", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(7)).toBe("07");
    expect(pad2(23)).toBe("23");
  });

  it("formatHHMM compone la hora legible", () => {
    expect(formatHHMM("2026-03-10T09:05:00Z")).toBe("09:05");
    expect(formatHHMM("2026-03-10T00:00:00Z")).toBe("00:00");
  });

  it("isoToDateStr recorta la marca ISO a la fecha", () => {
    expect(isoToDateStr("2026-03-10T14:05:00Z")).toBe("2026-03-10");
  });

  it("todayUTCStr devuelve la fecha de hoy en formato YYYY-MM-DD", () => {
    expect(todayUTCStr()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayUTCStr()).toBe(new Date().toISOString().slice(0, 10));
  });

  it("los doce meses cortos están en español", () => {
    expect(MESES_CORTOS).toHaveLength(12);
    expect(MESES_CORTOS[0]).toBe("Ene");
    expect(MESES_CORTOS[11]).toBe("Dic");
  });
});

describe("formatMoney", () => {
  it("compacta a miles a partir de $1000", () => {
    expect(formatMoney(1000)).toBe("$1.0k");
    expect(formatMoney(1234)).toBe("$1.2k");
    expect(formatMoney(15800)).toBe("$15.8k");
  });

  it("muestra el importe sin decimales por debajo de mil", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(999)).toBe("$999");
    expect(formatMoney(45.6)).toBe("$46");
  });
});

describe("initials", () => {
  it("toma la primera letra del nombre y del apellido", () => {
    expect(initials("María Fernanda Pérez")).toBe("MP");
    expect(initials("Ana Torres")).toBe("AT");
  });

  it("usa las dos primeras letras si solo hay un nombre", () => {
    expect(initials("Ana")).toBe("AN");
  });

  it("degrada a '?' sin nombre", () => {
    expect(initials(null)).toBe("?");
    expect(initials("")).toBe("?");
  });

  it("ignora los espacios sobrantes", () => {
    expect(initials("  María   Pérez  ")).toBe("MP");
  });
});

describe("constantes del dashboard", () => {
  it("ofrece cinco tonos de avatar para rotar entre clientes", () => {
    expect(AVATAR_TONES).toHaveLength(5);
  });

  it("cada estado de reserva tiene etiqueta, estilo y color de punto", () => {
    for (const estado of ["confirmada", "pendiente_pago", "finalizada", "cancelada"]) {
      expect(ESTADO_MAP[estado]).toMatchObject({
        label: expect.any(String),
        style: expect.any(String),
        dot: expect.any(String),
      });
    }
  });

  it("define los cuatro KPIs de la pantalla", () => {
    expect(KPI_SHELLS.map((k) => k.label)).toEqual([
      "Total de Espacios",
      "Reservas Hoy",
      "Pendientes de Pago",
      "Ingresos del Mes",
    ]);
  });

  /** Si la carga falla se muestran los KPIs con guiones, no una fila vacía. */
  it("los KPIs vacíos conservan las etiquetas y marcan el valor con un guion", () => {
    expect(EMPTY_KPIS).toHaveLength(4);
    for (const kpi of EMPTY_KPIS) {
      expect(kpi.value).toBe("—");
      expect(kpi.tag).toEqual({ text: "—", tone: "muted" });
      expect(kpi.label.length).toBeGreaterThan(0);
    }
  });
});

const kpi = (o: Partial<Kpi> = {}): Kpi => ({
  label: "Total de Espacios",
  value: "12",
  icon: MapPin,
  iconColor: "text-info",
  iconBg: "bg-info/10",
  tag: { text: "+3 este mes", tone: "success" },
  ...o,
});

describe("DashboardKPIs", () => {
  it("pinta cada KPI con su etiqueta, valor y distintivo", () => {
    renderWithQuery(<DashboardKPIs kpis={[kpi()]} />);

    expect(screen.getByText("Total de Espacios")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("+3 este mes")).toBeInTheDocument();
  });

  it("pinta los KPIs vacíos cuando la carga falló", () => {
    renderWithQuery(<DashboardKPIs kpis={EMPTY_KPIS} />);

    expect(screen.getAllByText("—")).toHaveLength(8); // valor + distintivo por KPI
  });

  it.each(["success", "warning", "muted"] as const)(
    "acepta el tono %s en el distintivo",
    (tone) => {
      renderWithQuery(<DashboardKPIs kpis={[kpi({ tag: { text: "dato", tone } })]} />);
      expect(screen.getByText("dato")).toBeInTheDocument();
    },
  );
});

describe("ReservasChart", () => {
  const bars = [
    { month: "Ene", height: 40, value: "12 reservas", color: "bg-primary" },
    { month: "Feb", height: 80, value: "24 reservas", color: "bg-primary" },
  ];

  it("dibuja una barra por mes con su altura relativa", () => {
    const { container } = renderWithQuery(<ReservasChart bars={bars} />);

    expect(screen.getByText("Ene")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
    const alturas = [...container.querySelectorAll<HTMLElement>('[style*="height"]')].map(
      (b) => b.style.height,
    );
    expect(alturas).toEqual(["40%", "80%"]);
  });

  it("indica que aún no hay datos en vez de un gráfico en blanco", () => {
    renderWithQuery(<ReservasChart bars={[]} />);

    expect(screen.getByText("No hay datos de reservas aún.")).toBeInTheDocument();
  });
});

describe("UpcomingBookings", () => {
  const items = [
    {
      day: "10",
      monthLabel: "MAR",
      monthColor: "text-primary",
      space: "Cancha Norte",
      time: "14:00 - 16:00",
      initials: "MP",
      client: "María Pérez",
    },
  ];

  it("lista cada reserva próxima con espacio, hora y cliente", () => {
    renderWithQuery(<UpcomingBookings items={items} />);

    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
    expect(screen.getByText("14:00 - 16:00")).toBeInTheDocument();
    expect(screen.getByText("María Pérez")).toBeInTheDocument();
    expect(screen.getByText("MAR")).toBeInTheDocument();
  });

  it("indica cuando no hay próximas reservas", () => {
    renderWithQuery(<UpcomingBookings items={[]} />);

    expect(screen.getByText("Sin próximas reservas.")).toBeInTheDocument();
  });
});

describe("RecentBookingsTable", () => {
  const rows = [
    {
      initials: "MP",
      avatarTone: "bg-primary/10 text-primary",
      name: "María Pérez",
      email: "maria@example.com",
      space: "Cancha Norte",
      dateLabel: "10 Mar",
      time: "14:00",
      amount: "$50",
      statusLabel: "Confirmada",
      statusStyle: "bg-success/10",
      statusDot: "bg-success",
    },
  ];

  it("muestra las columnas y la fila de la reserva", () => {
    renderWithQuery(<RecentBookingsTable rows={rows} />);

    for (const col of ["Cliente", "Espacio", "Fecha / Hora", "Monto", "Estado"]) {
      expect(screen.getByText(col)).toBeInTheDocument();
    }
    expect(screen.getByText("María Pérez")).toBeInTheDocument();
    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByText("$50")).toBeInTheDocument();
  });

  it("indica cuando aún no hay reservas registradas", () => {
    renderWithQuery(<RecentBookingsTable rows={[]} />);

    expect(screen.getByText("No hay reservas registradas aún.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("DashboardModule", () => {
  const data: DashboardData = {
    kpis: [kpi()],
    chartBars: [{ month: "Ene", height: 40, value: "12", color: "bg-primary" }],
    upcoming: [
      {
        day: "10",
        monthLabel: "MAR",
        monthColor: "text-primary",
        space: "Cancha Norte",
        time: "14:00",
        initials: "MP",
        client: "María Pérez",
      },
    ],
    recent: [],
  };

  it("saluda al anfitrión por su nombre y compone las cuatro secciones", () => {
    renderWithQuery(<DashboardModule firstName="Ana" data={data} />);

    expect(screen.getByRole("heading", { name: /Hola, Ana/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Total de Espacios")).toBeInTheDocument();
    expect(screen.getByText("Reservas por Mes")).toBeInTheDocument();
    expect(screen.getByText("Próximas Reservas")).toBeInTheDocument();
    expect(screen.getByText("Últimas Reservas Generadas")).toBeInTheDocument();
  });
});
