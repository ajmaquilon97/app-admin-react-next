"use client";

import { useState } from "react";
import { X, KeyRound, Copy, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGeneratePinRecepcion } from "../hooks/useBookingActions";

interface Props {
  bookingId: string;
  alreadyIssued: boolean;
  onGenerated: () => void;
  onClose: () => void;
}

function formatExpiracion(iso: string): string {
  return new Date(iso).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" });
}

export function PinRecepcionModal({ bookingId, alreadyIssued, onGenerated, onClose }: Props) {
  const [result, setResult] = useState<{ pin: string; fechaExpiracion: string } | null>(null);
  const generatePin = useGeneratePinRecepcion();

  const handleGenerate = () => {
    generatePin.mutate(
      { bookingId },
      {
        onSuccess: (data) => {
          setResult(data);
          onGenerated();
        },
      },
    );
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.pin);
    toast.success("PIN copiado");
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E3A5F]/10 rounded-lg">
              <KeyRound size={18} className="text-[#1E3A5F]" />
            </div>
            <h3 className="font-bold text-[#1F2937]">
              {result ? "PIN de Recepción" : alreadyIssued ? "Regenerar PIN de Recepción" : "Generar PIN de Recepción"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={16} />
          </button>
        </div>

        {!result && (
          <>
            {alreadyIssued ? (
              <p className="text-sm text-[#1F2937] mb-5">
                Esto invalidará el PIN anterior y cerrará la sesión del kiosco que lo esté usando.
                ¿Continuar?
              </p>
            ) : (
              <p className="text-sm text-[#1F2937] mb-5">
                Se generará un PIN de 6 dígitos para que el personal de recepción valide el ingreso
                en la puerta. El PIN se mostrará <span className="font-semibold">una sola vez</span>:
                no hay forma de volver a consultarlo después.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generatePin.isPending}
                className="flex-1 flex items-center justify-center py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#3A69BD] transition-colors disabled:opacity-50"
              >
                {generatePin.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                {alreadyIssued ? "Regenerar PIN" : "Generar PIN"}
              </button>
            </div>
          </>
        )}

        {result && (
          <>
            <div className="bg-[#F5F7FA] rounded-xl border border-gray-100 p-5 text-center mb-4">
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-[#1F2937]">{result.pin}</p>
              <p className="text-xs text-[#6B7280] mt-2">
                Expira: {formatExpiracion(result.fechaExpiracion)}
              </p>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Este PIN no se podrá volver a ver. Anótalo o cópialo ahora antes de cerrar.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#1F2937] hover:bg-gray-50 transition-colors"
              >
                <Copy size={14} className="mr-2" /> Copiar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#3A69BD] transition-colors"
              >
                Entendido, cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
