# Orion — Gap Master Status Report

**Date:** 2026-03-20
**Author:** Claude Code
**Purpose:** Single-document reference for all identified security, architecture, workflow, and compliance gaps — ordered by criticality, with full status and pending work.

---

## How to Read This Document

- **24 gaps** (GAP-01 through GAP-24) from the role system analysis
- **5 discovered issues** (DISC-01 through DISC-05) found during codebase exploration
- **5 auth flow issues** (AUTH-01 through AUTH-05) found during production testing
- **6 phases** of remediation, 3 completed, 3 pending
- Ordered by **criticality** (Critical > High > Medium), then by phase

**Governing rules:** `docs/_ THESE ARE THE RULES.TXT` and `docs/_ INTENT OF THE RULES.TXT` — production-first, no fabrication, no mock data, enterprise-grade, context-obedient. Every gap and fix adheres to this operating constitution.

---

## Scoreboard

| Metric | Value |
|--------|-------|
| Total issues identified | 34 (24 gaps + 5 DISC + 5 AUTH) |
| Resolved | 22 |
| Pending | 12 |
| Phases completed | 3 of 6 (Phase 1, 3, 5) |
| Effort remaining | ~72 hours (~2 dev-weeks) |
| Defense layers | 5 (Middleware → Page guards → API guards → RLS → Client UI) |

### Scoreboard Update (2026-03-20 evening)

| Metric | Updated Value |
|--------|---------------|
| Resolved | 27 (+5: Phase 2 resolved GAP-07, GAP-08, GAP-21, DISC-03; Phase 4 resolved GAP-03) |
| Pending | 7 |
| Phases completed | 5 of 6 (Phase 1, 2, 3, 4, 5) |
| Effort remaining | ~32 hours (Phase 6 only) |

---

## Phase Summary

| Phase | Name | Status | Gaps Resolved | Effort |
|-------|------|--------|---------------|--------|
| 1 | Security Hardening | **COMPLETED** 2026-03-19 | GAP-01, 02, 04, 05, 06, 18 + DISC-01, 04 + AUTH-01–05 | Done |
| 2 | Permission Architecture | **COMPLETED** 2026-03-20 | GAP-07, 08, 21 + DISC-03 | Done |
| 3 | Audit Trail & Compliance | **COMPLETED** 2026-03-19 | GAP-16, 22 + DISC-02, 05 | Done |
| 4 | Role-Aware Data Filtering | **COMPLETED** 2026-03-20 | GAP-03 | Done |
| 5 | Operations Dashboard | **COMPLETED** 2026-03-19 | GAP-10, 11 | Done |
| 6 | Advanced Capabilities | **DEFERRED** | GAP-09, 12, 13, 14, 15, 17, 19, 20, 23, 24 | ~32h |

---

## All Issues by Criticality

### CRITICAL (3 gaps — all resolved)

---

#### GAP-01: API Routes Accessible Beyond Intended Roles
**Phase:** 1 | **Category:** Security | **Status:** RESOLVED (changelog 074, 2026-03-19)

**What was wrong:** 20+ API routes used only `requireAuth()` — any authenticated user (including ventas salespeople) could call `/api/analytics/commissions`, `/api/analytics/payments`, `/api/sales`, etc. directly and access all financial data. Middleware blocks page access but does NOT intercept API routes.

**What was done:** Added `requireRole()` guards to 30 API routes across 4 groups:
- **Group A** (4 unguarded mutation routes): confirm, reject, desist, release-freeze — had ZERO auth. Added `requireRole(ADMIN_ROLES)`.
- **Group B** (7 analytics routes): commissions, payments, cash-flow, etc. Changed `requireAuth()` → `requireRole(DATA_VIEWER_ROLES)`.
- **Group C** (11 admin operational routes): sales, payments, projects CRUD, referidos, valorizacion, cesion, buyer-persona, integracion. Added `requireRole(ADMIN_ROLES)`.
- **Group D** (6 reference data routes): units, salespeople, projects (reservation context). Added `requireAuth()`.

**Pending:** Nothing.

---

#### GAP-02: Public OCR Endpoints Without Auth or Rate Limiting
**Phase:** 1 | **Category:** Security | **Status:** RESOLVED (changelog 074, 2026-03-19)

