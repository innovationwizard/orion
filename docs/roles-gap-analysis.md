# Orion — Role System Gap Analysis: Current State vs Industry Best Practices

**Date:** 2026-03-19
**Reference Documents:**
- Current state: `docs/roles-current-state.md`
- Best practices: `docs/roles-industry-best-practices.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Critical Gaps (Security & Data Exposure)](#2-critical-gaps-security--data-exposure)
3. [Structural Gaps (Role Architecture)](#3-structural-gaps-role-architecture)
4. [Dashboard & Visualization Gaps](#4-dashboard--visualization-gaps)
5. [Authorization & Workflow Gaps](#5-authorization--workflow-gaps)
6. [Compliance & Audit Gaps](#6-compliance--audit-gaps)
7. [Gap Summary Matrix](#7-gap-summary-matrix)
8. [Prioritized Remediation Roadmap](#8-prioritized-remediation-roadmap)

---

## 1. Executive Summary

The Orion role system is **functionally correct for the three roles actively in use** (master, torredecontrol, ventas). The ventas role is well-isolated by middleware, the server-side OTP auth flow is secure, and the `app_metadata` approach for immutable roles is best-practice.

However, the system has **significant gaps when measured against enterprise SaaS standards:**

| Category | Gap Count | Severity | Resolved |
|----------|-----------|----------|----------|
| Security & Data Exposure | 5 | 2 Critical, 3 High | 4 resolved (GAP-01/02/04/05) |
| Role Architecture | 4 | 1 Critical, 3 High | 1 resolved (GAP-06) |
| Dashboard & Visualization | 6 | 2 High, 4 Medium | 0 |
| Authorization & Workflows | 5 | 1 High, 4 Medium | 1 resolved (GAP-18) |
| Compliance & Audit | 4 | 2 High, 2 Medium | 0 |

**Total: 24 identified gaps. 6 resolved as of 2026-03-19.**

~~The single most impactful issue: **four defined roles (gerencia, financiero, contabilidad, inventario) are dead code.** A user assigned any of these roles would see the full admin NavBar, access the analytics dashboard, and receive 403 errors on admin operations — a confusing and potentially data-exposing experience.~~

**Update (2026-03-19):** The 3 critical gaps and 3 high-severity gaps have been resolved (changelogs 074 + 075). Middleware now has explicit 5-category role routing, NavBar is role-filtered, 30+ API routes are secured with role guards, OCR endpoints have auth + rate limiting, and ownership-scoped RLS policies enforce ventas data isolation at the database level. The remaining 18 gaps are structural, dashboard, workflow, and compliance items.

---

## 2. Critical Gaps (Security & Data Exposure)

### GAP-01: API Routes Accessible Beyond Intended Roles — ✅ RESOLVED (changelog 074)
**Severity: Critical**

**Current state:** 20+ API routes use only `requireAuth()` — any authenticated user (including ventas) can call them directly. This includes:
- `GET /api/analytics/commissions` — all commission data
- `GET /api/analytics/payments` — all payment data
- `GET /api/analytics/cash-flow-forecast` — cash flow projections
- `GET /api/sales` — all sales data
- `GET /api/commission-rates` — commission rate configuration
- `GET /api/projects` — project CRUD (including POST/PATCH/DELETE)
- `GET /api/payments` — payment records
- All `/api/reservas/referidos`, `/api/reservas/valorizacion`, `/api/reservas/buyer-persona` routes

**Best practice:** API routes should enforce the same role restrictions as the pages that call them. Middleware blocks ventas users from seeing the commission dashboard page, but a ventas user who knows the API URL can fetch the same data directly via `fetch('/api/analytics/commissions')`.

**Impact:** A technically savvy salesperson (or a script) could access all commission data for all salespeople, all payment data, all sales data, and even create/modify projects. This is a data exposure risk.

**Recommendation:** Add `requireRole()` guards to all API routes that serve data intended only for admin roles. At minimum:
- Analytics routes → `requireRole(["master", "torredecontrol", "gerencia", "financiero"])`
- Commission/payment routes → `requireRole(["master", "torredecontrol", "financiero"])`
- Project CRUD → `requireRole(["master", "torredecontrol"])` for write operations
- Referidos/valorizacion management → `requireRole(["master", "torredecontrol"])`

### GAP-02: Public OCR Endpoints Without Rate Limiting — ✅ RESOLVED (changelog 074)
**Severity: Critical**

**Current state:** `POST /api/reservas/dpi-ocr` and `POST /api/reservas/ocr` are fully public. Any unauthenticated caller can submit images for Claude Vision processing, consuming API credits.

**Best practice:** All endpoints that consume external API credits (Claude, OpenAI, etc.) must have authentication and rate limiting.

**Impact:** An attacker could exhaust Claude API credits by submitting bulk image processing requests. No rate limiting is visible in the codebase.

**Recommendation:**
1. Add `requireAuth()` at minimum (or `requireSalesperson()` for the intended use case)
2. Add per-user rate limiting (e.g., max 10 OCR requests per hour per user)

### GAP-03: No Server-Side Field Masking on Analytics Routes
**Severity: High**

**Current state:** The dual-auth routes for reservation detail correctly mask fields (omitting `audit_log`, `sale_rate`, `monthly_context` for salesperson callers). However, the analytics API routes (`/api/analytics/commissions`, `/api/analytics/payments`, etc.) return the full dataset regardless of the caller's role.

**Best practice:** Every API response should be filtered based on the caller's role. If a route is accessible to a Sales Manager, they should see team-level aggregates, not individual commission amounts for all salespeople across all projects.

**Impact:** If/when the gerencia or financiero roles are activated, users with these roles would receive the same data as master — including potentially sensitive data like individual commission amounts for all salespeople, individual payment compliance per unit, etc.

**Recommendation:** Implement role-aware response shaping — the same API endpoint returns different data granularity depending on the caller's role.

### GAP-04: Inactive Roles Have Uncontrolled Access — ✅ RESOLVED (changelog 075)
**Severity: High**

**Current state:** ~~The four inactive roles (gerencia, financiero, contabilidad, inventario) are defined in the TypeScript type but have no middleware enforcement, no NavBar differentiation, and no API-level guards.~~ **Resolved.** Middleware now has explicit 5-category role routing: `ventas` → restricted, `ADMIN_PAGE_ROLES` (master, torredecontrol) → full admin access, `DATA_PAGE_ROLES` (gerencia, financiero, contabilidad) → analytics pages only (blocked from /admin, /referidos, /valorizacion, /cesion, /buyer-persona, /integracion), unknown/null roles → redirect to /login. NavBar links are tagged with `roles` arrays and filtered by the user's role at render time.

~~If a user were assigned `role = "financiero"`:~~
~~- Middleware: non-ventas → full page access~~
~~- NavBar: shows all admin links~~
~~- API: passes `requireAuth()` checks → access to analytics, commissions, payments~~
~~- API: fails `requireRole(["master", "torredecontrol"])` → blocked from reservation admin operations~~
~~- Net effect: full read access to sensitive financial data, no ability to take any admin action, confusing UX~~

**Best practice:** Every role in the system should have explicitly defined access boundaries. Undefined behavior is a security gap.

**Recommendation:** ~~Either:~~
~~- **Option A (recommended):** Implement full middleware and API enforcement for all four roles before assigning any user to them~~
~~- **Option B (temporary):** Remove the inactive roles from the type definition and re-add them when implementation is ready.~~
**Implemented Option A** — middleware, NavBar, and API routes all enforce explicit role boundaries.

### GAP-05: No Row-Level Ownership Enforcement at Database Level — ✅ RESOLVED (changelog 075, migration 040)
**Severity: High**

**Current state:** ~~Ownership scoping for ventas users (see only own reservations, own clients) is implemented at the API layer via query filters (`WHERE salesperson_id = $1`). The RLS policies allow any authenticated user to SELECT all rows from `reservations`, `rv_clients`, `reservation_clients`, etc.~~ **Resolved.** Migration 040 deployed ownership-scoped RLS policies on 4 tables: `reservations`, `rv_clients`, `reservation_clients`, `receipt_extractions`. Uses a reusable `jwt_role()` helper function. Ventas users see only rows linked to their own `salespeople.user_id`. Non-ventas roles see all rows. INSERT policies on `reservations` and `reservation_clients` also tightened from `TO public` to `TO authenticated`.

**Best practice:** Row-level ownership should be enforced at the database level via RLS policies. If a new API route is added and forgets the ownership filter, the database should prevent data leakage.

~~**Impact:** Any new API endpoint that queries reservations or clients without adding the `salesperson_id` filter would expose other salespeople's data. The defense relies entirely on developer discipline at the API layer.~~

~~**Recommendation:** Add ownership-scoped RLS policies for ventas users.~~
**Implemented** — defense-in-depth now operates at both API layer (query filters) and database layer (RLS policies).

---

## 3. Structural Gaps (Role Architecture)

### GAP-06: No Role Hierarchy — ✅ RESOLVED (changelog 074)
**Severity: Critical**

**Current state:** The system has three active roles treated as flat, independent categories:
- `master` → everything
- `torredecontrol` → almost everything (minus 2 master-only endpoints)
- `ventas` → restricted to own data

There is no inheritance. The system checks for exact role matches: `requireRole(["master", "torredecontrol"])`.

**Best practice (Salesforce model):** Hierarchical RBAC where senior roles automatically inherit all permissions of subordinate roles. Example:
```
master
  └─ torredecontrol
       └─ gerencia (future)
            └─ ventas
