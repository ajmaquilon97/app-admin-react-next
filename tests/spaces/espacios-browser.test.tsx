/**
 * Catálogo de espacios del anfitrión.
 *
 * Toda la lógica es de cliente: filtrado por texto y estado, ordenamiento y qué
 * acciones ofrece cada tarjeta según el estado del espacio. Un espacio "en
 * revisión" no debe poder activarse ni inactivarse, y uno inactivo tiene que
 * dejar claro que dejó de recibir reservas.
 */

jest.mock("@/modules/spaces/actions/spaces", () => ({
  activarEspacio: jest.fn(),
  inactivarEspacio: jest.fn(),
}));

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EspaciosBrowser } from "@/modules/spaces";
import type { EspacioResponse } from "@/lib/api/spaces";
import { renderWithQuery } from "../helpers/render";

const espacio = (o: Partial<EspacioResponse> = {}) =>
  ({
    id: 1,
    titulo: "Cancha Norte",
    estado: "activo",
    imagenPortada: "https://cdn.test/cancha.jpg",
    tipoEspacioNombre: "Cancha de fútbol",
    calificacion: 4.65,
    referencia: "Junto al parque",
    ciudadNombre: "Guayaquil",
    provinciaNombre: "Guayas",
    maxCapacidad: 20,
    ...o,
  }) as EspacioResponse;

describe("estado vacío", () => {
  it("invita a crear el primer espacio", () => {
    renderWithQuery(<EspaciosBrowser espacios={[]} />);

    expect(screen.getByText("No tienes espacios aún")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Crear Espacio/ })).toHaveLength(2);
  });
});

describe("tarjeta de espacio", () => {
  it("muestra categoría, título, calificación y ubicación compuesta", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio()]} />);

    expect(screen.getByText("Cancha de fútbol")).toBeInTheDocument();
    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
    expect(screen.getByText("4.7")).toBeInTheDocument(); // redondeada a un decimal
    expect(screen.getByText("Junto al parque · Guayaquil · Guayas")).toBeInTheDocument();
  });

  it("omite las partes ausentes de la ubicación", () => {
    renderWithQuery(
      <EspaciosBrowser
        espacios={[espacio({ referencia: null, provinciaNombre: null })]}
      />,
    );

    expect(screen.getByText("Guayaquil")).toBeInTheDocument();
  });

  it("oculta la calificación cuando el espacio aún no tiene", () => {
    const { container } = renderWithQuery(
      <EspaciosBrowser espacios={[espacio({ calificacion: null })]} />,
    );

    expect(container.querySelector("svg.lucide-star")).not.toBeInTheDocument();
  });

  it("usa respaldos legibles cuando faltan título y categoría", () => {
    renderWithQuery(
      <EspaciosBrowser espacios={[espacio({ titulo: null, tipoEspacioNombre: null })]} />,
    );

    expect(screen.getByText("Sin nombre")).toBeInTheDocument();
    expect(screen.getByText("Espacio")).toBeInTheDocument();
  });

  it("muestra un marcador de posición si no hay imagen de portada", () => {
    const { container } = renderWithQuery(
      <EspaciosBrowser espacios={[espacio({ imagenPortada: null })]} />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg.lucide-tent")).toBeInTheDocument();
  });

  it("un espacio activo muestra su capacidad y permite inactivarlo", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio()]} />);

    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText("20 personas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inactivar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activar" })).not.toBeInTheDocument();
  });

  it("un espacio inactivo explica que las reservas están pausadas y permite activarlo", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio({ estado: "inactivo" })]} />);

    expect(screen.getByText("Inactivo")).toBeInTheDocument();
    expect(screen.getByText("En Mantenimiento")).toBeInTheDocument();
    expect(screen.getByText("Reservas pausadas. Actívalo cuando esté listo.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activar" })).toBeInTheDocument();
  });

  /** Mientras el equipo verifica el espacio, el anfitrión no puede cambiar su estado. */
  it("un espacio en revisión no ofrece activar ni inactivar", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio({ estado: "revision" })]} />);

    // "En Revisión" también es una opción del filtro de estado.
    expect(screen.getAllByText("En Revisión").filter((n) => n.tagName !== "OPTION")).toHaveLength(1);
    expect(screen.getByText("Nuestro equipo está verificando tu espacio.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inactivar" })).not.toBeInTheDocument();
  });

  it("trata como 'en revisión' un espacio sin estado", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio({ estado: null })]} />);

    expect(screen.getAllByText("En Revisión").filter((n) => n.tagName !== "OPTION")).toHaveLength(1);
  });

  it("enlaza a editar y a tarifas", () => {
    renderWithQuery(<EspaciosBrowser espacios={[espacio({ id: 7 })]} />);

    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute(
      "href",
      "/espacios/7/editar",
    );
    expect(screen.getByRole("link", { name: "Ver tarifas" })).toHaveAttribute("href", "/tarifas");
  });
});

