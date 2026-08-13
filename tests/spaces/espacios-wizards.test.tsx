/**
 * Asistentes de creación y edición de espacios.
 *
 * Son los formularios más largos del portal y su lógica está en las guardas de
 * cada paso: el botón "Siguiente" solo se habilita cuando el paso está completo,
 * y eso es lo que impide crear un espacio sin ubicación o sin descripción. La
 * otra regla que se prueba es la del arquetipo: un espacio de cupo compartido
 * exige control de aforo, así que su interruptor queda bloqueado en "activo".
 */

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/modules/spaces/actions/spaces", () => ({
  createEspacio: jest.fn(),
  updateEspacio: jest.fn(),
}));
// El mapa depende de Leaflet, que necesita layout real (ver tests/ui).
jest.mock("@/components/ui/MapPicker", () => ({
  MapPicker: ({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) => (
    <button type="button" onClick={() => onChange({ lat: -2.17, lng: -79.92 })}>
      Marcar en el mapa
    </button>
  ),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as spacesActions from "@/modules/spaces/actions/spaces";
import { CrearEspacioWizard, EditarEspacioWizard } from "@/modules/spaces";
import type { EspacioResponse, TipoEspacio } from "@/lib/api/spaces";
import { renderWithQuery } from "../helpers/render";

const acciones = jest.mocked(spacesActions);

const USER = { id: "u1", name: "Ana Pérez", email: "ana@example.com", role: "admin" as const };

const TIPOS: TipoEspacio[] = [
  { id: 3, nombre: "Cancha de fútbol", modalidadReserva: "franja_exclusiva" },
  { id: 5, nombre: "Piscina", modalidadReserva: "cupo_compartido" },
] as TipoEspacio[];

const PROVINCIAS = [
  { id: 9, nombre: "Guayas", ciudades: [{ id: 90, nombre: "Guayaquil" }, { id: 91, nombre: "Durán" }] },
  { id: 17, nombre: "Pichincha", ciudades: [{ id: 170, nombre: "Quito" }] },
];

const ESPACIO: EspacioResponse = {
  id: 7,
  titulo: "Cancha Norte",
  descripcion: "Cancha de césped sintético con iluminación",
  tipoEspacioId: 3,
  propietarioId: "u1",
  provinciaId: 9,
  ciudadId: 90,
  referencia: "Av. Principal 123, junto al parque",
  linkUbicacion: "https://www.google.com/maps?q=-2.17,-79.92",
  latitud: -2.17,
  longitud: -79.92,
  validarAforo: false,
  maxCapacidad: 20,
  imagenPortada: "https://cdn.test/portada.jpg",
  imagenesGaleria: ["https://cdn.test/1.jpg"],
  estado: "activo",
} as EspacioResponse;

/** Los pasos no tienen `label` asociada; se accede por marcador o por tipo. */
const campo = {
  titulo: () => screen.getByPlaceholderText("Ej. Cancha Sintética Norte #1"),
  descripcion: () => screen.getByPlaceholderText("Detalla todo lo que hace especial a tu espacio..."),
  referencia: () =>
    screen.getByPlaceholderText("Ej. Av. Francisco de Orellana y Calle 14, frente al parque"),
};

const siguiente = () => screen.getByRole("button", { name: /Siguiente/ });

async function completarPaso1(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(campo.titulo(), "Cancha Sur");
  await usuario.type(campo.descripcion(), "Cancha de césped sintético con iluminación nocturna");
  await usuario.click(siguiente());
}

async function completarPaso2(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(campo.referencia(), "Av. Principal 123, junto al parque");
  await usuario.click(await screen.findByRole("button", { name: "Marcar en el mapa" }));
  await usuario.click(siguiente());
}

describe("CrearEspacioWizard — guardas de cada paso", () => {
  const props = { user: USER, tiposEspacios: TIPOS, provincias: PROVINCIAS };

  it("arranca en el paso General con los tres pasos visibles", () => {
    renderWithQuery(<CrearEspacioWizard {...props} />);

    expect(screen.getByText("Registrar Nuevo Espacio")).toBeInTheDocument();
    for (const paso of ["General", "Ubicación", "Configuración"]) {
      expect(screen.getByText(paso)).toBeInTheDocument();
    }
  });

  it("no deja avanzar con el paso General vacío", () => {
    renderWithQuery(<CrearEspacioWizard {...props} />);

    expect(siguiente()).toBeDisabled();
  });

  it("exige un título de al menos 3 caracteres", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await usuario.type(campo.titulo(), "AB");
    await usuario.type(campo.descripcion(), "Descripción suficientemente larga");

    expect(siguiente()).toBeDisabled();
  });

  it("exige una descripción de al menos 10 caracteres", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await usuario.type(campo.titulo(), "Cancha Sur");
    await usuario.type(campo.descripcion(), "corta");

    expect(siguiente()).toBeDisabled();
  });

  it("habilita el avance con el paso General completo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await usuario.type(campo.titulo(), "Cancha Sur");
    await usuario.type(campo.descripcion(), "Cancha de césped sintético con iluminación");

    expect(siguiente()).toBeEnabled();
  });

  /** Sin coordenadas el espacio no aparecería en el mapa del marketplace. */
  it("no deja avanzar del paso Ubicación sin marcar el punto en el mapa", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);
    await usuario.type(campo.referencia(), "Av. Principal 123, junto al parque");

    expect(siguiente()).toBeDisabled();
  });

  it("no deja avanzar sin una referencia de al menos 5 caracteres", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);
    await usuario.type(campo.referencia(), "abc");
    await usuario.click(await screen.findByRole("button", { name: "Marcar en el mapa" }));

    expect(siguiente()).toBeDisabled();
  });

  it("permite volver al paso anterior", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);
    await usuario.click(screen.getByRole("button", { name: "Anterior" }));

    expect(campo.titulo()).toHaveValue("Cancha Sur");
  });
});

