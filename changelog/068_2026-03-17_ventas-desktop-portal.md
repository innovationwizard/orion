# 068 — Ventas Desktop Portal

**Date:** 2026-03-17
**Author:** Jorge Luis Contreras Herrera
**Status:** Built, pending deployment
**Migration:** None (frontend-only + API auth change)

---

## Context

### The Problem

The `/reservar` WPA works as a mobile MVP for salespeople: inventory grid → form → OCR → submit. The existing `/ventas/dashboard` is a minimal "Mis Reservas" page showing 5 KPI counts, a table, and PDF buttons (Boulevard 5 only). Salespeople had no desktop-optimized experience for browsing inventory, viewing reservation details, tracking performance, or managing client profiles.

### The Solution

A complete desktop portal at `/ventas/portal` with 5 tabs (Panel, Inventario, Reservas, Rendimiento, Clientes) plus a desktop-adapted reservation form, providing salespeople with full visibility into their work without needing admin access.

---

## Architecture

### Route Structure

```
/ventas/portal/           → redirect to /panel
/ventas/portal/panel      → KPI dashboard + recent reservations + quick actions
/ventas/portal/inventario → full inventory grid (all statuses), realtime, filters
/ventas/portal/reservas   → reservation table + detail side panel
/ventas/portal/nueva-reserva → desktop reservation form (two-column layout)
/ventas/portal/rendimiento → performance metrics + monthly velocity chart
/ventas/portal/clientes   → client list + inline buyer persona editing
```

### Layout

Shared `layout.tsx` at `/ventas/portal/` provides:
- **Auth guard** via `useCurrentSalesperson()` — one call, shared via `VentasContext`
- **Top tab bar** — horizontal tabs below the main NavBar
- **`VentasProvider`** — React context exposing `salesperson` and `projects` to all sub-pages

```
┌─────────────────────────────────────────────┐
│  NavBar (existing)                          │
├─────────────────────────────────────────────┤
│  [Panel] [Inventario] [Reservas] [Rend.] [Clientes] │
├─────────────────────────────────────────────┤
│           [Tab Content Area]                │
└─────────────────────────────────────────────┘
```

### Data Isolation

All data is scoped to the authenticated salesperson:
- Reservations: `GET /api/reservas/ventas/reservations` (existing, filtered by `salesperson_id`)
- Reservation detail: `GET /api/reservas/admin/reservations/[id]` (now dual-auth with ownership check)
- Clients: `GET /api/reservas/ventas/clients` (new, joins through `reservation_clients` → `reservations` filtered by `salesperson_id`)
- Inventory: `GET /api/reservas/units` (public, all statuses visible — but non-available units show view-only detail without salesperson name)

---

## Features (Verbose)

### 1. Panel Tab (`/ventas/portal/panel`)

**Purpose:** At-a-glance dashboard for the salesperson.

**KPI Cards (4):**
- **Total Reservas** — count of all reservations + 6-month sparkline trend
- **Confirmadas** — count + conversion rate percentage as hint
- **Pendientes** — count of PENDING_REVIEW
- **Desistidas** — count with negative indicator if > 0

**Recent Reservations List:**
- Shows the 5 most recent reservations sorted by `submitted_at` descending
- Table columns: Unidad, Proyecto, Cliente(s), Monto, Fecha, Estado
- Clickable rows → navigate to `/ventas/portal/reservas?selected={id}`
- "Ver todas (N)" link at bottom when more than 5 exist

**Quick Actions:**
- "+ Nueva Reserva" button → `/ventas/portal/nueva-reserva`
- "Ver Inventario" button → `/ventas/portal/inventario`

**Data source:** `GET /api/reservas/ventas/reservations` (existing)

---

### 2. Inventario Tab (`/ventas/portal/inventario`)

**Purpose:** Desktop inventory browser showing ALL units across all statuses with realtime updates.

**Filters:**
- **Project selector** — dropdown from `VentasContext.projects`
- **Tower selector** — appears when project has multiple towers
- **Status selector** — filter by AVAILABLE, SOFT_HOLD, RESERVED, FROZEN, SOLD
- **Search box** — filters by unit number, type, project name, tower name
- **URL sync** — filter state synced to URL query params via `history.replaceState`

**Summary Pills:**
- Count per status with colored dot (matches `UNIT_STATUS_COLORS`)
- Total unit count

**Grid Display:**
- Tower groups → floors descending → unit cells
- Each cell shows unit number + area, colored by status
- SOLD units at 60% opacity
- Realtime subscription via `useRealtimeUnits()` — live status updates

