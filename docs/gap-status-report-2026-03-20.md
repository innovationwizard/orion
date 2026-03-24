# Orion — Gap Status Report

**Date:** 2026-03-20
**Source of truth:** `docs/gap-prioritization-2026-03-19.md` (last updated 2026-03-20), `docs/gap-master-status-2026-03-20.md`, `docs/roles-gap-analysis.md`

---

## Scoreboard

| Metric | Value |
|--------|-------|
| Total issues identified | 34 (24 GAPs + 5 DISCs + 5 AUTHs) |
| Resolved / closed | 27 |
| Pending | 7 |
| Phases completed | 5 of 6 (Phases 1, 2, 3, 4, 5) |
| Effort remaining | ~32 hours (Phase 6 only) |
| Defense layers | 6 (Middleware > Page guards > API guards > Field masking > RLS > Client UI) |

---

## Phases

| Phase | Name | Description | Status | Gaps Resolved | Effort |
|-------|------|-------------|--------|---------------|--------|
| 1 | Security Hardening | API route guards, OCR auth+rate-limiting, role hierarchy, middleware routing, RLS ownership, NavBar filtering | **COMPLETED** 2026-03-19 | GAP-01, 02, 04, 05, 06, 18 + DISC-01, 04 + AUTH-01–05 | Done |
| 2 | Permission Architecture | Centralized PERMISSIONS matrix, `can()`/`rolesFor()` utilities, auto-generated access control document | **COMPLETED** 2026-03-20 | GAP-07, 08, 21 + DISC-03 | Done |
| 3 | Audit Trail & Compliance | `audit_events` table, `logAudit()` utility, audit log API+UI, provisioning & assignment tracking | **COMPLETED** 2026-03-19 | GAP-16, 22 + DISC-02, 05 | Done |
| 4 | Role-Aware Data Filtering | Server-side field masking on analytics routes per role | **COMPLETED** 2026-03-20 | GAP-03 | Done |
| 5 | Operations Dashboard | Action-first command center for Pati (work queue, activity feed, KPIs) | **COMPLETED** 2026-03-19 | GAP-10, 11 | Done |
| 6 | Advanced Capabilities | Project scoping, desist workflow, notifications, permission expiry, UX, compliance | **DEFERRED** | GAP-09, 12–15, 17, 19, 20, 23, 24 | ~32h |

---

## All Issues by Criticality

### CRITICAL — 3 issues, 3 resolved

| ID | Description | Phase | Category | Status | Resolution |
|----|-------------|-------|----------|--------|------------|
| GAP-01 | API routes accessible beyond intended roles — 20+ routes had only `requireAuth()`, any authenticated user could access financial data | 1 | Security | **RESOLVED** | `requireRole()` guards on 30 routes across 4 groups (changelog 074) |
| GAP-02 | Public OCR endpoints without auth or rate limiting — anyone could submit images for Claude Vision processing | 1 | Security | **RESOLVED** | `requireAuth()` + `src/lib/rate-limit.ts` — 20 req/hr/user (changelog 074) |
| GAP-06 | No role hierarchy — every route hardcoded exact role lists, adding a role required editing every route | 1 | Architecture | **RESOLVED** | `ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` in `src/lib/auth.ts` (changelog 074) |

---

### HIGH — 23 issues, 20 resolved, 3 pending

#### Resolved