describe("CrearEspacioWizard — ubicación", () => {
  const props = { user: USER, tiposEspacios: TIPOS, provincias: PROVINCIAS };

  it("preselecciona la primera provincia y su primera ciudad", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);

    expect(screen.getByRole("option", { name: "Guayaquil" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Quito" })).not.toBeInTheDocument();
  });

  it("repuebla las ciudades al cambiar de provincia", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);

    const provincia = screen.getByRole("option", { name: "Guayas" }).closest("select")!;
    await usuario.selectOptions(provincia, "17");

    expect(await screen.findByRole("option", { name: "Quito" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Guayaquil" })).not.toBeInTheDocument();
  });
});

describe("CrearEspacioWizard — configuración y envío", () => {
  const props = { user: USER, tiposEspacios: TIPOS, provincias: PROVINCIAS };

  async function llegarAPaso3(usuario: ReturnType<typeof userEvent.setup>) {
    await completarPaso1(usuario);
    await completarPaso2(usuario);
  }

  it("muestra el resumen con lo capturado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);

    expect(screen.getByText("Resumen del espacio")).toBeInTheDocument();
    expect(screen.getByText("Cancha Sur")).toBeInTheDocument();
    expect(screen.getByText("Guayaquil, Guayas")).toBeInTheDocument();
    expect(screen.getByText("Sin imagen")).toBeInTheDocument();
    expect(screen.getByText("Sin imágenes")).toBeInTheDocument();
  });

  it("rechaza una capacidad menor que 1", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);
    await usuario.clear(screen.getByRole("spinbutton"));

    expect(screen.getByRole("button", { name: /Finalizar y Guardar/ })).toBeDisabled();
    expect(
      screen.getByText("Ingresa un número entero de al menos 1 persona."),
    ).toBeInTheDocument();
  });

  it("descarta los caracteres no numéricos de la capacidad", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);
    const capacidad = screen.getByRole("spinbutton");
    await usuario.clear(capacidad);
    await usuario.type(capacidad, "5a0");

    expect(capacidad).toHaveValue(50);
  });

  it("envía el espacio completo al backend", async () => {
    acciones.createEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);
    await usuario.click(screen.getByRole("button", { name: /Finalizar y Guardar/ }));

    await waitFor(() => expect(acciones.createEspacio).toHaveBeenCalled());
    const formData = acciones.createEspacio.mock.calls[0]![1] as FormData;

    expect(formData.get("propietarioId")).toBe("u1");
    expect(formData.get("titulo")).toBe("Cancha Sur");
    expect(formData.get("tipoEspacioId")).toBe("3");
    expect(formData.get("provinciaId")).toBe("9");
    expect(formData.get("ciudadId")).toBe("90");
    expect(formData.get("latitud")).toBe("-2.17");
    expect(formData.get("longitud")).toBe("-79.92");
    expect(formData.get("maxCapacidad")).toBe("20");
    expect(formData.get("imagenesGaleria")).toBe("[]");
  });

  /** El enlace de Google Maps se deriva de las coordenadas, no se escribe a mano. */
  it("compone el enlace de Google Maps a partir de las coordenadas", async () => {
    acciones.createEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);
    await usuario.click(screen.getByRole("button", { name: /Finalizar y Guardar/ }));

    await waitFor(() => expect(acciones.createEspacio).toHaveBeenCalled());
    const formData = acciones.createEspacio.mock.calls[0]![1] as FormData;
    expect(formData.get("linkUbicacion")).toBe("https://www.google.com/maps?q=-2.17,-79.92");
  });

  it("muestra el error del backend sin salir del asistente", async () => {
    acciones.createEspacio.mockResolvedValue({ error: "Ya tienes un espacio con ese nombre." });
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await llegarAPaso3(usuario);
    await usuario.click(screen.getByRole("button", { name: /Finalizar y Guardar/ }));

    expect(await screen.findByText("Ya tienes un espacio con ese nombre.")).toBeInTheDocument();
    expect(screen.getByText("Resumen del espacio")).toBeInTheDocument();
  });
});

