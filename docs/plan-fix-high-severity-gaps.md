# Plan: Fix 11 High-Severity Gaps + Discovered Issues

**Date:** 2026-03-19
**Last updated:** 2026-03-19 (Phases 1, 3, 5 completed)
**Prerequisite:** All 3 critical gaps (GAP-01, GAP-02, GAP-06) are resolved and deployed (changelog 074).
**Scope:** 11 high-severity gaps from `docs/roles-gap-analysis.md` + 5 additional issues discovered during codebase exploration.

---

## Table of Contents

1. [Status Summary](#1-status-summary)
2. [Phase 1 — Security Hardening Before Go-Live](#2-phase-1--security-hardening-before-go-live)
3. [Phase 2 — Permission Architecture Foundation](#3-phase-2--permission-architecture-foundation)
4. [Phase 3 — Audit Trail & Compliance](#4-phase-3--audit-trail--compliance)
5. [Phase 4 — Role-Aware Data Filtering](#5-phase-4--role-aware-data-filtering)
6. [Phase 5 — Pati's Operations Dashboard](#6-phase-5--patis-operations-dashboard)
7. [Phase 6 — Deferred Items](#7-phase-6--deferred-items)
8. [Additional Issues Discovered](#8-additional-issues-discovered)
9. [File Change Summary](#9-file-change-summary)
10. [Dependency Graph](#10-dependency-graph)

---

## 1. Status Summary

### Already Resolved (changelog 074 + follow-up)

| Gap | Description | Resolution |
|-----|-------------|------------|
| GAP-01 | API routes too permissive | 30 routes secured with `requireRole()` guards |
| GAP-02 | Public OCR without auth/rate limit | `requireAuth()` + 20 req/hr rate limiting |
| GAP-06 | No role hierarchy | `ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` |
| GAP-18 | No escalation for rate confirmation | `financiero` added to ejecutivo-rate PATCH |

### 11 High-Severity Gaps to Address

| Gap | Description | Phase | Priority |
|-----|-------------|-------|----------|
| GAP-04 | Inactive roles have uncontrolled access | 1 | ✅ COMPLETED 2026-03-19 |
| GAP-05 | No DB-level ownership enforcement | 1 | ✅ COMPLETED 2026-03-19 |
| GAP-07 | No formal access control matrix | 2 | P1 — before new roles |
| GAP-08 | No `can(action, resource)` utility | 2 | P1 — before new roles |
| GAP-21 | No formal access control document | 2 | P1 — before new roles |
| GAP-22 | Incomplete audit trail | 3 | ✅ COMPLETED 2026-03-19 |
| GAP-16 | No maker-checker on user provisioning | 3 | ✅ COMPLETED 2026-03-19 (audit-only, Option A) |
| GAP-03 | No server-side field masking on analytics | 4 | P2 — before activating gerencia/financiero dashboards |
| GAP-10 | No role-specific dashboards | 5 | ✅ COMPLETED 2026-03-19 |
| GAP-11 | No operations dashboard for Pati | 5 | ✅ COMPLETED 2026-03-19 (MVP) |
| GAP-09 | No project-scoped admin access | 6 | P3 — deferred (2 admin users, 4 projects) |

---

## 2. Phase 1 — Security Hardening Before Go-Live

**Status:** ✅ COMPLETED 2026-03-19
**Urgency:** Must complete before 32 salespeople receive accounts.
**Effort:** ~12 hours total.

### 2.1 GAP-04: Enforce Boundaries for Inactive/Non-Standard Roles

**Problem:** If a user is assigned `role = "contabilidad"`, middleware treats them as non-ventas (full page access), NavBar shows all admin links, and API routes pass `DATA_VIEWER_ROLES` checks. They'd see the full analytics dashboard with all commission data — a confusing and data-exposing experience.

Additionally, inactive salespeople (`is_active = false`) can still authenticate and call API routes.

**Solution: Two-pronged enforcement.**

#### 2.1a — Middleware: Explicit Role Routing

**File:** `middleware.ts`

Currently the middleware has a binary check: `role === "ventas"` → restricted, everything else → unrestricted. Change to explicit role handling:

```typescript
// Current (binary):
if (role === "ventas") { /* restrict */ }
// else: full access

// Proposed (explicit):
const ADMIN_PAGE_ROLES = ["master", "torredecontrol"];
const DATA_PAGE_ROLES = ["master", "torredecontrol", "gerencia", "financiero", "contabilidad"];

if (role === "ventas") {
  // Existing ventas routing (unchanged)
} else if (ADMIN_PAGE_ROLES.includes(role)) {
  // Full admin access (current default behavior)
} else if (DATA_PAGE_ROLES.includes(role)) {
  // Analytics/dashboard pages only — block admin mutation pages
  const adminOnlyPaths = ["/admin/reservas", "/admin/asesores", "/admin/roles",
    "/referidos", "/valorizacion", "/cesion", "/buyer-persona", "/integracion"];
  if (adminOnlyPaths.some(p => pathname.startsWith(p))) {
    return redirectTo("/");  // Redirect to analytics dashboard
  }
} else {
  // Unknown/unhandled role → deny all, redirect to login
  return redirectTo("/login");
}
```

This ensures:
- `master` and `torredecontrol` → full admin access (unchanged)
- `gerencia`, `financiero`, `contabilidad` → analytics pages only (dashboard, projects, disponibilidad, ventas, cotizador, desistimientos)
- `inventario` → redirect to login (role exists in type but has no valid page set)
- Any undefined role → redirect to login

#### 2.1b — NavBar: Role-Aware Link Filtering

**File:** `src/components/nav-bar.tsx`

Replace the binary `ADMIN_LINKS`/`VENTAS_LINKS` split with role-filtered links:

```typescript
// Each link tagged with required minimum role or role group
const ALL_LINKS = [
  { href: "/", label: "Dashboard", roles: DATA_PAGE_ROLES },
  { href: "/projects", label: "Projects", roles: DATA_PAGE_ROLES },
  { href: "/admin/reservas", label: "Reservas", roles: ADMIN_PAGE_ROLES },
  { href: "/admin/asesores", label: "Asesores", roles: ADMIN_PAGE_ROLES },
  { href: "/admin/roles", label: "Roles", roles: ["master"] },
  // ... etc
];

// Filter by user's role
const visibleLinks = ALL_LINKS.filter(link => link.roles.includes(role));
```

This prevents a `financiero` user from seeing links to pages they can't access.

#### 2.1c — Inactive Salesperson Enforcement

**File:** `src/lib/reservas/require-salesperson.ts`

The `requireSalesperson()` utility already checks `is_active`. Verify this check exists and returns 403 if the salesperson is inactive. If not, add:

```typescript
if (!salesperson.is_active) {
  return { response: jsonError(403, "Cuenta desactivada. Contacte al administrador.") };
}
```

**File:** `middleware.ts`

For middleware-level enforcement, inactive salespeople should be redirected to a "deactivated" page or the login page. This requires querying the `salespeople` table from middleware — which is expensive. **Decision: enforce at API layer only** (via `requireSalesperson()`), since middleware already restricts ventas to `/reservar` and `/ventas/*` pages, and those pages call APIs that will reject inactive salespeople.

**Effort:** ~4 hours (middleware changes, NavBar refactor, testing).

#### Implementation Notes (Completed 2026-03-19)

**2.1a — Middleware:** Replaced binary `role === "ventas"` / else split with explicit 5-category routing:
- `ventas` → existing restriction (unchanged)
- `ADMIN_PAGE_ROLES` (`master`, `torredecontrol`) → full admin access
- `DATA_PAGE_ROLES` (`gerencia`, `financiero`, `contabilidad`) → analytics pages only; blocked from `/admin`, `/referidos`, `/valorizacion`, `/cesion`, `/buyer-persona`, `/integracion`
- Unknown/null roles → redirect to `/login`
- Login redirect: role-based (ventas → `/ventas/dashboard`, admin/data → `/`)

**2.1b — NavBar:** Links tagged with `roles` array. Non-ventas links filtered by user's role at render time. Orphaned dividers (leading, trailing, consecutive) cleaned up automatically. `/admin/roles` restricted to `["master"]` (fixes DISC-04).

**2.1c — Inactive Salesperson:** Already handled — `requireSalesperson()` checks `is_active` at line 61 of `src/lib/reservas/require-salesperson.ts`, returns 403 for deactivated salespeople. No changes needed.

---

### 2.2 GAP-05: Row-Level Ownership Enforcement (RLS)

**Problem:** Ventas ownership is enforced at the API layer via `WHERE salesperson_id = $1` query filters. If any new API route forgets this filter, ventas users could see other salespeople's reservations, clients, and documents. RLS policies currently allow any authenticated user to SELECT all rows.

**Solution:** Add ownership-scoped RLS policies for ventas-relevant tables.

**Migration file:** `scripts/migrations/040_ventas_ownership_rls.sql`

```sql
-- ============================================================
-- Migration 040: Ventas Ownership RLS Policies
-- Adds row-level ownership enforcement for ventas users.
-- Admin roles see all rows. Ventas users see only their own.
-- ============================================================

-- 1. reservations: ventas see only own reservations
CREATE POLICY "ventas_own_reservations" ON reservations
FOR SELECT TO authenticated
USING (
  CASE
    WHEN coalesce(
      current_setting('request.jwt.claims', true)::jsonb
        -> 'app_metadata' ->> 'role', ''
    ) = 'ventas'
    THEN salesperson_id IN (
      SELECT id FROM salespeople WHERE user_id = auth.uid()
    )
    ELSE true  -- non-ventas roles: see all
  END
);

-- 2. rv_clients: ventas see only clients linked to own reservations
CREATE POLICY "ventas_own_clients" ON rv_clients
FOR SELECT TO authenticated
USING (
  CASE
    WHEN coalesce(
      current_setting('request.jwt.claims', true)::jsonb
        -> 'app_metadata' ->> 'role', ''
    ) = 'ventas'
    THEN id IN (
      SELECT rc.client_id FROM reservation_clients rc
      JOIN reservations r ON r.id = rc.reservation_id
      WHERE r.salesperson_id IN (
        SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
      )
    )
    ELSE true
  END
);

-- 3. reservation_clients: ventas see only junction rows for own reservations
CREATE POLICY "ventas_own_reservation_clients" ON reservation_clients
FOR SELECT TO authenticated
USING (
  CASE
    WHEN coalesce(
      current_setting('request.jwt.claims', true)::jsonb
        -> 'app_metadata' ->> 'role', ''
    ) = 'ventas'
    THEN reservation_id IN (
      SELECT id FROM reservations
      WHERE salesperson_id IN (
        SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
      )
    )
    ELSE true
  END
);

-- 4. receipt_extractions: ventas see only extractions for own reservations
CREATE POLICY "ventas_own_extractions" ON receipt_extractions
FOR SELECT TO authenticated
USING (
  CASE
    WHEN coalesce(
      current_setting('request.jwt.claims', true)::jsonb
        -> 'app_metadata' ->> 'role', ''
    ) = 'ventas'
    THEN reservation_id IN (
      SELECT id FROM reservations
      WHERE salesperson_id IN (
        SELECT sp.id FROM salespeople sp WHERE sp.user_id = auth.uid()
      )
    )
    ELSE true
  END
);
```

**Important notes:**
- These policies ADD to the existing `SELECT` policy (`auth.role() IN ('authenticated', 'service_role')`). The existing policy must be **replaced**, not layered, because RLS is permissive-OR by default — an overly broad existing policy would override the new one. The migration must `DROP POLICY` the old permissive SELECT policy first, then create the new one.
- INSERT/UPDATE/DELETE policies remain service_role-only (unchanged) — ventas users can only write through API routes that use the admin client.
- The `current_setting('request.jwt.claims', true)` approach reads the JWT claims embedded by Supabase in every request. This is the standard Supabase pattern for RLS role checks.

**Testing:** After deployment, verify:
1. Ventas user A cannot see reservations created by Ventas user B
2. Admin users still see all reservations
3. The `/reservar` form submission still works (uses admin client, bypasses RLS)
4. Dual-auth document routes still work for ventas ownership check

**Effort:** ~8 hours (migration writing, testing existing policy replacement, verifying no regressions on all API routes that query these tables).

#### Implementation Notes (Completed 2026-03-19)

**Migration 040 deployed** via Management API. Actual implementation differs from plan in two improvements:

1. **Reusable `jwt_role()` helper function** — Instead of inline `current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'` in every policy, created a `CREATE OR REPLACE FUNCTION public.jwt_role()` that all 4 policies reference. Cleaner and DRYer.

2. **INSERT policies tightened** — As a bonus, replaced 2 overly permissive INSERT policies:
   - `"Anyone can insert reservations"` → `"Authenticated users insert reservations"` (changed `TO public` to `TO authenticated`)
   - `"Anyone can insert reservation_clients"` → `"Authenticated users insert reservation_clients"` (same change)
   These INSERT policies previously allowed anonymous users to insert rows.

**Old policies dropped:**
- `"Authenticated users read reservations"` on `reservations`
- `"Authenticated users read rv_clients"` on `rv_clients`
- `"Authenticated users read reservation_clients"` on `reservation_clients`
- `"Authenticated users read extractions"` on `receipt_extractions`

**New policies created:**
- `"Role-scoped read reservations"` — ventas see only rows where `salesperson_id` matches their `salespeople.user_id`
- `"Role-scoped read rv_clients"` — ventas see only clients linked through `reservation_clients` → `reservations` ownership chain
- `"Role-scoped read reservation_clients"` — ventas see only junction rows for their own reservations
- `"Role-scoped read receipt_extractions"` — ventas see only extractions for their own reservations

**Verification:** Policy existence confirmed via `pg_policies` query post-deployment. Build passed clean.

---

## 3. Phase 2 — Permission Architecture Foundation

**Urgency:** Must complete before activating gerencia, financiero, contabilidad, or inventario roles for real users.
**Effort:** ~16 hours total.
**Dependencies:** Phase 1 (middleware/NavBar must handle role groups first).

### 3.1 GAP-07 + GAP-08 + GAP-21: Unified Permission System

These three gaps are deeply interrelated:
- **GAP-07** (no access control matrix) → the "what" — define every (role, resource, action) triple
- **GAP-08** (no `can()` utility) → the "how" — a function that all code calls to check permissions
- **GAP-21** (no formal document) → the "where" — a single source of truth, auditable

**Solution: A single `permissions.ts` module that serves as both code and documentation.**

#### 3.1a — Permission Matrix (Code-Level)

**New file:** `src/lib/permissions.ts`

```typescript
import type { Role } from "./auth";

// ============================================================
// Orion Access Control Matrix
// This file is the SINGLE SOURCE OF TRUTH for all authorization
// decisions in the application. Every requireRole() call and
// every UI conditional should reference this matrix.
//
// Format: PERMISSIONS[resource][action] = Role[]
// A role listed in the array CAN perform the action on the resource.
// Roles NOT listed are denied.
//
// Review schedule: Update whenever roles or routes change.
// Last reviewed: 2026-03-19
// ============================================================

export type Resource =
  | "reservations"
  | "sales"
  | "payments"
  | "commissions"
  | "commission_rates"
  | "projects"
  | "units"
  | "clients"
  | "salespeople"
  | "analytics"
  | "settings"
  | "documents"
  | "ocr"
  | "referidos"
  | "valorizacion"
  | "cesion"
  | "buyer_persona"
  | "integracion"
  | "management_roles";

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
  | "export"
  | "provision_user"
  | "assign_project"
  | "toggle_setting";

const M: Role = "master";
const T: Role = "torredecontrol";
const G: Role = "gerencia";
const F: Role = "financiero";
const C: Role = "contabilidad";
const V: Role = "ventas";

const ADMIN: Role[] = [M, T];
const DATA_VIEWERS: Role[] = [M, T, G, F, C];
const ALL_INTERNAL: Role[] = [M, T, G, F, C, V];

export const PERMISSIONS: Record<string, Record<string, Role[]>> = {
  reservations: {
    view:          ADMIN,         // View all reservations
    view_own:      [V],           // View own reservations only
    create:        [V, ...ADMIN], // Submit new reservation
    confirm:       ADMIN,         // Confirm pending reservation
    reject:        ADMIN,         // Reject pending reservation
    desist:        ADMIN,         // Process desistimiento
    release_freeze: ADMIN,        // Release frozen unit
  },
  sales: {
    view:          ALL_INTERNAL,  // View sales list
    create:        ADMIN,         // Create sale record
    update:        ADMIN,         // Update sale record
  },
  payments: {
    view:          ALL_INTERNAL,  // View payment records
    create:        ADMIN,         // Record new payment
  },
  commissions: {
    view:          DATA_VIEWERS,  // View commission data
    confirm_rate:  [M, F],        // Confirm ejecutivo rate
  },
  commission_rates: {
    view:          DATA_VIEWERS,  // View rate configuration
    update:        [M],           // Modify rates
  },
  projects: {
    view:          DATA_VIEWERS,  // View project list + details
    create:        ADMIN,         // Create project
    update:        ADMIN,         // Update project
    delete:        ADMIN,         // Delete project
  },
  units: {
    view:          ALL_INTERNAL,  // View unit inventory
  },
  clients: {
    view:          ADMIN,         // View all clients
    view_own:      [V],           // View own clients
    update:        ADMIN,         // Edit client data
  },
  salespeople: {
    view:          ADMIN,         // View salesperson list
    provision_user: ADMIN,        // Create auth account
    assign_project: ADMIN,        // Change project assignments
  },
  analytics: {
    view:          DATA_VIEWERS,  // View analytics dashboards
  },
  settings: {
    view:          ALL_INTERNAL,  // Read system settings
    toggle_setting: ADMIN,        // Change system settings
  },
  documents: {
    view:          ADMIN,         // View all documents
    view_own:      [V],           // View own documents
    export:        ADMIN,         // Download/export
  },
  ocr: {
    create:        ALL_INTERNAL,  // Submit OCR request
  },
  referidos: {
    view:          ADMIN,
    create:        ADMIN,
    update:        ADMIN,
    delete:        ADMIN,
  },
  valorizacion: {
    view:          ADMIN,
    create:        ADMIN,
    update:        ADMIN,
    delete:        ADMIN,
  },
  cesion: {
    view:          ADMIN,
  },
  buyer_persona: {
    view:          ADMIN,
    update:        ADMIN,
  },
  integracion: {
    view:          ADMIN,
  },
  management_roles: {
    view:          [M],
    create:        [M],
    update:        [M],
  },
};

/**
 * Check if a role is permitted to perform an action on a resource.
 *
 * Usage:
 *   if (!can(userRole, "reservations", "confirm")) return jsonError(403, "...");
 *   {can(role, "analytics", "view") && <DashboardLink />}
 */
export function can(role: Role | null | undefined, resource: string, action: string): boolean {
  if (!role) return false;
  return PERMISSIONS[resource]?.[action]?.includes(role) ?? false;
}

/**
 * Get the list of roles permitted for a specific action.
 * Useful for passing to requireRole().
 *
 * Usage:
 *   const auth = await requireRole(rolesFor("reservations", "confirm"));
 */
export function rolesFor(resource: string, action: string): Role[] {
  return PERMISSIONS[resource]?.[action] ?? [];
}
```

#### 3.1b — Migrate Existing Routes to Use `rolesFor()`

Gradually replace hardcoded role arrays in API routes:

```typescript
// Before:
const auth = await requireRole(ADMIN_ROLES);

// After:
import { rolesFor } from "@/lib/permissions";
const auth = await requireRole(rolesFor("reservations", "confirm"));
```

This is a **non-breaking, incremental migration**. Each route can be updated independently. The behavior is identical — `rolesFor("reservations", "confirm")` returns `["master", "torredecontrol"]`, same as `ADMIN_ROLES`. But now the permission is defined in one place and can be audited.

**Migration strategy:** Update routes in batches during other work. No big-bang rewrite needed.

#### 3.1c — Access Control Document (Auto-Generated)

Add a script or build step that reads `PERMISSIONS` and generates a markdown table:

**New file:** `scripts/generate-access-matrix.ts`

```typescript
// Reads PERMISSIONS from src/lib/permissions.ts
// Generates docs/access-control-matrix.md
// Run: npx tsx scripts/generate-access-matrix.ts
```

Output format:

```markdown
| Resource | Action | master | torredecontrol | gerencia | financiero | contabilidad | ventas |
|----------|--------|--------|----------------|----------|------------|--------------|--------|
| reservations | view | ✓ | ✓ | | | | |
| reservations | view_own | | | | | | ✓ |
| reservations | confirm | ✓ | ✓ | | | | |
| commissions | view | ✓ | ✓ | ✓ | ✓ | ✓ | |
| commissions | confirm_rate | ✓ | | | ✓ | | |
```

This document is always in sync with the code because it's generated from the same `PERMISSIONS` object. It satisfies SOC 2 CC6.1 and ISO 27001 A.5.15 requirements for a formal access control matrix.

#### 3.1d — NavBar Integration

The NavBar link filtering (from Phase 1, section 2.1b) should use the `can()` function:

```typescript
const navLinks = [
  { href: "/", label: "Dashboard", show: can(role, "analytics", "view") },
  { href: "/admin/reservas", label: "Reservas", show: can(role, "reservations", "view") },
  { href: "/admin/roles", label: "Roles", show: can(role, "management_roles", "view") },
  // ...
];
```

**Effort:** ~16 hours (permissions module, script, route migration planning, NavBar integration).

---

## 4. Phase 3 — Audit Trail & Compliance

**Status:** ✅ COMPLETED (2026-03-19)
**Urgency:** Should complete before external audit or compliance review. Practical urgency: before scaling admin team beyond 2 users.
**Effort:** ~20 hours total.
**Dependencies:** None (can run in parallel with Phase 2).

### 4.1 GAP-22: Comprehensive Audit Trail — ✅ RESOLVED (2026-03-19)

**Problem:** The system logs unit status changes and reservation reviews, but does NOT log:
- Who changed system settings (column exists, never populated)
- Who invited which salesperson
- Who changed project assignments
- Who modified commission rates
- Login events (internal to Supabase Auth, not surfaced)

**Solution:** Create a centralized `audit_events` table and instrument all admin actions.

#### 4.1a — Migration: `audit_events` Table

**Migration file:** `scripts/migrations/041_audit_events.sql`

```sql
-- ============================================================
-- Migration 041: Centralized Audit Events
-- Logs all significant admin actions for compliance & traceability.
-- ============================================================

CREATE TABLE audit_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text        NOT NULL,  -- e.g. 'user.provisioned', 'settings.updated', 'rate.confirmed'
  actor_id   uuid        NOT NULL,  -- auth.users.id of the person who performed the action
  actor_role text,                   -- role at time of action (denormalized for query speed)
  resource_type text     NOT NULL,  -- e.g. 'salesperson', 'system_settings', 'reservation'
  resource_id  text,                 -- UUID or identifier of the affected resource
  details    jsonb,                  -- action-specific payload (old_value, new_value, reason, etc.)
  ip_address text,                   -- request IP if available (from x-forwarded-for)
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for common queries: by actor, by resource, by time
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_events_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX idx_audit_events_type ON audit_events(event_type);

-- RLS: admin-only read, service_role insert
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit" ON audit_events
FOR SELECT TO authenticated
USING (
  coalesce(
    current_setting('request.jwt.claims', true)::jsonb
      -> 'app_metadata' ->> 'role', ''
  ) IN ('master', 'torredecontrol')
);

CREATE POLICY "service_role_insert_audit" ON audit_events
FOR INSERT TO service_role
WITH CHECK (true);
```

#### 4.1b — Audit Logging Utility

**New file:** `src/lib/audit.ts`

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

interface AuditEvent {
  event_type: string;
  actor_id: string;
  actor_role?: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

export async function logAuditEvent(event: AuditEvent): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_events").insert(event);
  if (error) {
    // Log to console but don't fail the primary operation
    console.error("[audit] Failed to log event:", error, event);
  }
}
```

#### 4.1c — Instrument Existing Admin Actions

Add `logAuditEvent()` calls to these routes:

| Route | Event Type | Details Payload |
|-------|-----------|-----------------|
| `/api/admin/salespeople/invite` POST | `user.provisioned` | `{ salesperson_id, email, salesperson_name }` |
| `/api/admin/salespeople/projects` POST | `user.projects_changed` | `{ salesperson_id, added: [...], removed: [...] }` |
| `/api/reservas/admin/settings` PATCH | `settings.updated` | `{ key, old_value, new_value }` |
| `/api/reservas/admin/reservations/[id]/confirm` PATCH | `reservation.confirmed` | `{ reservation_id }` |
| `/api/reservas/admin/reservations/[id]/reject` PATCH | `reservation.rejected` | `{ reservation_id, reason }` |
| `/api/reservas/admin/reservations/[id]/desist` PATCH | `reservation.desisted` | `{ reservation_id }` |
| `/api/reservas/admin/sales/[id]/ejecutivo-rate` PATCH | `rate.confirmed` | `{ sale_id, rate }` |
| `/api/admin/management-roles` POST | `management_role.created` | `{ assignment details }` |
| `/api/admin/management-roles/[id]` PATCH | `management_role.updated` | `{ old, new }` |

**Also fix:** The `system_settings` PATCH route (`/api/reservas/admin/settings/route.ts`) has an `updated_by` column that is **never populated**. Fix by passing `auth.user!.id` in the update.

#### 4.1d — Audit Log Admin Page

**New page:** `/admin/audit` (master-only)

Simple paginated table showing audit events:
- Columns: Timestamp, Actor, Event Type, Resource, Details
- Filters: Date range, event type, actor
- No edit/delete capabilities (append-only)

**Effort:** ~12 hours (migration, utility, instrumenting 9+ routes, admin page).

#### Implementation Notes (Completed 2026-03-19)

- **Migration 041 deployed** via Management API: `audit_events` table with 4 indexes, RLS (admin read via `jwt_role()`, service_role insert). Uses `jwt_role()` from migration 040.
- **`src/lib/audit.ts`**: Fire-and-forget `logAudit(user, event)` utility. Accepts `User` object from `requireRole()`. Extracts IP/method/path from optional `request`. Try/catch wraps everything — never crashes primary operation.
- **10 routes instrumented** (11 event types): `reservation.confirmed`, `reservation.rejected`, `reservation.desisted`, `freeze.released`, `rate.confirmed`, `settings.updated`, `salesperson.invited` (3 exit points), `assignment.created`, `assignment.ended`, `mgmt_role.created`, `mgmt_role.ended`.
- **`/api/admin/audit-log`**: GET endpoint with filtering (event_type, resource_type, actor_id, date range) + pagination (limit/offset, max 100).
- **`/admin/audit`**: Full audit log viewer — filterable table (event type + resource type dropdowns), expandable detail rows (JSON), pagination, Spanish labels.
- DISC-02 resolved via audit trail — `event_type = 'reservation.desisted'` distinguishes desist from confirm/reject. No `desisted_by`/`desisted_at` columns needed.
- DISC-05 resolved — `assignment.created`/`assignment.ended` events capture who changed project assignments.

---

### 4.2 GAP-16: Maker-Checker on User Provisioning — ✅ RESOLVED (Option A, 2026-03-19)

**Problem:** A single admin can create an auth account, assign projects, and send credentials — all without approval from a second person.

**Current risk level:** Low (only 2 admin users exist). But this is a SOC 2 requirement (CC6.2) and becomes critical when the admin team grows.

**Solution: Lightweight approval workflow.**

The full maker-checker pattern (separate table, approval queue, second admin UI) is overengineered for a 2-admin team. Instead, implement **audit + notification**:

#### Option A: Audit-Only (Recommended for now)

1. Log all user provisioning to `audit_events` (covered in 4.1c above)
2. Add a `provisioned_by` column to `salespeople` table (denormalized for quick queries)
3. Show provisioning history in `/admin/asesores` (who invited whom, when)
4. The second admin can review the audit log and revoke access if needed

This satisfies the "at minimum, log all user provisioning actions with full audit trail" recommendation from the gap analysis.

#### Option B: Full Maker-Checker (Deferred)

If the admin team grows beyond 3 users, implement:
1. `user_provisioning_requests` table (status: PENDING → APPROVED/REJECTED)
2. First admin creates request, second admin approves
3. Invite link generated only after approval
4. Notification to second admin when request is pending

**Decision:** Implement Option A now. Option B is Phase 6 (deferred).

**Effort:** ~4 hours (migration for `provisioned_by`, audit instrumentation already covered in 4.1).

#### Implementation Notes (Completed 2026-03-19)

Option A implemented: `salesperson.invited` audit events capture who invited whom (actor_id, actor_email, actor_role) with details (email, salesperson name, resend flag). No `provisioned_by` column added — the audit trail is the source of truth. Adding a denormalized column would create a second source of truth that could drift.

---

## 5. Phase 4 — Role-Aware Data Filtering

**Urgency:** Required before activating gerencia, financiero, or contabilidad roles for real users who should see filtered data.
**Effort:** ~24 hours total.
**Dependencies:** Phase 2 (permission matrix must exist to define what each role sees).

### 5.1 GAP-03: Server-Side Field Masking on Analytics Routes

**Problem:** All analytics API routes return the same full dataset regardless of the caller's role. When gerencia or financiero roles are activated, these users should see appropriate subsets — not the same data as master.

**Solution:** Role-aware response shaping. The API checks the caller's role and filters the response accordingly.

#### Data Sensitivity Classification

Based on codebase exploration, the analytics endpoints fall into three sensitivity tiers:

| Endpoint | Sensitivity | Contains PII | Contains Financial |
|----------|-------------|-------------|-------------------|
| `/api/analytics/commissions` | HIGH | recipient names | individual commission amounts, ISR |
| `/api/commissions` | HIGH | recipient names, sale/client IDs | individual commission rows |
| `/api/commission-rates` | HIGH | recipient names | individual rates |
| `/api/analytics/payments` | MEDIUM | client names | per-unit payment amounts |
| `/api/analytics/payment-compliance` | MEDIUM | client names | per-unit compliance, delinquency |
| `/api/analytics/cash-flow-forecast` | LOW | none | monthly aggregates only |
| `/api/commission-phases` | NONE | none | configuration only |

#### Masking Rules by Role

| Field | master | torredecontrol | gerencia | financiero | contabilidad |
|-------|--------|----------------|----------|------------|--------------|
| Individual commission amounts | ✓ | ✓ | Team only | ✓ | Aggregates only |
| Recipient names | ✓ | ✓ | Team only | ✓ | Anonymized |
| Client names | ✓ | ✓ | Team only | Anonymized | Anonymized |
| ISR/tax details | ✓ | ✓ | ✗ | ✓ | ✓ |
| Payment compliance per unit | ✓ | ✓ | Team only | ✓ | Aggregates only |
| Cash flow forecast | ✓ | ✓ | ✓ | ✓ | ✓ |
| Commission rates config | ✓ | ✓ | ✗ | ✓ | ✗ |

"Team only" = gerencia sees data only for salespeople they manage (requires GAP-09 project scoping first). Until then, gerencia sees aggregates.

#### Implementation Pattern

Create a response shaping utility:

**New file:** `src/lib/field-masking.ts`

```typescript
import type { Role } from "./auth";

interface MaskingConfig {
  redactFields?: string[];     // Fields to remove entirely
  anonymizeFields?: string[];  // Fields to replace with "***"
  aggregateOnly?: boolean;     // Return only summary, no detail rows
}

const MASKING_RULES: Record<string, Record<string, MaskingConfig>> = {
  "analytics/commissions": {
    contabilidad: { anonymizeFields: ["recipientName"], aggregateOnly: true },
    gerencia: { aggregateOnly: true },
    // master, torredecontrol, financiero: no masking
  },
  "analytics/payments": {
    contabilidad: { anonymizeFields: ["clientName"], aggregateOnly: true },
    financiero: { anonymizeFields: ["clientName"] },
    gerencia: { aggregateOnly: true },
  },
  // ... per endpoint
};

export function getMaskingConfig(endpoint: string, role: Role): MaskingConfig | null {
  return MASKING_RULES[endpoint]?.[role] ?? null;
}
```

Each analytics route applies masking after the Supabase query:

```typescript
const config = getMaskingConfig("analytics/commissions", role);
if (config?.aggregateOnly) {
  // Return only summary totals, strip byRecipient array
}
if (config?.anonymizeFields) {
  // Replace named fields with "***"
}
```

**Effort:** ~24 hours (masking utility, updating 5 analytics routes, testing each role's response).

**Note:** This is the highest-effort gap. Consider deferring detailed masking until a specific role activation is imminent. The `requireRole(DATA_VIEWER_ROLES)` guard from changelog 074 already prevents ventas users from accessing these routes — the remaining risk is only between admin sub-roles.

---

## 6. Phase 5 — Pati's Operations Dashboard

**Status:** ✅ COMPLETED (2026-03-19, MVP)
**Urgency:** Highest ROI for the mission ("obliterate Excel"). Not a security blocker.
**Effort:** ~40 hours total.
**Dependencies:** None (can start independently).

### 6.1 GAP-11: Operations Dashboard for Pati (Torre de Control) — ✅ RESOLVED (2026-03-19)

**Problem:** Pati uses the analytics dashboard (designed for insight, not action) plus `/admin/reservas` (reservation queue). Her actual workflow — processing incoming reservations, cross-referencing data, catching errors, managing document flow — has no dedicated interface. She still context-switches to Excel for payment tracking.

**Solution:** An action-first operator command center.

**New page:** `/admin/operaciones` (or `/torre-de-control`)

#### Layout: 4 Panels

**Panel 1 — Work Queue (left, 60% width)**

| Section | Content |
|---------|---------|
| Pendientes | Reservations in PENDING_REVIEW, sorted by submission date (oldest first) |
| Rate Confirmación | Sales with `ejecutivo_rate_confirmed = false`, sorted by sale date |
| Documentos Faltantes | Reservations missing: DPI photo, receipt, PCV |
| Próximos Vencimientos | Payments due in next 7 days (from `expected_payments`) |

Each item is a clickable row that opens the existing `ReservationDetail` component (or a payment detail). Color-coded urgency: red (>48h pending), amber (24-48h), green (<24h).

**Panel 2 — Stats Strip (top, full width)**

KPI cards showing today's operational state:
- Pendientes (count, trend arrow vs yesterday)
- Procesadas hoy (confirmed + rejected today)
- Tasas sin confirmar (count)
- Documentos faltantes (count)
- Pagos vencidos (count, color-coded)

**Panel 3 — Recent Activity Feed (right, 40% width)**

Chronological log of recent events:
- "José reservó BLT-301 hace 2h"
- "Leonel confirmó tasa EV de BEN-505 hace 1h"
- "Auto-aprobación: CE-201 confirmada hace 30m"

Data source: `unit_status_log` + `audit_events` (from Phase 3).

**Panel 4 — Quick Actions (bottom of work queue)**

Bulk operations:
- Select multiple pending reservations → confirm all
- Export pending list to clipboard (for WhatsApp sharing)
- Jump to reservation form (`/reservar`) — for when Pati submits on behalf of a salesperson

#### Data Sources

- `/api/reservas/admin/reservations?status=PENDING_REVIEW` — existing
- `/api/reservas/admin/sales?rate_unconfirmed=true` — new query param
- `/api/analytics/payment-compliance?delinquent_only=true` — existing
- `/api/audit-events?limit=20` — new (from Phase 3)
- Document status: derived from `reservations.pcv_url IS NULL`, `dpi_image_url IS NULL`

#### Implementation Notes

- Reuse existing components (`ReservationDetail`, `KpiCard`, `AdminStats`)
- New components: `WorkQueue`, `ActivityFeed`, `BulkActionBar`
- No new API routes needed except audit events endpoint and the rate-unconfirmed sales query param

**Effort:** ~24 hours.

#### Implementation Notes (Completed 2026-03-19)

- **`/admin/operaciones`**: Operations command center (MVP) — `operaciones-client.tsx` (~380 lines)
- **Stats strip**: 5 KPI cards (Pendientes, Tasas sin confirmar, Docs faltantes, Procesadas hoy, Total reservas) with urgency-colored values (red >5, amber >0, green =0)
- **Work queue (3 tabs)**: Pendientes (sorted oldest-first, urgency dots: red >48h, amber 24-48h, green <24h), Tasas EV (unconfirmed ejecutivo rates), Documentos (missing DPI)
- **Activity feed**: Last 20 audit events from `/api/admin/audit-log?limit=20` with `timeAgo()` relative timestamps, graceful fallback ("Sin actividad reciente")
- **Data source**: Reuses existing `useReservations()` hook — no new API routes. Client-side filtering for queue tabs.
- **Click-through**: Selected reservation links to `/admin/reservas?selected=ID`
- **NavBar**: "Operaciones" link added after Reservas (ADMIN_PAGE_ROLES)
- **Panel 4 (quick actions / bulk ops)**: Deferred — not needed for MVP

---

### 6.2 GAP-10: Role-Specific Dashboard Routing — ✅ RESOLVED (2026-03-19, simpler approach)

**Problem:** All admin users see the same analytics dashboard at `/`. A CFO needs financial KPIs. Pati needs operational queues. A sales manager needs team performance.

**Solution:** Route `/` to the appropriate dashboard based on role.

**File:** `src/app/page.tsx`

```typescript
// Read user role from session
// Route:
//   master / torredecontrol → /admin/operaciones (Pati's new dashboard, with link to analytics)
//   financiero → /dashboard (analytics, commissions tab)
//   gerencia → /dashboard (analytics, overview tab)
//   contabilidad → /dashboard (analytics, payments tab)
//   ventas → already handled by middleware → /ventas/dashboard
```

The existing analytics dashboard at `/dashboard` (or served at `/`) remains available to all DATA_VIEWER_ROLES users — it's just not the default landing for operational roles.

**Alternative simpler approach:** Keep `/` as the analytics dashboard for all admin roles. Add `/admin/operaciones` as a separate page. Let Pati bookmark it. This avoids routing complexity and is more predictable.

**Recommendation:** Start with the simpler approach (separate page, no routing change). Add role-based routing later if user feedback demands it.

**Effort:** ~16 hours (new page + components, reusing existing patterns).

**Implemented:** Simpler approach — `/admin/operaciones` as a separate page. Pati bookmarks it. No middleware routing changes. Role-based `/` routing deferred until user feedback demands it.

---

## 7. Phase 6 — Deferred Items

These gaps are real but have low practical urgency given the current team size (2 admins, 32 salespeople, 4 projects).

### 7.1 GAP-09: Project-Scoped Admin Access

**Problem:** All admins see all 4 projects.

**Why deferred:** Only 2 admin users exist, both need to see all projects. Project scoping only becomes valuable when the admin team grows to include project-specific roles (e.g., a BLT-only accountant).

**Future implementation:**
1. Create `user_project_assignments` table (mirrors `salesperson_project_assignments` but for admin users)
2. Add RLS policies that filter by project assignment
3. Update all analytics queries to filter by assigned projects
4. Admin UI: project assignment management for admin users

**Effort when needed:** ~24 hours.

### 7.2 GAP-16 Option B: Full Maker-Checker

**Why deferred:** 2-admin team. Audit trail (Phase 3) provides accountability without workflow friction.

**Future implementation:**
1. `user_provisioning_requests` table
2. Approval workflow API routes
3. UI: pending approvals queue in `/admin/asesores`
4. Notification to second admin

**Effort when needed:** ~8 hours.

---

## 8. Additional Issues Discovered

During codebase exploration, five additional issues were identified:

### DISC-01: `system_settings.updated_by` Never Populated — ✅ ALREADY RESOLVED

**File:** `src/app/api/reservas/admin/settings/route.ts`

~~The PATCH handler updates `auto_approval_enabled` but does not set `updated_by`. The column exists in the schema but is always NULL.~~

**Status:** Upon inspection, the route already populates `updated_by: auth.user!.id` at line 39. This was a false finding — the exploration agent missed the existing code. No changes needed.

### DISC-02: No `desisted_by` Column on Reservations — ✅ RESOLVED (2026-03-19)

When an admin processes a desistimiento, `reviewed_by` captures who initially confirmed the reservation — not who desisted it. The desist action overwrites the status but doesn't record the actor.

~~**Fix:** Add `desisted_by` and `desisted_at` columns to `reservations` table. Populate in the desist RPC or API route.~~

**Resolution:** Resolved via centralized audit trail — `audit_events` with `event_type = 'reservation.desisted'` captures who desisted and when. No schema change needed. `reviewed_by`/`reviewed_at` already captures the timestamp, and the audit event distinguishes desist from confirm/reject.

### DISC-03: `hasMinimumRole()` Exists But Is Never Used

The function was added in changelog 074 but no route or component calls it. All authorization still uses explicit role arrays.

**Fix:** No immediate action needed. The function exists for future use. Once Phase 2 (permissions module) is implemented, routes will use `rolesFor()` which makes `hasMinimumRole()` less relevant. Consider removing it if still unused after Phase 2 to avoid dead code.

### DISC-04: NavBar Shows "Roles" Link to `torredecontrol` — ✅ RESOLVED (Phase 1)

The `/admin/roles` page (commission gerencia assignments) uses `requireRole(["master"])` — master-only. But the NavBar showed the "Roles" link to all non-ventas users, including `torredecontrol`. A torredecontrol user clicking the link would see the page rendered but API calls would fail with 403.

**Fix applied:** Tagged the Roles link with `roles: ["master"]` in the NavBar link list. Now only `master` users see the link. Implemented as part of Phase 1 NavBar refactor (section 2.1b).

### DISC-05: Salesperson Project Assignments Not Audit-Logged — ✅ RESOLVED (2026-03-19)

When an admin changes a salesperson's project assignments via `/api/admin/salespeople/projects`, the temporal model tracks what changed (end_date set, new row inserted) but not who made the change.

~~**Fix:** Add `logAuditEvent()` call in the project assignment route. Already planned in Phase 3 (section 4.1c).~~

**Resolution:** `logAudit()` call added to project assignment route. Logs `assignment.created` or `assignment.ended` events with `details: { added, removed, resulting }` arrays.

---

## 9. File Change Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `src/lib/permissions.ts` | 2 | Access control matrix + `can()` + `rolesFor()` |
| `src/lib/audit.ts` | 3 ✅ | `logAudit()` utility |
| `src/lib/field-masking.ts` | 4 | Role-aware response shaping |
| `scripts/migrations/040_ventas_ownership_rls.sql` | 1 ✅ | Ownership-scoped RLS policies (deployed) |
| `scripts/migrations/041_audit_events.sql` | 3 ✅ | `audit_events` table + RLS (deployed) |
| ~~`scripts/migrations/042_provisioning_audit.sql`~~ | ~~3~~ | ~~`salespeople.provisioned_by` + `reservations.desisted_by/at`~~ — NOT NEEDED (resolved via audit trail) |
| `scripts/generate-access-matrix.ts` | 2 | Auto-generate access control doc |
| `docs/access-control-matrix.md` | 2 | Generated formal access control document |
| `src/app/admin/operaciones/page.tsx` | 5 ✅ | Pati's operations dashboard (page wrapper) |
| `src/app/admin/operaciones/operaciones-client.tsx` | 5 ✅ | Operations dashboard (main component) |
| `src/app/admin/audit/page.tsx` | 3 ✅ | Audit log viewer (page wrapper) |
| `src/app/admin/audit/audit-client.tsx` | 3 ✅ | Audit log viewer (main component) |
| `src/app/api/admin/audit-log/route.ts` | 3 ✅ | Audit log API (GET with filters + pagination) |

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `middleware.ts` | 1 ✅ | Explicit role routing (replace binary ventas/non-ventas) |
| `src/components/nav-bar.tsx` | 1 ✅ (+3+5 ✅ for Operaciones/Auditoría links) | Role-filtered links with `roles` array tagging |
| `src/app/api/reservas/admin/settings/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/admin/salespeople/invite/route.ts` | 3 ✅ | Add audit logging (3 exit points) |
| `src/app/api/admin/salespeople/projects/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/reservas/admin/reservations/[id]/reject/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` | 3 ✅ | Add audit logging (no desisted_by column — resolved via audit trail) |
| `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/admin/management-roles/route.ts` | 3 ✅ | Add audit logging (POST) |
| `src/app/api/admin/management-roles/[id]/route.ts` | 3 ✅ | Add audit logging (PATCH) |
| `src/app/api/reservas/admin/freeze-requests/[id]/release/route.ts` | 3 ✅ | Add audit logging |
| `src/app/api/analytics/commissions/route.ts` | 4 | Add field masking |
| `src/app/api/analytics/payments/route.ts` | 4 | Add field masking |
| `src/app/api/analytics/payment-compliance/route.ts` | 4 | Add field masking |
| `src/app/api/commissions/route.ts` | 4 | Add field masking |
| `src/app/api/commission-rates/route.ts` | 4 | Add field masking |
| `src/lib/auth.ts` | 2 | Export role groups for NavBar/middleware consumption |

---

## 10. Dependency Graph

```
Phase 1 (Security) ✅ DONE   Phase 3 (Audit) ✅ DONE
  GAP-04: ✅ Middleware/NavBar   GAP-22: ✅ audit_events table
  GAP-05: ✅ RLS ownership       GAP-16: ✅ provisioning audit
  DISC-01: ✅ already resolved   DISC-02: ✅ via audit trail
  DISC-04: ✅ NavBar Roles link  DISC-05: ✅ assignment audit
         │
         ▼
Phase 2 (Permissions)          Phase 5 (Dashboards) ✅ DONE
  GAP-07: Permission matrix      GAP-11: ✅ Pati operations
  GAP-08: can() utility          GAP-10: ✅ Role routing
  GAP-21: Access control doc
  DISC-03: hasMinimumRole cleanup
         │
         ▼
Phase 4 (Field Masking)
  GAP-03: Response shaping
         │
         ▼
Phase 6 (Deferred)
  GAP-09: Project-scoped access
  GAP-16b: Full maker-checker
```

**Key dependencies:**
- Phase 2 depends on Phase 1 ✅ (middleware must handle role groups before NavBar uses `can()`)
- Phase 4 depends on Phase 2 (masking rules reference the permission matrix)
- ~~Phase 5 is independent (can start anytime, uses existing APIs)~~ ✅ DONE
- ~~Phase 3 is independent (can start anytime)~~ ✅ DONE
- Phase 6 has no timeline pressure

---

## Effort Summary

| Phase | Scope | Estimated Hours |
|-------|-------|-----------------|
| Phase 1 | GAP-04 + GAP-05 + DISC-01/04 | ✅ COMPLETED |
| Phase 2 | GAP-07 + GAP-08 + GAP-21 + DISC-03 | ~16 |
| Phase 3 | GAP-22 + GAP-16 + DISC-02/05 | ✅ COMPLETED |
| Phase 4 | GAP-03 | ~24 |
| Phase 5 | GAP-10 + GAP-11 | ✅ COMPLETED (MVP) |
| Phase 6 | GAP-09 + GAP-16b (deferred) | ~32 |
| **Total remaining** | **Phase 2 + Phase 4 + Phase 6** | **~72 hours** |

**Execution history:**
- Phase 1 completed 2026-03-19 (changelogs 074 + 075)
- Phase 3 completed 2026-03-19 (migration 041 + audit trail)
- Phase 5 completed 2026-03-19 (operations dashboard MVP)
- **Post-auth redirect fixes completed 2026-03-20** (see below)

**Next:** Phase 2 (permission architecture) — must complete before activating gerencia/financiero/contabilidad for real users. Phase 4 depends on Phase 2. Phase 6 deferred until admin team grows.

---

## 11. Post-Deployment Auth Issues (Discovered 2026-03-20)

### Context

After all Phase 1/3/5 security work was deployed, production testing with two ventas users (Erwin Cardona and Antonio Rada) revealed **5 compounding failures in the post-authentication redirect layer** that were not covered by any of the existing phases. These were not gaps in the role system itself, but failures in how authenticated users were routed to the correct page after login.

### Issues Found

| # | Issue | File | Severity |
|---|-------|------|----------|
| AUTH-01 | Login page `redirect("/")` ignores role — sends ALL authenticated users to admin dashboard | `src/app/login/page.tsx` | CRITICAL |
| AUTH-02 | `router.replace("/")` race condition — React renders admin dashboard before middleware redirect arrives | `login-form.tsx`, `set-password/page.tsx` | CRITICAL |
| AUTH-03 | `/auth/confirm` always forces password re-set even for returning users with existing passwords | `auth/confirm/route.ts` | HIGH |
| AUTH-04 | Root page `/` has NO server-side auth guard — only defense was middleware | `src/app/page.tsx` | HIGH |
| AUTH-05 | Pre-March-17 users missing `password_set` trapped in infinite set-password loop | SQL (Supabase) | HIGH |

### Resolution (2026-03-20)

All 5 issues fixed. Full investigation and resolution details in `docs/plan-auth-deep-investigation.md`.

**Key changes:**
- `src/app/login/page.tsx` — Role-aware server redirect (ventas → `/ventas/dashboard`)
- `src/app/login/login-form.tsx` — `window.location.href` (hard navigation) replaces `router.replace("/")`
- `src/app/auth/set-password/page.tsx` — Same hard navigation pattern
- `src/app/page.tsx` — Async Server Component with full auth guard (no user → login, ventas → ventas dashboard, unknown role → login, only DATA_VIEWER_ROLES renders)
- `src/app/auth/confirm/route.ts` — Checks `password_set` before routing; existing users skip set-password
- SQL backfill — `password_set: true` for confirmed ventas users missing it

**Build:** `npx next build` passes with zero errors. Root page changed from static (`○`) to dynamic (`ƒ`).

### Relationship to Existing Phases

These issues were orthogonal to the gap-analysis framework (GAP-01 through GAP-24). They were not role system gaps but rather *auth flow* failures in the login → redirect → landing chain. The existing phases addressed:
- **Phase 1:** Middleware role routing, NavBar filtering, RLS ownership
- **Phase 3:** Audit trail
- **Phase 5:** Operations dashboard

The post-auth redirect fixes address a sixth concern: **what page does an authenticated user actually land on?** The middleware correctly identifies role and enforces routing, but three additional entry points (login page Server Component, login-form client navigation, set-password client navigation) were bypassing middleware's role-aware routing. The root page also lacked a last-resort server-side guard.