**Unit Click Behavior:**
- **AVAILABLE units** → opens `UnitDetailModal` with "Reservar" button → navigates to `/ventas/portal/nueva-reserva?unit={id}`
- **Non-available units** → opens `UnitDetailModal` in view-only mode showing unit info (number, type, area, price, status) with "Cotizar" button. **NO salesperson name displayed** (privacy/competitive concern per user requirement)

**Connection indicator:**
- Green dot "En vivo" when connected
- Amber "Reconectando..." when connecting
- Red when disconnected

**Data sources:** `useUnits()` hook → `GET /api/reservas/units` (public), `useRealtimeUnits()` for live updates

---

### 3. Reservas Tab (`/ventas/portal/reservas`)

**Purpose:** Full list of the salesperson's reservations with detail side panel.

**Filters:**
- **Status filter** — dropdown with counts: Todos (N), Pendientes (N), Confirmadas (N), Desistidas (N), Rechazadas (N)
- **Project filter** — dropdown (only shown if salesperson has multiple projects)

**Table:**
- Columns: Unidad, Proyecto, Cliente(s), Monto, Fecha, Estado, Documentos
- Sorted by `submitted_at` descending
- Status badges color-coded (amber=PENDING_REVIEW, green=CONFIRMED, gray=DESISTED, red=REJECTED)
- Selected row highlighted with `bg-primary/5`
- Documents column (Boulevard 5 + CONFIRMED only): PCV, Autorización, Pago buttons → open in new tab

**"+ Nueva Reserva" button** in the header

**Detail Side Panel (`VentasReservationDetail`):**
- Opens on row click, slides in from right (fixed, max-width 448px)
- **Read-only** adaptation of admin `ReservationDetail`
- Sections shown: Status badge + date, Unit info (number, project, tower, floor, type, price, status), Clients (read-only: name, role badge, ownership %, DPI, phone, email), Lead source, Deposit (amount, date, bank, depositor), Receipt + OCR data (image + extracted fields via `ReceiptViewer`), Documents (B5 only: Ver PCV, Carta de Autorización, Carta de Pago), Notes, Audit log (`AuditLog` component)
- Sections **omitted** (vs admin): Action buttons (Confirmar/Rechazar/Desistir), Salesperson section (redundant), Ejecutivo rate section (admin-only data), Client editing forms

**Data sources:**
- List: `GET /api/reservas/ventas/reservations` (existing)
- Detail: `GET /api/reservas/admin/reservations/[id]` (now with dual-auth)

---

### 4. Desktop Reservation Form (`/ventas/portal/nueva-reserva`)

**Purpose:** Desktop-adapted reservation creation with two-column layout, file picker, and unit selector.

**Unit Selection:**
- If `?unit={id}` query param present → pre-loads unit info, shows "Cambiar unidad" link
- If no param → shows unit picker: Project dropdown → Tower dropdown → Available units dropdown (showing unit number, type, bedrooms, price)
- Pre-loaded unit fetched from `GET /api/reservas/units` if not in current filter set

**Two-Column Layout (when unit selected):**
- **Left column (340px, sticky):** Unit info card — number, project, tower, type, area, price
- **Right column:** Full form

**Documents Section (side-by-side):**
- **DPI upload** — `DesktopFileInput` with drag-and-drop, file picker. On upload: auto-runs Claude Vision OCR via `POST /api/reservas/dpi-ocr`. Shows CUI extraction result (green badge) or error. Remove button to re-upload.
- **Receipt upload** — Same drag-and-drop component. On upload: auto-runs OCR via `POST /api/reservas/ocr`. Shows `ReceiptPreview` component with extracted amount, date, bank, reference, depositor, confidence. Auto-fills deposit fields from OCR.

**`DesktopFileInput` Component:**
- Dashed border drag-and-drop zone
- Accepts: JPG, PNG, WebP, HEIC, PDF (same as mobile)
- Max 10 MB file size validation
- Click to open file picker
- Visual drag-over feedback (border-primary, bg-primary/5)

**Client Data:** Same as mobile — multiple client names, add/remove co-buyers, phone field

**Deposit Data:** Amount (Q), Date, Bank (dropdown: 12 Guatemalan banks), Receipt type (dropdown: 6 types), Depositor name. Auto-populated from OCR when available.

**Lead Source:** Chip buttons — top 6 shown by default, "Ver todas (24)" expands full list

**Notes:** Optional textarea

