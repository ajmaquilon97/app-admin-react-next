/**
 * Server Actions del módulo de configuración.
 *
 * Cubren tres decisiones de diseño que la tesis documenta y que son fáciles de
 * revertir por accidente: el perfil personal y los datos fiscales del negocio se
 * guardan por endpoints separados; `PUT /api/espacios/{id}` no admite parches
 * parciales, así que cambiar el modo de confirmación exige releer y reenviar el
 * espacio completo; y ninguna de estas actions recibe el token como parámetro.
 */

jest.mock("next/navigation", () => ({
  redirect: jest.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
jest.mock("@/lib/auth/session", () => ({ getSessionTokens: jest.fn() }));
jest.mock("@/lib/auth/dal", () => ({ verifySession: jest.fn() }));
jest.mock("@/lib/api/usuarios", () => ({
  getUsuario: jest.fn(),
  completeProfile: jest.fn(),
  checkAvailability: jest.fn(),
  UsuariosError: class UsuariosError extends Error {},
}));
jest.mock("@/lib/api/spaces", () => ({
  getMisEspacios: jest.fn(),
  getEspacioById: jest.fn(),
  updateEspacio: jest.fn(),
  getTiposEspacios: jest.fn(),
}));
jest.mock("@/modules/configuracion/api/negocios", () => ({
  getNegocio: jest.fn(),
  upsertNegocio: jest.fn(),
}));

import * as usuariosApi from "@/lib/api/usuarios";
import * as spacesApi from "@/lib/api/spaces";
import * as negociosApi from "@/modules/configuracion/api/negocios";
import { getSessionTokens } from "@/lib/auth/session";
import { verifySession } from "@/lib/auth/dal";
import * as perfilActions from "@/modules/configuracion/actions/configuracion";
import * as negocioActions from "@/modules/configuracion/actions/negocio";
import * as bookingConfigActions from "@/modules/configuracion/actions/booking-config";
import { espacioOption } from "../helpers/fixtures";

const usuarios = jest.mocked(usuariosApi);
const spaces = jest.mocked(spacesApi);
const negocios = jest.mocked(negociosApi);
const sesion = jest.mocked(getSessionTokens);
const verificarSesion = jest.mocked(verifySession);

const TOKEN = "tok";
const USUARIO = { id: "u1", name: "Ana Pérez", email: "ana@example.com", role: "admin" as const };

beforeEach(() => {
  sesion.mockResolvedValue({ accessToken: TOKEN, refreshToken: "r" });
  verificarSesion.mockResolvedValue(USUARIO);
});

describe("getPerfil", () => {
  it("normaliza a cadena vacía cada campo que el backend deja nulo", async () => {
    usuarios.getUsuario.mockResolvedValue({
      nombre: null,
      apellido: null,
      correo: null,
      fotoPerfilUrl: null,
      rutaFotoCedula: null,
      numeroCedula: null,
      fechaNacimiento: null,
    } as never);

    const perfil = await perfilActions.getPerfil();

    // Los inputs del formulario son controlados: un `null` los volvería
    // no controlados y React emitiría una advertencia al escribir en ellos.
    expect(perfil).toEqual({
      nombre: "",
      apellido: "",
      email: USUARIO.email,
      telefono: "",
      fotoPerfilUrl: "",
      documentoIdentidadUrl: "",
      numeroCedula: "",
      fechaNacimiento: "",
    });
  });

  it("mapea los datos reales del usuario", async () => {
    usuarios.getUsuario.mockResolvedValue({
      nombre: "Ana",
      apellido: "Pérez",
      correo: "ana@negocio.com",
      fotoPerfilUrl: "https://cdn.test/foto.jpg",
      rutaFotoCedula: "https://cdn.test/cedula.jpg",
      numeroCedula: "0912345678",
      fechaNacimiento: "1995-04-02",
    } as never);

    const perfil = await perfilActions.getPerfil();

    expect(perfil).toMatchObject({
      nombre: "Ana",
      apellido: "Pérez",
      email: "ana@negocio.com",
      numeroCedula: "0912345678",
      documentoIdentidadUrl: "https://cdn.test/cedula.jpg",
    });
    expect(usuarios.getUsuario).toHaveBeenCalledWith("u1", TOKEN);
  });

  /** `telefono` no está en `UsuarioResponse`: se gestiona por el flujo de OTP SMS. */
  it("deja el teléfono vacío porque el backend no lo expone en el perfil", async () => {
    usuarios.getUsuario.mockResolvedValue({ nombre: "Ana", telefono: "0999999999" } as never);

    const perfil = await perfilActions.getPerfil();
    expect(perfil.telefono).toBe("");
  });

  it("falla con un mensaje accionable si la sesión expiró", async () => {
    sesion.mockResolvedValue(null);

    await expect(perfilActions.getPerfil()).rejects.toThrow(
      "Tu sesión expiró. Inicia sesión de nuevo.",
    );
  });
});

describe("updatePerfil", () => {
  const perfil = {
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana@negocio.com",
    telefono: "0999999999",
    fotoPerfilUrl: "https://cdn.test/foto.jpg",
    documentoIdentidadUrl: "https://cdn.test/cedula.jpg",
    numeroCedula: "0912345678",
    fechaNacimiento: "1995-04-02",
  };

  it("envía solo los campos del perfil personal", async () => {
    await perfilActions.updatePerfil(perfil);

    expect(usuarios.completeProfile).toHaveBeenCalledWith("u1", TOKEN, {
      nombre: "Ana",
      apellido: "Pérez",
      numeroCedula: "0912345678",
      fechaNacimiento: "1995-04-02",
      rutaFotoCedula: "https://cdn.test/cedula.jpg",
      fotoPerfilUrl: "https://cdn.test/foto.jpg",
    });
  });

  /**
   * `tipoUsuarioId` se omite a propósito: reenviarlo pisaría el rol que el
   * onboarding ya asignó. Y `telefono` no forma parte del request.
   */
  it("no reenvía el rol ni el teléfono", async () => {
    await perfilActions.updatePerfil(perfil);

    const enviado = usuarios.completeProfile.mock.calls[0]![2];
    expect(enviado).not.toHaveProperty("tipoUsuarioId");
    expect(enviado).not.toHaveProperty("telefono");
  });

  it("devuelve el perfil recibido para poblar la caché", async () => {
    await expect(perfilActions.updatePerfil(perfil)).resolves.toEqual(perfil);
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(perfilActions.updatePerfil(perfil)).rejects.toThrow("Tu sesión expiró");
    expect(usuarios.completeProfile).not.toHaveBeenCalled();
  });
});

describe("getNegocio", () => {
  it("devuelve un negocio vacío si el anfitrión aún no lo registró", async () => {
    negocios.getNegocio.mockResolvedValue(null as never);

    await expect(negocioActions.getNegocio()).resolves.toEqual({
      nombreNegocio: "",
      ruc: "",
      razonSocial: "",
      categoria: "",
      direccion: "",
      provinciaId: 0,
      ciudadId: 0,
      telefonoNegocio: "",
      descripcion: "",
      logoUrl: "",
    });
  });

  /** El backend llama `numeroIdentificacion` a lo que la UI muestra como RUC. */
  it("renombra numeroIdentificacion a ruc", async () => {
    negocios.getNegocio.mockResolvedValue({
      nombreNegocio: "Canchas del Sur",
      numeroIdentificacion: "0912345678001",
      razonSocial: "Canchas del Sur S.A.",
      categoria: "Deportivo",
      direccion: "Av. Principal 123",
      provinciaId: 9,
      ciudadId: 90,
      telefonoNegocio: "042345678",
      descripcion: "Complejo deportivo",
      logoUrl: "https://cdn.test/logo.png",
    } as never);

    const negocio = await negocioActions.getNegocio();

    expect(negocio.ruc).toBe("0912345678001");
    expect(negocio.nombreNegocio).toBe("Canchas del Sur");
  });

  it("normaliza a 0 las ubicaciones sin seleccionar", async () => {
    negocios.getNegocio.mockResolvedValue({ nombreNegocio: "X" } as never);

    const negocio = await negocioActions.getNegocio();
    expect(negocio.provinciaId).toBe(0);
    expect(negocio.ciudadId).toBe(0);
  });
});

describe("updateNegocio", () => {
  const negocio = {
    nombreNegocio: "Canchas del Sur",
    ruc: "0912345678001",
    razonSocial: "Canchas del Sur S.A.",
    categoria: "Deportivo",
    direccion: "Av. Principal 123",
    provinciaId: 9,
    ciudadId: 90,
    telefonoNegocio: "042345678",
    descripcion: "Complejo deportivo",
    logoUrl: "https://cdn.test/logo.png",
  };

  /** Ante el SRI, el tipo de identificación de un RUC es siempre "04". */
  it("fija el tipo de identificación en 04 (RUC)", async () => {
    await negocioActions.updateNegocio(negocio);

    expect(negocios.upsertNegocio).toHaveBeenCalledWith(
      TOKEN,
      expect.objectContaining({ tipoIdentificacion: "04", numeroIdentificacion: "0912345678001" }),
    );
  });

  it("omite las ubicaciones sin seleccionar en vez de enviar 0", async () => {
    await negocioActions.updateNegocio({ ...negocio, provinciaId: 0, ciudadId: 0 });

    expect(negocios.upsertNegocio).toHaveBeenCalledWith(
      TOKEN,
      expect.objectContaining({ provinciaId: undefined, ciudadId: undefined }),
    );
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(negocioActions.updateNegocio(negocio)).rejects.toThrow("Tu sesión expiró");
    expect(negocios.upsertNegocio).not.toHaveBeenCalled();
  });
});

describe("getBookingConfigs", () => {
  it("no consulta el backend si el anfitrión no tiene espacios", async () => {
    await expect(bookingConfigActions.getBookingConfigs([])).resolves.toEqual([]);
    expect(spaces.getMisEspacios).not.toHaveBeenCalled();
  });

  it("cruza cada espacio con su modo de confirmación", async () => {
    spaces.getMisEspacios.mockResolvedValue([
      { id: 1, modoConfirmacion: "solicitud_aprobacion" },
      { id: 2, modoConfirmacion: "pago_confirmacion_manual" },
    ] as never);

    const configs = await bookingConfigActions.getBookingConfigs([
      espacioOption({ id: 1, nombre: "Cancha Norte" }),
      espacioOption({ id: 2, nombre: "Piscina" }),
    ]);

    expect(configs).toEqual([
      { espacioId: 1, espacioNombre: "Cancha Norte", modo: "solicitud_aprobacion" },
      { espacioId: 2, espacioNombre: "Piscina", modo: "pago_confirmacion_manual" },
    ]);
  });

  it.each([
    ["null", null],
    ["un valor desconocido", "modo_inventado"],
  ])("cae en confirmación inmediata cuando el modo es %s", async (_caso, modo) => {
    spaces.getMisEspacios.mockResolvedValue([{ id: 1, modoConfirmacion: modo }] as never);

    const configs = await bookingConfigActions.getBookingConfigs([espacioOption({ id: 1 })]);
    expect(configs[0]!.modo).toBe("inmediata");
  });

  it("cae en inmediata si el espacio no aparece en mis-espacios", async () => {
    spaces.getMisEspacios.mockResolvedValue([] as never);

    const configs = await bookingConfigActions.getBookingConfigs([espacioOption({ id: 99 })]);
    expect(configs[0]!.modo).toBe("inmediata");
  });
});

describe("updateBookingConfig", () => {
  const espacioActual = {
    id: 1,
    titulo: "Cancha Norte",
    descripcion: "Cancha de césped sintético",
    propietarioId: "u1",
    tipoEspacioId: 3,
    provinciaId: 9,
    ciudadId: 90,
    linkUbicacion: "https://maps.test/x",
    referencia: "Junto al parque",
    latitud: -2.17,
    longitud: -79.92,
    validarAforo: true,
    maxCapacidad: 20,
    imagenPortada: "https://cdn.test/portada.jpg",
    imagenesGaleria: ["https://cdn.test/1.jpg"],
    modoConfirmacion: "inmediata",
  };

  /**
   * El PUT no acepta parches parciales: si se enviara solo `modoConfirmacion`,
   * el backend borraría el resto de los datos del espacio.
   */
  it("relee el espacio y lo reenvía completo con el modo cambiado", async () => {
    spaces.getEspacioById.mockResolvedValue(espacioActual as never);

    await bookingConfigActions.updateBookingConfig(1, "Cancha Norte", "solicitud_aprobacion");

    expect(spaces.getEspacioById).toHaveBeenCalledWith(1, TOKEN);
    expect(spaces.updateEspacio).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        titulo: "Cancha Norte",
        descripcion: "Cancha de césped sintético",
        tipoEspacioId: 3,
        latitud: -2.17,
        longitud: -79.92,
        validarAforo: true,
        maxCapacidad: 20,
        imagenesGaleria: ["https://cdn.test/1.jpg"],
        modoConfirmacion: "solicitud_aprobacion",
      }),
      TOKEN,
    );
  });

  it("normaliza los textos nulos del espacio a cadena vacía", async () => {
    spaces.getEspacioById.mockResolvedValue({
      ...espacioActual,
      titulo: null,
      descripcion: null,
      propietarioId: null,
      linkUbicacion: null,
      referencia: null,
    } as never);

    await bookingConfigActions.updateBookingConfig(1, "Cancha Norte", "inmediata");

    expect(spaces.updateEspacio).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ titulo: "", descripcion: "", propietarioId: "", referencia: "" }),
      TOKEN,
    );
  });

  it("convierte las coordenadas nulas en undefined para omitirlas del JSON", async () => {
    spaces.getEspacioById.mockResolvedValue({
      ...espacioActual,
      latitud: null,
      longitud: null,
      provinciaId: null,
      ciudadId: null,
    } as never);

    await bookingConfigActions.updateBookingConfig(1, "Cancha Norte", "inmediata");

    expect(spaces.updateEspacio).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        latitud: undefined,
        longitud: undefined,
        provinciaId: undefined,
        ciudadId: undefined,
      }),
      TOKEN,
    );
  });

  it("devuelve la configuración ya aplicada", async () => {
    spaces.getEspacioById.mockResolvedValue(espacioActual as never);

    await expect(
      bookingConfigActions.updateBookingConfig(1, "Cancha Norte", "pago_confirmacion_manual"),
    ).resolves.toEqual({
      espacioId: 1,
      espacioNombre: "Cancha Norte",
      modo: "pago_confirmacion_manual",
    });
  });

  it("exige sesión activa", async () => {
    sesion.mockResolvedValue(null);

    await expect(
      bookingConfigActions.updateBookingConfig(1, "Cancha Norte", "inmediata"),
    ).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(spaces.updateEspacio).not.toHaveBeenCalled();
  });
});
