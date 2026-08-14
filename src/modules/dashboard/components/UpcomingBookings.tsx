import type { UpcomingItem } from "../types";

export function UpcomingBookings({ items }: { items: UpcomingItem[] }) {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface p-6 shadow-soft">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="subtitle">Próximas Reservas</h2>
        <a href="#" className="text-sm font-medium text-secondary transition-colors hover:text-primary">
          Ver todas
        </a>
      </div>

      {items.length > 0 ? (
        <div className="flex-1 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-start rounded-xl border border-transparent bg-background p-3 transition-colors hover:border-gray-200">
              <div className="mr-4 flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                <span className={`text-xs font-semibold ${item.monthColor}`}>{item.monthLabel}</span>
                <span className="modal-title leading-tight">{item.day}</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-text-main">{item.space}</h4>
                <p className="mt-0.5 text-xs text-text-muted">{item.time}</p>
                <div className="mt-2 flex items-center">
                  <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                    {item.initials}
                  </div>
                  <span className="text-xs font-medium text-text-main">{item.client}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
          Sin próximas reservas.
        </div>
      )}
    </div>
  );
}