describe("búsqueda y filtros", () => {
  const catalogo = [
    espacio({ id: 1, titulo: "Cancha Norte", estado: "activo", maxCapacidad: 20, calificacion: 4.5 }),
    espacio({ id: 2, titulo: "Piscina Sur", estado: "inactivo", maxCapacidad: 100, calificacion: 3.2 }),
    espacio({ id: 3, titulo: "Salón de eventos", estado: "revision", maxCapacidad: 50, calificacion: 4.9 }),
  ];

  it("filtra por nombre", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "piscina");

    expect(screen.getByText("Piscina Sur")).toBeInTheDocument();
    expect(screen.queryByText("Cancha Norte")).not.toBeInTheDocument();
  });

  it("filtra también por ubicación", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(
      <EspaciosBrowser
        espacios={[
          espacio({ id: 1, titulo: "Cancha Norte", ciudadNombre: "Guayaquil" }),
          espacio({ id: 2, titulo: "Piscina Sur", ciudadNombre: "Quito", referencia: null, provinciaNombre: null }),
        ]}
      />,
    );
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "quito");

    expect(screen.getByText("Piscina Sur")).toBeInTheDocument();
    expect(screen.queryByText("Cancha Norte")).not.toBeInTheDocument();
  });

  it("ignora mayúsculas y espacios alrededor", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "  CANCHA  ");

    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
  });

  it("filtra por estado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    const estado = screen.getByRole("option", { name: "Estado: Todos" }).closest("select")!;
    await usuario.selectOptions(estado, "inactivo");

    expect(screen.getByText("Piscina Sur")).toBeInTheDocument();
    expect(screen.queryByText("Cancha Norte")).not.toBeInTheDocument();
    expect(screen.queryByText("Salón de eventos")).not.toBeInTheDocument();
  });

  it("combina búsqueda y estado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    const estado = screen.getByRole("option", { name: "Estado: Todos" }).closest("select")!;
    await usuario.selectOptions(estado, "activo");
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "piscina");

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("limpia los filtros desde el estado sin resultados", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "inexistente");

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(screen.getByText("Cancha Norte")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar por nombre o ubicación...")).toHaveValue("");
  });

  /** Distinguir "no tienes espacios" de "ninguno coincide" evita un mensaje engañoso. */
  it("distingue el catálogo vacío del filtro sin coincidencias", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "zzz");

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.queryByText("No tienes espacios aún")).not.toBeInTheDocument();
  });
});

describe("ordenamiento", () => {
  const catalogo = [
    espacio({ id: 1, titulo: "Cancha Norte", maxCapacidad: 20, calificacion: 4.5 }),
    espacio({ id: 2, titulo: "Alberca", maxCapacidad: 100, calificacion: 3.2 }),
    espacio({ id: 3, titulo: "Salón", maxCapacidad: 50, calificacion: 4.9 }),
  ];

  function titulos(container: HTMLElement): string[] {
    return [...container.querySelectorAll("h3.modal-title")].map((h) => h.textContent!);
  }

  function selectorOrden(): HTMLSelectElement {
    return screen.getByRole("option", { name: "Ordenar: Recomendado" }).closest("select")!;
  }

  it("respeta el orden del backend en 'Recomendado'", () => {
    const { container } = renderWithQuery(<EspaciosBrowser espacios={catalogo} />);

    expect(titulos(container)).toEqual(["Cancha Norte", "Alberca", "Salón"]);
  });

  it.each([
    ["nombre-asc", ["Alberca", "Cancha Norte", "Salón"]],
    ["nombre-desc", ["Salón", "Cancha Norte", "Alberca"]],
    ["capacidad-desc", ["Alberca", "Salón", "Cancha Norte"]],
    ["calificacion-desc", ["Salón", "Cancha Norte", "Alberca"]],
  ])("ordena por %s", async (orden, esperado) => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.selectOptions(selectorOrden(), orden);

    expect(titulos(container)).toEqual(esperado);
  });

  it("coloca al final los espacios sin capacidad ni calificación", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(
      <EspaciosBrowser
        espacios={[
          espacio({ id: 1, titulo: "Sin datos", maxCapacidad: undefined, calificacion: null }),
          espacio({ id: 2, titulo: "Con datos", maxCapacidad: 30, calificacion: 4 }),
        ]}
      />,
    );
    await usuario.selectOptions(selectorOrden(), "capacidad-desc");

    expect(titulos(container)).toEqual(["Con datos", "Sin datos"]);
  });

  it("mantiene el filtro aplicado al cambiar el orden", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<EspaciosBrowser espacios={catalogo} />);
    await usuario.type(screen.getByPlaceholderText("Buscar por nombre o ubicación..."), "a");
    await usuario.selectOptions(selectorOrden(), "nombre-asc");

    expect(titulos(container)).toEqual(["Alberca", "Cancha Norte", "Salón"]);
  });
});

describe("acciones desde la tarjeta", () => {
  it("inactivar abre su diálogo de confirmación", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EspaciosBrowser espacios={[espacio()]} />);
    await usuario.click(screen.getByRole("button", { name: "Inactivar" }));

    const dialogo = screen.getByText("Inactivar espacio").closest("div")!.parentElement!
      .parentElement!;
    expect(within(dialogo).getByRole("button", { name: "Sí, inactivar" })).toBeInTheDocument();
  });
});
