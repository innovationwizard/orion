# Orion — Current App Roles: Unabridged Description

**Date:** 2026-03-19
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

The system defines seven roles in `src/lib/auth.ts`:

```typescript
type Role = "master" | "gerencia" | "financiero" | "contabilidad" | "ventas" | "inventario" | "torredecontrol"
```

**Actively used in production (as of 2026-03-19):**

| Role | Human Label | Description | Active Users |
|------|-------------|-------------|--------------|
| `master` | Super Administrador | Full system access, no restrictions | ~1-2 (Jorge, superuser) |
| `torredecontrol` | Torre de Control | Operational admin, manages day-to-day commercial flow | 1 (Pati) |
| `ventas` | Ejecutivo de Ventas | Salesperson, restricted to own data and assigned projects | 32 (field sales team) |

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

### 2.2 Four Layers of Enforcement

Role enforcement operates as a defense-in-depth model with four layers:

#### Layer 1: Middleware (Request-Level)
**File:** `middleware.ts`

The sole routing enforcer. Intercepts every HTTP request before it reaches a page or API route.

| Condition | Behavior |
|-----------|----------|
| Unauthenticated user hits protected route | Redirect → `/login` |
| Authenticated user hits `/login` | Redirect → `/` |
| `ventas` role user without `password_set = true` | Redirect → `/auth/set-password` |
| `ventas` role user hits any non-allowed route | Redirect → `/ventas/dashboard` |
| `ventas` role user hits allowed route | Allow through |
| Non-ventas role user hits any route | Allow through (no restrictions) |

**Ventas-allowed routes:**
- `/reservar`
- `/ventas/*`
- `/disponibilidad`
- `/cotizador`
- `/auth/*`
- `/login`

**Public routes (no auth required):**
- `/disponibilidad`
- `/cotizador`
- `/login`
- `/auth/*`

**Key observation:** Middleware only distinguishes between `ventas` and `not-ventas`. There is no middleware-level distinction between `master`, `torredecontrol`, `gerencia`, `financiero`, `contabilidad`, or `inventario`. All non-ventas roles receive identical routing treatment.

#### Layer 2: API Route Guards (Function-Level)
**File:** `src/lib/auth.ts`

Each API route handler explicitly calls one of:

| Guard Function | Behavior |
|----------------|----------|
| `requireAuth()` | Any authenticated user passes |
| `requireRole(roles)` | User must have one of the specified roles (or be superuser) |
| `requireSuperuser()` | User must be superuser (email in env var or master role) |
| `requireSalesperson()` | User must be linked to an active `salespeople` record |

API routes combine these guards to implement role-specific access. The dual-auth pattern (try admin first, fall back to salesperson with ownership check) is used for document routes (PCV, Carta de Pago, Carta de Autorización).

#### Layer 3: Row-Level Security (Database-Level)
**Supabase RLS policies on PostgreSQL tables**

RLS policies are the final enforcement boundary. Even if a bug in middleware or API code allows an unauthorized request through, RLS policies prevent data access at the database level.

Most reservation system tables use a simple two-policy model:
- `SELECT` → all authenticated users (or public for reference tables)
- `ALL` (INSERT/UPDATE/DELETE) → service_role only

This means **the application server always uses the service_role key for write operations**, bypassing RLS. The RLS policies primarily protect against direct Supabase client access from the browser.

Notable exceptions:
- `salesperson_project_assignments`: Salespeople can only SELECT their own assignments
- `system_settings`: Only `master` and `torredecontrol` can UPDATE

#### Layer 4: Client-Side UI Filtering (UX-Level)
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

**NavBar links:** Dashboard, Projects, Desistimientos, Disponibilidad, Reservas, Cotizador, Integracion, Ventas, Referidos, Buyer Persona, Valorizacion, Cesion, Asesores, Roles

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

**NavBar links:** Same as master (no difference in NavBar filtering)

**Key observation:** Torre de Control and Master have near-identical access. The only difference is two master-only API endpoints. The NavBar, middleware, and page-level access are identical. There is no dedicated "operations dashboard" optimized for Pati's workflow — she uses the same analytics dashboard as the system owner.

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

### 3.4 Gerencia / Financiero / Contabilidad / Inventario (Inactive Roles)

**Who:** No users currently assigned to these roles.

**Current behavior if assigned:**
- Middleware would treat them as non-ventas → full page access (same as master/torredecontrol)
- API routes checking for `master` or `torredecontrol` would return 403
- API routes with only `requireAuth()` would succeed
- NavBar would show admin links (role !== 'ventas' branch)
- Net effect: they could VIEW the analytics dashboard but could NOT manage reservations, confirm rates, or modify settings

**Implications:** These roles are effectively dead code. A user with `role = "financiero"` would see the same NavBar as master but get 403 errors on most admin operations. This would be confusing and potentially expose data they should not see (analytics, commission details) without granting them any operational capability.