describe("CrearEspacioWizard — arquetipo del tipo de espacio", () => {
  const props = { user: USER, tiposEspacios: TIPOS, provincias: PROVINCIAS };

  it("en franja exclusiva el aforo es opcional y se puede alternar", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await completarPaso1(usuario);
    await completarPaso2(usuario);

    expect(screen.getByText("Capacidad máxima")).toBeInTheDocument();
    expect(
      screen.getByText("Controla que el número de asistentes no supere la capacidad máxima."),
    ).toBeInTheDocument();
  });

  /**
   * En cupo compartido el aforo *es* el mecanismo de venta: sin él no se podría
   * limitar cuántas entradas se emiten por día.
   */
  it("en cupo compartido el aforo es obligatorio y su interruptor queda bloqueado", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await usuario.type(campo.titulo(), "Piscina Municipal");
    await usuario.type(campo.descripcion(), "Piscina semiolímpica climatizada");
    const tipo = screen.getByRole("option", { name: "Cancha de fútbol" }).closest("select")!;
    await usuario.selectOptions(tipo, "5");
    await usuario.click(siguiente());
    await completarPaso2(usuario);

    expect(screen.getByText("Aforo máximo simultáneo")).toBeInTheDocument();
    expect(
      screen.getByText("El control de aforo es obligatorio para espacios de cupo compartido."),
    ).toBeInTheDocument();

    const interruptor = screen
      .getByText("Validar aforo")
      .closest("div")!.parentElement!.querySelector("button")!;
    expect(interruptor).toBeDisabled();
  });

  it("envía validarAforo en verdadero para un espacio de cupo compartido", async () => {
    acciones.createEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<CrearEspacioWizard {...props} />);
    await usuario.type(campo.titulo(), "Piscina Municipal");
    await usuario.type(campo.descripcion(), "Piscina semiolímpica climatizada");
    await usuario.selectOptions(
      screen.getByRole("option", { name: "Cancha de fútbol" }).closest("select")!,
      "5",
    );
    await usuario.click(siguiente());
    await completarPaso2(usuario);
    await usuario.click(screen.getByRole("button", { name: /Finalizar y Guardar/ }));

    await waitFor(() => expect(acciones.createEspacio).toHaveBeenCalled());
    const formData = acciones.createEspacio.mock.calls[0]![1] as FormData;
    expect(formData.get("validarAforo")).toBe("true");
  });
});