```
A `gerencia` user would automatically have all `ventas` permissions plus manager-level additions. A `torredecontrol` user would have all `gerencia` permissions plus operational controls.

**Impact:** Every time a new role needs to be activated, every `requireRole()` call in every API route must be manually updated to include the new role. This is error-prone and violates DRY.

**Recommendation:** Implement a role hierarchy utility:
```typescript
const ROLE_HIERARCHY: Record<Role, number> = {
  ventas: 10,
  inventario: 20,
  contabilidad: 30,
  financiero: 40,
  gerencia: 50,
  torredecontrol: 60,
  master: 100,
};

function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
```
Then `requireRole("torredecontrol")` would automatically pass for `master`. Routes requiring `gerencia` would automatically pass for `torredecontrol` and `master`.

### GAP-07: No Permission Matrix / Formal Access Control Document
**Severity: High**

**Current state:** Permissions are implicitly defined by scattered `requireRole()` calls across 50+ API routes and middleware checks. There is no single document or data structure that maps (role, resource, action) → allowed/denied.

**Best practice:** A formal access control matrix — either as a document or as a code-level data structure — that defines every permission triple (verb, noun, scope) and which roles have it. This is a SOC 2 requirement (CC6.1) and makes auditing tractable.

**Recommendation:** Create an access control matrix (code-level, not just documentation) that is the single source of truth for all authorization checks. All `requireRole()` calls should reference this matrix rather than hardcoding role lists.

### GAP-08: No `can(action, resource)` Utility
**Severity: High**

**Current state:** Authorization checks are scattered across components and routes as direct role string comparisons:
- `role === 'ventas'` in NavBar
- `requireRole(["master", "torredecontrol"])` in API routes
- `readOnly` prop hardcoded based on path
- `isSalespersonFailure()` in dual-auth routes

**Best practice:** A centralized `can(user, action, resource)` function that all UI components and API routes call. This:
- Provides a single place to modify permission logic
- Makes UI conditional rendering declarative (`{can('approve', 'reservation') && <ApproveButton />}`)
- Enables testing permission logic independently
- Makes the permission model auditable

**Recommendation:** Create a `permissions.ts` module with:
```typescript
function can(role: Role, action: Action, resource: Resource, scope?: Scope): boolean
```
Use this everywhere instead of scattered role checks.

### GAP-09: No Project-Scoped Admin Access
**Severity: High**

**Current state:** All admin users (master, torredecontrol) see all 4 projects in all views. There is no mechanism to restrict an admin user to specific projects.

**Best practice (Yardi model):** "User Property Security" — admins can be restricted to specific properties. Relevant for scenarios like:
- A regional manager who oversees only B5 and BEN
- A project-specific accountant
- A legal reviewer assigned to only one project's PCVs

**Identified in:** `docs/remaining-features.md` item #30: "Role-based access per project — currently all admin users see all projects."

**Recommendation:** Extend the `salesperson_project_assignments` model to cover admin roles, or create a generic `user_project_assignments` table.

---

## 4. Dashboard & Visualization Gaps

### GAP-10: No Role-Specific Dashboard Views
**Severity: High**

**Current state:** The main dashboard (`/`) is a monolith (`dashboard-client.tsx`, ~28KB) that shows the same content to all admin users. Pati (torredecontrol) sees the same dashboard as the CFO (if the financiero role were active). There is no dashboard tailored to:
- CFO (financial KPIs, disbursement tracking, ISR summary)
- Sales Manager (team performance, pipeline health, coaching indicators)
- Executive (portfolio-level summary, trend arrows, project health scorecards)

**Best practice:** Each role has a landing page optimized for their primary concerns. The inverse density principle: executives see 5-7 large KPIs, managers see 8-12 with drill-down, operators see 10-15 with action queues.

**Impact:** Pati sees financial charts she doesn't act on. A future CFO would see operational details they don't need. Information overload reduces decision speed.

**Recommendation:** Create role-specific dashboard landing pages:
- `/` → route to role-appropriate dashboard
- `/dashboard/operaciones` → Torre de Control (work queues, pending approvals, data quality)
- `/dashboard/finanzas` → CFO (commissions, disbursements, ISR, cash flow)
- `/dashboard/gerencia` → Sales Manager (team KPIs, agent comparison)
- `/dashboard/ejecutivo` → C-Suite (portfolio summary, trend arrows)

### GAP-11: No Dedicated Operations Dashboard for Pati
**Severity: High**

**Current state:** Pati uses the analytics dashboard (same as everyone else) plus the admin reservations page. Her primary workflow — processing incoming reservations, cross-referencing data, catching errors, managing document flow — has no dedicated interface.

**Best practice:** The operator dashboard should be **action-first**: work queues with urgency indicators, exception lists (missing data, overdue items), and inline action buttons. The current analytics dashboard is **insight-first** — designed for understanding trends, not for processing a queue of 350+ clients.

**Impact:** Pati must context-switch between the analytics dashboard, the admin reservations page, and (still) Excel for payment tracking. Each switch costs cognitive load and increases error risk.

**Recommendation:** Build an operator command center for Pati:
- Pending approvals queue (sorted by age, with urgency color)
- Data quality alerts (missing DPI, incomplete profiles, unsigned PCVs)
- Daily transaction log
- Payment status overview (linked to remaining feature #14)
- Quick-action buttons for common operations

### GAP-12: Ventas Portal Lacks Progressive Disclosure
**Severity: Medium**

**Current state:** The ventas portal has 6 pages (panel, reservas, inventario, clientes, rendimiento, nueva-reserva). Each page loads its own data independently.

**Best practice:** Progressive disclosure — the panel (landing page) shows L0/L1 summary (KPI cards, sparklines), and each KPI links to the relevant detail page (L2: filterable table, L3: individual record).

**Impact:** Salespeople may not discover relevant information because the portal pages are isolated rather than interconnected. A salesperson seeing their commission KPI card should be able to tap it to see the commission breakdown, then tap a specific sale to see the commission detail.

**Recommendation:** Add click-through navigation from KPI cards on the panel to the corresponding detail pages.

### GAP-13: No Comparison Context on KPIs
**Severity: Medium**

**Current state:** KPI cards show current values (e.g., "Units Reserved: 5"). There is no comparison against:
- Target/quota
- Prior period (last month, same month last year)
- Team average

**Best practice:** Every KPI needs at least one comparison point. "5 units reserved" means nothing without context. "5 of 10 quota (50%)" or "5 (+2 vs last month)" tells a story.

**Recommendation:** Add comparison context to all KPI cards:
- Trend arrow (up/down vs prior period)
- Target bar (actual vs quota, where quota data exists)
- Color coding (green if on track, amber if behind, red if critical)

### GAP-14: Mobile Optimization for Ventas
**Severity: Medium**

**Current state:** The reservation form (`/reservar`) is designed for mobile (camera inputs, offline queue). But the ventas portal pages (panel, reservas, clientes, rendimiento) are standard responsive layouts without specific mobile optimization.

**Best practice:** Field sales teams need mobile-first dashboards:
- Card-based layouts instead of tables
- 44x44px minimum touch targets
- Reduced numerical precision ("Q45.2K" not "Q45,234.56")
- No hover-dependent interactions
- Single-question-per-screen pattern

**Recommendation:** Audit all ventas portal pages for mobile usability. Replace tables with card-based layouts on small screens. Ensure all interactive elements meet minimum touch target sizes.

### GAP-15: No Chart Type Variety
**Severity: Medium**

**Current state:** The analytics dashboard uses D3 treemaps (excellent for inventory), commission bars, cash flow chart, and bullet charts. The ventas portal uses KPI cards with sparklines.

**Best practice:** Different questions demand different chart types:
- Trend over time → line chart
- Comparison → horizontal bar chart
- Composition → stacked bar (not pie with >5 slices)
- Pipeline funnel → funnel chart
- Process progression → Sankey diagram

**Missing chart types that would serve existing data:**
- Funnel chart for reservation pipeline (PENDING → CONFIRMED → PCV → SIGNED)
- Agent comparison bar chart for sales managers
- Aging histogram for payment delinquency

**Recommendation:** Add Recharts as a complement to D3. Use D3 for custom visualizations (treemaps), Recharts for standard charts (line, bar, funnel). This matches the Stripe pattern.

---

## 5. Authorization & Workflow Gaps

### GAP-16: No Maker-Checker on User Provisioning
**Severity: High**

**Current state:** A single admin (master or torredecontrol) can create a new user account, assign them to projects, and send them credentials — all without any approval from a second person.

**Best practice:** User provisioning is a privileged operation (SOC 2 CC6.2). The maker-checker pattern requires a second admin to approve before the account is active.

**Recommendation:** At minimum, log all user provisioning actions with full audit trail. Ideally, require a second admin to approve before the invite link is sent.

### GAP-17: No Approval Workflow for Desistimientos
**Severity: Medium**

**Current state:** Desistimiento is a single-step operation: admin clicks "desist" and the reservation is immediately cancelled, the unit returns to AVAILABLE. There is no:
- Required evidence (letter, email) before processing
- Second-person approval
- Waiting period
- Client notification

**Best practice (per remaining features #16):** Desistimiento workflow should require documentation (letter/email evidence) and potentially an approval chain.

**Recommendation:** Implement a two-step desistimiento: request (with required evidence attachment) → approval (by a different user than the requester).

### GAP-18: No Escalation Path for Rate Confirmation — ✅ RESOLVED (changelog 074)
**Severity: Medium**

~~**Current state:** Only master can confirm ejecutivo rates. If the master user is unavailable, no one can confirm rates. Torre de Control can see rates but cannot confirm them.~~

**Resolved:** `financiero` role added to the ejecutivo-rate PATCH endpoint's `requireRole()` guard (`["master", "financiero"]`). CFO can now confirm rates as an escalation path when master is unavailable.

**Best practice:** Escalation paths should exist for all time-sensitive operations. If the primary approver is unavailable, a deputy or an escalation mechanism should exist.

~~**Recommendation:** Either:~~
~~- Allow torredecontrol to confirm rates (expand `requireRole` to include torredecontrol)~~
~~- Or implement a delegation mechanism (master can temporarily grant rate-confirmation rights)~~
**Implemented:** `financiero` added as rate confirmer — pragmatic escalation without delegation complexity.

### GAP-19: No Notification System
**Severity: Medium**

**Current state:** When a salesperson submits a reservation, the admin must manually check the admin reservations page to see it. When an admin confirms a reservation, the salesperson must manually check their portal. There are no push notifications, emails, or in-app alerts.

**Best practice:** Event-driven notifications for role-relevant state changes:
- Salesperson submits → notify admin (new pending review)
- Admin confirms → notify salesperson (reservation confirmed)
- Payment overdue → notify salesperson + admin
- Rate unconfirmed for >N days → notify master

**Recommendation:** Start with a simple notification system:
1. In-app notification badge (unread count on NavBar)
2. Email notifications for critical events (optional, configurable per user)

### GAP-20: No Temporal Permission Expiry
**Severity: Medium**

**Current state:** Once a role is assigned via `app_metadata`, it persists indefinitely. There is no mechanism for:
- Time-limited elevated access (e.g., temporary master access for a specific task)
- Automatic deactivation of accounts that haven't logged in for N days
- Seasonal access patterns (e.g., a salesperson who is only active during launch phases)

**Best practice:** Temporal access controls: accounts that have been inactive for 30+ days should be flagged for review, and elevated permissions should have optional expiry dates.

**Recommendation:** Build an admin view showing last login date per user. Flag accounts inactive >30 days. This is a SOC 2 requirement (CC6.3).

---

## 6. Compliance & Audit Gaps

### GAP-21: No Formal Access Control Matrix Document
**Severity: High**

**Current state:** Permissions are defined implicitly across ~50 API routes and middleware logic. There is no single document that says "role X can do Y on resource Z."

**Best practice (SOC 2 CC6.1, ISO 27001 A.5.15):** A formal, auditable access control matrix must exist. It should be reviewed quarterly and updated when roles or permissions change.

**Impact:** If Puerta Abierta ever undergoes a security audit or seeks compliance certification, the first question will be "show me your access control matrix." Currently, that would require reading every API route's source code.

**Recommendation:** The `docs/roles-current-state.md` (this analysis's Doc 1) is a first step. Convert the API authorization matrix into a structured format (spreadsheet or code-level data structure) that can be formally reviewed.

### GAP-22: Incomplete Audit Trail
**Severity: High**

**Current state:** Audit logging exists for:
- Unit status changes (`unit_status_log` with `changed_by`)
- Reservation confirmation/rejection (`reviewed_by`, `reviewed_at`)
- Ejecutivo rate confirmation (`ejecutivo_rate_confirmed_by`, `_at`)
- System auto-approval marker (`'system:auto-approval'`)

Audit logging does NOT exist for:
- Who accessed what data (no read audit trail)
- System settings changes (who toggled auto-approval)
- User provisioning actions (who invited which salesperson)
- Commission rate changes (who modified what rate, when)
- Export/download actions
- Login/logout events (Supabase Auth logs these internally but not surfaced in app)

**Best practice:** Every significant action should log who, what, when, where (IP/device), and why (reason if applicable). This is especially important for financial operations.

**Recommendation:**
1. Add an `audit_events` table for system-wide event logging
2. Log all admin actions: user provisioning, settings changes, rate modifications
3. Surface audit log in a dedicated admin page (remaining feature #29)

### GAP-23: No Access Review Process
**Severity: Medium**

**Current state:** There is no mechanism to review whether existing users still need their current level of access. No reports show:
- Users by role
- Last login date per user
- Inactive accounts
- Over-privileged accounts (users with roles beyond their current job function)

**Best practice (SOC 2 CC6.3, ISO 27001):** Quarterly access reviews. An admin should be able to pull a report showing all users, their roles, last login, and project assignments, then certify that each user's access is still appropriate.

**Recommendation:** Build an access review dashboard in `/admin/asesores` showing:
- All users with roles and last login dates
- Inactive accounts (>30 days since last login)
- Role distribution chart
- One-click deactivation for revoked access

### GAP-24: No Data Classification or Minimization
**Severity: Medium**

**Current state:** All authenticated users (including ventas) can potentially access the same data through direct API calls (GAP-01). There is no data classification that marks certain data as "financial-sensitive" or "PII" and restricts access accordingly.

**Best practice (GDPR Art. 25, data minimization):** Data should be classified by sensitivity level, and each role should only see the minimum data necessary for their function:
- **Public:** Unit availability, project info
- **Internal:** Reservation details, client names
- **Confidential:** DPI numbers, financial data, commission amounts
- **Restricted:** System settings, user credentials, audit logs

**Recommendation:** Classify all data fields by sensitivity level. Align API field masking and RLS policies to enforce data minimization per role.

---

## 7. Gap Summary Matrix

| # | Gap | Category | Severity | Effort | Current State | Best Practice |
|---|-----|----------|----------|--------|---------------|---------------|
| 01 | ✅ API routes too permissive | Security | Critical | Medium | ~~20+ routes use `requireAuth()` only~~ 30 routes secured | Role-specific guards on all routes |
| 02 | ✅ Public OCR without auth/rate limit | Security | Critical | Low | ~~Public endpoints~~ Auth + 20 req/hr rate limit | Auth required + rate limiting |
| 03 | No server-side field masking on analytics | Security | High | High | Full data returned to all authenticated users | Role-aware response shaping |
| 04 | ✅ Inactive roles have uncontrolled access | Security | High | Low | ~~4 roles undefined~~ Explicit 5-category routing | Remove or implement before assignment |
| 05 | ✅ No DB-level ownership enforcement | Security | High | Medium | ~~API-only~~ RLS ownership policies deployed | RLS ownership policies |
| 06 | ✅ No role hierarchy | Architecture | Critical | Medium | ~~Flat~~ ROLE_LEVEL + ADMIN/DATA_VIEWER groups | Hierarchical RBAC with inheritance |
| 07 | No formal access control matrix | Architecture | High | Low | Implicit in scattered code | Central matrix (code + document) |
| 08 | No `can(action, resource)` utility | Architecture | High | Medium | Scattered role string comparisons | Centralized permission utility |
| 09 | No project-scoped admin access | Architecture | High | High | All admins see all projects | Per-user project assignments for admins |
| 10 | No role-specific dashboards | Dashboard | High | High | One monolith dashboard for all admins | Role-optimized landing pages |
| 11 | No operations dashboard for Pati | Dashboard | High | High | Analytics dashboard + admin reservas | Action-first operator command center |
| 12 | No progressive disclosure in ventas portal | Dashboard | Medium | Low | Isolated pages, no interconnection | KPI cards link to detail pages |
| 13 | No comparison context on KPIs | Dashboard | Medium | Low | Raw values without targets | Trends, quotas, period comparison |
| 14 | Mobile optimization gaps in ventas portal | Dashboard | Medium | Medium | Standard responsive layouts | Mobile-first cards, large touch targets |
| 15 | Limited chart type variety | Dashboard | Medium | Medium | Treemaps + bars + cash flow | Add funnels, agent comparison, aging |
| 16 | No maker-checker on user provisioning | Auth/Workflow | High | Medium | Single admin creates users unilaterally | Two-person approval for account creation |
| 17 | No approval workflow for desistimientos | Auth/Workflow | Medium | Medium | Single-step cancellation | Two-step with evidence + approval |
| 18 | ✅ No escalation path for rate confirmation | Auth/Workflow | Medium | Low | ~~Master-only~~ master + financiero | Expand role or add delegation |
| 19 | No notification system | Auth/Workflow | Medium | High | Manual polling for state changes | In-app + email notifications |
| 20 | No temporal permission expiry | Auth/Workflow | Medium | Medium | Permanent role assignments | Inactivity flags, optional expiry |
| 21 | No formal access control document | Compliance | High | Low | Permissions in code only | SOC 2 / ISO 27001 ready matrix |
| 22 | Incomplete audit trail | Compliance | High | Medium | Partial logging (unit status, confirmation) | Full event logging (all admin actions) |
| 23 | No access review process | Compliance | Medium | Low | No user activity visibility | Quarterly review dashboard |
| 24 | No data classification | Compliance | Medium | Medium | All data accessible by all auth users | Sensitivity classification + enforcement |

---

## 8. Prioritized Remediation Roadmap

### Phase 1: Security Hardening — ✅ COMPLETED (2026-03-19, changelogs 074 + 075)

| Priority | Gap | Action | Status |
|----------|-----|--------|--------|
| P0 | GAP-02 | `requireAuth()` + 20 req/hr rate limiting on OCR endpoints | ✅ Done |
| P0 | GAP-04 | Explicit 5-category middleware routing + role-filtered NavBar | ✅ Done |
| P0 | GAP-01 | `requireRole()` on 30 API routes (4 groups) | ✅ Done |
| P1 | GAP-05 | Ownership-scoped RLS policies on 4 tables + `jwt_role()` helper | ✅ Done |

**All Phase 1 security gaps resolved before salesperson go-live.**

### Phase 2: Architecture Foundation (Before activating new roles)

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| ✅ | GAP-06 | Role hierarchy (`ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()`) | ✅ Done (changelog 074) |
| P1 | GAP-08 | Create `can(role, action, resource)` permission utility | 4-8 hours |
| P1 | GAP-07 | Define formal access control matrix in code | 2-4 hours |
| P2 | GAP-03 | Implement role-aware field masking on analytics API routes | 8-16 hours |

**Rationale:** GAP-06 resolved. Remaining items must be in place before activating the gerencia, financiero, contabilidad, or inventario roles. Without them, new role activation would create undefined access patterns.

### Phase 3: Pati's Workflow Optimization (Highest ROI for mission)

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| P1 | GAP-11 | Build operations command center for Torre de Control | 16-24 hours |
| P2 | GAP-10 | Create role-specific dashboard routing | 8-16 hours |
| P2 | GAP-13 | Add comparison context to KPI cards | 4-8 hours |

**Rationale:** The mission is to obliterate Pati's Excel dependency. A dedicated operations dashboard — not a shared analytics view — is the interface that replaces her Excel workflow.

### Phase 4: Ventas Portal Enhancement

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| P2 | GAP-12 | Add click-through navigation from panel KPIs to detail pages | 2-4 hours |
| P2 | GAP-14 | Mobile-first audit of ventas portal pages | 4-8 hours |
| P3 | GAP-19 | Implement in-app notification system | 16-24 hours |

### Phase 5: Compliance & Audit (Before external audit or scale)

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| P2 | GAP-22 | Create `audit_events` table + logging for all admin actions | 8-16 hours |
| P2 | GAP-21 | Formalize access control matrix as auditable document | 2-4 hours |
| P3 | GAP-23 | Build access review dashboard (users, roles, last login) | 4-8 hours |
| P3 | GAP-24 | Classify data by sensitivity, align with access controls | 4-8 hours |

### Phase 6: Advanced Capabilities (When scale demands it)

| Priority | Gap | Action | Effort |
|----------|-----|--------|--------|
| P3 | GAP-09 | Project-scoped admin access (user_project_assignments) | 16-24 hours |
| P3 | GAP-15 | Add funnel, comparison, aging chart types via Recharts | 8-16 hours |
| P3 | GAP-16 | Maker-checker on user provisioning | 4-8 hours |
| P3 | GAP-17 | Two-step desistimiento workflow | 8-16 hours |
| ✅ | GAP-18 | ~~Rate confirmation escalation/delegation~~ financiero added | ✅ Done (changelog 074) |
| P3 | GAP-20 | Temporal permission expiry and inactivity flags | 4-8 hours |

---

## Summary

The Orion role system is **secure for its current 3-role production deployment** ~~but has **significant gaps when measured against the enterprise standards the project aspires to**~~. **Phase 1 (security hardening) is complete** — all critical and high-severity security gaps have been resolved (changelogs 074 + 075). The system now has 4-layer defense-in-depth: explicit middleware role routing, role-guarded API routes, ownership-scoped RLS policies, and role-filtered NavBar links.

~~The most urgent work is in Phase 1 (security hardening) and Phase 2 (architecture foundation) — both should be completed before the 32-salesperson go-live.~~

The remaining gaps are structural (GAP-07/08 permission matrix), compliance (GAP-22 audit trail), dashboard (GAP-10/11 Pati's operations), and advanced items (GAP-09 project scoping). The highest-ROI work for the mission is Pati's operations dashboard (GAP-11). See `docs/plan-fix-high-severity-gaps.md` for the detailed remediation plan.

Total estimated effort for remaining phases: **~132 hours** (roughly 3-4 developer-weeks).
