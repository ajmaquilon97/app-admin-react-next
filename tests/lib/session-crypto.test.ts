import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encryptSession,
  decryptSession,
} from "@/lib/auth/session-crypto";

/**
 * Cifrado de la sesión (JWE A256GCM sobre la cookie httpOnly).
 *
 * Es el control que sostiene dos requisitos de seguridad del sistema: los tokens
 * del backend no viajan legibles al navegador y una cookie manipulada no puede
 * suplantar una sesión. Se verifica el viaje de ida y vuelta y, sobre todo, que
 * toda entrada inválida degrade a `null` en vez de lanzar.
 */
const TOKENS = { accessToken: "access-abc", refreshToken: "refresh-xyz" };

describe("constantes de sesión", () => {
  it("la cookie se llama 'session' y dura 7 días", () => {
    expect(SESSION_COOKIE).toBe("session");
    expect(SESSION_MAX_AGE).toBe(7 * 24 * 60 * 60);
  });
});

describe("encryptSession / decryptSession", () => {
  it("descifra el mismo par de tokens que cifró", async () => {
    const jwe = await encryptSession(TOKENS);
    await expect(decryptSession(jwe)).resolves.toEqual(TOKENS);
  });

  it("produce un JWE compacto de 5 segmentos, no el token en claro", async () => {
    const jwe = await encryptSession(TOKENS);
    expect(jwe.split(".")).toHaveLength(5);
    expect(jwe).not.toContain("access-abc");
    expect(jwe).not.toContain("refresh-xyz");
  });

  it("cifra distinto en cada llamada (IV aleatorio)", async () => {
    const [a, b] = await Promise.all([encryptSession(TOKENS), encryptSession(TOKENS)]);
    expect(a).not.toBe(b);
  });

  it.each([
    ["cadena vacía", ""],
    ["texto arbitrario", "no-es-un-jwe"],
    ["un JWE de otra clave", "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..AAAA.BBBB.CCCC"],
  ])("devuelve null ante %s", async (_caso, valor) => {
    await expect(decryptSession(valor)).resolves.toBeNull();
  });

  /** Alterar cualquier byte del ciphertext debe invalidar la etiqueta GCM. */
  it("devuelve null ante un JWE manipulado", async () => {
    const [cabecera, clave, iv, ciphertext, tag] = (await encryptSession(TOKENS)).split(".");
    const manipulado = [cabecera, clave, iv, `${ciphertext}AA`, tag].join(".");

    await expect(decryptSession(manipulado)).resolves.toBeNull();
  });

  it("devuelve null si el payload descifra pero le falta un token", async () => {
    const { EncryptJWT } = await import("jose");
    const key = Uint8Array.from(atob(process.env.SESSION_SECRET!), (c) => c.charCodeAt(0));
    const jwe = await new EncryptJWT({ accessToken: "solo-access" })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .encrypt(key);

    await expect(decryptSession(jwe)).resolves.toBeNull();
  });

  it("falla de forma explícita si falta SESSION_SECRET en el entorno", async () => {
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      await expect(encryptSession(TOKENS)).rejects.toThrow("Falta SESSION_SECRET en el entorno.");
    } finally {
      process.env.SESSION_SECRET = original;
    }
  });
});
