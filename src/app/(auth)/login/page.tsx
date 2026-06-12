import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata: Metadata = {
  title: "Iniciar sesión — RecreAdmin",
};

export default function LoginPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-main">Bienvenido de nuevo</h2>
        <p className="mt-1 text-sm text-text-muted">
          Ingresa tus credenciales para acceder a tu portal.
        </p>
      </div>

      <LoginForm />

      <div className="mt-5">
        <GoogleButton />
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-semibold text-secondary hover:text-primary">
          Regístrate
        </Link>
      </p>

      <p className="mt-8 rounded-lg border border-gray-200 bg-surface px-3 py-2.5 text-center text-xs text-text-muted">
        Demo: <span className="font-medium text-text-main">admin@recreadmin.com</span>{" "}
        / <span className="font-medium text-text-main">Admin123</span>
      </p>
    </div>
  );
}
