# Orion — Current App Roles: Unabridged Description

**Date:** 2026-03-19 (updated 2026-03-20 — Phase 2 permission architecture, Phase 4 field masking; updated 2026-03-24 — marketing role)
**Scope:** Complete inventory of roles, access patterns, data visibility, and UI behavior as implemented in production.

---

## Table of Contents

1. [Role Definitions](#1-role-definitions)
2. [Role Storage & Enforcement Architecture](#2-role-storage--enforcement-architecture)
3. [Role-by-Role Detailed Profiles](#3-role-by-role-detailed-profiles)
4. [Page Access Matrix](#4-page-access-matrix)
5. [API Route Authorization Matrix](#5-api-route-authorization-matrix)
6. [Database-Level Access Control (RLS)](#6-database-level-access-control-rls)
7. [Navigation & UI Filtering](#7-navigation--ui-filtering)
8. [Data Visibility Rules](#8-data-visibility-rules)
9. [Action Authorization](#9-action-authorization)
10. [Foreseeable Role Needs](#10-foreseeable-role-needs)

---

## 1. Role Definitions

The system defines eight roles in `src/lib/auth.ts`:

```typescript
type Role = "master" | "gerencia" | "financiero" | "contabilidad" | "marketing" | "ventas" | "inventario" | "torredecontrol"
```

**Actively used in production (as of 2026-03-19):**

| Role | Human Label | Description | Active Users |
|------|-------------|-------------|--------------|
| `master` | Super Administrador | Full system access, no restrictions | ~1-2 (Jorge, superuser) |
| `torredecontrol` | Torre de Control | Operational admin, manages day-to-day commercial flow | 1 (Pati) |
| `ventas` | Ejecutivo de Ventas | Salesperson, restricted to own data and assigned projects | 32 (field sales team) |

**Implemented with scoped access (added 2026-03-24):**

| Role | Human Label | Description | Active Users |
|------|-------------|-------------|--------------|
| `marketing` | Marketing | Lead source management + read-only dashboard | 0 (ready to provision) |

**Defined but not actively enforced (no routes, no pages, no RLS policies check for them):**

| Role | Human Label | Intended Use |
|------|-------------|-------------|
| `gerencia` | Gerencia Comercial | Sales management oversight |
| `financiero` | Financiero / CFO | Financial operations, commission confirmation |
| `contabilidad` | Contabilidad | Accounting reconciliation |
| `inventario` | Inventario | Inventory control, unit management |

These four roles exist in the TypeScript type definition and in one RLS policy (`salesperson_project_assignments` allows `gerencia` and `inventario` to manage assignments), but no middleware routes, API guards, or NavBar filters reference them. Users assigned these roles would effectively behave like unauthenticated users — they can log in but middleware would redirect them to `/` (the dashboard), where they'd see the analytics dashboard without any ventas-specific restrictions.

### Superuser Concept

A parallel authorization concept exists outside the role system: **superuser**. Determined by the `SUPERUSER_EMAILS` environment variable or by having the `master` role. Superusers bypass all `requireRole()` checks. This is a break-glass mechanism, not a role.

---

## 2. Role Storage & Enforcement Architecture

### 2.1 Where Roles Are Stored

Roles are stored in **Supabase Auth `app_metadata`** — a JSON field on `auth.users` that is:
- **Immutable by the client** (only service_role key can modify via server-side API)
- **Embedded in the JWT token** on every authenticated request
- **Accessible server-side** via `user.app_metadata.role`
- **Accessible in RLS policies** via `auth.jwt()->'app_metadata'->>'role'`

This is a critical security decision. The alternative (`user_metadata`) is **client-editable** — any authenticated user can call `supabase.auth.updateUser({ data: { role: "master" } })`. The system explicitly does NOT use `user_metadata` for authorization.

### 2.2 Permission Architecture (Added 2026-03-20)

**Single source of truth:** `src/lib/permissions.ts` defines the `PERMISSIONS` matrix — `Record<Resource, Partial<Record<Action, Role[]>>>` covering 23 resources, 14 action types, 53 permission triples, and 131 role grants. Every authorization decision references this matrix.

**Public API:**
- `rolesFor(resource, action)` → `Role[]` — used in API routes as `requireRole(rolesFor("reservations", "confirm"))`
- `can(role, resource, action)` → `boolean` — for UI conditional rendering and script consumption
- `ADMIN_ROLES` / `DATA_VIEWER_ROLES` — client-safe re-exports (auth.ts uses `next/headers` which can't be imported in client components)

**Formal documentation:** `docs/access-control-matrix.md` — auto-generated 8-role × 53-action matrix via `scripts/generate-access-matrix.ts`. SOC 2 CC6.1 / ISO 27001 A.5.15 compliant. Regenerate on demand: `npx tsx scripts/generate-access-matrix.ts`.

See changelog 078 for full details.

### 2.3 Six Layers of Enforcement

Role enforcement operates as a defense-in-depth model with six layers (updated 2026-03-20 — page-level auth guards + field masking added):

#### Layer 1: Middleware (Request-Level)
**File:** `middleware.ts`

The sole routing enforcer. Intercepts every HTTP request before it reaches a page or API route. **Updated 2026-03-19** to use explicit 5-category role routing (previously binary ventas/non-ventas).

| Condition | Behavior |
|-----------|----------|
| Unauthenticated user hits protected route | Redirect → `/login` |
| `ventas` role on `/login` | Redirect → `/ventas/dashboard` |
| Admin/data role on `/login` | Redirect → `/` |
| `ventas` role without `password_set = true` | Redirect → `/auth/set-password` |
| `ventas` role hits non-allowed route | Redirect → `/ventas/dashboard` |
| `ventas` role hits allowed route | Allow through |
| `marketing` role hits `/admin/lead-sources` | Allow through |
| `marketing` role hits other admin/blocked page | Redirect → `/` |
| `marketing` role hits analytics page | Allow through |
| `ADMIN_PAGE_ROLES` (master, torredecontrol) | Full page access (no restrictions) |
| `DATA_PAGE_ROLES` (gerencia, financiero, contabilidad) | Analytics pages only; blocked from admin-only pages |
| Unknown/null/unhandled role | Redirect → `/login` |

**Ventas-allowed routes:**
- `/reservar`
- `/ventas/*`
- `/disponibilidad`
- `/cotizador`
- `/auth/*`
- `/login`

**Admin-only pages** (blocked for DATA_PAGE_ROLES):
- `/admin/*`
- `/referidos`
- `/valorizacion`
- `/cesion`
- `/buyer-persona`
- `/integracion`

**Public routes (no auth required):**
- `/disponibilidad`
- `/cotizador`
- `/login`
- `/auth/*`

~~**Key observation:** Middleware only distinguishes between `ventas` and `not-ventas`. There is no middleware-level distinction between `master`, `torredecontrol`, `gerencia`, `financiero`, `contabilidad`, or `inventario`. All non-ventas roles receive identical routing treatment.~~

**Updated:** Middleware now has explicit 6-category role routing (ventas, marketing, admin, data viewer, unknown, unauthenticated). Marketing users get the same blocklist as DATA_PAGE_ROLES with an exception for `/admin/lead-sources`. DATA_PAGE_ROLES users are blocked from admin mutation pages but can access analytics, projects, ventas velocity, desistimientos, disponibilidad, and cotizador. Unknown/null roles are redirected to login.

#### Layer 2: Page Auth Guards (Server Component-Level) — NEW 2026-03-20
**Files:** `src/app/page.tsx`, `src/app/login/page.tsx`

Server Components that check the user's role before rendering page content. Added as defense-in-depth after discovering that middleware alone was insufficient — client-side race conditions in `router.replace()` could render a page briefly before middleware's redirect arrived on the next request.

| Page | Guard Behavior |
|------|---------------|
| `/` (Analytics Dashboard) | `getUser()` → unauthenticated → `/login`; ventas → `/ventas/dashboard`; unknown role → `/login`; `DATA_VIEWER_ROLES` only → render |
| `/login` | `getUser()` → ventas → `/ventas/dashboard`; other authenticated → `/` |

**Key design decisions:**
- Uses `createServerClient` with read-only cookie adapter (get only, set/remove are no-ops) — safe for Server Components that cannot write cookies
- `window.location.href` replaces `router.replace()` in client components (`login-form.tsx`, `set-password/page.tsx`) — hard navigation forces middleware to run on a fresh server request, eliminating the client-side race condition
- Role-aware redirects: ventas users go to `/ventas/dashboard`, admin/data users go to `/`

**Context:** These guards were added to fix 5 compounding post-authentication redirect failures discovered during production testing with ventas users on 2026-03-20. Full details in `docs/plan-auth-deep-investigation.md`.

#### Layer 3: API Route Guards (Function-Level)
**File:** `src/lib/auth.ts`

Each API route handler explicitly calls one of:

| Guard Function | Behavior |
|----------------|----------|
| `requireAuth()` | Any authenticated user passes |
| `requireRole(roles)` | User must have one of the specified roles (or be superuser) |
| `requireSuperuser()` | User must be superuser (email in env var or master role) |
| `requireSalesperson()` | User must be linked to an active `salespeople` record |

API routes combine these guards to implement role-specific access. The dual-auth pattern (try admin first, fall back to salesperson with ownership check) is used for document routes (PCV, Carta de Pago, Carta de Autorización).

#### Layer 4: Field Masking (Post-Query Response Shaping) — NEW 2026-03-20
**File:** `src/lib/field-masking.ts`

Post-query response shaping applied after Supabase queries and before `jsonOk()`. 4 per-resource masking functions — pure, typed, defense-in-depth: unknown roles default to most restrictive masking (gerencia-level).

| Function | Route | gerencia | contabilidad |
|----------|-------|----------|--------------|
| `maskCommissionsAnalytics()` | `/api/analytics/commissions` | `byRecipient: []`, ISR/disbursable zeroed | `recipientName` → "Beneficiario N" |
| `maskPaymentCompliance()` | `/api/analytics/payment-compliance` | `paymentHistory: []` per unit | No masking |
| `maskPaymentsAnalytics()` | `/api/analytics/payments` | Money fields zeroed, `paymentHistory: []` | No masking |
| `maskCommissionsLegacy()` | `/api/commissions` | `data: []` (keep totals) | `recipient_name` → "Beneficiario N" |

**Full access (no masking):** master, torredecontrol, financiero.
**Cash flow route excluded:** `/api/analytics/cash-flow-forecast` returns only aggregate monthly data with no PII.

**Dashboard UI integration:** `src/app/page.tsx` passes `role` prop to `DashboardClient`. `src/app/dashboard-client.tsx` filters visible tabs — gerencia sees Resumen, Pagos, Flujo de Caja (Comisiones tab hidden). Server-side masking ensures that even if a role somehow reaches the Comisiones data, the response contains empty arrays.

See changelog 079 for full implementation details.

#### Layer 5: Row-Level Security (Database-Level)
**Supabase RLS policies on PostgreSQL tables**

RLS policies are the final enforcement boundary. Even if a bug in middleware or API code allows an unauthorized request through, RLS policies prevent data access at the database level.

~~Most reservation system tables use a simple two-policy model:~~
~~- `SELECT` → all authenticated users (or public for reference tables)~~

**Updated 2026-03-19 (migration 040):** Ownership-scoped RLS policies now enforce ventas data isolation at the database level. Uses a reusable `jwt_role()` SQL helper function to extract role from JWT `app_metadata`.

**Ownership-scoped SELECT policies (CASE-based: ventas → own data, non-ventas → all rows):**
- `reservations` — ventas see only rows where `salesperson_id` matches their `salespeople.user_id`
- `rv_clients` — ventas see only clients linked through `reservation_clients` → `reservations` ownership chain
- `reservation_clients` — ventas see only junction rows for their own reservations
- `receipt_extractions` — ventas see only extractions for their own reservations

**INSERT policies tightened** (from `TO public` to `TO authenticated`):
- `reservations`
- `reservation_clients`

**Unchanged policies:**
- `ALL` (INSERT/UPDATE/DELETE) → service_role only (write operations bypass RLS)
- Reference tables (`towers`, `floors`, `rv_units`, `salespeople`, `unit_status_log`) → public SELECT

Notable role-specific policies:
- `salesperson_project_assignments`: Salespeople can only SELECT their own assignments
- `system_settings`: Only `master` and `torredecontrol` can UPDATE

#### Layer 6: Client-Side UI Filtering (UX-Level)
**Files:** `src/components/nav-bar.tsx`, various `*-client.tsx` components

The weakest layer (easily bypassed via browser dev tools), but important for user experience:
- NavBar hides links based on role
- `readOnly` prop hides edit controls for ventas users on shared pages
- API responses for dual-auth routes omit sensitive fields when the caller is a salesperson

---

## 3. Role-by-Role Detailed Profiles

### 3.1 Master (Super Administrador)

**Who:** Jorge (system owner/developer), possibly one additional trusted admin.

**Authentication:** Email/password login. `app_metadata.role = "master"`. May also match `SUPERUSER_EMAILS` env var.

**What they can access:**
- Every page in the application without restriction
- Every API route
- All database records (no ownership scoping)
- System settings (auto-approval toggle)
- Commission rate management (`/admin/roles`)
- Ejecutivo rate confirmation (`ejecutivo_rate_confirmed` workflow)
- User provisioning (`/admin/asesores` — invite, project assignment)

**What they see:**
- Full analytics dashboard (`/`) with all tabs: Resumen, Pagos, Flujo de Caja, Comisiones
- Treemaps (payment compliance, commission breakdown)
- Cash flow charts with projections
- Commission bars with ISR, disbursable/accumulated split
- All KPIs: total sales, commissions, payment compliance, delinquency
- Full reservation admin queue with all pending/confirmed/desisted/rejected
- TASA EV section with confirm button for ejecutivo rates
- All legal documents (PCV, Carta de Pago, Carta de Autorización) with edit capability
- User management panel with auth status, project assignments, invite flow
- HR Roles page for GC/Supervisor temporal assignments

**What they can do:**
- Confirm/reject/desist reservations
- Confirm ejecutivo commission rates (master-only action)
- Create/modify GC/Supervisor temporal assignments (master-only action)
- Toggle auto-approval on/off
- Create salespeople accounts and send invite links
- Assign salespeople to projects (temporal start/end dates)
- Send password reset links
- Generate and view all PDF documents (PCV, letters)
- Release frozen units
- Mark sales as cancelled (desistimientos)
- Manage referrals, price history, buyer persona data
- CRUD operations on projects
- Export data (where available)

**NavBar links:** Dashboard, Projects, Desistimientos, Disponibilidad, Reservas, Operaciones, Cotizador, Integracion, Ventas, Referidos, Buyer Persona, Valorizacion, Cesion, Asesores, Roles, Auditoría

### 3.2 Torre de Control (Pati)

**Who:** Patricia — single-operator Control Tower for all commercial operations.

**Authentication:** Email/password login. `app_metadata.role = "torredecontrol"`.

**What they can access:**
- Same pages as master (middleware treats all non-ventas identically)
- Same API routes as master EXCEPT:
  - Cannot access `/api/admin/management-roles` CRUD (master-only)
  - Cannot confirm ejecutivo rates (master-only PATCH endpoint)
- Same database records (no ownership scoping)
- System settings read + write

**What they see:**
- Identical to master on all pages
- Full analytics dashboard with all tabs and KPIs
- Full reservation admin queue
- TASA EV section (can see rates, but the confirm button calls a master-only endpoint — would receive 403)
- All legal documents with edit capability
- User management panel (can invite salespeople, assign projects)

**What they can do:**
- Confirm/reject/desist reservations
- Toggle auto-approval
- Create salespeople accounts and send invite links
- Assign salespeople to projects
- Generate and view all PDF documents
- Release frozen units
- Mark sales as cancelled
- Manage referrals, price history, buyer persona data
- CRUD on projects
- **Cannot:** Confirm ejecutivo rates, manage GC/Supervisor assignments

**NavBar links:** Dashboard, Projects, Desistimientos, Disponibilidad, Reservas, Operaciones, Cotizador, Integracion, Ventas, Referidos, Buyer Persona, Valorizacion, Cesion, Asesores, Auditoría (**no "Roles" link** — master-only, updated 2026-03-19)

**Key observation:** Torre de Control and Master have near-identical access. The only differences are: (1) two master-only API endpoints (management-roles, ejecutivo-rate confirm) and (2) the "Roles" NavBar link is hidden for torredecontrol. ~~There is no dedicated "operations dashboard" optimized for Pati's workflow — she uses the same analytics dashboard as the system owner.~~ **Updated 2026-03-19:** `/admin/operaciones` provides a dedicated operations command center for Pati with work queues, KPI cards, and activity feed.

### 3.3 Ventas (Ejecutivo de Ventas)

**Who:** 32 salespeople in the field, primarily mobile users.

**Authentication:** Server-side OTP invite flow → password setup → email/password login. `app_metadata.role = "ventas"`. Linked to `salespeople` table via `user_id` FK.

**What they can access:**
- `/reservar` — New reservation form (filtered to assigned projects)
- `/ventas/portal/panel` — Personal dashboard
- `/ventas/portal/reservas` — Own reservations list
- `/ventas/portal/inventario` — Unit availability (assigned projects only)
- `/ventas/portal/clientes` — Own clients
- `/ventas/portal/rendimiento` — Personal performance KPIs
- `/ventas/portal/nueva-reserva` — Quick reservation entry
- `/ventas/dashboard/pcv/[id]` — Read-only PCV view (own reservations only)
- `/ventas/dashboard/carta-autorizacion/[id]` — Authorization letter (own only)
- `/ventas/dashboard/carta-pago/[id]` — Payment letter (own only)
- `/disponibilidad` — Availability board (all projects, public)
- `/cotizador` — Payment calculator (public)

**What they CANNOT access:**
- `/` — Main analytics dashboard
- `/admin/*` — Any admin page
- `/projects` — Project management
- `/desistimientos` — Cancellation management
- `/referidos` — Referral management
- `/valorizacion` — Price history
- `/buyer-persona` — Buyer persona dashboard
- `/integracion` — Integration pipeline
- `/ventas` — Sales velocity analytics (admin view)
- `/cesion` — Rights assignment

**What they see:**
- Inventory grid filtered to their assigned projects and towers
- Own reservation list with status indicators
- Own client database
- Personal commission/performance KPIs
- PDF documents in read-only mode (no save/upload/profile-edit buttons)
- Reservation detail with limited fields (no `salesperson` object, no `audit_log`, no `sale_rate`, no `monthly_context`)

**What they can do:**
- Submit new reservations (creates PENDING_REVIEW)
- Upload receipt photos (OCR extraction)
- Upload DPI photos (OCR extraction)
- View own reservation status and documents
- Download own PDFs (PCV, letters)
- Submit freeze requests (hold units without deposit)

**What they CANNOT do:**
- Approve/reject/desist any reservation
- View other salespeople's reservations or clients
- Access commission rate data
- Modify system settings
- Manage other users
- View analytics dashboards

**NavBar links:** Mis Reservas, Inventario, Clientes, Rendimiento, Disponibilidad, Cotizador

### 3.4 Marketing (Added 2026-03-24)

**Who:** Marketing team members managing lead source configuration.

**Authentication:** Email/password login. `app_metadata.role = "marketing"`.

**ROLE_LEVEL:** 25 (between inventario=20 and contabilidad=30).

**What they can access:**
- `/` — Main analytics dashboard (read-only, same as DATA_VIEWER_ROLES)
- `/admin/lead-sources` — Lead source management page (full CRUD)
- `/disponibilidad` — Availability board (public)
- `/cotizador` — Payment calculator (public)
- `/projects`, `/desistimientos`, `/ventas` — Analytics pages (read-only)

**What they CANNOT access:**
- `/admin/reservas` — Reservation admin
- `/admin/operaciones`, `/admin/asesores`, `/admin/roles`, `/admin/audit` — Other admin pages
- `/referidos`, `/valorizacion`, `/cesion`, `/buyer-persona`, `/integracion` — Admin-only pages
- `/reservar` — Reservation form (salesperson only)
- `/ventas/portal/*` — Salesperson portal

**What they can do:**
- View, create, update, delete lead sources (name, display_order, is_active)
- View analytics dashboard (all tabs available to DATA_VIEWER_ROLES)

**What they CANNOT do:**
- Manage reservations, salespeople, commissions, or any admin operations
- Access financial detail data beyond what DATA_VIEWER_ROLES allows

**NavBar links:** Dashboard, Projects, Desistimientos, Disponibilidad, Cotizador, Ventas, Créditos, Fuentes

**Enforcement layers:**
- Middleware: explicit marketing block — same blocklist as DATA_PAGE_ROLES with exception for `/admin/lead-sources`
- API: `requireRole(rolesFor("lead_sources", ...))` → `["master", "torredecontrol", "marketing"]`
- RLS: `lead_sources` table — INSERT/UPDATE/DELETE restricted to `jwt_role() IN ('master', 'torredecontrol', 'marketing')`
- NavBar: "Fuentes" link visible to `["master", "torredecontrol", "marketing"]`

### 3.5 Gerencia / Financiero / Contabilidad / Inventario (Inactive Roles)

**Who:** No users currently assigned to these roles.

**Current behavior if assigned (updated 2026-03-19):**

**gerencia / financiero / contabilidad** (DATA_PAGE_ROLES):
- Middleware: explicit routing — can access analytics pages (/, /projects, /desistimientos, /disponibilidad, /cotizador, /ventas); blocked from admin-only pages (/admin/*, /referidos, /valorizacion, /cesion, /buyer-persona, /integracion)
- API: passes `requireRole(DATA_VIEWER_ROLES)` → access to analytics, commissions, payments, commission-rates, projects (GET)
- API: fails `requireRole(ADMIN_ROLES)` → blocked from reservation admin operations, mutations
- NavBar: shows only links they have access to (Dashboard, Projects, Desistimientos, Disponibilidad, Cotizador, Ventas); admin-only links hidden
- Net effect: controlled, scoped read access to analytics data without admin capabilities

**inventario:**
- Middleware: unknown role → redirect to `/login`
- API: passes `requireAuth()` checks only
- NavBar: not rendered (redirected before page loads)
- Net effect: no page access until the role is explicitly implemented

~~**Implications:** These roles are effectively dead code.~~
**Updated:** gerencia/financiero/contabilidad now have well-defined, scoped behavior at middleware, NavBar, API, and field masking levels. inventario remains unimplemented (redirect to login).

**Field masking update (2026-03-20):** Analytics API routes now apply role-aware response shaping:
- **gerencia:** Sees project-level aggregates and compliance data. Individual commission amounts, ISR breakdowns, payment histories, and salesperson-amount pairings are hidden. Comisiones tab hidden in dashboard.
- **contabilidad:** Sees all amounts and ISR calculations. Salesperson names anonymized to "Beneficiario N" in commission views. Full payment compliance data.
- **financiero:** Full data access — no masking applied. Same as master/torredecontrol.

**These roles are now safe to activate for real users** — defense-in-depth across 6 layers: middleware routing, page auth guards, API route guards, field masking, RLS policies, and client UI filtering.

---

## 4. Page Access Matrix

### 4.1 Current Production Access (Updated 2026-03-19)

| Page | Route | Public | master | torredecontrol | marketing | ventas | gerencia/financiero/contabilidad |
|------|-------|--------|--------|----------------|-----------|--------|----------------------------------|
| Analytics Dashboard | `/` | — | Full | Full | Full (view-only) | Blocked (server-side redirect → `/ventas/dashboard`) | Full (view-only, API guards limit mutations) |
| Login | `/login` | Yes | → `/` (role-aware) | → `/` (role-aware) | → `/` (role-aware) | → `/ventas/dashboard` (role-aware) | → `/` (role-aware) |
| Password Setup | `/auth/set-password` | — | N/A | N/A | N/A | Required | N/A |
| Inventory Grid | `/reservar` | — | Full | Full | Blocked | Own projects | Blocked (admin-only page) |
| Admin Reservations | `/admin/reservas` | — | Full | Full | Blocked | Blocked | Blocked (admin-only page) |
| Lead Sources Mgmt | `/admin/lead-sources` | — | RW | RW | **RW** | Blocked | Blocked (admin-only page) |
| PCV Editor | `/admin/reservas/pcv/[id]` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Carta de Pago | `/admin/reservas/carta-pago/[id]` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Carta de Autorización | `/admin/reservas/carta-autorizacion/[id]` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Availability Board | `/disponibilidad` | Yes | Full | Full | Full | Full | Full |
| Projects | `/projects` | — | RW | RW | Full (view) | Blocked | Full (view; API limits mutations) |
| Desistimientos | `/desistimientos` | — | RW | RW | Full (view) | Blocked | Full (view-only) |
| Referidos | `/referidos` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Valorización | `/valorizacion` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Buyer Persona | `/buyer-persona` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Cotizador | `/cotizador` | Yes | Full | Full | Full | Full | Full |
| Integración | `/integracion` | — | Full | Full | Blocked | Blocked | Blocked (admin-only page) |
| Sales Velocity | `/ventas` | — | Full | Full | Full (view) | Blocked | Full (view-only) |
| Cesión | `/cesion` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Salesperson Mgmt | `/admin/asesores` | — | RW | RW | Blocked | Blocked | Blocked (admin-only page) |
| Operations | `/admin/operaciones` | — | Full | Full | Blocked | Blocked | Blocked (admin-only page) |
| Audit Log | `/admin/audit` | — | Full | Full | Blocked | Blocked | Blocked (admin-only page) |
| HR Roles | `/admin/roles` | — | RW | Blocked (API) | Blocked | Blocked | Blocked (admin-only page) |
| Ventas Portal | `/ventas/portal/*` | — | Redirect‡ | Redirect‡ | Redirect‡ | Full | Redirect‡ |
| Ventas PCV (RO) | `/ventas/dashboard/pcv/[id]` | — | Full | Full | Full | Own only | Full |

‡ Non-ventas users are not redirected — they could access `/ventas/portal/*` pages, but the content depends on `requireSalesperson()` API calls which would fail

**Note:** `inventario` role → redirect to `/login` (not shown in table — no page access)

**Updated 2026-03-20:** The analytics dashboard (`/`) now has a **server-side auth guard** (Layer 2). Previously, if middleware failed to redirect a ventas user, the full admin dashboard would render. Now `src/app/page.tsx` is an async Server Component that checks the user's role before rendering — ventas users are redirected to `/ventas/dashboard`, unauthenticated users to `/login`, and only `DATA_VIEWER_ROLES` see the dashboard. The login page (`/login`) also uses role-aware server-side redirects. Client-side auth flows (`login-form.tsx`, `set-password/page.tsx`) use `window.location.href` instead of `router.replace()` to force middleware evaluation on a fresh server request.

### 4.2 Ventas Portal Pages (Detail)

| Page | Route | Purpose | Data Source |
|------|-------|---------|-------------|
| Panel | `/ventas/portal/panel` | Home dashboard with KPI cards | `GET /api/reservas/ventas/reservations` |
| Reservas | `/ventas/portal/reservas` | Own reservation list with filters | `GET /api/reservas/ventas/reservations` |
| Inventario | `/ventas/portal/inventario` | Unit availability for assigned projects | `GET /api/reservas/units` (project-filtered) |
| Clientes | `/ventas/portal/clientes` | Own client database | `GET /api/reservas/ventas/clients` |
| Rendimiento | `/ventas/portal/rendimiento` | Personal commission and velocity KPIs | `GET /api/reservas/ventas/reservations` |
| Nueva Reserva | `/ventas/portal/nueva-reserva` | Quick reservation entry | Same as `/reservar` flow |

---

## 5. API Route Authorization Matrix

### 5.1 By Guard Type

#### ~~No Auth Required (Public)~~ OCR Endpoints — Now Secured (changelog 074)

~~**Security observation:** These OCR endpoints are fully public. Any unauthenticated caller can submit images for processing, consuming Claude API credits. There is no rate limiting visible in the codebase.~~

**Updated 2026-03-19:** Both OCR endpoints now require `requireAuth()` + in-memory rate limiting (20 req/hour/user). Returns HTTP 429 when exceeded.

| Route | Method | Auth | Rate Limit |
|-------|--------|------|------------|
| `/api/reservas/dpi-ocr` | POST | `requireAuth()` | 20/hr/user |
| `/api/reservas/ocr` | POST | `requireAuth()` | 20/hr/user |

#### Any Authenticated User (`requireAuth()`) — Updated 2026-03-19
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/me` | GET | User identity |
| `/api/auth/session` | GET | Session info |
| `/api/auth/confirm-password-set` | POST | Mark password as set |
| `/api/sales` | GET | Sales data (read-only) |
| `/api/payments` | GET | Payment records (read-only) |
| `/api/reservas/units` | GET | Unit inventory |
| `/api/reservas/salespeople` | GET | Salespeople list |
| `/api/reservas/projects` | GET | Project list |
| `/api/reservas/reservations` | GET | Reservations list |
| `/api/reservas/freeze-requests` | POST | Freeze requests |
| `/api/reservas/ventas` | GET | Sales velocity data |

~~**Security observation:** Many operational API routes (commission data, payment data, sales, projects CRUD) only require `requireAuth()`. Any authenticated user — including ventas — could call these endpoints directly.~~

**Updated 2026-03-19 (changelog 074):** Analytics, commission, and mutation routes upgraded to `requireRole()`. Only self-info, read-only reference data, and freeze requests remain at `requireAuth()` level.

#### Data Viewer Roles (`requireRole(DATA_VIEWER_ROLES)`) — New 2026-03-19
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analytics/commissions` | GET | Commission analytics |
| `/api/analytics/payments` | GET | Payment analytics |
| `/api/analytics/payment-compliance` | GET | Payment compliance |
| `/api/analytics/cash-flow-forecast` | GET | Cash flow forecast |
| `/api/commissions` | GET | Commission data |
| `/api/commission-rates` | GET | Commission rates |
| `/api/commission-phases` | GET | Commission phases |
| `/api/projects` | GET | Project list + details |

#### Master + TorreDeControl (`requireRole(ADMIN_ROLES)`) — Updated 2026-03-19
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/salespeople` | GET | List salespeople |
| `/api/admin/salespeople/invite` | POST | Create invite |
| `/api/admin/salespeople/projects` | POST | Project assignment |
| `/api/admin/audit-log` | GET | Audit events (filter + pagination) |
| `/api/admin/send-password-link` | POST | Password reset link |
| `/api/reservas/admin/settings` | GET/PATCH | System settings |
| `/api/reservas/admin/reservations/[id]` | PATCH/DELETE | Update/delete reservation |
| `/api/reservas/admin/reservations/[id]/confirm` | PATCH | Confirm reservation |
| `/api/reservas/admin/reservations/[id]/desist` | POST | Desist reservation |
| `/api/reservas/admin/reservations/[id]/reject` | POST | Reject reservation |
| `/api/reservas/admin/clients/[id]` | GET/PATCH | Manage clients |
| `/api/reservas/admin/reservation-clients/[id]` | PATCH | Update buyer role/ownership |
| `/api/reservas/admin/freeze-requests/[id]/release` | POST | Release frozen unit |
| `/api/sales` | POST, PATCH | Sales mutations |
| `/api/payments` | POST | Payment creation |
| `/api/projects` | POST, PATCH, DELETE | Project mutations |
| `/api/reservas/referidos` | GET, POST | Referrals |
| `/api/reservas/referidos/[id]` | PATCH, DELETE | Referral detail |
| `/api/reservas/valorizacion` | GET, POST | Price history |
| `/api/reservas/valorizacion/[id]` | PATCH, DELETE | Price history detail |
| `/api/reservas/cesion` | GET | Rights assignment |
| `/api/reservas/buyer-persona` | GET | Buyer persona dashboard |
| `/api/reservas/buyer-persona/[client_id]` | GET, PUT | Client profile |
| `/api/reservas/integracion` | GET | Integration pipeline |

#### Marketing + Admin (`requireRole(["master", "torredecontrol", "marketing"])`) — New 2026-03-24
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/lead-sources` | GET | List all lead sources (active + inactive) |
| `/api/admin/lead-sources` | POST | Create lead source |
| `/api/admin/lead-sources/[id]` | PATCH | Update lead source |
| `/api/admin/lead-sources/[id]` | DELETE | Delete lead source (if unused) |

#### Master Only (`requireRole(["master"])`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/management-roles` | GET/POST | GC/Supervisor assignments |
| `/api/admin/management-roles/[id]` | PATCH | Update assignment |

#### Master + Financiero (`requireRole(["master", "financiero"])`) — Updated 2026-03-19
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/reservas/admin/sales/[id]/ejecutivo-rate` | PATCH | Confirm ejecutivo rate (GAP-18 escalation) |

#### Dual-Auth (Admin OR Salesperson with ownership)
| Route | Method | Admin Access | Salesperson Access |
|-------|--------|--------------|-------------------|
| `/api/reservas/admin/reservations/[id]` | GET | All data | Own only, sensitive fields hidden |
| `/api/reservas/admin/pcv/[id]` | GET | All | Own reservation only |
| `/api/reservas/admin/pcv/[id]` | PATCH | All | Own reservation only |
| `/api/reservas/admin/carta-pago/[id]` | GET | All | Own reservation only |
| `/api/reservas/admin/carta-autorizacion/[id]` | GET | All | Own reservation only |

**Dual-auth field masking:** When a salesperson accesses `GET /api/reservas/admin/reservations/[id]`, the response omits:
- `salesperson` object (the salesperson's own record)
- `audit_log` (admin operational history)
- `sale_rate` (ejecutivo commission rate)
- `monthly_context` (monthly sales context for rate decisions)

#### Salesperson Only (`requireSalesperson()`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/reservas/ventas/reservations` | GET | Own reservations |
| `/api/reservas/ventas/clients` | GET | Own clients |

#### Salesperson or Admin (flexible)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/reservas/reservations` | GET | List reservations (filtered by assignment for salespeople) |
| `/api/reservas/reservations` | POST | Submit new reservation |
| `/api/reservas/me` | GET | Current user's context (projects, towers) |
| `/api/reservas/units` | GET | Unit inventory |
| `/api/reservas/projects` | GET | Project list |
| `/api/reservas/salespeople` | GET | Salespeople list |

---

## 6. Database-Level Access Control (RLS)

### 6.1 RLS Policy Summary by Table (Updated 2026-03-19)

| Table | SELECT Policy | INSERT Policy | UPDATE/DELETE Policy |
|-------|--------------|---------------|---------------------|
| `towers` | Anyone (true) | Service role | Service role |
| `floors` | Anyone (true) | Service role | Service role |
| `rv_units` | Anyone (true) | Service role | Service role |
| `salespeople` | Anyone (true) | Service role | Service role |
| `rv_clients` | **Ownership-scoped** (ventas=own, others=all) | Service role | Service role |
| `reservations` | **Ownership-scoped** (ventas=own, others=all) | **Authenticated** | Service role |
| `reservation_clients` | **Ownership-scoped** (ventas=own, others=all) | **Authenticated** | Service role |
| `receipt_extractions` | **Ownership-scoped** (ventas=own, others=all) | Service role | Service role |
| `unit_status_log` | Anyone (true) | Service role | — (append-only) |
| `freeze_requests` | Authenticated | Anyone (true) | Service role |
| `rv_referrals` | Authenticated | Service role | Service role |
| `rv_price_history` | Authenticated | Service role | Service role |
| `rv_client_profiles` | Authenticated | Service role | Service role |
| `system_settings` | Authenticated | — | master/torredecontrol |
| `salesperson_project_assignments` | Own assignments (salespeople) + admin roles | Service role | Admin roles |
| `audit_events` | Admin only (master/torredecontrol via `jwt_role()`) | Service role | — (append-only, no UPDATE/DELETE) |
| `salesperson_periods` | Service role | Service role | Service role |
| `lead_sources` | Authenticated (all) | marketing/master/torredecontrol | marketing/master/torredecontrol |

### 6.2 Notable RLS Observations (Updated 2026-03-19)

1. ~~**Most INSERT policies are wide open.**~~ **INSERT policies tightened (migration 040).** `reservations` and `reservation_clients` INSERT changed from `TO public` to `TO authenticated`. `freeze_requests` INSERT remains `TO public` (unchanged).

2. ~~**No role-specific SELECT policies.**~~ **Ownership-scoped SELECT policies added (migration 040).** Four tables (`reservations`, `rv_clients`, `reservation_clients`, `receipt_extractions`) now have CASE-based policies using `jwt_role()`: ventas users see only rows linked to their `salespeople.user_id`, non-ventas roles see all rows. Defense-in-depth alongside API-layer filters.

3. **Service role dominance.** All write operations go through the service_role key, bypassing RLS entirely. The RLS policies primarily protect against direct browser-to-Supabase connections (which the app doesn't use for writes).

4. **Views have no RLS.** PostgreSQL views don't support RLS directly. The views (`v_rv_units_full`, `v_reservations_pending`, etc.) are readable by anyone who can query the view. Access control for view data is at the API layer only.

5. **`jwt_role()` helper function (new, migration 040).** Reusable SQL function: `public.jwt_role()` extracts role from `current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'`. Used by all 4 ownership-scoped policies.

---

## 7. Navigation & UI Filtering

### 7.1 NavBar (`src/components/nav-bar.tsx`) — Updated 2026-03-19

The NavBar fetches the user's role from `app_metadata` on mount and conditionally renders link sets. **Updated to use role-filtered links** — each non-ventas link is tagged with a `roles` array, and links are filtered by the user's actual role at render time. Orphaned dividers (leading, trailing, consecutive) are cleaned up automatically.

**master links:**
```
Dashboard | Projects | Desistimientos | Disponibilidad | Reservas | Operaciones |
Cotizador | Integracion | Ventas | Referidos | Buyer Persona | Valorizacion |
Cesion | Asesores | Roles | Auditoría
```

**torredecontrol links:**
```
Dashboard | Projects | Desistimientos | Disponibilidad | Reservas | Operaciones |
Cotizador | Integracion | Ventas | Referidos | Buyer Persona | Valorizacion |
Cesion | Asesores | Auditoría
```
(No "Roles" link — master-only)

**marketing links:**
```
Dashboard | Projects | Desistimientos | Disponibilidad | Cotizador | Ventas | Créditos | Fuentes
```
(Same as data viewer roles + Fuentes link for lead source management)

**gerencia / financiero / contabilidad links:**
```
Dashboard | Projects | Desistimientos | Disponibilidad | Cotizador | Ventas | Créditos
```
(No admin-only links: Reservas, Integracion, Referidos, Buyer Persona, Valorizacion, Cesion, Asesores, Roles are hidden)

**Ventas links (role === 'ventas'):**
```
Mis Reservas | Inventario | Clientes | Rendimiento | Disponibilidad | Cotizador
```

~~**Key observation:** The NavBar has exactly two states — admin and ventas. There is no differentiation between master and torredecontrol, or between any of the inactive roles. A `financiero` user would see the full admin NavBar, including links to pages like Roles and Asesores where the underlying APIs would reject their requests.~~

**Updated:** NavBar now has per-role link filtering. Each link specifies which roles can see it via a `roles` array. Users only see links to pages they can actually access.

### 7.2 Component-Level Visibility

**PCV documents:** Shared component with `readOnly` prop. When `readOnly = true` (ventas path):
- Save button hidden
- Upload button hidden
- Profile edit form hidden
- Download button shown

**Reservation detail (dual-auth routes):** When requester is salesperson:
- `salesperson` field omitted from response
- `audit_log` omitted
- `sale_rate` omitted
- `monthly_context` omitted

**TASA EV section:** Visible in reservation detail for admin users. Shows:
- Current ejecutivo rate status (confirmed/pending/unassigned)
- Monthly sales context (Ventas del asesor — month, year + count, per-sale details)
- Confirm button (calls master-only endpoint)

### 7.3 Auto-Approval Toggle

Visible in admin reservations header. Only functional for master/torredecontrol (PATCH endpoint checks role). When toggled ON:
- New reservations skip PENDING_REVIEW → auto-confirm via `auto_confirm_reservation()` RPC
- Uses `'system:auto-approval'` as `changed_by` identifier in audit trail

---

## 8. Data Visibility Rules

### 8.1 What Each Role Sees (Data Level)

| Data Category | master | torredecontrol | ventas |
|---------------|--------|----------------|--------|
| **All reservations** | Yes | Yes | Own only |
| **All clients** | Yes | Yes | Own only |
| **All sales data** | Yes | Yes | Own (via API filter)* |
| **Commission rates** | Yes | Yes | API accessible† |
| **Commission amounts** | Yes | Yes | Own (rendimiento page) |
| **Ejecutivo rates** | Yes (+ confirm) | Yes (view) | Hidden in detail |
| **Monthly sales context** | Yes | Yes | Hidden in detail |
| **Audit logs** | Yes | Yes | Hidden in detail |
| **Unit inventory** | All projects | All projects | Assigned projects |
| **Salesperson list** | All + auth status | All + auth status | API accessible† |
| **System settings** | Read + write | Read + write | Not exposed |
| **GC/Supervisor assignments** | CRUD | View | Not exposed |

~~\* Ventas users cannot access sales data pages, but `GET /api/sales` only requires `requireAuth()` — a direct API call would succeed.~~
~~† These API routes require only `requireAuth()`, so ventas users could access them via direct API calls even though no UI exposes this data to them.~~

**Updated 2026-03-19:** Analytics, commission, and commission-rate routes now require `DATA_VIEWER_ROLES` — ventas users are blocked at the API level. Sales and payments GET remain `requireAuth()` but are filtered by RLS ownership policies for ventas users. Ejecutivo rates are hidden from ventas in dual-auth response + confirmed by master/financiero only.

**Updated 2026-03-20 (Phase 4 field masking):** Analytics API responses are now role-shaped:

| Data Category | master/torredecontrol | financiero | contabilidad | gerencia |
|---------------|----------------------|------------|--------------|----------|
| Project-level aggregates | Full | Full | Full | Full |
| Client names (display) | Full | Full | Full | Full |
| Individual commission amounts per recipient | Full | Full | Full | **Hidden** |
| ISR calculations | Full | Full | Full | **Hidden** |
| Salesperson name + amount pairing | Full | Full | **Anonymized** | **Hidden** |
| Payment delinquency per unit | Full | Full | Full | Full |
| Payment history per unit | Full | Full | Full | **Hidden** |
| Disbursable/non-disbursable split | Full | Full | Full | **Hidden** |
| Dashboard Comisiones tab | Visible | Visible | Visible | **Hidden** |

### 8.2 Project Scoping

**Admin users:** See all 4 projects (BLT, CE, B5, BEN) in all views. Filter dropdowns include all options.

**Ventas users:** `GET /api/reservas/me` returns only projects the salesperson is assigned to (via `salesperson_project_assignments` where `end_date IS NULL`). The inventory grid, reservation form, and client list are filtered accordingly.

**Observation:** Project scoping for ventas is implemented at the API level (query filters based on `salesperson_id` → `salesperson_project_assignments`), not at the database level. RLS does not enforce project scoping.

---

## 9. Action Authorization

### 9.1 CRUD by Role

| Action | master | torredecontrol | ventas |
|--------|--------|----------------|--------|
| **Create reservation** | Yes | Yes | Yes (own projects) |
| **Read reservation** | All | All | Own only |
| **Update reservation** | Yes | Yes | No |
| **Delete reservation** | Yes | Yes | No |
| **Confirm reservation** | Yes | Yes | No |
| **Reject reservation** | Yes | Yes | No |
| **Desist reservation** | Yes | Yes | No |
| **Confirm ejecutivo rate** | Yes | No | No |
| **Manage GC/Supervisor** | Yes | No | No |
| **Toggle auto-approval** | Yes | Yes | No |
| **Invite salesperson** | Yes | Yes | No |
| **Assign project** | Yes | Yes | No |
| **Generate PCV** | Yes | Yes | No |
| **Download PCV** | All | All | Own only |
| **Manage referrals** | Yes | Yes | No |
| **Manage price history** | Yes | Yes | No |
| **Manage buyer persona** | Yes | Yes | No |
| **Release freeze** | Yes | Yes | No |
| **Submit freeze** | Yes | Yes | Yes |
| **Upload receipt** | Yes | Yes | Yes |
| **Upload DPI** | Yes | Yes | Yes |

~~\* These APIs use `requireAuth()` only — ventas could technically call them directly.~~
**Updated 2026-03-19:** All admin mutation routes now use `requireRole(ADMIN_ROLES)`. Ventas users are blocked at the API level.

### 9.2 Approval Workflows

The system has two explicit approval workflows:

1. **Reservation confirmation:**
   - Maker: Salesperson (creates PENDING_REVIEW)
   - Checker: Torre de Control or Master (confirms/rejects)
   - Auto-path: System auto-confirms when `auto_approval_enabled = true`

2. **Ejecutivo rate confirmation:**
   - Maker: System (backfills rate from policy-period model)
   - Checker: Master only (confirms per-unit rate)
   - No auto-path

There is no approval workflow for:
- Desistimientos (single-step: admin desists directly)
- PCV generation (single-step: admin generates directly)
- System settings changes (single-step: admin toggles directly)
- User provisioning (single-step: admin invites directly)

---

## 10. Foreseeable Role Needs

Based on `docs/remaining-features.md` and the current roadmap:

### 10.1 CFO/Finance Role (Priority: High)
Items #12 (auto-create sales on confirmation), #14 (enganche payment tracking), #17 (Odoo integration), #18 (payment matching), and #27 (commission automation) all require a finance-focused role that can:
- View all commission data with ISR detail
- Confirm commission rates and disbursement amounts
- Access payment reconciliation tools
- View cash flow projections with edit capability
- Export financial data for accounting systems

The `financiero` role exists in the type definition but has zero implementation.

### 10.2 Sales Manager / Gerencia Role (Priority: Medium)
Items #26 (competitive analysis) and the general need for team-level oversight require:
- View team members' reservations and performance
- Access aggregated team KPIs
- Cannot modify individual transactions
- View (not edit) commission rates

The `gerencia` role exists but has zero implementation.

### 10.3 Inventory Manager Role (Priority: Low)
Items #22 (bulk unfreezing), #23 (parking assignment), and #25 (pricing rules engine) suggest:
- Manage unit status bulk operations
- Configure per-project pricing rules
- Manage parking assignments
- Cannot access financial data

The `inventario` role exists but has zero implementation.

### 10.4 Role-Based Project Scoping (Item #30)
Currently all admin users see all projects. The remaining features list explicitly identifies "role-based access per project" as a gap. This would require:
- Project assignment for admin roles (not just ventas)
- API-level filtering for admin queries based on project assignments
- Dashboard filtering to show only assigned projects

### 10.5 Audit & Compliance Role (Not Yet Defined)
As the system grows, an audit role that can:
- View all data read-only
- Access complete audit trails
- Export compliance reports
- Cannot modify any data

This does not exist even as a type definition.
