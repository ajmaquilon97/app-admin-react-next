import type { Metadata } from "next";
import Link from "next/link";
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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const oauthError = error ? (OAUTH_ERROR_MESSAGES[error] ?? OAUTH_ERROR_MESSAGES.google) : undefined;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-slate-500 font-semibold leading-relaxed">
          Ingresa tus credenciales para acceder a tu portal.
        </p>
      </div>

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

      <p className="mt-8 rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-center text-xs text-text-main">
        Demo: <span className="font-medium text-text-main">admin@recreadmin.com</span>{" "}
        / <span className="font-medium text-text-main">Admin123</span>
      </p>
    </div>
  );
}
