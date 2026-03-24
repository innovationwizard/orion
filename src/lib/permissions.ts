import type { Role } from "./auth";

// ────────────────────────────────────────────────────────────────
// Resource and Action types
// ────────────────────────────────────────────────────────────────

export type Resource =
  | "reservations"
  | "reservation_clients"
  | "sales"
  | "payments"
  | "commissions"
  | "commission_rates"
  | "commission_phases"
  | "projects"
  | "clients"
  | "salespeople"
  | "settings"
  | "documents"
  | "ocr"
  | "referidos"
  | "valorizacion"
  | "cesion"
  | "buyer_persona"
  | "integracion"
  | "management_roles"
  | "audit_log"
  | "creditos"
  | "analytics"
  | "lead_sources";

export type Action =
  | "view"
  | "view_own"
  | "create"
  | "update"
  | "delete"
  | "confirm"
  | "reject"
  | "desist"
  | "release_freeze"
  | "confirm_rate"
  | "invite"
  | "assign_project"
  | "send_password_link";

// ────────────────────────────────────────────────────────────────
// Role group shorthands (same values as ADMIN_ROLES / DATA_VIEWER_ROLES
// in auth.ts — defined inline to avoid circular imports)
// ────────────────────────────────────────────────────────────────

/** Admin roles — client-safe re-export (auth.ts uses next/headers). */
export const ADMIN_ROLES: Role[] = ["master", "torredecontrol"];
/** Data viewer roles — client-safe re-export (auth.ts uses next/headers). */
export const DATA_VIEWER_ROLES: Role[] = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad", "marketing"];

const A = ADMIN_ROLES;
const D = DATA_VIEWER_ROLES;
const M: Role[] = ["master"]; // Master only
const MF: Role[] = ["master", "financiero"]; // Master + financiero
const MK: Role[] = ["master", "torredecontrol", "marketing"]; // Admin + marketing

// ────────────────────────────────────────────────────────────────
// Permission matrix — single source of truth
//
// Every (resource, action) → Role[] mapping in this object is a
// direct transcription of the requireRole() calls currently in
// the codebase. No permissions are invented or changed.
//
// Entries marked "via requireSalesperson" or "authenticated" are
// NOT enforced through this matrix — they use requireAuth() or
// requireSalesperson() directly. They appear here for
// documentation and access-control-matrix generation only.
// ────────────────────────────────────────────────────────────────

export const PERMISSIONS: Record<Resource, Partial<Record<Action, Role[]>>> = {
  reservations: {
    view: A,
    confirm: A,
    reject: A,
    desist: A,
    release_freeze: A,
    update: A,
  },
  reservation_clients: {
    update: A,
  },
  sales: {
    view: D,
    create: A,
    update: A,
    confirm_rate: MF,
  },
  payments: {
    view: D,
    create: A,
  },
  commissions: {
    view: D,
  },
  commission_rates: {
    view: D,
  },
  commission_phases: {
    view: D,
  },
  projects: {
    view: D,
    create: A,
    update: A,
    delete: A,
  },
  clients: {
    view: A,
    update: A,
  },
  salespeople: {
    view: A,
    invite: A,
    assign_project: A,
    send_password_link: A,
  },
  settings: {
    view: A,
    update: A,
  },
  documents: {
    view: A,
    update: A,
    delete: A,
  },
  ocr: {
    // Enforced via requireAuth() + rate limiting, not requireRole()
  },
  referidos: {
    view: A,
    create: A,
    update: A,
    delete: A,
  },
  valorizacion: {
    view: A,
    create: A,
    update: A,
    delete: A,
  },
  cesion: {
    view: A,
  },
  buyer_persona: {
    view: A,
    update: A,
  },
  integracion: {
    view: A,
  },
  management_roles: {
    view: M,
    create: M,
    update: M,
  },
  audit_log: {
    view: A,
  },
  creditos: {
    view: D,
  },
  analytics: {
    view: D,
  },
  lead_sources: {
    view: MK,
    create: MK,
    update: MK,
    delete: MK,
  },
};

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

/**
 * Returns the list of roles allowed to perform `action` on `resource`.
 * Returns `[]` for undefined entries (no access).
 */
export function rolesFor(resource: Resource, action: Action): Role[] {
  return PERMISSIONS[resource]?.[action] ?? [];
}

/**
 * Check if a given role is allowed to perform `action` on `resource`.
 * Returns `false` for null/undefined roles (safe for unauthenticated contexts).
 */
export function can(
  role: Role | string | null | undefined,
  resource: Resource,
  action: Action
): boolean {
  if (!role) return false;
  const allowed = rolesFor(resource, action);
  return allowed.includes(role as Role);
}