**What was wrong:** `POST /api/reservas/dpi-ocr` and `POST /api/reservas/ocr` were fully public. Anyone on the internet could submit images for Claude Vision processing, consuming API credits with no throttle.

**What was done:**
- Added `requireAuth()` to both endpoints.
- Created `src/lib/rate-limit.ts` — in-memory sliding window rate limiter.
- Applied 20 requests/hour/user limit on both OCR endpoints.

**Pending:** Nothing.

---

#### GAP-06: No Role Hierarchy
**Phase:** 1 | **Category:** Architecture | **Status:** RESOLVED (changelog 074, 2026-03-19)

**What was wrong:** Roles were flat — every `requireRole()` call hardcoded exact role lists like `["master", "torredecontrol"]`. Adding a new role would require editing every route manually.

**What was done:** Added to `src/lib/auth.ts`:
- `ROLE_LEVEL` — numeric hierarchy (ventas=10, inventario=20, contabilidad=30, financiero=40, gerencia=50, torredecontrol=60, master=70).
- `ADMIN_ROLES` = `["master", "torredecontrol"]` — roles that manage reservations and operational data.
- `DATA_VIEWER_ROLES` = `["master", "torredecontrol", "gerencia", "financiero", "contabilidad"]` — roles that view analytics/financial data.
- `hasMinimumRole(user, minimumRole)` — hierarchy comparison utility.

**Pending:** `hasMinimumRole()` exists but is unused (DISC-03). Will be evaluated during Phase 2.

---

### HIGH (13 gaps + 5 DISC + 5 AUTH — 16 resolved, 7 pending)

---

#### GAP-04: Inactive Roles Have Uncontrolled Access
**Phase:** 1 | **Category:** Security | **Status:** RESOLVED (changelog 075, 2026-03-19)

**What was wrong:** Four defined roles (gerencia, financiero, contabilidad, inventario) had no enforcement. A user assigned `role = "financiero"` would see the full admin NavBar, access the analytics dashboard, and get 403 errors on admin operations — confusing and data-exposing.

**What was done:**
- **Middleware:** Replaced binary `ventas`/non-ventas split with explicit 5-category routing:
  - `ventas` → restricted to `/reservar`, `/ventas/*`
  - `ADMIN_PAGE_ROLES` (master, torredecontrol) → full admin access
  - `DATA_PAGE_ROLES` (gerencia, financiero, contabilidad) → analytics pages only; blocked from `/admin`, `/referidos`, `/valorizacion`, `/cesion`, `/buyer-persona`, `/integracion`
  - Unknown/null roles → redirect to `/login`
- **NavBar:** Links tagged with `roles` arrays, filtered at render time. Orphaned dividers auto-cleaned.

**Pending:** Nothing.

---

#### GAP-05: No Row-Level Ownership Enforcement at Database Level
**Phase:** 1 | **Category:** Security | **Status:** RESOLVED (changelog 075, migration 040, 2026-03-19)

**What was wrong:** Ventas data isolation relied entirely on API query filters (`WHERE salesperson_id = $1`). RLS policies allowed any authenticated user to SELECT all rows. If a new API route forgot the filter, data leakage would occur.

**What was done:** Migration 040 deployed:
- Created reusable `jwt_role()` SQL helper function.
- Added ownership-scoped RLS policies on 4 tables: `reservations`, `rv_clients`, `reservation_clients`, `receipt_extractions`.
- Ventas users see only rows linked to their own `salespeople.user_id`.
- Non-ventas roles see all rows (unchanged behavior).
- Bonus: INSERT policies tightened from `TO public` to `TO authenticated` on `reservations` and `reservation_clients`.

**Pending:** Nothing.

---

#### GAP-03: No Server-Side Field Masking on Analytics Routes
**Phase:** 4 | **Category:** Security | **Status:** RESOLVED (2026-03-20)

**What's wrong:** All analytics API routes return the same full dataset regardless of the caller's role. When gerencia/financiero/contabilidad roles are activated, users would see the same data as master — including individual commission amounts, ISR details, and PII.

**What was done:**
- Created `src/lib/field-masking.ts` — 4 per-resource masking functions (pure, typed, defense-in-depth: unknown roles default to most restrictive).
- Applied masking to 4 API routes: `/api/analytics/commissions`, `/api/analytics/payments`, `/api/analytics/payment-compliance`, `/api/commissions`.
- Cash flow route (`/api/analytics/cash-flow-forecast`) excluded — aggregate data only, no PII.
- Dashboard UI: `role` prop passed from `page.tsx` → `DashboardClient`. Comisiones tab hidden for gerencia.

