"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase-browser";
import logoHorizontal from "./assets/logo-horizontal.png";
import {
  NON_VENTAS_CATEGORIES,
  VENTAS_CATEGORIES,
  ENTREGAS_ONLY_CATEGORIES,
  ROLE_COLORS,
  type PanelCategory,
} from "./nav-links";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function filterCategories(categories: PanelCategory[], role: string | null): PanelCategory[] {
  return categories
    .map((category) => ({
      ...category,
      links: category.links.filter((link) => !link.roles || (role != null && link.roles.includes(role))),
    }))
    .filter((category) => category.links.length > 0);
}

export default function Panel() {
  // --- All hooks BEFORE any early return (React #310 prevention) ---
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setRole(data.user?.app_metadata?.role ?? null);
      setEmail(data.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (role === undefined) return;
    if (role === "ventas") {
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
    if (email) {
      setDisplayName(email.split("@")[0]);
    }
  }, [role, email]);

  const toggleOpen = useCallback(() => {
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
  if (role === undefined) return null;

  let categories: PanelCategory[];
  if (role === "ventas") {
    categories = filterCategories(VENTAS_CATEGORIES, role);
  } else if (role === "entregas_viewer" || role === "entregas_editor") {
    categories = filterCategories(ENTREGAS_ONLY_CATEGORIES, role);
  } else {
    categories = filterCategories(NON_VENTAS_CATEGORIES, role);
  }

  const resolvedName = displayName ?? "Usuario";
  const initials = getInitials(resolvedName);
  const roleColor = ROLE_COLORS[role ?? ""] ?? "#64748b";

  return (
    <div className="relative">
      {/* Collapsed bar — always visible */}
      <div className="rounded-2xl border border-border px-[clamp(16px,3vw,32px)] py-3 backdrop-blur-sm bg-gradient-to-br from-panel-gradient-from/85 to-panel-gradient-to/70 flex items-center gap-[clamp(16px,3vw,32px)]">
        <Image src={logoHorizontal} alt="Puerta Abierta" height={32} className="h-8 w-auto flex-shrink-0" priority />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
          {categories.map((category) => (
            <span key={category.name}>{category.name}</span>
          ))}
        </div>

        <span className="text-[12px] font-semibold uppercase tracking-wide text-muted ml-auto">Cuenta</span>

        <button
          type="button"
          onClick={toggleOpen}
          aria-expanded={open}
          aria-label={open ? "Cerrar panel de navegación" : "Abrir panel de navegación"}
          className="flex-shrink-0 w-7 h-7 rounded-full border border-border flex items-center justify-center cursor-pointer bg-transparent transition-colors hover:bg-[#f8fafc]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Dropdown — toggled open/closed only by the button above */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border p-[clamp(16px,3vw,32px)] bg-gradient-to-br from-panel-gradient-from to-panel-gradient-to"
          style={{ boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}
        >
          <div className="flex flex-wrap gap-[clamp(24px,4vw,48px)] items-start">
            {categories.map((category) => (
              <div key={category.name} className="min-w-[150px]">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-primary mb-2.5">
                  {category.name}
                </h3>
                <ul className="grid gap-2 list-none p-0 m-0">
                  {category.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="text-[13px] text-muted no-underline hover:text-text-primary transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="ml-auto min-w-[180px] pl-[clamp(16px,3vw,32px)] border-l border-border">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-primary mb-2.5">
                Cuenta
              </h3>
              <div className="flex items-center gap-2.5 mb-3">
                <span
                  className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center select-none flex-shrink-0"
                  style={{ backgroundColor: roleColor }}
                >
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-text-primary truncate">{resolvedName}</div>
                </div>
              </div>
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="text-[13px] text-danger hover:underline cursor-pointer border-0 bg-transparent p-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
