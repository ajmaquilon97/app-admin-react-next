"use client";

import { useState } from "react";
import {
  X, UserCheck, MapPin, CheckCircle2, CreditCard,
  MessageSquare, ArrowRightLeft, Ban, Phone, Mail, Loader2, KeyRound,
} from "lucide-react";
import { useBookingDetail } from "../hooks/useBookingDetail";
import {
  useConfirmBooking,
  useCancelBooking,
  useRescheduleBooking,
  useRegisterPayment,
  useRegisterAttendance,
} from "../hooks/useBookingActions";
import { BOOKING_STATUS_STYLES, PAYMENT_STATUS_STYLES } from "../constants";
import { getTimelineDotColor } from "../utils";
import { CancelDialog } from "./CancelDialog";
import { ReschedulePanel } from "./ReschedulePanel";
import { PaymentPanel } from "./PaymentPanel";
import { PinRecepcionModal } from "./PinRecepcionModal";
import type { Booking } from "../types";
import type { RescheduleForm, PaymentForm } from "../schemas";

type Panel = "cancel" | "reschedule" | "payment" | "pin" | null;

interface Props {
  booking: Booking;
  onClose: () => void;
}

export function BookingDetailDrawer({ booking: bookingPreview, onClose }: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  const [pinIssued, setPinIssued] = useState(false);
  const { data: booking, isLoading } = useBookingDetail(bookingPreview.id);

  const confirm = useConfirmBooking();
  const cancel = useCancelBooking();
  const reschedule = useRescheduleBooking();
  const payment = useRegisterPayment();
  const attendance = useRegisterAttendance();

  // Usar datos del detalle si ya cargaron, sino usar el preview de la tabla
  const b = booking ?? { ...bookingPreview, payment: { total: bookingPreview.total, paid: 0, pending: bookingPreview.total, status: bookingPreview.paymentStatus }, timeline: [] };

  const handleConfirm = () => {
    confirm.mutate({ bookingId: b.id });
  };

  const handleCancel = (reason: string) => {
    cancel.mutate({ bookingId: b.id, reason }, { onSuccess: () => setPanel(null) });
  };

  const handleReschedule = (data: RescheduleForm) => {
    reschedule.mutate(
      { bookingId: b.id, ...data },
      { onSuccess: () => setPanel(null) },
    );
  };

  const handlePayment = (data: PaymentForm) => {
    payment.mutate(
      { bookingId: b.id, ...data },
      { onSuccess: () => setPanel(null) },
    );
  };

  const handleAttendance = (status: "Asistió" | "No asistió") => {
    attendance.mutate({ bookingId: b.id, status });
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-[2px] z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#F5F7FA] shadow-2xl z-50 border-l border-gray-200 flex flex-col">

        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="modal-title">Detalle de Reserva</h2>
            <p className="text-xs font-mono text-text-muted mt-0.5">{b.code}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}

          {/* Estado + Pago */}
          <div className="flex gap-3">
            <div className={`flex-1 p-3 rounded-xl border flex flex-col justify-center items-center text-center ${BOOKING_STATUS_STYLES[b.status]}`}>
              <span className="text-[10px] uppercase font-bold opacity-70 mb-1">Estado</span>
              <span className="font-semibold text-sm">{b.status}</span>
            </div>
            <div className={`flex-1 p-3 rounded-xl border border-transparent flex flex-col justify-center items-center text-center ${PAYMENT_STATUS_STYLES[b.paymentStatus]}`}>
              <span className="text-[10px] uppercase font-bold opacity-70 mb-1">Pago</span>
              <span className="font-semibold text-sm">{b.paymentStatus}</span>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="overline mb-4 flex items-center">
              <UserCheck size={14} className="mr-2" /> Datos del Cliente
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${b.client.avatarColor}`}>
                {b.client.initials}
              </div>
              <div>
                <p className="font-bold text-text-main">{b.client.name}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex items-center text-sm">
                <Phone size={14} className="text-gray-400 mr-3 w-5" />
                <span className="text-text-main font-medium">{b.client.phone ?? "—"}</span>
              </div>
              <div className="flex items-center text-sm">
                <Mail size={14} className="text-gray-400 mr-3 w-5" />
                <span className="text-text-main font-medium">{b.client.email}</span>
              </div>
            </div>
          </div>

          {/* Espacio */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="overline mb-4 flex items-center">
              <MapPin size={14} className="mr-2" /> Espacio Reservado
            </h3>
            <p className="font-semibold text-text-main text-lg mb-4">{b.spaceName}</p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="text-xs text-gray-400 mb-1">{b.archetype === "cupo_compartido" ? "Fecha" : "Fecha y Hora"}</p>
                <p className="text-sm font-medium text-text-main">{b.dateDisplay}</p>
                <p className="text-sm text-text-muted">
                  {b.archetype === "cupo_compartido" ? "Entrada de día completo" : b.timeDisplay}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">{b.archetype === "cupo_compartido" ? "Entradas" : "Asistentes"}</p>
                <p className="text-sm font-medium text-text-main">
                  {b.pax == null
                    ? "—"
                    : b.archetype === "cupo_compartido"
                      ? `${b.pax} entradas`
                      : `${b.pax} personas`}
                </p>
              </div>
            </div>
            {b.notes && (
              <div className="pt-4 border-t border-gray-50 mt-4">
                <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                <p className="text-sm text-text-main bg-[#F5F7FA] p-3 rounded-lg border border-gray-100">
                  &quot;{b.notes}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Asistencia */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="overline mb-3">Asistencia</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAttendance("Asistió")}
                disabled={attendance.isPending}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                  b.attendance === "Asistió"
                    ? "bg-[#27AE60]/10 border-[#27AE60]/30 text-[#27AE60]"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                Asistió
              </button>
              <button
                type="button"
                onClick={() => handleAttendance("No asistió")}
                disabled={attendance.isPending}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                  b.attendance === "No asistió"
                    ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                No asistió
              </button>
            </div>
          </div>

          {/* Control de acceso */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="overline mb-3 flex items-center">
              <KeyRound size={14} className="mr-2" /> Control de Acceso
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Genera el PIN que el anfitrión entrega al personal de recepción para validar el ingreso en la puerta.
            </p>
            <button
              type="button"
              onClick={() => setPanel("pin")}
              className="w-full flex items-center justify-center py-2 px-3 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <KeyRound size={15} className="mr-1.5 text-gray-400" />
              {pinIssued ? "Regenerar PIN" : "Generar PIN de Recepción"}
            </button>
          </div>

          {/* Timeline */}
          {booking && booking.timeline.length > 0 && (
            <div className="pt-2">
              <h3 className="overline mb-4">Línea de Tiempo</h3>
              <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-4">
                {booking.timeline.map((event) => {
                  const dots = getTimelineDotColor(event.type).split(" ");
                  return (
                    <div key={event.id} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white ${dots[1]} flex items-center justify-center`}>
                        <div className={`w-2 h-2 rounded-full ${dots[0]}`} />
                      </div>
                      <p className="text-sm font-semibold text-text-main">{event.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{event.date} • {event.time}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer de acciones */}
        <div className="bg-white p-5 border-t border-gray-100 shrink-0 space-y-3">
          {b.status === "Pendiente" && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirm.isPending}
              className="w-full flex items-center justify-center py-2.5 px-4 bg-[#27AE60] text-white rounded-lg hover:bg-[#219653] transition-colors font-medium text-sm shadow-md disabled:opacity-50"
            >
              {confirm.isPending
                ? <Loader2 size={16} className="mr-2 animate-spin" />
                : <CheckCircle2 size={16} className="mr-2" />}
              Confirmar Reserva
            </button>
          )}

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPanel("payment")}
              className="flex items-center justify-center py-2 px-3 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <CreditCard size={15} className="mr-1.5 text-gray-400" /> Pagar
            </button>
            <a
              href={`mailto:${b.client.email}`}
              className="flex items-center justify-center py-2 px-3 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <MessageSquare size={15} className="mr-1.5 text-gray-400" /> Mensaje
            </a>
            {b.client.phone ? (
              <a
                href={`tel:${b.client.phone}`}
                className="flex items-center justify-center py-2 px-3 bg-white border border-gray-200 text-text-main rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Phone size={15} className="mr-1.5 text-gray-400" /> Llamar
              </a>
            ) : (
              <span
                title="Sin teléfono registrado"
                className="flex items-center justify-center py-2 px-3 bg-white border border-gray-200 text-gray-300 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                <Phone size={15} className="mr-1.5 text-gray-300" /> Llamar
              </span>
            )}
          </div>

          {(b.status === "Pendiente" || b.status === "Confirmada" || b.status === "Reagendada") && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPanel("reschedule")}
                className="flex items-center justify-center py-2 px-4 text-text-muted hover:text-text-main transition-colors text-xs font-medium"
              >
                <ArrowRightLeft size={14} className="mr-1.5" /> Reagendar
              </button>
              <button
                type="button"
                onClick={() => setPanel("cancel")}
                className="flex items-center justify-center py-2 px-4 text-[#EF4444] hover:bg-[#EF4444]/5 rounded-lg transition-colors text-xs font-medium"
              >
                <Ban size={14} className="mr-1.5" /> Cancelar reserva
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paneles modales */}
      {panel === "cancel" && (
        <CancelDialog
          bookingCode={b.code}
          onConfirm={handleCancel}
          onClose={() => setPanel(null)}
          loading={cancel.isPending}
        />
      )}
      {panel === "reschedule" && booking && (
        <ReschedulePanel
          booking={booking}
          onSubmit={handleReschedule}
          onClose={() => setPanel(null)}
          loading={reschedule.isPending}
        />
      )}
      {panel === "payment" && booking && (
        <PaymentPanel
          booking={booking}
          onSubmit={handlePayment}
          onClose={() => setPanel(null)}
          loading={payment.isPending}
        />
      )}
      {panel === "pin" && (
        <PinRecepcionModal
          bookingId={b.id}
          alreadyIssued={pinIssued}
          onGenerated={() => setPinIssued(true)}
          onClose={() => setPanel(null)}
        />
      )}
    </>
  );
}