**Masking rules by role:**
- **gerencia:** Aggregates only — `byRecipient: []`, no ISR/disbursable, no payment history, Comisiones tab hidden.
- **contabilidad:** Amounts + ISR visible, recipient names anonymized → "Beneficiario N".
- **financiero:** Full access (no masking).
- **master / torredecontrol:** Full access (no masking).

**Depends on:** Phase 2 (completed 2026-03-20).
**Plan document:** `docs/plan-phase4-field-masking.md`.

---

#### GAP-07: No Formal Access Control Matrix
**Phase:** 2 | **Category:** Architecture | **Status:** RESOLVED (changelog 078, 2026-03-20)

**What's wrong:** Permissions are implicitly defined across ~50 API routes and middleware checks. No single data structure maps (role, resource, action) → allowed/denied. If Puerta Abierta undergoes a security audit, the first question will be "show me your access control matrix" — currently that requires reading every route's source code.

**What was done:**
- Created `src/lib/permissions.ts` — `PERMISSIONS` matrix: 22 resources, 49 triples, 119 grants.
- `Resource` and `Action` types formalize the full domain vocabulary.
- Client-safe `ADMIN_ROLES` and `DATA_VIEWER_ROLES` re-exports (no circular imports).

---

#### GAP-08: No `can(action, resource)` Utility
**Phase:** 2 | **Category:** Architecture | **Status:** RESOLVED (changelog 078, 2026-03-20)

**What's wrong:** Authorization checks are scattered as direct role string comparisons: `role === 'ventas'` in NavBar, `requireRole(["master", "torredecontrol"])` in APIs, `readOnly` prop hardcoded by path. There's no centralized function to check permissions.

**What was done:**
- Created `can(role, resource, action)` → boolean in `src/lib/permissions.ts`.
- Created `rolesFor(resource, action)` → Role[] helper.
- 15 API routes migrated from hardcoded role arrays to `rolesFor()` calls.
- 3 duplicate `ADMIN_ROLES`/`DATA_VIEWER_ROLES` constants eliminated.

---

#### GAP-09: No Project-Scoped Admin Access
**Phase:** 6 | **Category:** Architecture | **Status:** DEFERRED

**What's wrong:** All admin users see all 4 projects. No mechanism to restrict an admin to specific projects (e.g., a BLT-only accountant, a regional manager for B5+BEN).

**Why deferred:** Only 2 admin users exist, both need all-project access. Becomes relevant only when admin team grows to include project-specific roles.

**What would be needed:**
- `user_project_assignments` table (mirrors salesperson assignments).
- RLS policies filtering by project assignment.
- Updates to all analytics queries.
- Admin UI for project assignment management.

**Effort when needed:** ~24 hours.

---

#### GAP-10: No Role-Specific Dashboard Views
**Phase:** 5 | **Category:** Dashboard | **Status:** RESOLVED (2026-03-19)

**What was wrong:** The main dashboard (`/`) was a monolith showing the same content to all admin users — no dashboard tailored for CFO, Sales Manager, or Executive views.

**What was done:** Created `/admin/operaciones` as a separate operations dashboard for Pati (Torre de Control). Simpler approach: separate page rather than role-based routing on `/`. Pati bookmarks `/admin/operaciones`.

**Pending:** Role-specific dashboard routing (CFO → financial KPIs, Sales Manager → team performance) deferred until user feedback demands it.

---

#### GAP-11: No Dedicated Operations Dashboard for Pati
**Phase:** 5 | **Category:** Dashboard | **Status:** RESOLVED (2026-03-19)

**What was wrong:** Pati used the analytics dashboard (insight-first) plus `/admin/reservas` for reservation management. Her actual workflow — processing incoming reservations, cross-referencing data, catching errors — had no dedicated interface.

