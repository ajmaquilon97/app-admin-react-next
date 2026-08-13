/**
 * Formularios de autenticación y estructura del portal.
 *
 * Se apoyan en `useActionState`, así que la Server Action se sustituye por un
 * doble que devuelve el estado que la acción real produciría. Eso permite
 * comprobar lo que ve el usuario —errores por campo, mensajes de backend,
 * estado de envío— sin levantar el runtime de Server Actions.
 */

jest.mock("@/lib/actions/auth", () => ({
  login: jest.fn(),
  signup: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  loginWithGoogle: jest.fn(),
  logout: jest.fn(),
}));
jest.mock("@/lib/actions/usuarios", () => ({ checkEmailAvailability: jest.fn() }));
jest.mock("next/navigation", () => ({ usePathname: jest.fn(() => "/reservas") }));

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import * as authActions from "@/lib/actions/auth";
import { checkEmailAvailability } from "@/lib/actions/usuarios";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { renderWithQuery } from "../helpers/render";

const acciones = jest.mocked(authActions);
const disponibilidadCorreo = jest.mocked(checkEmailAvailability);
const rutaActual = jest.mocked(usePathname);

describe("LoginForm", () => {
  it("presenta los campos de acceso y el enlace de recuperación", () => {
    renderWithQuery(<LoginForm />);

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });

  it("envía las credenciales a la Server Action", async () => {
    acciones.login.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<LoginForm />);
    await usuario.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await usuario.type(screen.getByLabelText("Contraseña"), "secreta123");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await waitFor(() => expect(acciones.login).toHaveBeenCalled());
    const formData = acciones.login.mock.calls[0]![1] as FormData;
    expect(formData.get("email")).toBe("ana@example.com");
    expect(formData.get("password")).toBe("secreta123");
  });

  it("muestra el mensaje que devuelve la action tras credenciales inválidas", async () => {
    acciones.login.mockResolvedValue({ message: "Correo o contraseña incorrectos." });
    const usuario = userEvent.setup();

    renderWithQuery(<LoginForm />);
    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Correo o contraseña incorrectos.")).toBeInTheDocument();
  });

  it("muestra los errores por campo bajo su input", async () => {
    acciones.login.mockResolvedValue({
      errors: { email: ["Ingresa un correo válido."], password: ["La contraseña es obligatoria."] },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<LoginForm />);
    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(await screen.findByText("Ingresa un correo válido.")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es obligatoria.")).toBeInTheDocument();
  });

  /** El error de OAuth llega por query param, no por la action. */
  it("muestra el error devuelto por el proveedor externo", () => {
    renderWithQuery(<LoginForm oauthError="No se pudo completar el acceso con Google." />);

    expect(screen.getByText("No se pudo completar el acceso con Google.")).toBeInTheDocument();
  });

  it("no valida en el navegador: la validación real ocurre en el servidor", () => {
    const { container } = renderWithQuery(<LoginForm />);

    expect(container.querySelector("form")).toHaveAttribute("noValidate");
  });
});

describe("SignupForm", () => {
  beforeEach(() => {
    disponibilidadCorreo.mockResolvedValue({ available: true });
  });

  it("pide nombres, apellidos, correo, contraseña y aceptación de políticas", () => {
    renderWithQuery(<SignupForm />);

    expect(screen.getByLabelText("Nombres")).toBeInTheDocument();
    expect(screen.getByLabelText("Apellidos")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("declara la política de contraseña antes de que el usuario falle", () => {
    renderWithQuery(<SignupForm />);

    expect(
      screen.getByText("Mínimo 8 caracteres, con al menos una letra y un número."),
    ).toBeInTheDocument();
  });

  /** El consentimiento LOPDP enlaza a los dos documentos que se aceptan. */
  it("enlaza términos y políticas de privacidad en el consentimiento", () => {
    renderWithQuery(<SignupForm />);

    expect(screen.getByRole("link", { name: "Términos y condiciones" })).toHaveAttribute(
      "href",
      "/terminos-y-condiciones",
    );
    expect(screen.getByRole("link", { name: "Políticas de privacidad" })).toHaveAttribute(
      "href",
      "/politicas-de-privacidad",
    );
  });

  it("verifica la disponibilidad del correo al salir del campo", async () => {
    disponibilidadCorreo.mockResolvedValue({ available: false });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.type(screen.getByLabelText("Correo electrónico"), "ana@example.com");
    await usuario.tab();

    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeInTheDocument();
    expect(disponibilidadCorreo).toHaveBeenCalledWith("ana@example.com");
  });

  it("no consulta disponibilidad si el texto no parece un correo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.type(screen.getByLabelText("Correo electrónico"), "ana");
    await usuario.tab();

    expect(disponibilidadCorreo).not.toHaveBeenCalled();
  });

  it("no repite la consulta para el mismo correo", async () => {
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    const correo = screen.getByLabelText("Correo electrónico");
    await usuario.type(correo, "ana@example.com");
    await usuario.tab();
    await waitFor(() => expect(disponibilidadCorreo).toHaveBeenCalledTimes(1));

    await usuario.click(correo);
    await usuario.tab();

    expect(disponibilidadCorreo).toHaveBeenCalledTimes(1);
  });

  it("retira el aviso de correo ocupado en cuanto el usuario lo cambia", async () => {
    disponibilidadCorreo.mockResolvedValue({ available: false });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    const correo = screen.getByLabelText("Correo electrónico");
    await usuario.type(correo, "ana@example.com");
    await usuario.tab();
    await screen.findByText("Ya existe una cuenta con este correo.");

    await usuario.type(correo, "x");

    await waitFor(() =>
      expect(screen.queryByText("Ya existe una cuenta con este correo.")).not.toBeInTheDocument(),
    );
  });

  it("lista todos los incumplimientos de la política de contraseña", async () => {
    acciones.signup.mockResolvedValue({
      errors: {
        password: ["Debe tener al menos 8 caracteres.", "Debe incluir al menos un número."],
      },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("• Debe tener al menos 8 caracteres.")).toBeInTheDocument();
    expect(screen.getByText("• Debe incluir al menos un número.")).toBeInTheDocument();
  });

  it("repuebla los campos ya escritos tras un error de validación", async () => {
    acciones.signup.mockResolvedValue({
      errors: { email: ["Ingresa un correo válido."] },
      values: { firstName: "Ana", lastName: "Pérez", email: "roto" },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(screen.getByLabelText("Nombres")).toHaveValue("Ana"));
    expect(screen.getByLabelText("Apellidos")).toHaveValue("Pérez");
  });

  it("muestra el error genérico del backend", async () => {
    acciones.signup.mockResolvedValue({ message: "Ya existe una cuenta con este correo." });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText("Ya existe una cuenta con este correo.")).toBeInTheDocument();
  });

  it("marca el error de aceptación de políticas", async () => {
    acciones.signup.mockResolvedValue({
      errors: { terms: ["Debes aceptar las políticas de privacidad para continuar."] },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<SignupForm />);
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("Debes aceptar las políticas de privacidad para continuar."),
    ).toBeInTheDocument();
  });
});

describe("ForgotPasswordForm", () => {
  it("solo pide el correo", () => {
    renderWithQuery(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar enlace de recuperación" }),
    ).toBeInTheDocument();
  });

  it("muestra el error de campo devuelto por la action", async () => {
    acciones.forgotPassword.mockResolvedValue({ errors: { email: ["Ingresa un correo válido."] } });
    const usuario = userEvent.setup();

    renderWithQuery(<ForgotPasswordForm />);
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));

    expect(await screen.findByText("Ingresa un correo válido.")).toBeInTheDocument();
  });

  it("muestra el error general devuelto por la action", async () => {
    acciones.forgotPassword.mockResolvedValue({ message: "Servicio no disponible." });
    const usuario = userEvent.setup();

    renderWithQuery(<ForgotPasswordForm />);
    await usuario.click(screen.getByRole("button", { name: "Enviar enlace de recuperación" }));

    expect(await screen.findByText("Servicio no disponible.")).toBeInTheDocument();
  });
});

describe("ResetPasswordForm", () => {
  /** El token del enlace viaja oculto: el usuario no puede alterarlo desde la UI. */
  it("envía el token y el correo del enlace como campos ocultos", async () => {
    acciones.resetPassword.mockResolvedValue(undefined);
    const usuario = userEvent.setup();

    renderWithQuery(<ResetPasswordForm token="tok-123" email="ana@example.com" />);
    await usuario.type(screen.getByLabelText("Nueva contraseña"), "secreta123");
    await usuario.type(screen.getByLabelText("Confirmar contraseña"), "secreta123");
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    await waitFor(() => expect(acciones.resetPassword).toHaveBeenCalled());
    const formData = acciones.resetPassword.mock.calls[0]![1] as FormData;
    expect(formData.get("token")).toBe("tok-123");
    expect(formData.get("email")).toBe("ana@example.com");
    expect(formData.get("password")).toBe("secreta123");
  });

  it("señala la falta de coincidencia bajo el campo de confirmación", async () => {
    acciones.resetPassword.mockResolvedValue({
      errors: { confirmPassword: ["Las contraseñas no coinciden."] },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<ResetPasswordForm token="tok-123" email="ana@example.com" />);
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });

  it("muestra el enlace inválido como mensaje general", async () => {
    acciones.resetPassword.mockResolvedValue({
      message: "El enlace no es válido o expiró. Solicita uno nuevo.",
    });
    const usuario = userEvent.setup();

    renderWithQuery(<ResetPasswordForm token="" email="" />);
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    expect(
      await screen.findByText("El enlace no es válido o expiró. Solicita uno nuevo."),
    ).toBeInTheDocument();
  });

  it("lista los incumplimientos de la política de contraseña", async () => {
    acciones.resetPassword.mockResolvedValue({
      errors: { password: ["Debe incluir al menos un número."] },
    });
    const usuario = userEvent.setup();

    renderWithQuery(<ResetPasswordForm token="tok" email="ana@example.com" />);
    await usuario.click(screen.getByRole("button", { name: "Guardar nueva contraseña" }));

    expect(await screen.findByText("• Debe incluir al menos un número.")).toBeInTheDocument();
  });
});

describe("GoogleButton", () => {
  it("ofrece continuar con Google", () => {
    renderWithQuery(<GoogleButton />);

    expect(screen.getByRole("button", { name: /Continuar con Google/ })).toBeInTheDocument();
  });

  /** El consentimiento solo se muestra en registro, no al iniciar sesión. */
  it("muestra el aviso de tratamiento de datos solo cuando se pide", () => {
    const { rerender } = renderWithQuery(<GoogleButton />);
    expect(screen.queryByText(/tratamiento de tus datos personales/)).not.toBeInTheDocument();

    rerender(<GoogleButton showConsent />);
    expect(screen.getByText(/tratamiento de tus datos personales/)).toBeInTheDocument();
  });
});

describe("Sidebar", () => {
  const user = { id: "u1", name: "Ana Pérez", email: "ana@example.com", role: "admin" as const };

  it("lista los módulos del portal", () => {
    renderWithQuery(<Sidebar user={user} />);

    for (const modulo of ["Espacios", "Agenda", "Reservas", "Financiero", "Tarifas", "Configuración"]) {
      expect(screen.getByRole("link", { name: modulo })).toBeInTheDocument();
    }
  });

  it("muestra el nombre y el rol del usuario", () => {
    renderWithQuery(<Sidebar user={user} />);

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });

  it("traduce el rol staff", () => {
    renderWithQuery(<Sidebar user={{ ...user, role: "staff" }} />);

    expect(screen.getByText("Staff")).toBeInTheDocument();
  });

  it("resalta el módulo de la ruta actual", () => {
    rutaActual.mockReturnValue("/reservas");

    renderWithQuery(<Sidebar user={user} />);

    expect(screen.getByRole("link", { name: "Reservas" }).className).toContain("border-secondary");
    expect(screen.getByRole("link", { name: "Espacios" }).className).not.toContain(
      "border-secondary",
    );
  });

  /** Una subruta (`/espacios/crear`) también debe marcar su módulo. */
  it("resalta el módulo también desde una subruta", () => {
    rutaActual.mockReturnValue("/espacios/crear");

    renderWithQuery(<Sidebar user={user} />);

    expect(screen.getByRole("link", { name: "Espacios" }).className).toContain("border-secondary");
  });

  it("muestra el contador de reservas pendientes cuando lo hay", () => {
    renderWithQuery(<Sidebar user={user} pendingReservas={5} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("oculta el contador cuando no hay pendientes o no se pudo cargar", () => {
    const { rerender } = renderWithQuery(<Sidebar user={user} pendingReservas={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();

    rerender(<Sidebar user={user} />);
    expect(screen.getByRole("link", { name: "Reservas" })).toBeInTheDocument();
  });

  it("ofrece cerrar sesión", () => {
    renderWithQuery(<Sidebar user={user} />);

    expect(screen.getByTitle("Cerrar sesión")).toBeInTheDocument();
  });
});

describe("Topbar", () => {
  it("presenta el buscador global y las notificaciones", () => {
    renderWithQuery(<Topbar />);

    expect(
      screen.getByPlaceholderText("Buscar clientes, reservas o espacios..."),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Agora")).toBeInTheDocument();
  });
});

describe("QueryProvider", () => {
  /**
   * El `QueryClient` se crea dentro de `useState` para que cada request tenga el
   * suyo: un singleton de módulo compartiría la caché de un anfitrión con otro.
   */
  it("provee un cliente a sus hijos", () => {
    renderWithQuery(
      <QueryProvider>
        <p>contenido</p>
      </QueryProvider>,
    );

    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