---

## 4. Page Access Matrix

### 4.1 Current Production Access

| Page | Route | Public | master | torredecontrol | ventas | gerencia* | financiero* |
|------|-------|--------|--------|----------------|--------|-----------|-------------|
| Analytics Dashboard | `/` | — | Full | Full | Blocked | **Full†** | **Full†** |
| Login | `/login` | Yes | Redirect | Redirect | Redirect | Redirect | Redirect |
| Password Setup | `/auth/set-password` | — | N/A | N/A | Required | N/A | N/A |
| Inventory Grid | `/reservar` | — | Full | Full | Own projects | **Full†** | **Full†** |
| Admin Reservations | `/admin/reservas` | — | Full | Full | Blocked | **Full†** | **Full†** |
| PCV Editor | `/admin/reservas/pcv/[id]` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Carta de Pago | `/admin/reservas/carta-pago/[id]` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Carta de Autorización | `/admin/reservas/carta-autorizacion/[id]` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Availability Board | `/disponibilidad` | Yes | Full | Full | Full | Full | Full |
| Projects | `/projects` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Desistimientos | `/desistimientos` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Referidos | `/referidos` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Valorización | `/valorizacion` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Buyer Persona | `/buyer-persona` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Cotizador | `/cotizador` | Yes | Full | Full | Full | Full | Full |
| Integración | `/integracion` | — | Full | Full | Blocked | **Full†** | **Full†** |
| Sales Velocity | `/ventas` | — | Full | Full | Blocked | **Full†** | **Full†** |
| Cesión | `/cesion` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Salesperson Mgmt | `/admin/asesores` | — | RW | RW | Blocked | **RW†** | **RW†** |
| HR Roles | `/admin/roles` | — | RW | RW | Blocked | **RW†** | **RW†** |
| Ventas Portal | `/ventas/portal/*` | — | Redirect‡ | Redirect‡ | Full | Redirect‡ | Redirect‡ |
| Ventas PCV (RO) | `/ventas/dashboard/pcv/[id]` | — | Full | Full | Own only | **Full†** | **Full†** |

\* Roles defined but not actively enforced
† Would see the page but API calls would fail with 403 on admin operations
‡ Non-ventas users are not redirected — they could access `/ventas/portal/*` pages, but the content depends on `requireSalesperson()` API calls which would fail

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

#### No Auth Required (Public)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/reservas/dpi-ocr` | POST | Claude Vision OCR for DPI images |
| `/api/reservas/ocr` | POST | Claude Vision OCR for receipt images |

**Security observation:** These OCR endpoints are fully public. Any unauthenticated caller can submit images for processing, consuming Claude API credits. There is no rate limiting visible in the codebase.

#### Any Authenticated User (`requireAuth()`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/me` | GET | User identity |
| `/api/auth/session` | GET | Session info |
| `/api/auth/confirm-password-set` | POST | Mark password as set |
| `/api/commissions` | GET | Commission data |
| `/api/payments` | GET/POST | Payment records |
| `/api/sales` | GET/PATCH | Sales data, cancellation |
| `/api/commission-rates` | GET | Commission rates |
| `/api/projects` | GET/POST/PATCH/DELETE | Project CRUD |
| `/api/analytics/commissions` | GET | Commission analytics |
| `/api/analytics/payments` | GET | Payment analytics |
| `/api/analytics/cash-flow-forecast` | GET | Cash flow forecast |
| `/api/analytics/payment-compliance` | GET | Payment compliance |
| `/api/commission-phases` | GET | Commission phases |
| `/api/reservas/buyer-persona/[client_id]` | GET/POST/PATCH | Client profile |
| `/api/reservas/referidos` | GET/POST | Referrals |
| `/api/reservas/referidos/[id]` | GET/PATCH/DELETE | Referral detail |
| `/api/reservas/valorizacion` | GET/POST | Price history |
| `/api/reservas/valorizacion/[id]` | GET/PATCH/DELETE | Price history detail |
| `/api/reservas/freeze-requests` | GET/POST | Freeze requests |
| `/api/reservas/cesion` | POST | Rights assignment |

**Security observation:** Many operational API routes (commission data, payment data, sales, projects CRUD) only require `requireAuth()`. Any authenticated user — including ventas — could call these endpoints directly (bypassing middleware UI restrictions) and receive data. The middleware blocks page access but does not block direct API calls from authenticated ventas users.

