/**
 * Asistente de onboarding del anfitrión.
 *
 * Es la puerta de entrada al portal y tiene dos recorridos distintos según cómo
 * se creó la cuenta: con correo y contraseña hay que verificar el correo (3
 * pasos); con Google ese paso sobra (2 pasos). Las pruebas fijan esa
 * bifurcación, la verificación OTP —que solo deja avanzar tras validar— y la
 * reanudación en el paso donde quedó el usuario.
 */

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock("@/lib/actions/auth", () => ({
  logout: jest.fn(),
  sendEmailOtp: jest.fn(),
  verifyEmailOtp: jest.fn(),
  sendSmsOtp: jest.fn(),
  verifySmsOtp: jest.fn(),
}));
jest.mock("@/lib/actions/usuarios", () => ({
  checkPhoneAvailability: jest.fn(),
  completeOnboardingProfile: jest.fn(),
}));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as authActions from "@/lib/actions/auth";
import * as usuariosActions from "@/lib/actions/usuarios";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { renderWithQuery } from "../helpers/render";

const auth = jest.mocked(authActions);
const usuarios = jest.mocked(usuariosActions);

const USER = { id: "u1", name: "Ana Pérez", email: "ana@example.com", role: "admin" as const };

/** Los seis dígitos del OTP; se distinguen por su `maxLength` de 1. */
function casillasOtp(container: HTMLElement): HTMLInputElement[] {
  return [...container.querySelectorAll<HTMLInputElement>('input[maxlength="1"]')];
}

async function escribirOtp(
  usuario: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  codigo: string,
) {
  const casillas = casillasOtp(container);
  for (let i = 0; i < codigo.length; i++) {
    await usuario.type(casillas[i]!, codigo[i]!);
  }
}

beforeEach(() => {
  auth.sendEmailOtp.mockResolvedValue({ success: true });
  auth.verifyEmailOtp.mockResolvedValue({ success: true });
  auth.sendSmsOtp.mockResolvedValue({ success: true });
  auth.verifySmsOtp.mockResolvedValue({ success: true });
  usuarios.checkPhoneAvailability.mockResolvedValue({ available: true });
  usuarios.completeOnboardingProfile.mockResolvedValue({ success: true });
});

describe("recorrido según el método de registro", () => {
  /** Una cuenta de Google ya llega con el correo confirmado por el proveedor. */
  it("con Google arranca directo en la verificación del teléfono", () => {
    renderWithQuery(<OnboardingWizard user={USER} method="google" />);

    expect(screen.getByText(/Verifica tu Teléfono/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Enviar Código" })).toBeInTheDocument();
  });

  it("con correo y contraseña arranca pidiendo verificar el correo", () => {
    renderWithQuery(<OnboardingWizard user={USER} method="email" />);

    expect(screen.getByRole("button", { name: "Enviar Código" })).toBeInTheDocument();
    expect(screen.queryByText(/Verifica tu Teléfono/)).not.toBeInTheDocument();
  });

  it("saluda al anfitrión por su primer nombre", () => {
    renderWithQuery(<OnboardingWizard user={USER} method="google" />);

    expect(screen.getByText(/¡Bienvenido, Ana!/)).toBeInTheDocument();
  });

  /** El paso se calcula en el servidor: recargar no reinicia el proceso. */
  it("reanuda en el paso indicado", () => {
    renderWithQuery(<OnboardingWizard user={USER} method="email" initialStep={3} />);

    expect(screen.getByPlaceholderText("0987654321")).toBeInTheDocument();
  });

  it("permite cerrar sesión desde el asistente", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: /Salir/ }));

    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
  });
});

