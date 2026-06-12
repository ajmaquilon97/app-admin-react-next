"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarCheck,
  BookOpen,
  Tag,
  BarChart2,
  Building,
  Settings,
  LogOut,
  Tent,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import type { Role, SessionUser } from "@/lib/definitions";

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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Mis Espacios", href: "/mis-espacios", icon: Map },
  { label: "Disponibilidad", href: "/disponibilidad", icon: CalendarCheck },
  { label: "Reservas", href: "/reservas", icon: BookOpen, badge: 3 },
  { label: "Tarifas", href: "/tarifas", icon: Tag },
  { label: "Estadísticas", href: "/estadisticas", icon: BarChart2 },
];

const NAV_SECONDARY: NavItem[] = [
  { label: "Mi Negocio", href: "/mi-negocio", icon: Building },
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

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside className="z-20 hidden w-64 flex-shrink-0 flex-col bg-primary text-white shadow-xl md:flex">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
          <Tent className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-wide">RecreAdmin</span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map((item) => (
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
    </aside>
  );
}
