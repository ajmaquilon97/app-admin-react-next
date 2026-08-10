import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata: Metadata = {
  title: "Iniciar sesión — RecreAdmin",
};

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed:
    "Ya existe una cuenta con este correo, pero el email aún no está confirmado. Inicia sesión con tu contraseña y confirma tu correo para poder usar Google.",
  google: "No se pudo completar el inicio de sesión con Google. Inténtalo de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; reset?: string }>;
}) {
  const { error, reset } = await searchParams;
  const oauthError = error ? (OAUTH_ERROR_MESSAGES[error] ?? OAUTH_ERROR_MESSAGES.google) : undefined;

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title text-primary">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-slate-500 font-semibold leading-relaxed">
          Ingresa tus credenciales para acceder a tu portal.
        </p>
      </div>

      {reset === "success" && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2.5 text-sm text-success">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Tu contraseña se actualizó. Inicia sesión con tu nueva contraseña.</span>
        </div>
      )}

      <LoginForm oauthError={oauthError} />

      <div className="mt-5">
        <GoogleButton />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500 font-semibold leading-relaxed">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-secondary hover:text-primary">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
