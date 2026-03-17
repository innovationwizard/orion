"use client";

type NavLink = { href: string; label: string };

const LINKS: (NavLink | "divider")[] = [
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
  { href: "/ventas/portal", label: "Mi Portal" },
];

const linkClass =
  "text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]";

export default function NavBar() {
  return (
    <nav className="flex flex-wrap gap-2 items-center text-[13px]">
      {LINKS.map((item, i) =>
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