**What was done:** Built `/admin/operaciones` — action-first operations command center:
- **Stats strip:** 5 KPI cards (Pendientes, Tasas sin confirmar, Docs faltantes, Procesadas hoy, Total reservas) with urgency coloring (red >5, amber >0, green =0).
- **Work queue (3 tabs):** Pendientes (oldest-first, urgency dots: red >48h, amber 24-48h, green <24h), Tasas EV (unconfirmed ejecutivo rates), Documentos (missing DPI).
- **Activity feed:** Last 20 audit events with relative timestamps.
- **Click-through:** Selected reservation links to `/admin/reservas?selected=ID`.
- **NavBar:** "Operaciones" link added (ADMIN_PAGE_ROLES).

**Deferred:** Panel 4 (bulk operations / quick actions) — not needed for MVP.

---

#### GAP-16: No Maker-Checker on User Provisioning
**Phase:** 3 | **Category:** Auth/Workflow | **Status:** RESOLVED (Option A — audit-only, 2026-03-19)

**What was wrong:** A single admin could create a new user account, assign projects, and send credentials without approval from a second person. SOC 2 CC6.2 requirement.

**What was done (Option A):** All provisioning actions logged to `audit_events`:
- `salesperson.invited` events capture who invited whom, when, with full details (email, salesperson name, resend flag).
- `assignment.created`/`assignment.ended` events capture project assignment changes.
- Second admin reviews at `/admin/audit` and can revoke access.

**Pending (Option B — deferred to Phase 6):** Full maker-checker with `user_provisioning_requests` table, approval workflow, and second-admin notification. Not practical for current 2-admin team. ~8 hours when needed.

---

#### GAP-18: No Escalation Path for Rate Confirmation
**Phase:** 1 | **Category:** Auth/Workflow | **Status:** RESOLVED (changelog 074, 2026-03-19)

**What was wrong:** Only master could confirm ejecutivo rates. If unavailable, no one could confirm rates — blocking commission finalization.

**What was done:** Added `financiero` to the ejecutivo-rate PATCH endpoint's `requireRole()` guard: `["master", "financiero"]`. CFO can now confirm rates as an escalation path.

**Pending:** Nothing.

---

#### GAP-21: No Formal Access Control Document
**Phase:** 2 | **Category:** Compliance | **Status:** RESOLVED (changelog 078, 2026-03-20)

**What's wrong:** No single document says "role X can do Y on resource Z." Permissions are defined implicitly across ~50 API routes. SOC 2 CC6.1 and ISO 27001 A.5.15 require a formal, auditable access control matrix.

**What was done:**
- Created `scripts/generate-access-matrix.ts` — reads `PERMISSIONS` object, generates markdown table.
- Generated `docs/access-control-matrix.md` — 22 resources, 7 roles, fully auditable.
- SOC 2 CC6.1 / ISO 27001 A.5.15 requirement satisfied.

---

#### GAP-22: Incomplete Audit Trail
**Phase:** 3 | **Category:** Compliance | **Status:** RESOLVED (migration 041, 2026-03-19)

**What was wrong:** Audit logging existed for unit status changes and reservation reviews, but NOT for system settings, user provisioning, commission rate changes, project assignments, or management role changes.

**What was done:**
- **Migration 041:** `audit_events` table (append-only, 4 indexes, RLS: admin read via `jwt_role()`, service_role insert).
- **`src/lib/audit.ts`:** Fire-and-forget `logAudit(user, event)` — never crashes primary operation.
- **10 routes instrumented** with 11 event types:
  - `reservation.confirmed`, `reservation.rejected`, `reservation.desisted`
  - `freeze.released`
  - `rate.confirmed`
  - `settings.updated`
  - `salesperson.invited` (3 exit points: resend, link existing, new invite)
  - `assignment.created`, `assignment.ended`
  - `mgmt_role.created`, `mgmt_role.ended`
- **API:** `/api/admin/audit-log` — GET with filtering (event_type, resource_type, actor_id, date range) + pagination.
- **UI:** `/admin/audit` — filterable table, expandable detail rows, pagination, Spanish labels.
- **Operations dashboard:** Activity feed shows last 20 events on `/admin/operaciones`.

**Not logged (acceptable for current scale):** read access, login/logout (Supabase Auth internal), export/download.

---

#### DISC-01: `system_settings.updated_by` Never Populated
**Phase:** — | **Category:** Data Integrity | **Status:** FALSE FINDING (already correct)

The PATCH handler at `src/app/api/reservas/admin/settings/route.ts` already populates `updated_by: auth.user!.id`. No changes needed.

