"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, X } from "lucide-react";
import { paymentSchema, type PaymentForm } from "../schemas";
import type { BookingDetail } from "../types";

interface Props {
  booking: BookingDetail;
  onSubmit: (data: PaymentForm) => void;
  onClose: () => void;
  loading?: boolean;
}

export function PaymentPanel({ booking, onSubmit, onClose, loading }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { type: "partial" },
  });

  const type = watch("type");

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#27AE60]/10 rounded-lg">
              <CreditCard size={18} className="text-[#27AE60]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1F2937]">Registrar Pago</h3>
              <p className="text-xs text-[#6B7280] font-mono">{booking.code}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Resumen del pago */}
        <div className="mb-5 rounded-xl bg-[#F5F7FA] p-4 text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-[#6B7280]">Total</span>
            <span className="font-semibold">${booking.payment.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-[#6B7280]">Pagado</span>
            <span className="font-semibold text-[#27AE60]">${booking.payment.paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
            <span className="text-[#6B7280]">Pendiente</span>
            <span className="font-bold text-[#F59E0B]">${booking.payment.pending.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-2">Tipo de operación</label>
            <div className="grid grid-cols-3 gap-2">
              {(["partial", "full", "refund"] as const).map((t) => (
                <label key={t} className="cursor-pointer">
                  <input type="radio" {...register("type")} value={t} className="sr-only" />
                  <div className={`text-center py-2 rounded-lg border text-xs font-medium transition-colors ${
                    type === t
                      ? t === "refund"
                        ? "border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]"
                        : "border-[#27AE60] bg-[#27AE60]/10 text-[#27AE60]"
                      : "border-gray-200 text-[#6B7280] hover:bg-gray-50"
                  }`}>
                    {t === "partial" ? "Parcial" : t === "full" ? "Completo" : "Reembolso"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">Monto ($)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount", { valueAsNumber: true })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#27AE60]/40 focus:outline-none"
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-xs text-[#EF4444]">{errors.amount.message}</p>}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">Notas (opcional)</label>
            <input
              type="text"
              {...register("notes")}
              placeholder="Referencia de pago, banco, etc."
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#27AE60]/40 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#27AE60] text-white text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
