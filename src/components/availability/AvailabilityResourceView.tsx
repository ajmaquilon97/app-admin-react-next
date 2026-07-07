"use client";

import type { Block, Espacio } from "./types";
import { formatISODate, getWeekDates } from "@/lib/availability-mock";
import { getStatusClasses, STATUS_LABELS } from "./statusStyles";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

export function AvailabilityResourceView({
  spaces,
  blocks,
  weekStart,
  statusFilter,
  isLoading,
  onBlockClick,
}: {
  spaces: Espacio[];
  blocks: Block[];
  weekStart: Date;
  statusFilter: string;
  isLoading: boolean;
  onBlockClick: (block: Block) => void;
}) {
  const today = new Date();
  const weekDates = getWeekDates(weekStart);
  const displayDate =
    weekDates.find((d) => formatISODate(d) === formatISODate(today)) ?? weekDates[0]!;
  const dateStr = formatISODate(displayDate);

  if (isLoading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-10 bg-gray-100 rounded mb-2" />
        {HOURS.map((h) => (
          <div key={h} className="h-12 bg-gray-50 rounded mb-1" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-2">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr>
            <th className="p-4 border-b border-gray-100 text-text-muted font-medium text-sm w-20 bg-background/50 rounded-tl-lg">
              Hora
            </th>
            {spaces.map((space) => (
              <th
                key={space.id}
                className="p-4 border-b border-gray-100 text-text-main font-semibold text-sm bg-background/50"
              >
                {space.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="p-4 text-sm font-medium text-gray-400">{hour}:00</td>
              {spaces.map((space) => {
                const block = blocks.find(
                  (b) =>
                    b.date === dateStr &&
                    b.hour === hour &&
                    b.espacioId === space.id &&
                    (statusFilter === "all" || b.status === statusFilter),
                );
                return (
                  <td key={space.id} className="p-2 border-l border-gray-50">
                    {block ? (
                      <div
                        onClick={() => onBlockClick(block)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border text-center truncate transition-all ${getStatusClasses(block.status)}`}
                      >
                        {block.status === "reserved"
                          ? (block.clientName ?? STATUS_LABELS[block.status])
                          : STATUS_LABELS[block.status]}
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-lg text-xs text-gray-400 bg-background text-center border border-dashed border-gray-200">
                        Libre
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