**Draft Auto-save:** Text fields persisted to `localStorage` by unit ID (500ms debounce). Restored on form mount.

**Offline Support:** Uses `useOfflineQueue()` from `/reservar` — queues submission in localStorage when offline, auto-replays with exponential backoff.

**Submission Flow:**
1. Validates: ≥1 client name, DPI file, receipt file, CUI extracted
2. Compresses + uploads images: DPI → `dpi` bucket, receipt → `receipts` bucket
3. Enqueues `POST /api/reservas/reservations`
4. Shows `ConfirmationModal` (reused from `/reservar`) for review
5. Success screen with "Reservar otra unidad" and "Ver mis reservas" links

**Data sources:** `POST /api/reservas/reservations` (existing), `POST /api/reservas/ocr`, `POST /api/reservas/dpi-ocr`, Supabase Storage upload

---

### 5. Rendimiento Tab (`/ventas/portal/rendimiento`)

**Purpose:** Personal sales performance metrics computed client-side from the salesperson's reservation data.

**KPI Cards (4):**
- **Total Reservas** — count + 6-month sparkline trend
- **Tasa de Conversión** — `(confirmed / total) * 100`%, with hint "N confirmadas", green indicator when ≥70%
- **Tasa de Desistimiento** — `(desisted / total) * 100`%, with hint "N desistidas", red indicator when > 0
- **Pendientes** — count of PENDING_REVIEW, hint "en revisión" when > 0

**Monthly Velocity Chart (`VelocityChart`):**
- Side-by-side bar chart — 12 months
- Light primary bars = submitted, solid green bars = confirmed
- Labeled months (es-GT short month format)
- Legend at bottom

**Monthly Breakdown Table:**
- 12-month rolling window
- Columns: Mes, Enviadas, Confirmadas, Desistidas, Rechazadas, Neto (confirmed - desisted)
- Color-coded: confirmed=green, desisted=gray, rejected=red

**Data source:** All computed client-side from `GET /api/reservas/ventas/reservations` (no new API route needed)

---

### 6. Clientes Tab (`/ventas/portal/clientes`)

**Purpose:** View and edit buyer persona profiles for the salesperson's own clients.

**Header:** Client count + search box

**Client Table:**
- Columns: Nombre (with role badge), DPI, Teléfono, Unidad(es), Proyecto, Estado (reservation status badge), Perfil (completeness progress bar)
- **Deduplication:** Same client appearing in multiple reservations → merged row with multiple unit numbers
- **Search:** Filters by name, DPI, phone, email, unit number
- **Profile completeness:** Visual progress bar (green ≥75%, amber ≥50%, gray <50%) + percentage

**Expandable Inline Profile Editing:**
- Click row → expands to show `ClientProfileForm` (reused from admin)
- Form fields: Gender, Purchase type, Marital status, Children, Birth date, Education, Occupation, Industry, Department, Zone, Individual income, Family income, Acquisition channel
- Save via `PUT /api/reservas/buyer-persona/[client_id]` (existing, already supports salesperson auth)

**New API Route: `GET /api/reservas/ventas/clients`:**
- Auth: `requireSalesperson()` — 401/403 if not salesperson
- Query: Joins `reservation_clients` → `rv_clients` → `reservations` (filtered by `salesperson_id`), then enriches with `v_rv_units_full` (unit/project info) and `rv_client_profiles` (completeness)
- Profile completeness: 8 key fields checked (gender, birth_date, education_level, purchase_type, marital_status, occupation_type, department, acquisition_channel) → percentage

---

## API Changes

### Modified: `GET /api/reservas/admin/reservations/[id]`

**Before:** Admin-only via `requireRole(["master", "torredecontrol"])`

**After:** Dual-auth — admin OR salesperson with ownership check:
1. Try `requireRole(["master", "torredecontrol"])` → if success, proceed as admin
2. If not admin, try `requireSalesperson()` → if success, verify `reservation.salesperson_id === salesperson.id`
3. If neither → 401/403