| ID | Description | Phase | Category | Resolution |
|----|-------------|-------|----------|------------|
| GAP-04 | Inactive roles (gerencia, financiero, contabilidad, inventario) had uncontrolled access — full NavBar, analytics data visible, 403 on admin ops | 1 | Security | 5-category middleware routing + NavBar `roles` filtering (changelog 075) |
| GAP-05 | No row-level ownership enforcement — ventas data isolation relied on API query filters only | 1 | Security | Ownership-scoped RLS on 4 tables + `jwt_role()` helper (migration 040) |
| GAP-07 | No formal access control matrix — permissions implicit across ~50 routes, no auditable SSOT | 2 | Architecture | `PERMISSIONS` matrix in `src/lib/permissions.ts` — 22 resources, 49 triples, 119 grants (changelog 078) |
| GAP-08 | No `can(action, resource)` utility — authorization scattered as hardcoded role arrays | 2 | Architecture | `can()` + `rolesFor()` in `src/lib/permissions.ts` — 15 routes migrated from hardcoded arrays (changelog 078) |
| GAP-10 | No role-specific dashboard views — same monolith for all admin users | 5 | Dashboard | `/admin/operaciones` separate operations dashboard for Pati |
| GAP-11 | No dedicated operations dashboard for Pati — no action-first interface for her workflow | 5 | Dashboard | `/admin/operaciones` — 5 KPI cards, 3-tab work queue (Pendientes/Tasas EV/Documentos), activity feed |
| GAP-16 | No maker-checker on user provisioning — single admin could create accounts without approval | 3 | Auth/Workflow | Audit trail captures `salesperson.invited`, `assignment.created/ended` events (migration 041) |
| GAP-18 | No escalation path for rate confirmation — only master could confirm ejecutivo rates | 1 | Auth/Workflow | `financiero` added to ejecutivo-rate PATCH: `["master", "financiero"]` (changelog 074) |
| GAP-21 | No formal access control document — SOC 2 CC6.1 / ISO 27001 A.5.15 requirement unmet | 2 | Compliance | Auto-generated `docs/access-control-matrix.md` from PERMISSIONS object via `scripts/generate-access-matrix.ts` (changelog 078) |
| GAP-22 | Incomplete audit trail — no logging for settings, provisioning, rate changes, assignments, role changes | 3 | Compliance | `audit_events` table + `logAudit()` + 10 routes instrumented with 11 event types (migration 041) |
| DISC-01 | `system_settings.updated_by` never populated | — | Data Integrity | **False finding** — PATCH handler already populates `updated_by: auth.user!.id` |
| DISC-02 | No `desisted_by` tracking — desist actor unrecorded | 3 | Data Integrity | Resolved via audit trail — `event_type = 'reservation.desisted'` (no schema change) |
| DISC-03 | `hasMinimumRole()` exists but is never called | 2 | Dead Code | Retained with "Currently unused" JSDoc — 5 lines, zero cost, future UI value (changelog 078) |
| DISC-04 | NavBar showed "Roles" link to non-master users | 1 | UX | Tagged with `roles: ["master"]` — only master sees it |
| DISC-05 | Salesperson project assignments not audit-logged | 3 | Compliance | `logAudit()` — `assignment.created` / `assignment.ended` events |
| AUTH-01 | Login page `redirect("/")` ignores role — ventas users sent to admin dashboard | Post-deploy | Auth Flow | Role-aware server redirect — ventas → `/ventas/dashboard` |
| AUTH-02 | `router.replace("/")` race condition — flash of admin dashboard before middleware redirect | Post-deploy | Auth Flow | Replaced with `window.location.href` (hard navigation) |
| AUTH-03 | `/auth/confirm` always forces password re-set — returning users with `password_set = true` still redirected | Post-deploy | Auth Flow | Check `password_set` in `app_metadata` before routing |
| AUTH-04 | Root page `/` has no server-side auth guard — sole defense was middleware | Post-deploy | Auth Flow | Async Server Component with full auth guard: role check, redirect logic |
| AUTH-05 | Pre-March-17 users missing `password_set` — trapped in infinite set-password redirect loop | Post-deploy | Auth Flow | SQL backfill of `app_metadata` for affected confirmed ventas users |
| GAP-03 | No server-side field masking on analytics routes — all roles see full dataset (commissions, ISR, PII) | 4 | Security | `src/lib/field-masking.ts` — 4 masking functions on 4 routes; gerencia=aggregates only, contabilidad=anonymized names, financiero/master/torredecontrol=full (changelog 079, 2026-03-20) |

#### Pending

| ID | Description | Phase | Category | What needs to be done | Trigger | Effort |
|----|-------------|-------|----------|-----------------------|---------|--------|
| ~~GAP-03~~ | ~~No server-side field masking on analytics routes~~ | ~~4~~ | ~~Security~~ | ~~field masking~~ | ~~Activation~~ | ~~Done~~ |

