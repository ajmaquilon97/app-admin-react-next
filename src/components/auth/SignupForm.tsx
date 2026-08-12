"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { checkEmailAvailability } from "@/lib/actions/usuarios";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef  = useRef<HTMLInputElement>(null);
  const emailRef     = useRef<HTMLInputElement>(null);
  const passwordRef  = useRef<HTMLInputElement>(null);

  // Verificación temprana de disponibilidad del correo (al salir del campo).
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, startEmailCheck] = useTransition();
  const lastCheckedEmail = useRef<string>("");

  const handleEmailBlur = () => {
    const email = emailRef.current?.value.trim() ?? "";
    if (!email || !email.includes("@") || email === lastCheckedEmail.current) return;
    lastCheckedEmail.current = email;
    startEmailCheck(async () => {
      const result = await checkEmailAvailability(email);
      setEmailTaken(!result.available);
    });
  };

  useEffect(() => {
    if (state?.errors) {
      if (state.errors.firstName) { firstNameRef.current?.focus(); return; }
      if (state.errors.lastName)  { lastNameRef.current?.focus();  return; }
      if (state.errors.email)     { emailRef.current?.focus();     return; }
      if (state.errors.password)  { passwordRef.current?.focus();  return; }
      return;
    }
    // Error genérico del backend (ej. "Ya existe una cuenta con este correo").
    if (state?.message) emailRef.current?.focus();
  }, [state]);

  return (
    <form action={action} className="space-y-5" noValidate>
      {state?.message && (
        <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2.5 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
            Nombres
          </label>
          <input
            ref={firstNameRef}
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Carlos"
            defaultValue={state?.values?.firstName ?? ""}
            className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
          {state?.errors?.firstName && (
            <p className="mt-1.5 text-xs text-error">{state.errors.firstName[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
            Apellidos
          </label>
          <input
            ref={lastNameRef}
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Pérez"
            defaultValue={state?.values?.lastName ?? ""}
            className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
          />
          {state?.errors?.lastName && (
            <p className="mt-1.5 text-xs text-error">{state.errors.lastName[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
          Correo electrónico
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          defaultValue={state?.values?.email ?? ""}
          onBlur={handleEmailBlur}
          onChange={() => { if (emailTaken) setEmailTaken(false); lastCheckedEmail.current = ""; }}
          className="block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-text-main placeholder-text-muted shadow-sm transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
        {state?.errors?.email ? (
          <p className="mt-1.5 text-xs text-error">{state.errors.email[0]}</p>
        ) : checkingEmail ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> Verificando disponibilidad…
          </p>
        ) : emailTaken ? (
          <p className="mt-1.5 text-xs text-error">Ya existe una cuenta con este correo.</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold leading-relaxed text-slate-500">
          Contraseña
        </label>
        <input
          ref={passwordRef}
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

      <div className="space-y-1.5">
        <div className="flex items-start gap-3">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 accent-secondary"
          />
          <label htmlFor="terms" className="cursor-pointer text-sm font-semibold leading-relaxed text-slate-500">
            He leído y acepto los{" "}
            <Link
              href="/terminos-y-condiciones"
              target="_blank"
              className="font-semibold text-secondary underline underline-offset-2 hover:text-primary"
            >
              Términos y condiciones
            </Link>{" "}
            y las{" "}
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