**Response changes for salesperson callers:**
- `salesperson` field: `null` (redundant — it's the logged-in user)
- `sale_rate` field: `null` (ejecutivo rate is admin-only data)

### New: `GET /api/reservas/ventas/clients`

Returns all clients linked to the authenticated salesperson's reservations with profile completeness data. See Clientes tab section above.

---

## Other Changes

### NavBar (`src/components/nav-bar.tsx`)
- "Mi Panel" → renamed to "Mi Portal"
- href changed from `/ventas/dashboard` to `/ventas/portal`

### Old Dashboard Redirect (`src/app/ventas/dashboard/page.tsx`)
- Now redirects to `/ventas/portal/reservas` (backward compat for bookmarks)

### Service Worker (`public/sw.js`)
- Cache version bumped: `reservar-v2` → `reservar-v3`
- `/ventas/portal` added to `PRECACHE_URLS`

---

## Shared Context (`VentasContext`)

New React context at `src/lib/reservas/ventas-context.tsx`:
- `VentasProvider` wraps all portal sub-pages
- `useVentasContext()` hook returns `{ salesperson, projects }`
- Eliminates 5× redundant calls to `GET /api/reservas/me` (one call in layout, shared via context)

---

## Reused Components (no changes)

| Component | From | Used In |
|-----------|------|---------|
| `KpiCard` | `src/components/kpi-card.tsx` | Panel, Rendimiento |
| `ReceiptViewer` | `src/app/admin/reservas/receipt-viewer.tsx` | Reservas detail |
| `AuditLog` | `src/app/admin/reservas/audit-log.tsx` | Reservas detail |
| `ClientProfileForm` | `src/app/admin/reservas/client-profile-form.tsx` | Clientes |
| `ConfirmationModal` | `src/app/reservar/confirmation-modal.tsx` | Nueva reserva |
| `ReceiptPreview` | `src/app/reservar/receipt-preview.tsx` | Nueva reserva |
| `useOfflineQueue` | `src/app/reservar/use-offline-queue.ts` | Nueva reserva |
| `useUnits` | `src/hooks/use-units.ts` | Inventario, Nueva reserva |
| `useRealtimeUnits` | `src/hooks/use-realtime-units.ts` | Inventario |
| `useCurrentSalesperson` | `src/hooks/use-current-salesperson.ts` | Layout |
| `uploadImage` | `src/lib/reservas/upload-image.ts` | Nueva reserva |

---

## File Summary

### Created (21 files)

| File | Purpose |
|------|---------|
| `src/lib/reservas/ventas-context.tsx` | React context for salesperson data |
| `src/app/ventas/portal/layout.tsx` | Shared layout with tab nav + auth guard |
| `src/app/ventas/portal/page.tsx` | Redirect to /panel |
| `src/app/ventas/portal/panel/page.tsx` | Panel server wrapper |
| `src/app/ventas/portal/panel/panel-client.tsx` | KPI dashboard + recent reservations |
| `src/app/ventas/portal/inventario/page.tsx` | Inventario server wrapper |
| `src/app/ventas/portal/inventario/inventario-client.tsx` | Full inventory grid + filters |
| `src/app/ventas/portal/inventario/unit-detail-modal.tsx` | Unit detail modal (view-only for non-available) |
| `src/app/ventas/portal/reservas/page.tsx` | Reservas server wrapper |
| `src/app/ventas/portal/reservas/reservas-client.tsx` | Reservation table + filters |
| `src/app/ventas/portal/reservas/ventas-reservation-detail.tsx` | Read-only reservation detail side panel |
| `src/app/ventas/portal/nueva-reserva/page.tsx` | Nueva reserva server wrapper |
| `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx` | Desktop reservation form (two-column) |
| `src/app/ventas/portal/nueva-reserva/desktop-file-input.tsx` | Drag-and-drop file input |
| `src/app/ventas/portal/rendimiento/page.tsx` | Rendimiento server wrapper |
| `src/app/ventas/portal/rendimiento/rendimiento-client.tsx` | Performance metrics + KPIs |
| `src/app/ventas/portal/rendimiento/velocity-chart.tsx` | Monthly bar chart |
| `src/app/ventas/portal/clientes/page.tsx` | Clientes server wrapper |
| `src/app/ventas/portal/clientes/clientes-client.tsx` | Client list + inline profile editing |
| `src/app/api/reservas/ventas/clients/route.ts` | New API: salesperson's clients |

### Modified (4 files)

| File | Change |
|------|--------|
| `src/components/nav-bar.tsx` | "Mi Panel" → "Mi Portal", href to `/ventas/portal` |
| `src/app/ventas/dashboard/page.tsx` | Redirect to `/ventas/portal/reservas` |
| `src/app/api/reservas/admin/reservations/[id]/route.ts` | Dual-auth: admin OR salesperson ownership |
| `public/sw.js` | Cache version bump + portal precache |

---

## Build Verification

- `next build` — passes with zero TypeScript errors
- All 6 portal routes compiled as static pages
- New API route compiled as dynamic function
