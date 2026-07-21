"use client";

import { Users, CheckCircle2, MessageSquare, MoreVertical } from "lucide-react";
import { useBookings } from "../hooks/useBookings";
import { useConfirmBooking } from "../hooks/useBookingActions";
import { BOOKING_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "../constants";
import type { Booking, BookingFilters } from "../types";

function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-2 w-20 bg-gray-50 rounded" />
            </div>
            <div className="hidden md:block h-3 w-28 bg-gray-100 rounded" />
            <div className="h-6 w-20 bg-gray-100 rounded-md" />
            <div className="h-6 w-16 bg-gray-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  filters: BookingFilters;
  selectedId: string | null;
  onSelect: (b: Booking) => void;
}

export function BookingsTable({ filters, selectedId, onSelect }: Props) {
  const { data, isLoading, isError } = useBookings(filters);
  const confirm = useConfirmBooking();

  if (isLoading) return <TableSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <p className="text-[#EF4444] font-medium">Error al cargar las reservas.</p>
        <p className="text-sm text-[#6B7280] mt-1">Intenta recargar la página.</p>
      </div>
    );
  }

  const bookings = data?.items ?? [];

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
        <p className="text-[#1F2937] font-semibold">No hay reservas</p>
        <p className="text-sm text-[#6B7280] mt-1">Ajusta los filtros o crea una nueva reserva.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(31,41,55,0.05)] border border-gray-100/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr>
              {["Cliente", "Detalle Reserva", "Pax", "Estado", "Pago", "Acciones"].map((h, i) => (
                <th
                  key={h}
                  className={`py-4 px-6 border-b border-gray-100 text-[#6B7280] font-semibold text-xs uppercase tracking-wider bg-gray-50/50${i === 5 ? " text-right" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => onSelect(booking)}
                className={`hover:bg-[#F5F7FA]/50 transition-colors cursor-pointer group ${
                  selectedId === booking.id ? "bg-[#F5F7FA]" : ""
                }`}
              >
                {/* Cliente */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${booking.client.avatarColor}`}>
                      {booking.client.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1F2937] text-sm group-hover:text-[#487AD0] transition-colors">
                        {booking.client.name}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5 font-mono">{booking.code}</p>
                    </div>
                  </div>
                </td>

                {/* Detalle */}
                <td className="py-4 px-6">
                  <p className="font-medium text-[#1F2937] text-sm">{booking.spaceName}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{booking.dateDisplay} • {booking.timeDisplay}</p>
                </td>

                {/* Pax */}
                <td className="py-4 px-6">
                  <div className="flex items-center text-sm text-[#6B7280]">
                    <Users size={14} className="mr-1.5 opacity-70" />
                    {booking.pax ?? "—"}
                  </div>
                </td>

                {/* Estado */}
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${BOOKING_STATUS_STYLES[booking.status]}`}>
                    {booking.status}
                  </span>
                </td>

                {/* Pago */}
                <td className="py-4 px-6">
                  <div>
                    <p className="font-semibold text-[#1F2937] text-sm">${booking.total.toFixed(2)}</p>
                    <p className={`text-[10px] font-bold uppercase mt-1 inline-flex px-1.5 py-0.5 rounded ${PAYMENT_STATUS_STYLES[booking.paymentStatus]}`}>
                      {booking.paymentStatus}
                    </p>
                  </div>
                </td>

                {/* Acciones */}
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {booking.status === "Pendiente" && (
                      <button
                        type="button"
                        className="p-1.5 text-[#27AE60] hover:bg-[#27AE60]/10 rounded-md transition-colors"
                        title="Confirmar"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirm.mutate({ bookingId: booking.id });
                        }}
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1.5 text-[#487AD0] hover:bg-[#487AD0]/10 rounded-md transition-colors"
                      title="Contactar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-[#1F2937] hover:bg-gray-100 rounded-md transition-colors"
                      title="Opciones"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-sm text-[#6B7280]">
          <span>{data.total} reservas en total</span>
          <span>Página {data.page} de {data.totalPages}</span>
        </div>
      )}
    </div>
  );
}
