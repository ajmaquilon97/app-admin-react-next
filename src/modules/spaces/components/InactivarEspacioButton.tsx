"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { inactivarEspacio } from "@/actions/spaces";

export function InactivarEspacioButton({ espacioId }: { espacioId: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await inactivarEspacio(espacioId);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-text-muted transition-colors hover:text-error"
      >
        Inactivar
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-warning/10 p-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <h3 className="font-bold text-text-main">Inactivar espacio</h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-sm text-text-muted">
              Al inactivar este espacio <strong className="text-text-main">dejará de recibir reservas nuevas</strong> de inmediato.
            </p>
            <p className="mb-5 text-sm text-text-muted">
              Las reservas que ya te hicieron hasta ahora <strong className="text-text-main">se mantendrán activas</strong> y no se verán afectadas. Podrás reactivar el espacio cuando quieras.
            </p>

            {error && (
              <p className="mb-4 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-error py-2.5 text-sm font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-60"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {pending ? "Inactivando..." : "Sí, inactivar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
