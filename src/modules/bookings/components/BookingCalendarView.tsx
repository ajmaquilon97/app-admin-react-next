"use client";

import { CalendarDays } from "lucide-react";

export function BookingCalendarView() {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 flex items-center justify-center h-96 text-center">
      <div>
        <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-4 text-[#1E3A5F]">
          <CalendarDays size={24} />
        </div>
        <h3 className="text-lg font-bold text-[#1F2937]">Vista de Calendario (Lectura)</h3>
        <p className="text-sm text-[#6B7280] mt-1 max-w-sm mx-auto">
          Esta vista muestra las reservas en formato calendario. Para editar la disponibilidad ve al módulo "Agenda".
        </p>
      </div>
    </div>
  );
}
