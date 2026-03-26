"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ADMIN_ROLES, DATA_VIEWER_ROLES } from "@/lib/permissions";

type NavLink = { href: string; label: string; roles?: string[] };

const NON_VENTAS_LINKS: (NavLink | "divider")[] = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/desistimientos", label: "Desistimientos" },
  "divider",
  { href: "/disponibilidad", label: "Disponibilidad" },
  { href: "/admin/reservas", label: "Reservas", roles: ADMIN_ROLES },
  { href: "/admin/operaciones", label: "Operaciones", roles: ADMIN_ROLES },
  { href: "/cotizador", label: "Cotizador" },
  { href: "/integracion", label: "Integracion", roles: ADMIN_ROLES },
  { href: "/ventas", label: "Ventas" },
  { href: "/referidos", label: "Referidos", roles: ADMIN_ROLES },
  { href: "/buyer-persona", label: "Buyer Persona", roles: ADMIN_ROLES },
  { href: "/valorizacion", label: "Valorizacion", roles: ADMIN_ROLES },
  { href: "/creditos", label: "Créditos", roles: DATA_VIEWER_ROLES },
  "divider",
  { href: "/cesion", label: "Cesion", roles: ADMIN_ROLES },
  { href: "/admin/asesores", label: "Asesores", roles: ADMIN_ROLES },
  { href: "/admin/roles", label: "Roles", roles: ["master"] },
  { href: "/admin/audit", label: "Auditoría", roles: ADMIN_ROLES },
  { href: "/admin/lead-sources", label: "Fuentes", roles: ["master", "torredecontrol", "marketing"] },
  { href: "/admin/cotizador-config", label: "Config Cotizador", roles: ADMIN_ROLES },
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

const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  torredecontrol: "Torre de Control",
  gerencia: "Gerencia",
  financiero: "Financiero",
  contabilidad: "Contabilidad",
  inventario: "Inventario",
  marketing: "Marketing",
  ventas: "Ventas",
};

const ROLE_COLORS: Record<string, string> = {
  master: "#7c3aed",
  torredecontrol: "#2563eb",
  gerencia: "#0891b2",
  financiero: "#16a34a",
  contabilidad: "#64748b",
  inventario: "#f59e0b",
  marketing: "#ec4899",
  ventas: "#2563eb",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function NavBar() {
  // --- All hooks BEFORE any early return (React #310 prevention) ---
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user identity
  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setRole(data.user?.app_metadata?.role ?? null);
      setEmail(data.user?.email ?? null);
    });
  }, []);

  // Resolve display name
  useEffect(() => {
    if (role === undefined) return;
    if (role === "ventas") {
      // Try sessionStorage cache from useCurrentSalesperson hook
      try {
        const raw = sessionStorage.getItem("orion:current-salesperson");
        if (raw) {
          const cached = JSON.parse(raw);
          if (cached?.data?.salesperson?.display_name) {
            setDisplayName(cached.data.salesperson.display_name);
            return;
          }
        }
      } catch {
        /* ignore */
      }
    }
    // Fallback: email prefix
    if (email) {
      setDisplayName(email.split("@")[0]);
    }
  }, [role, email]);

  // Click outside → close dropdown
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Escape key → close dropdown
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggleMenu = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      try {
        sessionStorage.removeItem("orion:current-salesperson");
      } catch {
        /* ok */
      }
      await supabaseBrowser.auth.signOut();
      window.location.href = "/login";
    } catch {
      // If signOut fails, still redirect — middleware handles expired tokens
      window.location.href = "/login";
    }
  }, []);

  // --- Early return AFTER all hooks ---
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

  const resolvedName = displayName ?? "Usuario";
  const initials = getInitials(resolvedName);
  const roleColor = ROLE_COLORS[role ?? ""] ?? "#64748b";

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

      {/* User account menu */}
      <div className="ml-auto relative" ref={menuRef}>
        <button
          type="button"
          onClick={toggleMenu}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`Menú de usuario: ${resolvedName}${role ? `, ${ROLE_LABELS[role] ?? role}` : ""}`}
          className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center cursor-pointer border-2 transition-all select-none"
          style={{
            backgroundColor: roleColor,
            borderColor: open ? `${roleColor}50` : "transparent",
          }}
        >
          {initials}
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border border-border z-50 overflow-hidden"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.10)" }}
          >
            {/* Identity */}
            <div className="px-4 py-3 border-b border-border">
              <div className="text-sm font-semibold text-text-primary truncate">
                {resolvedName}
              </div>
              {email && (
                <div className="text-xs text-muted truncate mt-0.5">
                  {email}
                </div>
              )}
              {role && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase mt-1.5"
                  style={{
                    backgroundColor: `${roleColor}18`,
                    color: roleColor,
                  }}
                >
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="py-1">
              <button
                type="button"
                role="menuitem"
                disabled={signingOut}
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors cursor-pointer border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