#### Master + TorreDeControl (`requireRole(["master", "torredecontrol"])`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/salespeople` | GET | List salespeople |
| `/api/admin/salespeople/invite` | POST | Create invite |
| `/api/admin/salespeople/projects` | POST | Project assignment |
| `/api/admin/send-password-link` | POST | Password reset link |
| `/api/reservas/admin/settings` | GET/PATCH | System settings |
| `/api/reservas/admin/reservations/[id]` | PATCH/DELETE | Update/delete reservation |
| `/api/reservas/admin/reservations/[id]/confirm` | PATCH | Confirm reservation |
| `/api/reservas/admin/reservations/[id]/desist` | POST | Desist reservation |
| `/api/reservas/admin/reservations/[id]/reject` | POST | Reject reservation |
| `/api/reservas/admin/clients/[id]` | GET/PATCH | Manage clients |
| `/api/reservas/admin/reservation-clients/[id]` | PATCH | Update buyer role/ownership |
| `/api/reservas/admin/freeze-requests/[id]/release` | POST | Release frozen unit |

#### Master Only (`requireRole(["master"])`)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/management-roles` | GET/POST | GC/Supervisor assignments |
| `/api/admin/management-roles/[id]` | PATCH | Update assignment |
| `/api/reservas/admin/sales/[id]/ejecutivo-rate` | PATCH | Confirm ejecutivo rate |

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

### 6.1 RLS Policy Summary by Table

| Table | SELECT Policy | INSERT Policy | UPDATE/DELETE Policy |
|-------|--------------|---------------|---------------------|
| `towers` | Anyone (true) | Service role | Service role |
| `floors` | Anyone (true) | Service role | Service role |
| `rv_units` | Anyone (true) | Service role | Service role |
| `salespeople` | Anyone (true) | Service role | Service role |
| `rv_clients` | Authenticated | Service role | Service role |
| `reservations` | Authenticated | Anyone (true) | Service role |
| `reservation_clients` | Authenticated | Anyone (true) | Service role |
| `receipt_extractions` | Authenticated | Service role | Service role |
| `unit_status_log` | Anyone (true) | Service role | — (append-only) |
| `freeze_requests` | Authenticated | Anyone (true) | Service role |
| `rv_referrals` | Authenticated | Service role | Service role |
| `rv_price_history` | Authenticated | Service role | Service role |
| `rv_client_profiles` | Authenticated | Service role | Service role |
| `system_settings` | Authenticated | — | master/torredecontrol |
| `salesperson_project_assignments` | Own assignments (salespeople) + admin roles | Service role | Admin roles |
| `salesperson_periods` | Service role | Service role | Service role |

### 6.2 Notable RLS Observations

1. **Most INSERT policies are wide open.** `reservations`, `reservation_clients`, and `freeze_requests` allow ANY user (even unauthenticated via PostgREST anon key) to insert. This is by design — the reservation form is submitted by salespeople who may have intermittent connectivity, and the system relies on application-layer validation.

2. **No role-specific SELECT policies.** Except for `salesperson_project_assignments` and `system_settings`, all SELECT policies are either "anyone" or "any authenticated user." There is no database-level enforcement of "ventas can only see their own reservations" — this is handled entirely at the API layer.

3. **Service role dominance.** All write operations go through the service_role key, bypassing RLS entirely. The RLS policies primarily protect against direct browser-to-Supabase connections (which the app doesn't use for writes).

4. **Views have no RLS.** PostgreSQL views don't support RLS directly. The views (`v_rv_units_full`, `v_reservations_pending`, etc.) are readable by anyone who can query the view. Access control for view data is at the API layer only.

---

## 7. Navigation & UI Filtering

### 7.1 NavBar (`src/components/nav-bar.tsx`)

The NavBar fetches the user's role from `app_metadata` on mount and conditionally renders link sets:

**Admin links (role !== 'ventas'):**
```
Dashboard | Projects | Desistimientos | Disponibilidad | Reservas | Cotizador |
Integracion | Ventas | Referidos | Buyer Persona | Valorizacion |
Cesion | Asesores | Roles
```

**Ventas links (role === 'ventas'):**
```
Mis Reservas | Inventario | Clientes | Rendimiento | Disponibilidad | Cotizador
```

**Key observation:** The NavBar has exactly two states — admin and ventas. There is no differentiation between master and torredecontrol, or between any of the inactive roles. A `financiero` user would see the full admin NavBar, including links to pages like Roles and Asesores where the underlying APIs would reject their requests.

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

\* Ventas users cannot access sales data pages, but `GET /api/sales` only requires `requireAuth()` — a direct API call would succeed.
† These API routes require only `requireAuth()`, so ventas users could access them via direct API calls even though no UI exposes this data to them.

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
| **Manage referrals** | Yes | Yes | No (API allows)* |
| **Manage price history** | Yes | Yes | No (API allows)* |
| **Manage buyer persona** | Yes | Yes | No (API allows)* |
| **Release freeze** | Yes | Yes | No |
| **Submit freeze** | Yes | Yes | Yes |
| **Upload receipt** | Yes | Yes | Yes |
| **Upload DPI** | Yes | Yes | Yes |

\* These APIs use `requireAuth()` only — ventas could technically call them directly.

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