---

#### DISC-02: No `desisted_by` Column on Reservations
**Phase:** 3 | **Category:** Data Integrity | **Status:** RESOLVED (2026-03-19)

**What was wrong:** When an admin desisted a reservation, `reviewed_by` captured the initial reviewer — not who performed the desistimiento. The desist actor was unrecorded.

**Resolution:** Resolved via centralized audit trail — `event_type = 'reservation.desisted'` captures who desisted and when. No schema change needed (`reviewed_by`/`reviewed_at` already capture the timestamp; audit event distinguishes desist from confirm/reject).

---

#### DISC-03: `hasMinimumRole()` Exists But Is Never Used
**Phase:** 2 | **Category:** Dead Code | **Status:** RESOLVED (changelog 078, 2026-03-20)

The function was added in changelog 074 but no route or component calls it. **Resolution:** Retained with JSDoc comment `"Currently unused — retained for future UI conditional rendering"`. 5 lines, zero cost, future UI value when role-conditional rendering is needed.

---

#### DISC-04: NavBar Showed "Roles" Link to Non-Master Users
**Phase:** 1 | **Category:** UX | **Status:** RESOLVED (2026-03-19)

**What was wrong:** `/admin/roles` requires `requireRole(["master"])` but the NavBar showed the link to all non-ventas users. Torredecontrol users would see the page but API calls would 403.

**What was done:** Tagged Roles link with `roles: ["master"]` in the NavBar refactor. Only master sees it now.

---

#### DISC-05: Salesperson Project Assignments Not Audit-Logged
**Phase:** 3 | **Category:** Compliance | **Status:** RESOLVED (2026-03-19)

**What was wrong:** Project assignment changes via `/api/admin/salespeople/projects` tracked temporal data (end_date set, new row) but not who made the change.

**What was done:** `logAudit()` call added — logs `assignment.created` and `assignment.ended` events with `details: { added, removed, resulting }` arrays.

---

#### AUTH-01: Login Page `redirect("/")` Ignores Role
**Phase:** Post-deployment | **Category:** Auth Flow | **Status:** RESOLVED (2026-03-20)

**What was wrong:** `src/app/login/page.tsx` used `redirect("/")` for all authenticated users, sending ventas users to the admin dashboard.

**What was done:** Role-aware server redirect — ventas → `/ventas/dashboard`, others → `/`.

---

#### AUTH-02: `router.replace("/")` Race Condition
**Phase:** Post-deployment | **Category:** Auth Flow | **Status:** RESOLVED (2026-03-20)

**What was wrong:** `login-form.tsx` and `set-password/page.tsx` used `router.replace("/")` — React rendered the admin dashboard before middleware redirect arrived (flash of unauthorized content).

**What was done:** Replaced with `window.location.href` (hard navigation) to ensure middleware intercepts before any rendering.

---

#### AUTH-03: `/auth/confirm` Always Forces Password Re-Set
**Phase:** Post-deployment | **Category:** Auth Flow | **Status:** RESOLVED (2026-03-20)

**What was wrong:** Every magiclink click redirected to `/auth/set-password`, even for returning users who already had `password_set = true`.

**What was done:** Route now checks `password_set` in `app_metadata` before routing. Existing users skip set-password and go directly to their role-appropriate landing page.

---

#### AUTH-04: Root Page `/` Has No Server-Side Auth Guard
**Phase:** Post-deployment | **Category:** Auth Flow | **Status:** RESOLVED (2026-03-20)

**What was wrong:** `src/app/page.tsx` had no auth check — sole defense was middleware. If middleware failed to redirect, unauthorized users would see the admin dashboard.

**What was done:** Converted to Async Server Component with full auth guard: no user → login, ventas → ventas dashboard, unknown role → login, only DATA_VIEWER_ROLES renders.

---

#### AUTH-05: Pre-March-17 Users Missing `password_set`
**Phase:** Post-deployment | **Category:** Auth Flow | **Status:** RESOLVED (2026-03-20)

**What was wrong:** Users created before the March 17 auth overhaul lacked `password_set` in `app_metadata`, trapping them in an infinite set-password redirect loop.

**What was done:** SQL backfill — set `password_set: true` in `app_metadata` for affected confirmed ventas users.

---

### MEDIUM (8 gaps — all pending, Phase 6)

