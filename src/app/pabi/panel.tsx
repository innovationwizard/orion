"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase-browser";
import logoHorizontal from "./assets/logo-horizontal.png";
import {
  NON_VENTAS_CATEGORIES,
  VENTAS_CATEGORIES,
  ENTREGAS_ONLY_CATEGORIES,
  ROLE_COLORS,
  type PanelCategory,
  type PanelLink,
} from "./nav-links";

const ACCOUNT_MENU = "Cuenta";
const MENU_ESTIMATED_WIDTH = 280;

type MenuAnchor = { left: number; right: number; alignEnd: boolean };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function panelSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function filterCategories(categories: PanelCategory[], role: string | null): PanelCategory[] {
  return categories
    .map((category) => ({
      ...category,
      links: category.links.filter((link) => !link.roles || (role != null && link.roles.includes(role))),
    }))
    .filter((category) => category.links.length > 0);
}

const triggerClass =
  "bg-transparent border-0 p-0 cursor-pointer font-[inherit] text-[12px] font-semibold uppercase tracking-wide transition-colors";

export default function Panel() {
  // --- All hooks BEFORE any early return (React #310 prevention) ---
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<MenuAnchor>({ left: 0, right: 0, alignEnd: false });
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  const measure = useCallback((name: string) => {
    const el = itemRefs.current[name];
    const root = rootRef.current;
    if (!el || !root) return;
    const elRect = el.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const rawLeft = elRect.left - rootRect.left;
    const maxLeft = Math.max(0, rootRect.width - MENU_ESTIMATED_WIDTH);
    setAnchor({
      left: Math.min(Math.max(0, rawLeft), maxLeft),
      right: Math.max(0, rootRect.right - elRect.right),
      alignEnd: name === ACCOUNT_MENU,
    });
  }, []);

  const toggleMenu = useCallback((name: string) => {
    setOpenMenu((prev) => (prev === name ? null : name));
    measure(name);
  }, [measure]);

  useEffect(() => {
    if (!openMenu) return;
    function onResize() {
      if (openMenu) measure(openMenu);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [openMenu, measure]);

  useEffect(() => {
    if (!openMenu) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenu]);

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
  const activeCategory = categories.find((category) => category.name === openMenu) ?? null;
  const accountOpen = openMenu === ACCOUNT_MENU;
  const menuId = openMenu ? `panel-submenu-${panelSlug(openMenu)}` : undefined;

  function renderLinks(links: PanelLink[]) {
    return (
      <ul className="grid gap-2 list-none p-0 m-0">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={() => setOpenMenu(null)}
              className="text-[13px] text-muted no-underline hover:text-text-primary transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <div className="rounded-2xl border border-border px-[clamp(16px,3vw,32px)] py-3 backdrop-blur-sm bg-gradient-to-br from-panel-gradient-from/85 to-panel-gradient-to/70 flex items-center gap-[clamp(16px,3vw,32px)]">
        <Image src={logoHorizontal} alt="Puerta Abierta" height={32} className="h-8 w-auto flex-shrink-0" priority />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {categories.map((category) => {
            const isOpen = openMenu === category.name;
            const triggerId = `panel-trigger-${panelSlug(category.name)}`;
            return (
              <button
                key={category.name}
                id={triggerId}
                type="button"
                ref={(node) => {
                  itemRefs.current[category.name] = node;
                }}
                onClick={() => toggleMenu(category.name)}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls={isOpen ? menuId : undefined}
                className={`${triggerClass} ${isOpen ? "text-text-primary" : "text-muted hover:text-text-primary"}`}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        <button
          id={`panel-trigger-${panelSlug(ACCOUNT_MENU)}`}
          type="button"
          ref={(node) => {
            itemRefs.current[ACCOUNT_MENU] = node;
          }}
          onClick={() => toggleMenu(ACCOUNT_MENU)}
          aria-expanded={accountOpen}
          aria-haspopup="true"
          aria-controls={accountOpen ? menuId : undefined}
          className={`${triggerClass} ml-auto ${accountOpen ? "text-text-primary" : "text-muted hover:text-text-primary"}`}
        >
          {ACCOUNT_MENU}
        </button>
      </div>

      {openMenu && (activeCategory || accountOpen) ? (
        <div
          id={menuId}
          aria-labelledby={`panel-trigger-${panelSlug(openMenu)}`}
          className={`absolute z-50 rounded-2xl border border-border p-[clamp(16px,3vw,32px)] bg-gradient-to-br from-panel-gradient-from to-panel-gradient-to ${
            accountOpen ? "min-w-[180px]" : "min-w-[150px]"
          }`}
          style={{
            top: "calc(100% + 8px)",
            left: anchor.alignEnd ? undefined : anchor.left,
            right: anchor.alignEnd ? anchor.right : undefined,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >
          {activeCategory ? (
            <div className="min-w-[150px]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-primary mb-2.5">
                {activeCategory.name}
              </h3>
              {renderLinks(activeCategory.links)}
            </div>
          ) : (
            <div className="min-w-[180px]">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-primary mb-2.5">
                {ACCOUNT_MENU}
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
          )}
        </div>
      ) : null}
    </div>
  );
}
