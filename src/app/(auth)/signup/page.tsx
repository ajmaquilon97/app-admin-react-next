import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const metadata: Metadata = {
  title: "Crear cuenta — RecreAdmin",
};

export default function SignupPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Crea tu cuenta</h2>
        <p className="mt-1 text-sm text-slate-500 font-semibold leading-relaxed">
          Empieza a administrar tus espacios en minutos.
        </p>
      </div>

      <SignupForm />

      <div className="mt-5">
        <GoogleButton showConsent />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500 font-semibold leading-relaxed">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-secondary hover:text-primary">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
