"use client";

import { useActionState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { resetPassword } from "@/lib/actions/auth";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />

      {state?.message && (
        <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
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
          <p className="mt-1.5 text-xs font-semibold leading-relaxed text-slate-500">
            Mínimo 8 caracteres, con al menos una letra y un número.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.confirmPassword && (
          <p className="mt-1.5 text-xs text-error">{state.errors.confirmPassword[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Guardando…" : "Guardar nueva contraseña"}
      </button>
    </form>
  );
}
