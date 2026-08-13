/**
 * Componentes de Configuración: perfil personal, datos del negocio y modo de
 * confirmación de reservas por espacio.
 *
 * Dos comportamientos concentran el riesgo: los campos deliberadamente no
 * editables (correo y teléfono, que se gestionan por otros flujos) y el
 * encadenado provincia → ciudad, que debe impedir enviar una ciudad huérfana.
 */

jest.mock("@/modules/configuracion/actions/configuracion", () => ({
  getPerfil: jest.fn(),
  updatePerfil: jest.fn(),
}));
jest.mock("@/modules/configuracion/actions/negocio", () => ({
  getNegocio: jest.fn(),
  updateNegocio: jest.fn(),
}));
jest.mock("@/modules/configuracion/actions/booking-config", () => ({
  getBookingConfigs: jest.fn(),
  updateBookingConfig: jest.fn(),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import * as perfilActions from "@/modules/configuracion/actions/configuracion";
import * as negocioActions from "@/modules/configuracion/actions/negocio";
import * as bookingConfigActions from "@/modules/configuracion/actions/booking-config";
import { ConfiguracionModule } from "@/modules/configuracion";
import { PerfilTab } from "@/modules/configuracion/components/PerfilTab";
import { NegocioTab } from "@/modules/configuracion/components/NegocioTab";
import { ReservasConfigTab } from "@/modules/configuracion/components/ReservasConfigTab";
import { renderWithQuery } from "../helpers/render";
import { espacioOption } from "../helpers/fixtures";

const perfilApi = jest.mocked(perfilActions);
const negocioApi = jest.mocked(negocioActions);
const bookingApi = jest.mocked(bookingConfigActions);
const avisos = jest.mocked(toast);

const PERFIL = {
  nombre: "Ana",
  apellido: "Pérez",
  email: "ana@negocio.com",
  telefono: "",
  fotoPerfilUrl: "",
  documentoIdentidadUrl: "",
  numeroCedula: "0912345678",
  fechaNacimiento: "1995-04-02",
};

const NEGOCIO = {
  nombreNegocio: "Canchas del Sur",
  ruc: "0912345678001",
  razonSocial: "Canchas del Sur S.A.",
  categoria: "Deportivo",
  direccion: "Av. Principal 123",
  provinciaId: 9,
  ciudadId: 90,
  telefonoNegocio: "042345678",
  descripcion: "Complejo deportivo",
  logoUrl: "",
};

const PROVINCIAS = [
  { id: 9, nombre: "Guayas", ciudades: [{ id: 90, nombre: "Guayaquil" }, { id: 91, nombre: "Durán" }] },
  { id: 17, nombre: "Pichincha", ciudades: [{ id: 170, nombre: "Quito" }] },
];

/**
 * Los campos de estos dos formularios no asocian su `<label>` con el input (no
 * hay `htmlFor`/`id`), así que `getByLabelText` no los encuentra. Se seleccionan
 * por el atributo `name`, que es la identidad real del campo en el envío del
 * formulario. Asociar las etiquetas es una mejora de accesibilidad pendiente.
 */
const campo = (container: HTMLElement, name: string): HTMLElement =>
  container.querySelector(`[name="${name}"]`)!;

beforeEach(() => {
  perfilApi.getPerfil.mockResolvedValue(PERFIL);
  perfilApi.updatePerfil.mockResolvedValue(PERFIL);
  negocioApi.getNegocio.mockResolvedValue(NEGOCIO);
  negocioApi.updateNegocio.mockResolvedValue(NEGOCIO);
  bookingApi.getBookingConfigs.mockResolvedValue([
    { espacioId: 1, espacioNombre: "Cancha Norte", modo: "inmediata" },
  ]);
});

describe("PerfilTab", () => {
  it("precarga los datos del anfitrión", async () => {
    renderWithQuery(<PerfilTab />);

    await waitFor(() => expect(screen.getByDisplayValue("Ana")).toBeInTheDocument());
    expect(screen.getByDisplayValue("Pérez")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0912345678")).toBeInTheDocument();
  });

  /**
   * El correo identifica la cuenta y el teléfono se verifica por OTP SMS:
   * ninguno se edita desde este formulario.
   */
  it("deja el correo y el teléfono como campos de solo lectura", async () => {
    renderWithQuery(<PerfilTab />);

    await waitFor(() => expect(screen.getByDisplayValue("ana@negocio.com")).toBeDisabled());
    expect(screen.getByPlaceholderText("Sin registrar")).toBeDisabled();
    expect(screen.getByText(/verificación por SMS/i)).toBeInTheDocument();
  });

  it("guarda los cambios y confirma al usuario", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<PerfilTab />);
    await waitFor(() => expect(screen.getByDisplayValue("Ana")).toBeInTheDocument());

    await usuario.clear(campo(container, "nombre"));
    await usuario.type(campo(container, "nombre"), "Ana María");
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(perfilApi.updatePerfil).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: "Ana María" }),
      ),
    );
    await waitFor(() => expect(avisos.success).toHaveBeenCalledWith("Perfil actualizado."));
  });

  it("no envía el formulario si falta la cédula", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<PerfilTab />);
    await waitFor(() => expect(screen.getByDisplayValue("0912345678")).toBeInTheDocument());

    await usuario.clear(screen.getByDisplayValue("0912345678"));
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(await screen.findByText("Cédula requerida")).toBeInTheDocument();
    expect(perfilApi.updatePerfil).not.toHaveBeenCalled();
  });

  it("reporta el error del backend al guardar", async () => {
    perfilApi.updatePerfil.mockRejectedValue(new Error("Tu sesión expiró. Inicia sesión de nuevo."));
    const usuario = userEvent.setup();

    renderWithQuery(<PerfilTab />);
    await waitFor(() => expect(screen.getByDisplayValue("Ana")).toBeInTheDocument());
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(avisos.error).toHaveBeenCalledWith("Tu sesión expiró. Inicia sesión de nuevo."),
    );
  });
});

