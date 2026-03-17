"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type NavLink = { href: string; label: string };

const ADMIN_LINKS: (NavLink | "divider")[] = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/desistimientos", label: "Desistimientos" },
  "divider",
  { href: "/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/integracion", label: "Integracion" },
  { href: "/ventas", label: "Ventas" },
  { href: "/referidos", label: "Referidos" },
  { href: "/buyer-persona", label: "Buyer Persona" },
  { href: "/valorizacion", label: "Valorizacion" },
  "divider",
  { href: "/cesion", label: "Cesion" },
  { href: "/admin/asesores", label: "Asesores" },
  { href: "/admin/roles", label: "Roles" },
];

const VENTAS_LINKS: (NavLink | "divider")[] = [
  { href: "/ventas/portal/reservas", label: "Mis Reservas" },
  { href: "/ventas/portal/inventario", label: "Inventario" },
  { href: "/ventas/portal/clientes", label: "Clientes" },
  { href: "/ventas/portal/rendimiento", label: "Rendimiento" },
  "divider",
  { href: "/disponibilidad", label: "Disponibilidad" },
  { href: "/cotizador", label: "Cotizador" },
];

const linkClass =
  "text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]";

export default function NavBar() {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setRole(data.user?.app_metadata?.role ?? null);
    });
  }, []);

  // Don't render until role is determined (prevents flash of admin links for ventas users)
  if (role === undefined) return null;

  const links = role === "ventas" ? VENTAS_LINKS : ADMIN_LINKS;

  return (
    <nav className="flex flex-wrap gap-2 items-center text-[13px]">
      {links.map((item, i) =>
        item === "divider" ? (
          <span key={i} className="text-border select-none">
            |
          </span>
        ) : (
          <a key={item.href} className={linkClass} href={item.href}>
            {item.label}
          </a>
        ),
      )}
    </nav>
  );
}