**GAP-03 RESOLVED (2026-03-20, changelog 079).** Moved to Resolved section above. `src/lib/field-masking.ts` — 4 per-resource masking functions applied to 4 analytics routes. gerencia: aggregates only (byRecipient emptied, payment history stripped, Comisiones tab hidden). contabilidad: amounts visible, recipient names anonymized ("Beneficiario N"). financiero/master/torredecontrol: full access. Unknown roles default to most restrictive masking (defense-in-depth). Cash flow route excluded (aggregate data, no PII).
| GAP-09 | No project-scoped admin access — all admin users see all 4 projects | 6 | Architecture | `user_project_assignments` table + RLS + analytics query updates | Admin team grows to include project-specific roles | ~24h |
| GAP-17 | No approval workflow for desistimientos — single-step, no evidence, no second approval | 6 | Auth/Workflow | Two-step: request (with evidence) → approval (different user) | External audit or compliance requirement | 8–16h |
| GAP-19 | No notification system — no push, email, or in-app alerts between salespeople and admin | 6 | Auth/Workflow | In-app notification badge (NavBar unread count), optionally email | User feedback | 16–24h |

---

### MEDIUM — 8 issues, 0 resolved, 8 pending (all Phase 6, deferred)

| ID | Description | Phase | Category | What needs to be done | Effort |
|----|-------------|-------|----------|-----------------------|--------|
| GAP-12 | Ventas portal lacks progressive disclosure — KPI cards don't link to detail pages | 6 | Dashboard/UX | Click-through navigation from panel KPIs to detail pages | 2–4h |
| GAP-13 | No comparison context on KPIs — raw values without targets, trends, or team averages | 6 | Dashboard/UX | Trend arrows, target bars, color coding (green/amber/red) | 4–8h |
| GAP-14 | Mobile optimization gaps in ventas portal — panel/reservas/clientes/rendimiento not mobile-optimized | 6 | Dashboard/UX | Card layouts on small screens, 44px touch targets | 4–8h |
| GAP-15 | Limited chart type variety — missing funnel, agent comparison, aging histogram | 6 | Dashboard/UX | Add Recharts complement to D3 for standard chart types | 8–16h |
| GAP-16b | No full maker-checker on provisioning — current solution is audit-only (Option A) | 6 | Auth/Workflow | `user_provisioning_requests` table, approval workflow, second-admin notification | ~8h |
| GAP-20 | No temporal permission expiry — roles persist indefinitely, no auto-deactivation (SOC 2 CC6.3) | 6 | Auth/Workflow | Last login view, 30-day inactive flag, optional expiry dates | 4–8h |
| GAP-23 | No access review process — no reports for users by role, last login, over-privileged (SOC 2 CC6.3) | 6 | Compliance | Access review dashboard in `/admin/asesores` | 4–8h |
| GAP-24 | No data classification or minimization — no Public/Internal/Confidential/Restricted markings (GDPR Art. 25) | 6 | Compliance | Classify all data fields by sensitivity, align with field masking | 4–8h |

---

## Changes Already Done — by Phase

### Phase 1: Security Hardening (2026-03-19, changelogs 074 + 075)

**13 issues resolved.** Foundation defense-in-depth across all 5 layers.

| Deliverable | Location |
|-------------|----------|
| `requireRole()` guards on 30 API routes (4 groups: unguarded mutations, analytics, admin ops, reference data) | 30 route files |
| `requireAuth()` + 20 req/hr rate limiting on OCR endpoints | `src/lib/rate-limit.ts`, 2 OCR routes |
| Role hierarchy constants: `ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` | `src/lib/auth.ts` |
| 5-category middleware routing (ventas, admin, data viewer, unknown, unauthenticated) | `middleware.ts` |
| Ownership-scoped RLS on 4 tables + `jwt_role()` SQL helper | Migration 040 |
| NavBar role-filtered links with `roles` arrays | `src/components/nav-bar.tsx` |
| INSERT policies tightened: `TO public` → `TO authenticated` on reservations + reservation_clients | Migration 040 |
| `financiero` added to ejecutivo-rate confirmation | ejecutivo-rate PATCH route |

### Phase 2: Permission Architecture (2026-03-20, changelog 078)

**4 issues resolved.** Centralized 43 scattered authorization decision points into single SSOT.

