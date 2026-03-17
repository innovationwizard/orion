"use client";

import { usePathname } from "next/navigation";
import { useCurrentSalesperson } from "@/hooks/use-current-salesperson";
import { VentasProvider } from "@/lib/reservas/ventas-context";
import NavBar from "@/components/nav-bar";

const TABS = [
  { href: "/ventas/portal/panel", label: "Panel" },
  { href: "/ventas/portal/inventario", label: "Inventario" },
  { href: "/ventas/portal/reservas", label: "Reservas" },
  { href: "/ventas/portal/rendimiento", label: "Rendimiento" },
  { href: "/ventas/portal/clientes", label: "Clientes" },
] as const;

const tabBase =
  "px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors no-underline";
const tabActive = `${tabBase} border-primary text-primary`;
const tabInactive = `${tabBase} border-transparent text-muted hover:text-text-primary hover:border-border`;

export default function VentasPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data, loading, error } = useCurrentSalesperson();

  if (loading) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="animate-pulse grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted">
            Esta página es solo para asesores de ventas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <VentasProvider value={data}>
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <NavBar />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Portal de Ventas
            </h1>
            <p className="text-sm text-muted mt-1">
              {data.salesperson.display_name}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <nav className="flex gap-1 border-b border-border -mb-3">
          {TABS.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <a
                key={tab.href}
                href={tab.href}
                className={isActive ? tabActive : tabInactive}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>

        {/* Tab content */}
        {children}
      </div>
    </VentasProvider>
  );
}
