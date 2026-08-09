import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña — RecreAdmin",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title text-primary">Recuperar contraseña</h2>
        <p className="mt-1 text-sm text-slate-500 font-semibold leading-relaxed">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {sent ? (
        <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3.5 text-sm text-success">
          <MailCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>
            Si existe una cuenta asociada a ese correo, te enviamos un enlace para
            restablecer tu contraseña. Revisa tu bandeja de entrada (y la carpeta de spam).
          </span>
        </div>
      ) : (
        <ForgotPasswordForm />
      )}

      <p className="mt-6 text-center text-sm text-slate-500 font-semibold leading-relaxed">
        ¿Ya la recordaste?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:text-primary">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
