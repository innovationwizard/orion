# Plan: Phase 3 (Audit Trail) + Phase 5 (Pati's Operations Dashboard) — Parallel Execution

**Date:** 2026-03-19
**Status:** ✅ COMPLETED (2026-03-19)
**Prerequisite:** Phase 1 completed (changelogs 074 + 075). All critical + high-severity security gaps resolved.
**Scope:** GAP-22, GAP-16, DISC-02, DISC-05 (Phase 3) + GAP-10, GAP-11 (Phase 5)
**Total effort:** ~60 hours (~20 Phase 3 + ~40 Phase 5)

---

## Table of Contents

1. [Execution Strategy](#1-execution-strategy)
2. [Phase 3 — Audit Trail](#2-phase-3--audit-trail)
3. [Phase 5 — Operations Dashboard](#3-phase-5--operations-dashboard)
4. [Shared Dependency: Phase 3 → Phase 5](#4-shared-dependency-phase-3--phase-5)
5. [File Change Summary](#5-file-change-summary)
6. [Testing & Verification](#6-testing--verification)
7. [Execution Timeline](#7-execution-timeline)

---

## 1. Execution Strategy

### Why Parallel

- Phase 3 creates the `audit_events` table that Phase 5's **Activity Feed** panel consumes.
- Phase 5 can start immediately — the operations dashboard MVP works without audit data (queues use existing APIs). The activity feed is the last panel to wire up.
- Both phases are independent of Phases 2 and 4 (no `can()` utility or field masking needed).

### Execution Order

```
Week 1:  Phase 3.1 (migration + utility)     Phase 5.1 (page scaffolding + stats strip)
Week 2:  Phase 3.2 (instrument 9 routes)     Phase 5.2 (work queue panels)
Week 3:  Phase 3.3 (audit log API + UI)       Phase 5.3 (activity feed ← consumes audit_events)
Week 4:  Integration testing + polish
```

Phase 3.1 (migration) must land before Phase 5.3 (activity feed) — this is the only cross-dependency.

---

## 2. Phase 3 — Audit Trail

**Status:** ✅ COMPLETED (2026-03-19)
**Gaps addressed:** GAP-22 (incomplete audit trail), GAP-16 (provisioning audit), DISC-02 (desisted_by), DISC-05 (assignment audit)
**Effort:** ~20 hours

### 2.1 Current Audit Infrastructure

Audit logging exists but is **scattered across 4 tables** with no centralized trail:

| Table | What It Logs | Gap |
|-------|-------------|-----|
| `unit_status_log` | Unit status changes (`changed_by`, `reason`) | Functional but domain-specific |
| `reservations` | `reviewed_by`/`reviewed_at` | Does NOT distinguish confirm vs reject vs desist |
| `freeze_requests` | `released_by`/`released_at` | Only tracks release, not creation |
| `system_settings` | `updated_by`/`updated_at` | Functional |

**Not logged at all:**
- Ejecutivo rate confirmation (no audit fields — updates `sales` table directly)
- Salesperson invite/provisioning
- Project assignment changes
- Management role (GC/Supervisor) assignment changes

### 2.2 Migration: `audit_events` Table

**File:** `scripts/migrations/041_audit_events.sql`

```sql
-- ============================================================
-- Migration 041: Centralized Audit Events
-- Append-only table for all significant admin actions.
-- Complements unit_status_log (domain-specific) with a
-- system-wide event log for compliance and traceability.
-- ============================================================

CREATE TABLE audit_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_id       uuid        NOT NULL,  -- auth.users(id)
  actor_role     text        NOT NULL,  -- role at time of action (denormalized)
  actor_email    text,                   -- email at time of action (denormalized)

  -- Event
  event_type     text        NOT NULL,  -- e.g. 'reservation.confirmed', 'salesperson.invited'
  resource_type  text        NOT NULL,  -- e.g. 'reservation', 'salesperson', 'sale'
  resource_id    text,                   -- UUID or composite key of affected resource
  resource_label text,                   -- Human-readable summary for UI display

  -- Change data
  details        jsonb,                  -- Action-specific payload (old_value, new_value, reason, etc.)

  -- Request context
  ip_address     text,                   -- x-forwarded-for
  http_method    text,                   -- GET, POST, PATCH, DELETE
  http_path      text,                   -- /api/reservas/admin/reservations/[id]/confirm

  -- Timestamp
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_audit_events_actor      ON audit_events (actor_id);
CREATE INDEX idx_audit_events_resource   ON audit_events (resource_type, resource_id);
CREATE INDEX idx_audit_events_type       ON audit_events (event_type);
CREATE INDEX idx_audit_events_created    ON audit_events (created_at DESC);

-- RLS: admin-only read, service_role insert (append-only)
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit events" ON audit_events
  FOR SELECT TO authenticated
  USING (
    jwt_role() IN ('master', 'torredecontrol')
  );

CREATE POLICY "Service role insert audit events" ON audit_events
  FOR INSERT TO service_role
  WITH CHECK (true);

-- No UPDATE or DELETE policies — append-only by design
```

**Design decisions:**
- Uses existing `jwt_role()` helper (deployed in migration 040)
- `resource_id` is `text` (not uuid) to accommodate composite keys like `salesperson_id:project_id`
- `details` is `jsonb` for action-specific payloads — keeps the schema stable as new event types are added
- Reuses `audit_events` name from `plan-fix-high-severity-gaps.md` for consistency
- No FK on `actor_id` — avoids coupling to auth schema and allows logging even if user is later deleted

### 2.3 Audit Logging Utility

**New file:** `src/lib/audit.ts`

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export interface AuditEvent {
  eventType: string;
  resourceType: string;
  resourceId?: string;
  resourceLabel?: string;
  details?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an audit event to the centralized audit_events table.
 * Fire-and-forget: audit failure does NOT block the primary operation.
 */
export async function logAudit(user: User, event: AuditEvent): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("audit_events").insert({
      actor_id: user.id,
      actor_role: getUserRole(user) ?? "unknown",
      actor_email: user.email ?? null,
      event_type: event.eventType,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      resource_label: event.resourceLabel ?? null,
      details: event.details ?? null,
      ip_address: event.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      http_method: event.request?.method ?? null,
      http_path: event.request ? new URL(event.request.url).pathname : null,
    });

    if (error) {
      console.error("[audit] Failed to log event:", error.message, event.eventType);
    }
  } catch (err) {
    console.error("[audit] Unexpected error:", err);
  }
}
```

**Key design:**
- Accepts `User` object directly (already available from `requireRole()`/`requireAuth()` return)
- `request` is optional — extracts IP and method/path when provided
- Try/catch wraps everything — audit must never crash the primary operation
- No return value — callers `await` it but don't check the result

### 2.4 Event Types

Standardized event type format: `{resource}.{action}`

| Event Type | Route | Resource Type |
|-----------|-------|---------------|
| `reservation.confirmed` | `/api/reservas/admin/reservations/[id]/confirm` | `reservation` |
| `reservation.rejected` | `/api/reservas/admin/reservations/[id]/reject` | `reservation` |
| `reservation.desisted` | `/api/reservas/admin/reservations/[id]/desist` | `reservation` |
| `freeze.released` | `/api/reservas/admin/freeze-requests/[id]/release` | `freeze_request` |
| `rate.confirmed` | `/api/reservas/admin/sales/[id]/ejecutivo-rate` | `sale` |
| `settings.updated` | `/api/reservas/admin/settings` | `system_settings` |
| `salesperson.invited` | `/api/admin/salespeople/invite` | `salesperson` |
| `assignment.created` | `/api/admin/salespeople/projects` | `project_assignment` |
| `assignment.ended` | `/api/admin/salespeople/projects` | `project_assignment` |
| `mgmt_role.created` | `/api/admin/management-roles` | `management_role` |
| `mgmt_role.ended` | `/api/admin/management-roles/[id]` | `management_role` |

### 2.5 Route Instrumentation (9 Routes)

All routes follow the same pattern — add `logAudit()` call **after** the primary operation succeeds:

```typescript
import { logAudit } from "@/lib/audit";

// ... existing handler code ...

// After successful operation:
await logAudit(auth.user!, {
  eventType: "reservation.confirmed",
  resourceType: "reservation",
  resourceId: reservationId,
  resourceLabel: `Unit ${unitNumber} (${projectName})`,
  details: { admin_user_id: input.admin_user_id },
  request,
});
```

#### Route-by-route specifics:

**Route 1: Confirm reservation** (`/api/reservas/admin/reservations/[id]/confirm`)
- After `supabase.rpc("confirm_reservation")` succeeds
- `resourceLabel`: unit number + project name (query from response or existing data)
- `details`: `{ admin_user_id }`

**Route 2: Reject reservation** (`/api/reservas/admin/reservations/[id]/reject`)
- After `supabase.rpc("reject_reservation")` succeeds
- `details`: `{ admin_user_id, reason: input.reason }`

**Route 3: Desist reservation** (`/api/reservas/admin/reservations/[id]/desist`)
- After `supabase.rpc("desist_reservation")` succeeds
- `details`: `{ admin_user_id, reason: input.reason }`
- **DISC-02 resolved:** The centralized audit trail captures who desisted and when — no need for separate `desisted_by`/`desisted_at` columns on `reservations` table. The `reviewed_by`/`reviewed_at` columns already record the timestamp, and the audit event distinguishes desist from confirm/reject via `event_type`.

**Route 4: Release freeze** (`/api/reservas/admin/freeze-requests/[id]/release`)
- After `supabase.rpc("release_freeze")` succeeds
- `resourceType`: `"freeze_request"`
- `details`: `{ admin_user_id }`

**Route 5: Confirm ejecutivo rate** (`/api/reservas/admin/sales/[id]/ejecutivo-rate`)
- After `supabase.from("sales").update(...)` succeeds
- `resourceType`: `"sale"`
- `details`: `{ ejecutivo_rate: input.ejecutivo_rate, old_rate: null }`

**Route 6: Update settings** (`/api/reservas/admin/settings`)
- After `supabase.from("system_settings").update(...)` succeeds
- `resourceType`: `"system_settings"`
- `resourceId`: setting key (e.g. `"auto_approval_enabled"`)
- `details`: `{ key, old_value, new_value }`

**Route 7: Invite salesperson** (`/api/admin/salespeople/invite`)
- After successful invite link generation
- `resourceType`: `"salesperson"`
- `details`: `{ email, salesperson_name, is_resend: boolean }`
- **GAP-16 resolved (Option A):** Audit trail captures who invited whom and when. Full maker-checker (Option B) deferred to Phase 6.

**Route 8: Update project assignments** (`/api/admin/salespeople/projects`)
- After successful assignment changes
- Log one event per change (add or remove)
- `resourceType`: `"project_assignment"`
- `resourceId`: `"${salesperson_id}:${project_id}"` (composite)
- `details`: `{ salesperson_name, project_name, action: "added" | "removed" }`
- **DISC-05 resolved**

**Route 9a: Create management role** (`/api/admin/management-roles` POST)
- After successful insert
- `resourceType`: `"management_role"`
- `details`: `{ role, recipient_name, rate, start_date }`

**Route 9b: End management role** (`/api/admin/management-roles/[id]` PATCH)
- After successful update
- `details`: `{ recipient_name, role, end_date }`

### 2.6 Audit Log API Endpoint

**New file:** `src/app/api/admin/audit-log/route.ts`

```typescript
export async function GET(request: Request) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  // Query params: event_type, resource_type, actor_id, from, to, limit, offset
  // Validate with Zod schema
  // Query audit_events with filters, ordered by created_at DESC
  // Return { events: AuditEvent[], total: number }
}
```

**Features:**
- Filtering by: `event_type`, `resource_type`, `actor_id`, date range (`from`/`to`)
- Pagination: `limit` (default 50, max 100), `offset`
- Sort: `created_at DESC` (always newest first)
- Auth: `requireRole(ADMIN_ROLES)` — master + torredecontrol only

### 2.7 Audit Log Admin Page

**New files:**
- `src/app/admin/audit/page.tsx` — Server wrapper (metadata + Suspense)
- `src/app/admin/audit/audit-client.tsx` — Client component

**UI layout:**
```
┌─────────────────────────────────────────────────────────┐
│ NavBar                                                  │
├─────────────────────────────────────────────────────────┤
│ Registro de Auditoría                                   │
│                                                         │
│ [Tipo ▾] [Recurso ▾] [Desde ___] [Hasta ___] [Buscar]  │
│                                                         │
│ ┌─────────┬──────────┬─────────────┬─────────┬────────┐ │
│ │ Fecha   │ Actor    │ Evento      │ Recurso │ Detalle│ │
│ ├─────────┼──────────┼─────────────┼─────────┼────────┤ │
│ │ 14:32   │ Leonel   │ Reserva     │ B5-401  │ ▶      │ │
│ │         │ (master) │ confirmada  │         │        │ │
│ ├─────────┼──────────┼─────────────┼─────────┼────────┤ │
│ │ 14:15   │ Leonel   │ Tasa EV     │ CE-201  │ ▶      │ │
│ │         │ (master) │ confirmada  │ 1.25%   │        │ │
│ ├─────────┼──────────┼─────────────┼─────────┼────────┤ │
│ │ 13:50   │ Leonel   │ Asesor      │ José G. │ ▶      │ │
│ │         │ (master) │ invitado    │         │        │ │
│ └─────────┴──────────┴─────────────┴─────────┴────────┘ │
│                                                         │
│ Mostrando 1-50 de 127           [← Anterior] [Siguiente →] │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Paginated table (50 per page)
- Filter dropdowns: event type, resource type
- Date range picker
- Expand row to show full `details` JSON
- No edit/delete — read-only (append-only table)

**NavBar link:** Add `{ href: "/admin/audit", label: "Auditoría", roles: ADMIN_PAGE_ROLES }` to `NON_VENTAS_LINKS` after "Roles".

### 2.8 Migration for GAP-16: Provisioning Audit

**Included in migration 041** — no separate migration needed. The `audit_events` table captures `salesperson.invited` events with full details (who invited, whom, when, email). This satisfies GAP-16 Option A (audit-only, no maker-checker workflow).

**No `provisioned_by` column on `salespeople`** — the audit trail is the source of truth. Adding a denormalized column would create a second source of truth that could drift.

### 2.9 DISC-02 Resolution: No Separate `desisted_by` Column

The original plan proposed adding `desisted_by`/`desisted_at` columns to `reservations`. With the centralized audit trail, this is unnecessary:

- `reservations.reviewed_by`/`reviewed_at` already captures who and when
- `audit_events` with `event_type = 'reservation.desisted'` distinguishes desist from confirm/reject
- Adding columns would create redundant data that could drift

**Resolution:** DISC-02 is resolved by the audit trail — no schema change needed.

---

## 3. Phase 5 — Operations Dashboard

**Status:** ✅ COMPLETED (2026-03-19) — MVP implemented (3-tab work queue + activity feed). Quick actions (Panel 4) deferred.
**Gaps addressed:** GAP-11 (operations dashboard for Pati), GAP-10 (role-specific dashboards)
**Effort:** ~40 hours

### 3.1 Problem

Pati's daily workflow:
1. Check `/admin/reservas` for pending approvals
2. Check the analytics dashboard for payment status
3. Switch to Excel for payment tracking, document status, and salesperson follow-up
4. Manually count "what's pending" and "what needs attention"

There is no single view that shows her **what needs action right now**.

### 3.2 Solution: `/admin/operaciones`

An **action-first** operations command center — not another analytics dashboard. Everything on this page is something Pati needs to **do**, not just **see**.

### 3.3 Data Sources (No New API Routes Needed for MVP)

| Data Need | Existing API | Filter/Param |
|-----------|-------------|--------------|
| Pending reservations | `/api/reservas/reservations?status=PENDING_REVIEW` | `status=PENDING_REVIEW` |
| All reservations (for stats) | `/api/reservas/reservations` | No filter |
| Unconfirmed ejecutivo rates | `/api/reservas/reservations` | Client-side filter: `ejecutivo_rate != null && !ejecutivo_rate_confirmed` |
| Missing documents | `/api/reservas/reservations` | Client-side filter: `pcv_url IS NULL` or `dpi_image_url IS NULL` (if exposed) |
| Payment compliance | `/api/analytics/payment-compliance` | Existing endpoint |
| Salespeople status | `/api/admin/salespeople` | Existing endpoint |
| Recent activity | `/api/admin/audit-log` | **New** (Phase 3 dependency) |

### 3.4 Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ NavBar                                                          │
├─────────────────────────────────────────────────────────────────┤
│ Centro de Operaciones                                           │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Stats Strip (6 KPIs)                                        │ │
│ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │ │
│ │ │Pendient│ │Tasas   │ │Docs    │ │Pagos   │ │Procesad│     │ │
│ │ │  3     │ │sin conf│ │faltant │ │vencidos│ │hoy     │     │ │
│ │ │ 🟡     │ │  12    │ │  8     │ │  5     │ │  7     │     │ │
│ │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌────────────────────────────────────┐ ┌──────────────────────┐ │
│ │ Work Queue (tabs)            60%   │ │ Activity Feed   40%  │ │
│ │                                    │ │                      │ │
│ │ [Pendientes] [Tasas EV] [Docs]     │ │ • José reservó       │ │
│ │                                    │ │   BLT-301 hace 2h    │ │
│ │ ┌──────────────────────────────┐   │ │                      │ │
│ │ │ 🔴 BLT-401 José García      │   │ │ • Leonel confirmó    │ │
│ │ │    hace 52h · Q2,500        │   │ │   tasa EV CE-505     │ │
│ │ │                              │   │ │   hace 1h            │ │
│ │ ├──────────────────────────────┤   │ │                      │ │
│ │ │ 🟡 CE-201 Paula Méndez      │   │ │ • Auto-aprobación:   │ │
│ │ │    hace 18h · Q3,000        │   │ │   CE-201 confirmada  │ │
│ │ │                              │   │ │   hace 30m           │ │
│ │ ├──────────────────────────────┤   │ │                      │ │
│ │ │ 🟢 BEN-105 Rony Canel       │   │ │ • Leonel invitó a    │ │
│ │ │    hace 4h · Q1,500         │   │ │   Mario R. hace 3h   │ │
│ │ └──────────────────────────────┘   │ │                      │ │
│ │                                    │ │ [Ver registro ▶]     │ │
│ └────────────────────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Panel 1: Stats Strip

Six KPI cards (reuse `AdminStats` pattern from `admin-stats.tsx`):

| KPI | Source | Color Logic |
|-----|--------|-------------|
| Pendientes | `reservations.filter(status === PENDING_REVIEW).length` | Red if >5, amber if >0, green if 0 |
| Tasas sin confirmar | `reservations.filter(ejecutivo_rate != null && !ejecutivo_rate_confirmed).length` | Amber if >0 |
| Documentos faltantes | `reservations.filter(pcv_url === null && status === CONFIRMED).length` | Amber if >0 |
| Pagos vencidos | Payment compliance data (delinquent count) | Red if >0 |
| Procesadas hoy | `reservations.filter(reviewed_at is today).length` | Informational (no color) |
| Total reservas | `reservations.length` | Informational (no color) |

### 3.6 Panel 2: Work Queue (Tabbed)

Three tabs, each a filterable list:

#### Tab 1: Pendientes (Pending Approvals)

- Source: `/api/reservas/reservations?status=PENDING_REVIEW`
- Sort: `submitted_at ASC` (oldest first — FIFO processing)
- Urgency color:
  - Red: >48h since submission
  - Amber: 24-48h
  - Green: <24h
- Each row shows: urgency dot, unit (project-tower-number), salesperson name, time since submission, deposit amount
- Click → opens `ReservationDetail` panel (reuse existing component from admin reservas)
- Quick actions: Confirm / Reject buttons inline (calls existing API)

#### Tab 2: Tasas EV (Unconfirmed Ejecutivo Rates)

- Source: `/api/reservas/reservations` filtered client-side
- Filter: `ejecutivo_rate IS NOT NULL AND ejecutivo_rate_confirmed = false`
- Sort: sale date ASC (oldest unconfirmed first)
- Each row: unit, salesperson, rate value, sale date
- Click → opens reservation detail with rate confirmation section

#### Tab 3: Documentos (Missing Documents)

- Source: `/api/reservas/reservations` filtered client-side
- Filter: `status = CONFIRMED AND pcv_url IS NULL`
- Sort: confirmed date ASC (oldest missing PCV first)
- Each row: unit, salesperson, confirmed date, missing items (PCV, DPI)
- Click → opens reservation detail

### 3.7 Panel 3: Activity Feed

- Source: `/api/admin/audit-log?limit=20` (Phase 3 dependency)
- Displays last 20 audit events in chronological order (newest first)
- Each entry: relative timestamp ("hace 2h"), actor name, action description, resource label
- Spanish action labels:

| Event Type | Display |
|-----------|---------|
| `reservation.confirmed` | `{actor} confirmó reserva {resource}` |
| `reservation.rejected` | `{actor} rechazó reserva {resource}` |
| `reservation.desisted` | `{actor} desistió reserva {resource}` |
| `rate.confirmed` | `{actor} confirmó tasa EV {resource}` |
| `salesperson.invited` | `{actor} invitó a {resource}` |
| `settings.updated` | `{actor} actualizó {resource}` |
| `assignment.created` | `{actor} asignó proyecto a {resource}` |
| `assignment.ended` | `{actor} removió proyecto de {resource}` |
| `mgmt_role.created` | `{actor} creó rol {resource}` |
| `mgmt_role.ended` | `{actor} finalizó rol {resource}` |

- Footer link: "Ver registro completo ▶" → navigates to `/admin/audit`
- **Graceful fallback:** If `audit_events` table is empty or API returns error, show "Sin actividad reciente" — don't crash the dashboard.

### 3.8 Component Architecture

```
src/app/admin/operaciones/
  ├── page.tsx                      Server wrapper (metadata + Suspense)
  └── operaciones-client.tsx        Main client component (~300 lines)
        ├── OperationsStats          Stats strip (6 KPI cards)
        ├── WorkQueue                Tabbed work queue
        │     ├── PendingTab         Pending approvals list
        │     ├── RateTab            Unconfirmed rates list
        │     └── DocsTab            Missing documents list
        ├── ActivityFeed             Recent audit events
        └── (reused) ReservationDetail  Side panel on row click
```

**Reused from admin reservas:**
- `ReservationDetail` component (side panel with full reservation info)
- `useReservations()` hook (data fetching with filters)
- Status badge styling from `RESERVATION_STATUS_COLORS`
- `formatCurrency()`, `formatDate()` from constants

**New components:**
- `OperationsStats` — similar to `AdminStats` but with 6 cards and urgency colors
- `WorkQueue` — tabbed container with 3 queue lists
- `ActivityFeed` — chronological event list (fetches from audit log API)
- Individual queue tab components (can be inlined in `WorkQueue` initially)

### 3.9 NavBar Integration

Add to `NON_VENTAS_LINKS` in `src/components/nav-bar.tsx`:

```typescript
{ href: "/admin/operaciones", label: "Operaciones", roles: ADMIN_PAGE_ROLES },
```

Insert after `{ href: "/admin/reservas", label: "Reservas", roles: ADMIN_PAGE_ROLES }` — logical grouping.

### 3.10 GAP-10 Resolution (Simple Approach)

Per the `plan-fix-high-severity-gaps.md` recommendation: **separate page, no routing change.**

- `/admin/operaciones` is a new page, accessible to `master` + `torredecontrol`
- The existing analytics dashboard at `/` remains unchanged
- Pati bookmarks `/admin/operaciones` as her landing page
- No middleware changes needed — `/admin/*` is already restricted to `ADMIN_PAGE_ROLES`
- Role-based routing (`/` → different dashboard per role) deferred until user feedback demands it

---

## 4. Shared Dependency: Phase 3 → Phase 5

```
Phase 3.1: Migration 041 (audit_events table)
     │
     ├─── Phase 3.2: Instrument routes (logAudit calls)
     │         │
     │         └─── Phase 3.3: Audit log API + admin page
     │
     └─── Phase 5.3: Activity Feed panel
               (fetches from /api/admin/audit-log)
```

**Phase 5 MVP without Phase 3:** The operations dashboard works without the activity feed. Panels 1 (stats) and 2 (work queue) use existing reservation data. Only Panel 3 (activity feed) requires the audit trail. If Phase 3 is delayed, the activity feed shows "Sin actividad reciente" and the dashboard is still useful.

---

## 5. File Change Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `scripts/migrations/041_audit_events.sql` | 3 | Audit events table + indexes + RLS |
| `src/lib/audit.ts` | 3 | `logAudit()` utility |
| `src/app/api/admin/audit-log/route.ts` | 3 | Audit log API (GET with filters + pagination) |
| `src/app/admin/audit/page.tsx` | 3 | Audit log viewer (server wrapper) |
| `src/app/admin/audit/audit-client.tsx` | 3 | Audit log viewer (client component) |
| `src/app/admin/operaciones/page.tsx` | 5 | Operations dashboard (server wrapper) |
| `src/app/admin/operaciones/operaciones-client.tsx` | 5 | Operations dashboard (main client) |

### Modified Files

| File | Phase | Change |
|------|-------|--------|
| `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/reservas/admin/reservations/[id]/reject/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/reservas/admin/freeze-requests/[id]/release/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/reservas/admin/sales/[id]/ejecutivo-rate/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/reservas/admin/settings/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/admin/salespeople/invite/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/admin/salespeople/projects/route.ts` | 3 | Add `logAudit()` call |
| `src/app/api/admin/management-roles/route.ts` | 3 | Add `logAudit()` call (POST) |
| `src/app/api/admin/management-roles/[id]/route.ts` | 3 | Add `logAudit()` call (PATCH) |
| `src/components/nav-bar.tsx` | 3+5 | Add "Auditoría" + "Operaciones" links |

### No Changes Needed

| Item | Reason |
|------|--------|
| `middleware.ts` | `/admin/*` already restricted to `ADMIN_PAGE_ROLES` |
| `reservations` table schema | DISC-02 resolved via audit trail — no `desisted_by` column |
| `salespeople` table schema | GAP-16 resolved via audit trail — no `provisioned_by` column |
| Existing API endpoints | Phase 5 reuses existing endpoints with client-side filtering |

---

## 6. Testing & Verification

### Phase 3 Testing

1. **Migration deployment:** Deploy 041 via Management API → verify table, indexes, policies via `pg_policies` query
2. **logAudit utility:** Confirm reservation → check `audit_events` table has entry with correct `event_type`, `actor_id`, `resource_id`
3. **Each instrumented route:** Trigger each of the 9 routes → verify audit_events row exists
4. **Fire-and-forget:** Temporarily break the audit insert (e.g. typo in column) → verify primary operation still succeeds
5. **API endpoint:** `GET /api/admin/audit-log` → verify filtering, pagination, auth (ventas user gets 403)
6. **Admin UI:** Navigate to `/admin/audit` → verify table renders, filters work, expand shows details JSON
7. **Build:** `next build` passes clean

### Phase 5 Testing

1. **Page access:** Master/torredecontrol can access `/admin/operaciones` → 200. Ventas → redirected by middleware.
2. **Stats strip:** KPI counts match `/admin/reservas` stats
3. **Pending queue:** Same reservations as `/admin/reservas?status=PENDING_REVIEW`, sorted oldest first
4. **Urgency colors:** Manually create reservation >48h old → verify red dot
5. **Rate queue:** Reservations with unconfirmed rates appear, confirmed rates don't
6. **Docs queue:** Confirmed reservations without PCV appear
7. **Activity feed:** After Phase 3 deployment, audit events appear in feed
8. **Activity feed fallback:** Before Phase 3 deployment (or empty table), shows "Sin actividad reciente"
9. **Click-through:** Click queue item → ReservationDetail opens with correct reservation
10. **NavBar:** "Operaciones" link visible to master/torredecontrol, not to gerencia/financiero/contabilidad
11. **Build:** `next build` passes clean

---

## 7. Execution Timeline

### Week 1: Foundations

| Day | Phase 3 | Phase 5 |
|-----|---------|---------|
| 1 | Write migration 041 + deploy | Create page scaffold + NavBar link |
| 2 | Write `src/lib/audit.ts` utility | Implement `OperationsStats` (6 KPI cards) |
| 3 | Instrument routes 1-4 (reservation actions) | Wire up `useReservations()` hook + compute stats |

### Week 2: Core Implementation

| Day | Phase 3 | Phase 5 |
|-----|---------|---------|
| 4 | Instrument routes 5-9 (rate, settings, invite, assignments, mgmt roles) | Implement `WorkQueue` with Pending tab |
| 5 | Write audit log API endpoint | Implement Rate + Docs tabs |
| 6 | Build audit log admin page (table + filters) | Implement `ActivityFeed` (connected to audit API) |

### Week 3: Polish + Integration

| Day | Phase 3 | Phase 5 |
|-----|---------|---------|
| 7 | Test all 9 routes → verify audit entries | Integration: click-through to ReservationDetail |
| 8 | Polish audit page: pagination, expand details | Polish: urgency colors, responsive layout |
| 9 | End-to-end testing | End-to-end testing |
| 10 | `next build` + deploy | `next build` + deploy |

---

## Summary

| Phase | Gaps Resolved | New Files | Modified Files | Migration | Status |
|-------|---------------|-----------|----------------|-----------|--------|
| Phase 3 | GAP-22, GAP-16, DISC-02, DISC-05 | 5 | 11 | 041 | ✅ COMPLETED |
| Phase 5 | GAP-10, GAP-11 | 2 | 1 (NavBar) | None | ✅ COMPLETED (MVP) |
| **Total** | **6 gaps** | **7 files** | **12 files** | **1 migration** | ✅ |

**12 of 24 gaps resolved** (6 from Phase 1 + 6 from Phases 3+5).

### Implementation Notes (2026-03-19)

**Phase 3 — Delivered:**
- Migration 041 deployed to production via Management API: `audit_events` table with 4 indexes, RLS (admin read, service_role insert), uses `jwt_role()` helper from migration 040
- `src/lib/audit.ts`: fire-and-forget `logAudit(user, event)` utility — accepts `User` object directly from `requireRole()` result, extracts IP/method/path from optional `request` parameter, try/catch wraps everything
- 10 admin routes instrumented with `logAudit()` calls (11 event types)
- `/api/admin/audit-log`: GET with filtering (event_type, resource_type, actor_id, date range) + pagination (limit/offset)
- `/admin/audit`: full audit log viewer (filterable table, expandable detail rows, pagination)
- DISC-02 resolved via audit trail — no `desisted_by`/`desisted_at` columns needed (event_type distinguishes desist from confirm/reject)
- GAP-16 resolved via audit trail — no `provisioned_by` column needed (salesperson.invited events capture who invited whom)

**Phase 5 — Delivered (MVP):**
- `/admin/operaciones`: operations command center with 5 KPI cards (urgency-colored), 3-tab work queue (Pendientes, Tasas EV, Documentos), activity feed (last 20 audit events)
- Work queue uses existing `useReservations()` hook with client-side filtering (no new API routes)
- Queue rows have urgency dots (red >48h, amber 24-48h, green <24h)
- Activity feed consumes `/api/admin/audit-log?limit=20` with graceful fallback ("Sin actividad reciente")
- Selected reservation links to `/admin/reservas?selected=ID` for full detail
- NavBar updated: "Operaciones" after Reservas, "Auditoría" after Roles (both ADMIN_PAGE_ROLES)
- Panel 4 (quick actions / bulk operations) deferred — not needed for MVP

Remaining for future phases:
- Phase 2 (permission architecture): GAP-07, GAP-08, GAP-21, DISC-03
- Phase 4 (field masking): GAP-03
- Phase 6 (deferred): GAP-09, GAP-16b
- Medium-severity: GAP-12/13/14/15/17/19/20/23/24

---

## Post-Completion Note: Post-Auth Redirect Fixes (2026-03-20)

After Phases 3+5 were completed, production testing with ventas users revealed 5 compounding failures in the post-authentication redirect layer. These were **not audit or operations dashboard issues** — they were in the login/confirm/set-password flow and root page auth guard.

The fixes added a new **Layer 2 (Page Auth Guards)** to the defense-in-depth model, bringing the total to 5 layers. The operations dashboard (`/admin/operaciones`) was unaffected — it was already behind the `/admin/*` middleware guard and required no changes.

Full details in `docs/plan-auth-deep-investigation.md`. Updated defense-in-depth model in `docs/roles-current-state.md`.