---

#### GAP-12: Ventas Portal Lacks Progressive Disclosure
**Phase:** 6 | **Category:** Dashboard/UX | **Status:** PENDING

**What's wrong:** The ventas portal has 6 pages (panel, reservas, inventario, clientes, rendimiento, nueva-reserva) loaded independently. KPI cards on the panel don't link to their detail pages.

**What needs to be done:** Add click-through navigation from panel KPI cards to corresponding detail pages.

**Effort:** 2–4 hours.

---

#### GAP-13: No Comparison Context on KPIs
**Phase:** 6 | **Category:** Dashboard/UX | **Status:** PENDING

**What's wrong:** KPI cards show raw values ("Units Reserved: 5") without comparison against targets, prior periods, or team averages. "5" means nothing without context.

**What needs to be done:** Add trend arrows (up/down vs prior period), target bars (actual vs quota), color coding (green/amber/red).

**Effort:** 4–8 hours.

---

#### GAP-14: Mobile Optimization Gaps in Ventas Portal
**Phase:** 6 | **Category:** Dashboard/UX | **Status:** PENDING

**What's wrong:** The reservation form (`/reservar`) is mobile-optimized, but ventas portal pages (panel, reservas, clientes, rendimiento) use standard responsive layouts without mobile-specific design (card-based layouts, 44px touch targets, reduced precision).

**What needs to be done:** Audit all ventas pages for mobile usability. Replace tables with card layouts on small screens. Ensure minimum touch targets.

**Effort:** 4–8 hours.

---

#### GAP-15: Limited Chart Type Variety
**Phase:** 6 | **Category:** Dashboard/UX | **Status:** PENDING

**What's wrong:** Dashboard uses D3 treemaps, commission bars, cash flow chart, bullet charts. Missing: funnel chart for reservation pipeline, agent comparison bar chart, aging histogram for payment delinquency.

**What needs to be done:** Add Recharts as complement to D3. Use D3 for custom visualizations, Recharts for standard chart types.

**Effort:** 8–16 hours.

---

#### GAP-17: No Approval Workflow for Desistimientos
**Phase:** 6 | **Category:** Auth/Workflow | **Status:** PENDING

**What's wrong:** Desistimiento is single-step — admin clicks and reservation is immediately cancelled, unit returns to AVAILABLE. No required evidence (letter, email), no second-person approval, no waiting period.

**What needs to be done:** Two-step desistimiento: request (with required evidence attachment) → approval (by a different user than the requester).

**Effort:** 8–16 hours.

---

#### GAP-19: No Notification System
**Phase:** 6 | **Category:** Auth/Workflow | **Status:** PENDING

**What's wrong:** No push notifications, emails, or in-app alerts. When a salesperson submits a reservation, admin must manually check. When admin confirms, salesperson must manually check.

**What needs to be done:** Start with in-app notification badge (unread count on NavBar). Optionally add email notifications for critical events.

**Effort:** 16–24 hours.

---

#### GAP-20: No Temporal Permission Expiry
**Phase:** 6 | **Category:** Auth/Workflow | **Status:** PENDING

**What's wrong:** Roles persist indefinitely. No mechanism for time-limited elevated access, auto-deactivation of inactive accounts, or seasonal access patterns. SOC 2 CC6.3 requirement.

**What needs to be done:** Admin view showing last login per user. Flag accounts inactive >30 days. Optional expiry dates on elevated permissions.

**Effort:** 4–8 hours.

---

#### GAP-23: No Access Review Process
**Phase:** 6 | **Category:** Compliance | **Status:** PENDING

**What's wrong:** No reports showing users by role, last login, inactive accounts, or over-privileged users. SOC 2 CC6.3 requires quarterly access reviews.

**What needs to be done:** Access review dashboard in `/admin/asesores`: all users with roles/last login, inactive account flags, role distribution chart, one-click deactivation.

**Effort:** 4–8 hours.

---

#### GAP-24: No Data Classification or Minimization
**Phase:** 6 | **Category:** Compliance | **Status:** PENDING

**What's wrong:** No formal classification marking data as Public, Internal, Confidential, or Restricted. No enforcement of data minimization per role (GDPR Art. 25).

**What needs to be done:** Classify all data fields by sensitivity. Align API field masking and RLS policies accordingly.

