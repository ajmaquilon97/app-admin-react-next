import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import * as authApi from "@/lib/auth-api";
import { createSession } from "@/lib/session";

/**
 * Vuelta del OAuth de Google. El backend redirige aquí con un código de un solo
 * uso (`?code=...`, 60 s) o con `?error=...` si el usuario canceló.
 *
 * Canjeamos el código server-to-server, creamos la sesión (cookie httpOnly) y
 * mandamos al onboarding. Los `redirect()` van fuera del try porque lanzan.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  if (searchParams.get("error")) {
    redirect("/login?error=google");
  }

  const code = searchParams.get("code");
  if (!code) {
    redirect("/login?error=google");
  }

  let ok = false;
  try {
    const tokens = await authApi.exchangeGoogleCode(code);
    await createSession(tokens);
    ok = true;
  } catch {
    ok = false;
  }

  if (!ok) {
    redirect("/login?error=google");
  }

  // Las cuentas federadas también completan el onboarding la primera vez.
  redirect("/onboarding?method=google");
}
