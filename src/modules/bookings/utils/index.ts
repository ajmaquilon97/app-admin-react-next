import type { BookingTimeline, TimelineEventType } from "../types";

export function buildTimelineEvent(
  title: string,
  type: TimelineEventType = "info",
): BookingTimeline {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    title,
    date: now.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }),
    time: now.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
    type,
  };
}

export function getTimelineDotColor(type: TimelineEventType): string {
  switch (type) {
    case "success": return "bg-[#27AE60] border-[#27AE60]/30";
    case "error":   return "bg-[#EF4444] border-[#EF4444]/30";
    case "warning": return "bg-[#F59E0B] border-[#F59E0B]/30";
    case "info":    return "bg-[#3B82F6] border-[#3B82F6]/30";
    default:        return "bg-gray-400 border-gray-200";
  }
}

export function filterBookings<T extends { client: { name: string; email: string }; spaceName: string; code: string; status: string; paymentStatus: string; date: string }>(
  bookings: T[],
  filters: {
    search?: string;
    spaceId?: string;
    status?: string;
    paymentStatus?: string;
    dateFrom?: string;
    dateTo?: string;
  },
  spaceMap: Record<string, string> = {},
): T[] {
  return bookings.filter((b) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        b.client.name.toLowerCase().includes(q) ||
        b.client.email.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.spaceName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.spaceId && (b as { spaceId?: string }).spaceId !== filters.spaceId) return false;
    if (filters.status && b.status !== filters.status) return false;
    if (filters.paymentStatus && b.paymentStatus !== filters.paymentStatus) return false;
    if (filters.dateFrom && b.date < filters.dateFrom) return false;
    if (filters.dateTo && b.date > filters.dateTo) return false;
    return true;
  });
}

export function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
