import { TrendingUp } from "lucide-react";
import type { Kpi, KpiTone } from "../types";

function tagClasses(tone: KpiTone): string {
  if (tone === "success") return "text-success bg-success/10";
  if (tone === "warning") return "text-warning bg-warning/10";
  return "text-text-muted";
}

export function DashboardKPIs({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
              </div>
              <span className={`flex items-center rounded-full px-2 py-1 text-sm font-medium ${tagClasses(kpi.tag.tone)}`}>
                {kpi.tag.tone === "success" && <TrendingUp className="mr-1 h-3 w-3" />}
                {kpi.tag.text}
              </span>
            </div>
            <p className="text-sm font-medium text-text-muted">{kpi.label}</p>
            <h3 className="mt-1 text-3xl font-bold text-text-main">{kpi.value}</h3>
          </div>
        );
      })}
    </div>
  );
}