describe("NegocioTab", () => {
  it("precarga los datos fiscales del negocio", async () => {
    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);

    await waitFor(() => expect(screen.getByDisplayValue("Canchas del Sur")).toBeInTheDocument());
    expect(screen.getByDisplayValue("0912345678001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Canchas del Sur S.A.")).toBeInTheDocument();
  });

  it("limita el RUC a 13 caracteres desde el propio campo", async () => {
    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("0912345678001")).toHaveAttribute("maxLength", "13"),
    );
  });

  it("rechaza un RUC de longitud incorrecta", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);
    await waitFor(() => expect(screen.getByDisplayValue("0912345678001")).toBeInTheDocument());

    await usuario.clear(campo(container, "ruc"));
    await usuario.type(campo(container, "ruc"), "0912345");
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    expect(await screen.findByText("El RUC debe tener 13 dígitos")).toBeInTheDocument();
    expect(negocioApi.updateNegocio).not.toHaveBeenCalled();
  });

  it("solo ofrece las ciudades de la provincia elegida", async () => {
    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);

    await waitFor(() => expect(screen.getByRole("option", { name: "Guayaquil" })).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "Durán" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Quito" })).not.toBeInTheDocument();
  });

  it("repuebla las ciudades al cambiar de provincia", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Guayaquil" })).toBeInTheDocument());

    const provincia = screen.getByRole("option", { name: "Guayas" }).closest("select")!;
    await usuario.selectOptions(provincia, "17");

    expect(await screen.findByRole("option", { name: "Quito" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Guayaquil" })).not.toBeInTheDocument();
  });

  it("guarda el negocio y confirma al usuario", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);
    await waitFor(() => expect(screen.getByDisplayValue("Canchas del Sur")).toBeInTheDocument());
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(avisos.success).toHaveBeenCalledWith("Datos del negocio actualizados."),
    );
  });

  it("reporta el error del backend al guardar", async () => {
    negocioApi.updateNegocio.mockRejectedValue(new Error("RUC ya registrado"));
    const usuario = userEvent.setup();

    renderWithQuery(<NegocioTab provincias={PROVINCIAS} />);
    await waitFor(() => expect(screen.getByDisplayValue("Canchas del Sur")).toBeInTheDocument());
    await usuario.click(screen.getByRole("button", { name: /Guardar cambios/ }));

    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith("RUC ya registrado"));
  });
});

