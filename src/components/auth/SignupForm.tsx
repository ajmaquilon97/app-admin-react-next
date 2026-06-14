"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signup } from "@/actions/auth";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.message && (
        <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-main">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Carlos Pérez"
          className="block w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.name && (
          <p className="mt-1.5 text-xs text-error">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-main">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          className="block w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.email && (
          <p className="mt-1.5 text-xs text-error">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-main">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="block w-full rounded-xl border border-gray-200 bg-background px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.password ? (
          <ul className="mt-1.5 space-y-0.5">
            {state.errors.password.map((err) => (
              <li key={err} className="text-xs text-error">
                • {err}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-xs text-text-muted">
            Mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-secondary"
          />
          <label htmlFor="terms" className="cursor-pointer text-sm leading-snug text-text-muted">
            He leído y acepto las{" "}
            <Link
              href="/politicas-de-privacidad"
              target="_blank"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Políticas de privacidad
            </Link>{" "}
            y autorizo el tratamiento de mis datos personales.
          </label>
        </div>
        {state?.errors?.terms && (
          <p className="text-xs text-error">{state.errors.terms[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
