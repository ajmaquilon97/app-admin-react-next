import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as authApi from "@/lib/auth/api";
import { createSession } from "@/lib/auth/session";

/**
 * Vuelta del OAuth de Google. El backend redirige aquí con un código de un solo
 * uso (`?code=...`, 60 s) o con `?error=...` si el usuario canceló.
 *
 * Canjeamos el código server-to-server, creamos la sesión (cookie httpOnly) y
 * mandamos al onboarding. Los `redirect()` van fuera del try porque lanzan.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const backendError = searchParams.get("error");
  if (backendError) {
    console.error("[auth/google] el backend volvió con error=", backendError);
    // Solo reenviamos códigos conocidos — cualquier otro cae al mensaje genérico.
    const KNOWN_ERRORS = ["email_not_confirmed"];
    const code = KNOWN_ERRORS.includes(backendError) ? backendError : "google";
    redirect(`/login?error=${code}`);
  }

  const code = searchParams.get("code");
  if (!code) {
    console.error("[auth/google] falta el parámetro code en la vuelta:", searchParams.toString());
    redirect("/login?error=google");
  }

  let ok = false;
  try {
    const tokens = await authApi.exchangeGoogleCode(code);
    await createSession(tokens);
    // DEBUG — quitar antes de producción
    try {
      const payload = JSON.parse(Buffer.from(tokens.accessToken.split(".")[1]!, "base64").toString());
      console.log("[auth/google] login exitoso — claims JWT:", payload);
    } catch {
      console.log("[auth/google] login exitoso — token:", tokens.accessToken);
    }
    ok = true;
  } catch (err) {
    console.error("[auth/google] exchangeGoogleCode falló:", err);
    ok = false;
  }

  if (!ok) {
    redirect("/login?error=google");
  }

  // /onboarding decide si ya completó todo (a /dashboard) o en qué paso
  // continuar — cubre tanto el primer login federado como uno posterior si
  // quedó a medias.
  redirect("/onboarding");
}
