"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { activarEspacio } from "../actions/spaces";

export function ActivarEspacioButton({ espacioId }: { espacioId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await activarEspacio(espacioId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary-hover disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {pending ? "Activando..." : "Activar"}
      </button>
      {error && (
        <p className="absolute bottom-full right-0 z-10 mb-1.5 w-56 rounded-lg border border-error/20 bg-white px-2.5 py-1.5 text-xs text-error shadow-md">
          {error}
        </p>
      )}
    </div>
  );
}
