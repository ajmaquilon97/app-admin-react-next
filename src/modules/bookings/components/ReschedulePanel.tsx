"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, X } from "lucide-react";
import { rescheduleSchema, type RescheduleForm } from "../schemas";
import type { BookingDetail } from "../types";

interface Props {
  booking: BookingDetail;
  onSubmit: (data: RescheduleForm) => void;
  onClose: () => void;
  loading?: boolean;
}

export function ReschedulePanel({ booking, onSubmit, onClose, loading }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<RescheduleForm>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      newDate: booking.date,
      newStartTime: booking.startTime,
      newEndTime: booking.endTime,
    },
  });

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3B82F6]/10 rounded-lg">
              <ArrowRightLeft size={18} className="text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-bold text-[#1F2937]">Reagendar Reserva</h3>
              <p className="text-xs text-[#6B7280] font-mono">{booking.code}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1">Nueva fecha</label>
            <input
              type="date"
              {...register("newDate")}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3B82F6]/40 focus:outline-none"
            />
            {errors.newDate && <p className="mt-1 text-xs text-[#EF4444]">{errors.newDate.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Hora inicio</label>
              <input
                type="time"
                {...register("newStartTime")}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3B82F6]/40 focus:outline-none"
              />
              {errors.newStartTime && <p className="mt-1 text-xs text-[#EF4444]">{errors.newStartTime.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Hora fin</label>
              <input
                type="time"
                {...register("newEndTime")}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#3B82F6]/40 focus:outline-none"
              />
              {errors.newEndTime && <p className="mt-1 text-xs text-[#EF4444]">{errors.newEndTime.message}</p>}
            </div>
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
              className="flex-1 py-2.5 rounded-xl bg-[#3B82F6] text-white text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Reagendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
