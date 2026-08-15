"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Map,
  CalendarCheck,
  BookOpen,
  Tag,
  Wallet,
  Settings,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { Role, SessionUser } from "@/lib/auth/definitions";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  staff: "Staff",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
};

const NAV_ITEMS: NavItem[] = [
  // { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }, // fuera de alcance por ahora
  { label: "Espacios", href: "/espacios", icon: Map },
  { label: "Agenda", href: "/disponibilidad", icon: CalendarCheck },
  { label: "Reservas", href: "/reservas", icon: BookOpen },
  { label: "Financiero", href: "/financiero", icon: Wallet },
  { label: "Tarifas", href: "/tarifas", icon: Tag },
  // { label: "Estadísticas", href: "/estadisticas", icon: BarChart2 }, // fuera de alcance por ahora
];

const NAV_SECONDARY: NavItem[] = [
  // { label: "Soporte", href: "/soporte", icon: LifeBuoy }, // fuera de alcance por ahora
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center justify-between rounded-lg px-3 py-3 transition-colors ${
        active
          ? "border-l-4 border-secondary bg-primary-hover text-white"
          : "text-white/70 hover:bg-white/5 hover:text-white"
      }`}
    >
      <div className="flex items-center">
        <Icon
          className={`mr-3 h-5 w-5 transition-colors ${
            active ? "text-secondary" : "group-hover:text-white"
          }`}
        />
        <span className="text-sm font-medium">{item.label}</span>
      </div>
      {item.badge ? (
        <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-white">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarContent({
  user,
  navItems,
  isActive,
  onNavigate,
}: {
  user: SessionUser;
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6" onClick={onNavigate}>
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="mx-3 my-4 border-t border-white/10" />

        {NAV_SECONDARY.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Usuario */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center rounded-xl bg-white/5 p-3">
          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-secondary text-xs font-bold text-white">
            {initials(user.name)}
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-white/50">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export function Sidebar({
  user,
  pendingReservas,
  mobileOpen = false,
  onCloseMobile,
}: {
  user: SessionUser;
  /** Conteo real de reservas pendientes — undefined si no se pudo cargar. */
  pendingReservas?: number;
  /** Controla el drawer de navegación en mobile (< md). */
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Cierra el drawer mobile al navegar: resincroniza durante el render en vez
  // de un useEffect (ver AGENTS.md → Efectos y estado derivado).
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) onCloseMobile?.();
  }

  const navItems = NAV_ITEMS.map((item) =>
    item.href === "/reservas" ? { ...item, badge: pendingReservas || undefined } : item,
  );

  return (
    <>
      {/* Sidebar de escritorio */}
      <aside className="z-20 hidden w-64 flex-shrink-0 flex-col bg-primary text-white shadow-xl md:flex">
        <div className="flex justify-center border-b border-white/10 bg-white px-6 py-4">
          <Image
            src="/logo-agora-horizontal.png"
            alt="Agora"
            width={322}
            height={104}
            priority
            className="h-12 w-auto"
          />
        </div>
        <SidebarContent user={user} navItems={navItems} isActive={isActive} />
      </aside>

      {/* Drawer de navegación mobile */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-[2px] transition-opacity md:hidden"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-primary text-white shadow-2xl md:hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-white px-6 py-4">
              <Image
                src="/logo-agora-horizontal.png"
                alt="Agora"
                width={322}
                height={104}
                priority
                className="h-10 w-auto"
              />
              <button
                type="button"
                onClick={onCloseMobile}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent user={user} navItems={navItems} isActive={isActive} onNavigate={onCloseMobile} />
          </aside>
        </>
      )}
    </>
  );
}
