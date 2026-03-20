"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type NavLink = { href: string; label: string; roles?: string[] };

/** Roles that can manage reservations, salespeople, and operational data. */
const ADMIN_PAGE_ROLES = ["master", "torredecontrol"];

const NON_VENTAS_LINKS: (NavLink | "divider")[] = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/desistimientos", label: "Desistimientos" },
  "divider",
  { href: "/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/reservas", label: "Reservas", roles: ADMIN_PAGE_ROLES },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/integracion", label: "Integracion", roles: ADMIN_PAGE_ROLES },
  { href: "/ventas", label: "Ventas" },
  { href: "/referidos", label: "Referidos", roles: ADMIN_PAGE_ROLES },
  { href: "/buyer-persona", label: "Buyer Persona", roles: ADMIN_PAGE_ROLES },
  { href: "/valorizacion", label: "Valorizacion", roles: ADMIN_PAGE_ROLES },
  "divider",
  { href: "/cesion", label: "Cesion", roles: ADMIN_PAGE_ROLES },
  { href: "/admin/asesores", label: "Asesores", roles: ADMIN_PAGE_ROLES },
  { href: "/admin/roles", label: "Roles", roles: ["master"] },
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

  let links: (NavLink | "divider")[];

  if (role === "ventas") {
    links = VENTAS_LINKS;
  } else {
    // Filter non-ventas links by role
    const filtered = NON_VENTAS_LINKS.filter(
      (item) =>
        item === "divider" || !item.roles || (role != null && item.roles.includes(role)),
    );
    // Clean up orphaned dividers (leading, trailing, consecutive)
    links = filtered.filter((item, i, arr) => {
      if (item !== "divider") return true;
      if (i === 0 || i === arr.length - 1) return false;
      if (arr[i - 1] === "divider") return false;
      return true;
    });
  }

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