| Deliverable | Location |
|-------------|----------|
| `PERMISSIONS` matrix — 22 resources, 49 permission triples, 119 role grants | `src/lib/permissions.ts` |
| `can(role, action, resource)` → boolean | `src/lib/permissions.ts` |
| `rolesFor(resource, action)` → `Role[]` | `src/lib/permissions.ts` |
| 15 routes migrated from hardcoded role arrays to `rolesFor()` | 14 route files |
| 3 duplicate constants eliminated (`ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `ADMIN_PAGE_ROLES`) | `me/route.ts`, `page.tsx`, `nav-bar.tsx` |
| Auto-generated access control matrix (SOC 2 CC6.1 / ISO 27001 A.5.15) | `docs/access-control-matrix.md` |
| Matrix generation script | `scripts/generate-access-matrix.ts` |
| `hasMinimumRole()` retained with "Currently unused" JSDoc | `src/lib/auth.ts` |

### Phase 3: Audit Trail & Compliance (2026-03-19, migration 041)

**4 issues resolved.** Append-only audit logging for all admin actions.

| Deliverable | Location |
|-------------|----------|
| `audit_events` table (append-only, 4 indexes, RLS: admin read, service_role insert) | Migration 041 |
| `logAudit()` fire-and-forget utility | `src/lib/audit.ts` |
| 10 routes instrumented, 11 event types (reservation.confirmed/rejected/desisted, freeze.released, rate.confirmed, settings.updated, salesperson.invited, assignment.created/ended, mgmt_role.created/ended) | 10 route files |
| Audit log API with filtering + pagination | `/api/admin/audit-log` |
| Audit log UI — filterable table, expandable detail rows | `/admin/audit` |

### Phase 5: Operations Dashboard (2026-03-19, changelog 077)

**2 issues resolved.** Action-first command center for Pati.

| Deliverable | Location |
|-------------|----------|
| 5 KPI cards with urgency coloring (red >5, amber >0, green =0) | `/admin/operaciones` |
| 3-tab work queue: Pendientes (oldest-first, urgency dots), Tasas EV (unconfirmed rates), Documentos (missing DPI) | `/admin/operaciones` |
| Activity feed — last 20 audit events with relative timestamps | `/admin/operaciones` |
| Click-through to `/admin/reservas?selected=ID` | `/admin/operaciones` |
| NavBar links: "Operaciones" + "Auditoría" (ADMIN_PAGE_ROLES) | `src/components/nav-bar.tsx` |

### Phase 4: Role-Aware Field Masking (2026-03-20, changelog 079)

**1 issue resolved.** Server-side post-query response shaping prevents data leakage when gerencia/financiero/contabilidad roles are activated.

| Deliverable | Location |
|-------------|----------|
| 4 per-resource masking functions (pure, typed, defense-in-depth) | `src/lib/field-masking.ts` |
| Masking on commissions analytics route | `src/app/api/analytics/commissions/route.ts` |
| Masking on payments analytics route | `src/app/api/analytics/payments/route.ts` |
| Masking on payment-compliance route | `src/app/api/analytics/payment-compliance/route.ts` |
| Masking on legacy commissions route | `src/app/api/commissions/route.ts` |
| Role prop passed to DashboardClient | `src/app/page.tsx` |
| Comisiones tab hidden for gerencia | `src/app/dashboard-client.tsx` |

### Post-deployment Auth Fixes (2026-03-20)

**5 AUTH issues resolved.** Production-discovered auth flow bugs after ventas go-live.

| Deliverable | Location |
|-------------|----------|
| Role-aware login redirect (ventas → `/ventas/dashboard`) | `src/app/login/page.tsx` |
| Hard navigation replacing `router.replace()` to prevent flash | `login-form.tsx`, `set-password/page.tsx` |
| `password_set` check before routing in `/auth/confirm` | `src/app/auth/confirm/route.ts` |
| Server-side auth guard on root page `/` | `src/app/page.tsx` |
| SQL backfill of `app_metadata.password_set` for pre-March-17 users | One-time SQL |

---

## Progress Visualization

```
Phase 1  [##########] 100%  Security Hardening          13 issues  DONE
Phase 2  [##########] 100%  Permission Architecture      4 issues  DONE
Phase 3  [##########] 100%  Audit Trail                  4 issues  DONE
Phase 4  [##########] 100%  Field Masking                1 issue   DONE
Phase 5  [##########] 100%  Operations Dashboard         2 issues  DONE
Phase 6  [          ]   0%  Advanced Capabilities       10 issues  DEFERRED (~32h)

Overall: 27 of 34 resolved (79%)  |  ~32 hours remaining (Phase 6 only)
```

---

## What's Next

### ~~Immediate: Phase 4 — Role-Aware Data Filtering (~24h)~~ ✅ COMPLETED (2026-03-20, changelog 079)

~~**Trigger:** Activation of gerencia/financiero/contabilidad roles for real users.~~
~~**Dependency:** Phase 2 (PERMISSIONS matrix) — now satisfied.~~
~~**Scope:** GAP-03 — `src/lib/field-masking.ts` + updates to 5 analytics routes.~~

**Resolution:** `src/lib/field-masking.ts` — 4 per-resource masking functions. 4 analytics routes wrapped. Dashboard passes `role` prop, gerencia sees 3 tabs (no Comisiones). **gerencia/financiero/contabilidad roles are now safe to activate for real users.**

### Deferred: Phase 6 — Advanced Capabilities (~32h)

**Trigger:** Admin team growth or external audit.
**Scope:** 10 gaps (GAP-09, 12–15, 16b, 17, 19, 20, 23, 24).

---

## Defense-in-Depth Model (Current State)

```
Layer 1: Middleware           Role-based page routing (5 categories)
Layer 2: Page auth guards     Server-side role check on root page
Layer 3: API route guards     requireRole() on 30+ routes, 15 using rolesFor()
Layer 4: Field masking        Post-query response shaping per role (4 analytics routes)
Layer 5: RLS policies         Ownership-scoped SELECT on 4 tables + jwt_role()
Layer 6: Client UI filtering  NavBar role-filtered links + role-aware tab visibility
```

---

## Key Implementation Artifacts

| Artifact | Location | Phase |
|----------|----------|-------|
| PERMISSIONS matrix + `can()` + `rolesFor()` | `src/lib/permissions.ts` | 2 |
| Role hierarchy constants | `src/lib/auth.ts` | 1 |
| Rate limiter | `src/lib/rate-limit.ts` | 1 |
| Audit logger | `src/lib/audit.ts` | 3 |
| Audit events table | `scripts/migrations/041_audit_events.sql` | 3 |
| Ownership RLS | `scripts/migrations/040_ventas_ownership_rls.sql` | 1 |
| `jwt_role()` SQL helper | Migration 040 | 1 |
| Audit log API | `src/app/api/admin/audit-log/route.ts` | 3 |
| Audit log UI | `src/app/admin/audit/audit-client.tsx` | 3 |
| Operations dashboard | `src/app/admin/operaciones/operaciones-client.tsx` | 5 |
| Access control matrix | `docs/access-control-matrix.md` | 2 |
| Matrix generator | `scripts/generate-access-matrix.ts` | 2 |
| Field masking utility | `src/lib/field-masking.ts` | 4 |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/gap-prioritization-2026-03-19.md` | Tiered prioritization (updated 2026-03-20) |
| `docs/gap-master-status-2026-03-20.md` | Detailed per-gap narrative (Phase 2 not yet reflected) |
| `docs/roles-gap-analysis.md` | Full gap inventory (24 gaps, detailed analysis) |
| `docs/roles-current-state.md` | Unabridged role inventory (7 roles, 5 layers) |
| `docs/roles-industry-best-practices.md` | Enterprise RBAC benchmarks |
| `docs/access-control-matrix.md` | Auto-generated permission matrix (SOC 2 CC6.1) |
| `docs/plan-fix-critical-gaps.md` | Phase 1 plan (completed) |
| `docs/plan-fix-high-severity-gaps.md` | 6-phase master remediation plan |
| `docs/plan-phase2-permission-architecture.md` | Phase 2 plan (completed) |
| `docs/plan-phase3-audit-phase5-dashboard.md` | Phase 3+5 plan (completed) |
| `docs/plan-phase4-field-masking.md` | Phase 4 plan (completed) |