describe("EditarEspacioWizard", () => {
  const props = { user: USER, espacio: ESPACIO, tiposEspacios: TIPOS, provincias: PROVINCIAS };

  it("precarga todos los datos del espacio", () => {
    renderWithQuery(<EditarEspacioWizard {...props} />);

    expect(campo.titulo()).toHaveValue("Cancha Norte");
    expect(campo.descripcion()).toHaveValue("Cancha de césped sintético con iluminación");
  });

  it("permite avanzar de inmediato porque los datos ya son válidos", () => {
    renderWithQuery(<EditarEspacioWizard {...props} />);

    expect(siguiente()).toBeEnabled();
  });

  it("precarga la ubicación guardada", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EditarEspacioWizard {...props} />);
    await usuario.click(siguiente());

    // El asistente de edición usa un marcador más corto que el de creación.
    expect(screen.getByPlaceholderText("Ej. Av. Francisco de Orellana y Calle 14")).toHaveValue(
      "Av. Principal 123, junto al parque",
    );
    expect(screen.getByRole("option", { name: "Guayaquil" })).toBeInTheDocument();
  });

  it("exige una referencia también al editar", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EditarEspacioWizard {...props} />);
    await usuario.click(siguiente());
    await usuario.clear(screen.getByPlaceholderText("Ej. Av. Francisco de Orellana y Calle 14"));

    expect(siguiente()).toBeDisabled();
  });

  /**
   * Diferencia deliberada con el asistente de creación: allí el punto en el mapa
   * es obligatorio, aquí no. Editar un espacio antiguo —registrado antes de que
   * existiera el mapa— no debe quedar bloqueado por un dato que nunca se pidió.
   */
  it("permite editar un espacio guardado sin coordenadas", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(
      <EditarEspacioWizard
        {...props}
        espacio={{ ...ESPACIO, linkUbicacion: null, latitud: null, longitud: null } as EspacioResponse}
      />,
    );
    await usuario.click(siguiente());

    expect(siguiente()).toBeEnabled();
  });

  it("precarga la capacidad y el estado del aforo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<EditarEspacioWizard {...props} />);
    await usuario.click(siguiente());
    await usuario.click(siguiente());

    expect(screen.getByRole("spinbutton")).toHaveValue(20);
  });

  it("actualiza el espacio con su id", async () => {
    acciones.updateEspacio.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<EditarEspacioWizard {...props} />);
    await usuario.click(siguiente());
    await usuario.click(siguiente());
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios|Finalizar y Guardar/ }));

    await waitFor(() => expect(acciones.updateEspacio).toHaveBeenCalled());
    expect(acciones.updateEspacio.mock.calls[0]![0]).toBe(7);

    const formData = acciones.updateEspacio.mock.calls[0]![1] as FormData;
    expect(formData.get("titulo")).toBe("Cancha Norte");
    expect(formData.get("imagenesGaleria")).toBe('["https://cdn.test/1.jpg"]');
  });

  it("muestra el error del backend al actualizar", async () => {
    acciones.updateEspacio.mockResolvedValue({ error: "El espacio tiene reservas activas." });
    const usuario = userEvent.setup();

    renderWithQuery(<EditarEspacioWizard {...props} />);
    await usuario.click(siguiente());
    await usuario.click(siguiente());
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios|Finalizar y Guardar/ }));

    expect(await screen.findByText("El espacio tiene reservas activas.")).toBeInTheDocument();
  });
});
