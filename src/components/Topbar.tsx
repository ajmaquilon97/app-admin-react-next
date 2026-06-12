import { Search, Bell, Menu } from "lucide-react";

export function Topbar() {
  return (
    <header className="z-10 flex h-20 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-surface px-4 md:px-8">
      {/* Buscador */}
      <div className="relative hidden w-full max-w-md md:block">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-text-muted" />
        </div>
        <input
          type="text"
          placeholder="Buscar clientes, reservas o espacios..."
          className="block w-full rounded-xl border border-gray-200 bg-background py-2.5 pl-10 pr-3 text-sm placeholder-text-muted transition-all focus:border-secondary focus:bg-white focus:outline-none focus:ring-2 focus:ring-secondary/50"
        />
      </div>

      {/* Menú móvil */}
      <button className="text-text-muted hover:text-primary md:hidden">
        <Menu className="h-6 w-6" />
      </button>
      <div className="text-lg font-bold text-primary md:hidden">RecreAdmin</div>

      {/* Acciones derecha */}
      <div className="flex items-center gap-4 md:gap-6">
        <button className="relative text-text-muted transition-colors hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-error ring-2 ring-white" />
        </button>

        <button className="flex items-center focus:outline-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-transparent bg-primary/10 text-xs font-bold text-primary transition-all hover:border-secondary">
            CA
          </div>
        </button>
      </div>
    </header>
  );
}