describe("verificación del correo", () => {
  it("envía el código al correo de la cuenta", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    await waitFor(() => expect(auth.sendEmailOtp).toHaveBeenCalledWith("ana@example.com"));
    expect(await screen.findByText("Ingresar Código")).toBeInTheDocument();
  });

  it("muestra el motivo si el envío falla y no avanza", async () => {
    auth.sendEmailOtp.mockResolvedValue({ success: false, message: "Servicio de correo no disponible." });
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    expect(await screen.findByText("Servicio de correo no disponible.")).toBeInTheDocument();
    expect(screen.queryByText("Ingresar Código")).not.toBeInTheDocument();
  });

  it("valida el código automáticamente al completar los seis dígitos", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await escribirOtp(usuario, container, "123456");

    await waitFor(() =>
      expect(auth.verifyEmailOtp).toHaveBeenCalledWith("ana@example.com", "123456"),
    );
    expect(await screen.findByText(/¡Correo verificado correctamente!/)).toBeInTheDocument();
  });

  it("muestra el error del backend y limpia el código si es incorrecto", async () => {
    auth.verifyEmailOtp.mockResolvedValue({ success: false, message: "Código inválido o expirado." });
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await escribirOtp(usuario, container, "000000");

    expect(await screen.findByText("Código inválido o expirado.")).toBeInTheDocument();
    await waitFor(() => expect(casillasOtp(container)[0]).toHaveValue(""));
  });

  /** Sin verificar el correo no se puede continuar: el botón queda bloqueado. */
  it("bloquea el avance mientras el correo no esté verificado", async () => {
    auth.verifyEmailOtp.mockResolvedValue({ success: false, message: "Código inválido." });
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");

    expect(screen.getByRole("button", { name: /Siguiente Paso/ })).toBeDisabled();
  });

  it("avanza al teléfono una vez verificado el correo", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await escribirOtp(usuario, container, "123456");
    await screen.findByText(/¡Correo verificado correctamente!/);
    await usuario.click(screen.getByRole("button", { name: /Siguiente Paso/ }));

    expect(await screen.findByText(/Verifica tu Teléfono/)).toBeInTheDocument();
  });

  it("permite volver a pedir el correo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await usuario.click(screen.getByRole("button", { name: "Cambiar correo" }));

    expect(screen.getByRole("button", { name: "Enviar Código" })).toBeInTheDocument();
  });

  it("solo acepta dígitos en las casillas del código", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="email" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await usuario.type(casillasOtp(container)[0]!, "a");

    expect(casillasOtp(container)[0]).toHaveValue("");
    expect(auth.verifyEmailOtp).not.toHaveBeenCalled();
  });
});

describe("verificación del teléfono", () => {
  it("comprueba la disponibilidad antes de enviar el código", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    await waitFor(() => expect(usuarios.checkPhoneAvailability).toHaveBeenCalledWith("0991234567"));
    expect(auth.sendSmsOtp).toHaveBeenCalledWith("0991234567");
  });

  /** Un número ya usado por otra cuenta rompería la trazabilidad del anfitrión. */
  it("rechaza un número ya usado por otra cuenta y no envía el código", async () => {
    usuarios.checkPhoneAvailability.mockResolvedValue({ available: false });
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    expect(
      await screen.findByText("Este número celular ya está en uso por otra cuenta."),
    ).toBeInTheDocument();
    expect(auth.sendSmsOtp).not.toHaveBeenCalled();
  });

  it("exige un número antes de continuar", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.clear(screen.getByPlaceholderText("0991234567"));
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    expect(
      await screen.findByText("Ingresa tu número celular para continuar."),
    ).toBeInTheDocument();
    expect(usuarios.checkPhoneAvailability).not.toHaveBeenCalled();
  });

  it("descarta los caracteres no numéricos del teléfono", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    const campo = screen.getByPlaceholderText("0991234567");
    await usuario.clear(campo);
    await usuario.type(campo, "099-123 4567");

    expect(campo).toHaveValue("0991234567");
  });

  it("muestra el motivo si el envío del SMS falla", async () => {
    auth.sendSmsOtp.mockResolvedValue({ success: false, message: "Tu sesión expiró. Inicia sesión de nuevo." });
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));

    expect(
      await screen.findByText("Tu sesión expiró. Inicia sesión de nuevo."),
    ).toBeInTheDocument();
  });

  it("valida el código SMS al completarlo", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await escribirOtp(usuario, container, "123456");

    await waitFor(() => expect(auth.verifySmsOtp).toHaveBeenCalledWith("123456"));
    expect(await screen.findByText(/¡Número verificado correctamente!/)).toBeInTheDocument();
  });

  it("permite corregir el celular desde la pantalla del código", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await usuario.click(screen.getByRole("button", { name: "Editar celular" }));

    expect(screen.getByPlaceholderText("0991234567")).toBeInTheDocument();
  });

  it("bloquea el avance mientras el número no esté verificado", async () => {
    auth.verifySmsOtp.mockResolvedValue({ success: false, message: "Código inválido." });
    const usuario = userEvent.setup();

    renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");

    expect(screen.getByRole("button", { name: /Siguiente Paso/ })).toBeDisabled();
  });

  it("avanza al perfil una vez verificado el número", async () => {
    const usuario = userEvent.setup();

    const { container } = renderWithQuery(<OnboardingWizard user={USER} method="google" />);
    await usuario.click(screen.getByRole("button", { name: "Enviar Código" }));
    await screen.findByText("Ingresar Código");
    await escribirOtp(usuario, container, "123456");
    await screen.findByText(/¡Número verificado correctamente!/);
    await usuario.click(screen.getByRole("button", { name: /Siguiente Paso/ }));

    expect(await screen.findByPlaceholderText("0987654321")).toBeInTheDocument();
  });
});