describe("ReservasConfigTab", () => {
  it("guía al anfitrión sin espacios en vez de mostrar una lista vacía", () => {
    renderWithQuery(<ReservasConfigTab espacios={[]} />);

    expect(
      screen.getByText(/Crea tu primer espacio para configurar cómo se aceptan sus reservas/),
    ).toBeInTheDocument();
    expect(bookingApi.getBookingConfigs).not.toHaveBeenCalled();
  });

  it("muestra una fila por espacio con la descripción del modo activo", async () => {
    renderWithQuery(<ReservasConfigTab espacios={[espacioOption({ id: 1, nombre: "Cancha Norte" })]} />);

    expect(await screen.findByText("Cancha Norte")).toBeInTheDocument();
    expect(
      screen.getByText(/El usuario paga al reservar y la reserva se confirma automáticamente/),
    ).toBeInTheDocument();
  });

  it("cambia el modo de confirmación y confirma nombrando el espacio", async () => {
    bookingApi.updateBookingConfig.mockResolvedValue({
      espacioId: 1,
      espacioNombre: "Cancha Norte",
      modo: "solicitud_aprobacion",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<ReservasConfigTab espacios={[espacioOption({ id: 1, nombre: "Cancha Norte" })]} />);
    await screen.findByText("Cancha Norte");
    await usuario.selectOptions(screen.getByRole("combobox"), "solicitud_aprobacion");

    await waitFor(() =>
      expect(bookingApi.updateBookingConfig).toHaveBeenCalledWith(
        1,
        "Cancha Norte",
        "solicitud_aprobacion",
      ),
    );
    await waitFor(() =>
      expect(avisos.success).toHaveBeenCalledWith(
        'Modo de reservas actualizado para "Cancha Norte".',
      ),
    );
  });

  it("reporta el fallo al cambiar el modo", async () => {
    bookingApi.updateBookingConfig.mockRejectedValue(new Error("El espacio está inactivo"));
    const usuario = userEvent.setup();

    renderWithQuery(<ReservasConfigTab espacios={[espacioOption({ id: 1 })]} />);
    await screen.findByText("Cancha Norte");
    await usuario.selectOptions(screen.getByRole("combobox"), "pago_confirmacion_manual");

    await waitFor(() => expect(avisos.error).toHaveBeenCalledWith("El espacio está inactivo"));
  });
});

describe("ConfiguracionModule", () => {
  const props = { espacios: [espacioOption({ id: 1 })], provincias: PROVINCIAS };

  it("abre en la pestaña de perfil", async () => {
    renderWithQuery(<ConfiguracionModule {...props} />);

    expect(screen.getByRole("heading", { name: "Configuración", level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByDisplayValue("Ana")).toBeInTheDocument());
  });

  it("navega a la pestaña de negocio", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ConfiguracionModule {...props} />);
    await usuario.click(screen.getByRole("button", { name: "Negocio" }));

    expect(await screen.findByDisplayValue("Canchas del Sur")).toBeInTheDocument();
  });

  it("navega a la pestaña de reservas", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<ConfiguracionModule {...props} />);
    await usuario.click(screen.getByRole("button", { name: "Reservas" }));

    expect(await screen.findByText("Cancha Norte")).toBeInTheDocument();
  });
});
