import { Tent, CalendarCheck, ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Panel de marca (oculto en móvil) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, var(--color-secondary), transparent 45%)",
          }}
        />

        <div className="relative flex items-center">
          <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
            <Tent className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide">RecreAdmin</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Administra tus espacios recreativos en un solo lugar.
          </h1>
          <p className="mt-4 text-white/70">
            Reservas, disponibilidad, tarifas y estadísticas — todo desde tu
            portal.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <CalendarCheck className="h-5 w-5 text-secondary" />
              Gestiona reservas y disponibilidad en tiempo real.
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-secondary" />
              Acceso seguro con control de roles.
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © 2026 RecreAdmin. Todos los derechos reservados.
        </p>
      </div>

      {/* Área del formulario */}
      <div className="flex w-full items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
              <Tent className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-wide text-primary">
              RecreAdmin
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
