"use client";

import { Clock } from "lucide-react";
import type { Block } from "./types";
import { getWeekDates, isToday, formatISODate } from "@/lib/availability-mock";
import { getStatusClasses, STATUS_LABELS } from "./statusStyles";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function GridSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-8 border-b border-gray-100 bg-background/50 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 mx-1 bg-gray-100 rounded" />
        ))}
      </div>
      {HOURS.map((h) => (
        <div key={h} className="grid grid-cols-8 border-b border-gray-50 h-24">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-gray-50 p-1">
              {i > 0 && <div className="h-full bg-gray-50 rounded-lg" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AvailabilityCalendar({
  blocks,
  weekStart,
  selectedEspacioId,
  statusFilter,
  isLoading,
  onBlockClick,
  onEmptyCellClick,
  serverNow,
}: {
  blocks: Block[];
  weekStart: Date;
  selectedEspacioId: number;
  statusFilter: string;
  isLoading: boolean;
  onBlockClick: (block: Block) => void;
  onEmptyCellClick: (date: string, hour: number) => void;
  /** Hora del servidor — si es null (aún cargando), no se marca ninguna celda como pasada. */
  serverNow: Date | null;
}) {
  const weekDates = getWeekDates(weekStart);

  function getBlock(date: Date, hour: number): Block | undefined {
    const dateStr = formatISODate(date);
    return blocks.find(
      (b) =>
        b.date === dateStr &&
        b.hour === hour &&
        b.espacioId === selectedEspacioId &&
        (statusFilter === "all" || b.status === statusFilter),
    );
  }

  // El slot de esa hora ya terminó respecto a la hora del servidor.
  function isPastSlot(date: Date, hour: number): boolean {
    if (!serverNow) return false;
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    return slotEnd <= serverNow;
  }

  if (isLoading) return <GridSkeleton />;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 border-b border-gray-100 bg-background/50">
          <div className="p-4 text-center border-r border-gray-100">
            <Clock size={15} className="mx-auto text-gray-400" />
          </div>
          {weekDates.map((date, i) => (
            <div key={i} className="p-3 text-center border-r border-gray-100 last:border-r-0">
              <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                {DAY_LABELS[i]}
              </div>
              <div
                className={`text-xl mt-1 font-medium ${
                  isToday(date)
                    ? "text-white bg-primary w-8 h-8 rounded-full flex items-center justify-center mx-auto font-bold"
                    : "text-text-main"
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-50 h-24 last:border-b-0">
            <div className="border-r border-gray-100 p-2 flex items-start justify-center">
              <span className="text-xs font-medium text-gray-400 -mt-2">{hour}:00</span>
            </div>
            {weekDates.map((date, dayIdx) => {
              const block = getBlock(date, hour);
              const dateStr = formatISODate(date);
              const isPast = isPastSlot(date, hour);
              const showAsPast = isPast && (!block || block.status === "available");

              return (
                <div key={dayIdx} className="border-r border-gray-50 last:border-r-0 p-1 relative">
                  {showAsPast ? (
                    <div className="absolute inset-1 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center">
                      <span className="text-[11px] font-medium text-gray-300">No Disponible</span>
                    </div>
                  ) : block ? (
                    <div
                      onClick={() => onBlockClick(block)}
                      className={`absolute inset-1 p-2 rounded-lg border text-xs flex flex-col transition-all duration-150 ${getStatusClasses(block.status)}`}
                    >
                      <span className="font-semibold truncate">
                        {STATUS_LABELS[block.status]}
                      </span>
                      {block.status !== "available" && (
                        <span className="truncate opacity-80 font-medium text-[11px] mt-0.5">
                          {block.clientName ?? block.espacioNombre}
                        </span>
                      )}
                      {block.notes && (
                        <span className="truncate opacity-60 mt-auto text-[10px]">
                          {block.notes}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => onEmptyCellClick(dateStr, hour)}
                      className="absolute inset-1 rounded-lg border border-dashed border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
