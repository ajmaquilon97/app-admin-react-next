"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Ban } from "lucide-react";
import { cancelBookingSchema, type CancelBookingForm } from "../schemas";

interface Props {
  bookingCode: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export function CancelDialog({ bookingCode, onConfirm, onClose, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<CancelBookingForm>({
    resolver: zodResolver(cancelBookingSchema),
  });

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#EF4444]/10 rounded-lg">
              <Ban size={18} className="text-[#EF4444]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1F2937]">Cancelar Reserva</h3>
              <p className="text-xs text-[#6B7280] font-mono">{bookingCode}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit((d) => onConfirm(d.reason))}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#1F2937] mb-2">
              Motivo de cancelación <span className="text-[#EF4444]">*</span>
            </label>
            <textarea
              {...register("reason")}
              rows={3}
              placeholder="Explica el motivo de la cancelación..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#EF4444]/40 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/10 resize-none"
            />
            {errors.reason && (
              <p className="mt-1 text-xs text-[#EF4444]">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Cancelando..." : "Confirmar cancelación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