describe("perfil del anfitrión", () => {
  function renderPerfil() {
    return renderWithQuery(<OnboardingWizard user={USER} method="google" initialStep={2} />);
  }

  it("precarga nombres y apellidos a partir del nombre de la cuenta", () => {
    renderPerfil();

    expect(screen.getByDisplayValue("Ana")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pérez")).toBeInTheDocument();
  });

  it("muestra el correo como campo de solo lectura", () => {
    renderPerfil();

    expect(screen.getByDisplayValue("ana@example.com")).toHaveAttribute("readonly");
  });

  it("exige todos los campos antes de guardar", async () => {
    const usuario = userEvent.setup();

    renderPerfil();
    await usuario.click(screen.getByRole("button", { name: /Guardar y continuar/ }));

    expect(
      await screen.findByText("Completa todos los campos para continuar."),
    ).toBeInTheDocument();
    expect(usuarios.completeOnboardingProfile).not.toHaveBeenCalled();
  });

  it("exige una cédula de 10 dígitos", async () => {
    const usuario = userEvent.setup();

    const { container } = renderPerfil();
    await usuario.type(screen.getByPlaceholderText("0987654321"), "091234");
    await usuario.type(container.querySelector('input[type="date"]')!, "1995-04-02");
    await usuario.click(screen.getByRole("button", { name: /Guardar y continuar/ }));

    expect(await screen.findByText("La cédula debe tener 10 dígitos.")).toBeInTheDocument();
    expect(usuarios.completeOnboardingProfile).not.toHaveBeenCalled();
  });

  it("recorta la cédula a 10 dígitos y descarta lo no numérico", async () => {
    const usuario = userEvent.setup();

    renderPerfil();
    const cedula = screen.getByPlaceholderText("0987654321");
    await usuario.type(cedula, "09-1234 56789999");

    expect(cedula).toHaveValue("0912345678");
  });

  it("guarda el perfil y muestra la pantalla de bienvenida", async () => {
    const usuario = userEvent.setup();

    const { container } = renderPerfil();
    await usuario.type(screen.getByPlaceholderText("0987654321"), "0912345678");
    await usuario.type(container.querySelector('input[type="date"]')!, "1995-04-02");
    await usuario.click(screen.getByRole("button", { name: /Guardar y continuar/ }));

    await waitFor(() =>
      expect(usuarios.completeOnboardingProfile).toHaveBeenCalledWith("u1", {
        nombre: "Ana",
        apellido: "Pérez",
        numeroCedula: "0912345678",
        fechaNacimiento: "1995-04-02",
      }),
    );
  });

  it("muestra el error del backend sin avanzar", async () => {
    usuarios.completeOnboardingProfile.mockResolvedValue({
      success: false,
      message: "Cédula ya registrada.",
    });
    const usuario = userEvent.setup();

    const { container } = renderPerfil();
    await usuario.type(screen.getByPlaceholderText("0987654321"), "0912345678");
    await usuario.type(container.querySelector('input[type="date"]')!, "1995-04-02");
    await usuario.click(screen.getByRole("button", { name: /Guardar y continuar/ }));

    expect(await screen.findByText("Cédula ya registrada.")).toBeInTheDocument();
  });

  it("permite volver al paso anterior", async () => {
    const usuario = userEvent.setup();

    renderPerfil();
    await usuario.click(screen.getByRole("button", { name: "Atrás" }));

    expect(screen.getByText(/Verifica tu Teléfono/)).toBeInTheDocument();
  });

  /** El popover explica para qué se pide la cédula — dato sensible bajo LOPDP. */
  it("explica por qué se solicita la cédula", async () => {
    const usuario = userEvent.setup();

    renderPerfil();
    await usuario.click(screen.getByRole("button", { name: "?" }));

    expect(screen.getByText("Verificación de Identidad")).toBeInTheDocument();
    expect(screen.getByText(/comprobar la validez de los anfitriones/)).toBeInTheDocument();
  });
});
