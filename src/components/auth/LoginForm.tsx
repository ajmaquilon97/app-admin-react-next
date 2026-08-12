"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";

export function LoginForm({ oauthError }: { oauthError?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  const errorMessage = state?.message ?? oauthError;

  return (
    <form action={action} className="space-y-5" noValidate>
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.email && (
          <p className="mt-1.5 text-xs text-error">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-semibold leading-relaxed text-slate-500">
            Contraseña
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-secondary hover:text-primary">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.password && (
          <p className="mt-1.5 text-xs text-error">{state.errors.password[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
