import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Agora",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  // Enlace incompleto o manipulado — no hay nada que mostrar en un formulario.
  if (!token || !email) {
    return (
      <div>
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3.5 text-sm text-error">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>Este enlace de recuperación no es válido o está incompleto.</span>
        </div>
        <Link
          href="/forgot-password"
          className="font-semibold text-secondary hover:text-primary"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title text-primary">Elige una nueva contraseña</h2>
        <p className="mt-1 text-sm text-slate-500 font-semibold leading-relaxed">
          Ingresa y confirma la nueva contraseña para <span className="text-text-main">{email}</span>.
        </p>
      </div>

      <ResetPasswordForm token={token} email={email} />
    </div>
  );
}
