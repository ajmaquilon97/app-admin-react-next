import {
  ROLES,
  LoginSchema,
  SignupSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@/lib/auth/definitions";

/**
 * Esquemas Zod de autenticación.
 *
 * Son la primera línea de validación del servidor: las Server Actions de
 * `lib/actions/auth.ts` son endpoints alcanzables desde el navegador, así que
 * ningún dato llega "ya validado" desde el formulario. Se prueban aquí las
 * reglas de negocio (política de contraseñas, aceptación de términos,
 * coincidencia de confirmación) de forma aislada de React.
 */

describe("ROLES", () => {
  it("el RBAC del portal solo contempla admin y staff", () => {
    expect(ROLES).toEqual(["admin", "staff"]);
  });
});

describe("LoginSchema", () => {
  it("acepta credenciales bien formadas", () => {
    const r = LoginSchema.safeParse({ email: "ana@example.com", password: "x" });
    expect(r.success).toBe(true);
  });

  /**
   * En Zod 4 `.trim()` es una transformación que corre **después** de las
   * validaciones de la cadena, no antes: `z.email().trim()` valida el valor tal
   * cual llegó. Se documenta como comportamiento observado —un correo pegado con
   * espacios alrededor se rechaza— para que un cambio futuro de este orden
   * (p. ej. recortar en el formulario) haga fallar la prueba en vez de pasar
   * inadvertido.
   */
  it("valida el correo antes de recortarlo: los espacios alrededor lo invalidan", () => {
    const r = LoginSchema.safeParse({ email: "  ana@example.com  ", password: "x" });
    expect(r.success).toBe(false);
  });

  it("recorta el correo ya validado", () => {
    const r = LoginSchema.safeParse({ email: "ana@example.com", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ana@example.com");
  });

  it.each(["", "ana", "ana@", "@example.com", "ana example.com"])(
    "rechaza el correo inválido %p",
    (email) => {
      const r = LoginSchema.safeParse({ email, password: "x" });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.message === "Ingresa un correo válido.")).toBe(true);
      }
    },
  );

  it("exige contraseña no vacía", () => {
    const r = LoginSchema.safeParse({ email: "ana@example.com", password: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "La contraseña es obligatoria.")).toBe(true);
    }
  });
});

describe("SignupSchema", () => {
  const valido = {
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana@example.com",
    password: "secreta123",
    terms: true,
  };

  it("acepta un registro completo", () => {
    expect(SignupSchema.safeParse(valido).success).toBe(true);
  });

  it.each([
    ["contraseña corta", "abc123", "Debe tener al menos 8 caracteres."],
    ["contraseña sin letras", "12345678", "Debe incluir al menos una letra."],
    ["contraseña sin números", "abcdefgh", "Debe incluir al menos un número."],
  ])("rechaza %s", (_caso, password, mensaje) => {
    const r = SignupSchema.safeParse({ ...valido, password });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === mensaje)).toBe(true);
  });

  it("acumula todos los incumplimientos de la política de contraseña", () => {
    const r = SignupSchema.safeParse({ ...valido, password: "abc" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const mensajes = r.error.issues.filter((i) => i.path[0] === "password").map((i) => i.message);
      expect(mensajes).toContain("Debe tener al menos 8 caracteres.");
      expect(mensajes).toContain("Debe incluir al menos un número.");
    }
  });

  it.each([
    ["nombre", "firstName", "El nombre debe tener al menos 2 caracteres."],
    ["apellido", "lastName", "El apellido debe tener al menos 2 caracteres."],
  ])("exige al menos 2 caracteres en el %s", (_caso, campo, mensaje) => {
    const r = SignupSchema.safeParse({ ...valido, [campo]: "A" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === mensaje)).toBe(true);
  });

  /**
   * Consentimiento explícito de tratamiento de datos: sin la casilla marcada el
   * registro no procede (LOPDP, art. 7 — consentimiento libre e informado).
   */
  it("no permite registrarse sin aceptar las políticas de privacidad", () => {
    const r = SignupSchema.safeParse({ ...valido, terms: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) =>
          i.message.includes("Debes aceptar las políticas de privacidad"),
        ),
      ).toBe(true);
    }
  });
});

describe("ForgotPasswordSchema", () => {
  it("solo requiere un correo válido", () => {
    expect(ForgotPasswordSchema.safeParse({ email: "ana@example.com" }).success).toBe(true);
    expect(ForgotPasswordSchema.safeParse({ email: "roto" }).success).toBe(false);
  });
});

describe("ResetPasswordSchema", () => {
  const valido = {
    email: "ana@example.com",
    token: "tok-123",
    password: "secreta123",
    confirmPassword: "secreta123",
  };

  it("acepta un restablecimiento coherente", () => {
    expect(ResetPasswordSchema.safeParse(valido).success).toBe(true);
  });

  it("señala el campo de confirmación cuando las contraseñas no coinciden", () => {
    const r = ResetPasswordSchema.safeParse({ ...valido, confirmPassword: "otra12345" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.path[0] === "confirmPassword");
      expect(issue?.message).toBe("Las contraseñas no coinciden.");
    }
  });

  it("exige el token del enlace de recuperación", () => {
    expect(ResetPasswordSchema.safeParse({ ...valido, token: "" }).success).toBe(false);
  });

  it("aplica la misma política de contraseña que el registro", () => {
    const r = ResetPasswordSchema.safeParse({
      ...valido,
      password: "corta1",
      confirmPassword: "corta1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === "Debe tener al menos 8 caracteres.")).toBe(
        true,
      );
    }
  });
});
