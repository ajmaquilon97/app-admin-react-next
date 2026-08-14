import type { TimelineEventType } from "../types";

export function getTimelineDotColor(type: TimelineEventType): string {
  switch (type) {
    case "success": return "bg-[#27AE60] border-[#27AE60]/30";
    case "error":   return "bg-[#EF4444] border-[#EF4444]/30";
    case "warning": return "bg-[#F59E0B] border-[#F59E0B]/30";
    case "info":    return "bg-[#3B82F6] border-[#3B82F6]/30";
    default:        return "bg-gray-400 border-gray-200";
  }
}