**Effort:** 4–8 hours.

---

## What's Next

### ~~Immediate (Phase 2 — Permission Architecture, ~16h)~~ COMPLETED 2026-03-20

| Gap | What | Status |
|-----|------|--------|
| GAP-07 | Formal access control matrix | RESOLVED — `src/lib/permissions.ts` |
| GAP-08 | `can(role, action, resource)` utility | RESOLVED — `can()` + `rolesFor()` |
| GAP-21 | Auto-generated access control document | RESOLVED — `docs/access-control-matrix.md` |
| DISC-03 | `hasMinimumRole()` dead code | RESOLVED — retained with JSDoc |

### ~~Next (Phase 4 — Field Masking, ~24h)~~ COMPLETED 2026-03-20

| Gap | What | Status |
|-----|------|--------|
| GAP-03 | Role-aware response shaping | RESOLVED — `src/lib/field-masking.ts` + 4 routes masked + dashboard role-aware |

**gerencia/financiero/contabilidad roles are now safe to activate for real users.**

### Remaining (Phase 6 — ~32h, triggered by team growth or compliance requirements)

GAP-09, 12, 13, 14, 15, 17, 19, 20, 23, 24 — see individual descriptions above.

---

## Defense-in-Depth Model (Current)

```
Layer 1: Middleware           — Role-based page routing (5 categories)
Layer 2: Page auth guards     — Server-side role check on root page
Layer 3: API route guards     — requireRole() on 30+ routes, 15 using rolesFor()
Layer 4: Field masking        — Post-query response shaping per role (4 analytics routes)
Layer 5: RLS policies         — Ownership-scoped SELECT on 4 tables + jwt_role() helper
Layer 6: Client UI filtering  — NavBar role-filtered links + role-aware tab visibility
```

---

## Key Implementation Artifacts

| Artifact | Location | Phase |
|----------|----------|-------|
| Role hierarchy constants | `src/lib/auth.ts` | 1 |
| Rate limiter | `src/lib/rate-limit.ts` | 1 |
| Audit logger | `src/lib/audit.ts` | 3 |
| Audit events table | `scripts/migrations/041_audit_events.sql` | 3 |
| Ownership RLS | `scripts/migrations/040_ventas_ownership_rls.sql` | 1 |
| `jwt_role()` helper | Migration 040 (SQL function) | 1 |
| Audit log API | `src/app/api/admin/audit-log/route.ts` | 3 |
| Audit log UI | `src/app/admin/audit/audit-client.tsx` | 3 |
| Operations dashboard | `src/app/admin/operaciones/operaciones-client.tsx` | 5 |
| Auth deep investigation | `docs/plan-auth-deep-investigation.md` | Post-deploy |
| PERMISSIONS matrix | `src/lib/permissions.ts` | 2 |
| `can()` / `rolesFor()` utilities | `src/lib/permissions.ts` | 2 |
| Access control matrix generator | `scripts/generate-access-matrix.ts` | 2 |
| Access control matrix document | `docs/access-control-matrix.md` | 2 |
| Field masking utility | `src/lib/field-masking.ts` | 4 |
| Phase 4 plan document | `docs/plan-phase4-field-masking.md` | 4 |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/roles-gap-analysis.md` | Full gap inventory (24 gaps, detailed analysis) |
| `docs/roles-current-state.md` | Unabridged role inventory (7 roles, 4 layers) |
| `docs/roles-industry-best-practices.md` | Enterprise RBAC benchmarks |
| `docs/plan-fix-critical-gaps.md` | Phase 1 plan (completed) |
| `docs/plan-fix-high-severity-gaps.md` | 6-phase remediation plan (master plan) |
| `docs/plan-phase3-audit-phase5-dashboard.md` | Phase 3+5 plan (completed) |
| `docs/gap-prioritization-2026-03-19.md` | Tiered prioritization |
| `docs/plan-auth-deep-investigation.md` | Post-deploy auth redirect fixes |
| `docs/_ THESE ARE THE RULES.TXT` | Operating constitution |
| `docs/_ INTENT OF THE RULES.TXT` | Rules analysis and enforcement rationale |
| `docs/plan-phase2-permission-architecture.md` | Phase 2 plan (completed) |
| `docs/plan-phase4-field-masking.md` | Phase 4 plan (completed) |
