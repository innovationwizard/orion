# 056 — Reservar Page Redesign: Minimal-Friction Reservation Flow

**Date:** 2026-03-12
**Author:** Jorge Luis Contreras Herrera
**Status:** IMPLEMENTED — migration 022 executed on production

---

## Context

The `/reservar` page was a 4-step wizard requiring salespeople to manually select project, tower, unit, and themselves from dropdowns — 4 screens of friction on a phone in the field. This redesign collapses the flow to **2 screens** by inferring salesperson from Supabase Auth and project from a DB junction table.

**Design decisions:**
- Auth: **Supabase Auth** (magic link or invite)
- Project inference: **`salesperson_projects` junction table** in DB
- Apartment model: **auto-populated** from `rv_units.unit_type` (no dropdown)
- DPI photo: **new required field** — client national ID capture
- Receipt images: **now actually persisted** to Supabase Storage (previously always NULL)

---

## Database Migration (022)

**File:** `scripts/migrations/022_salesperson_auth.sql`
**Executed:** 2026-03-12 on production

| Change | Detail |
|--------|--------|
| `salespeople.user_id` | `uuid UNIQUE REFERENCES auth.users(id)` — links salesperson to Supabase Auth |
| `salesperson_projects` table | Junction table: `(salesperson_id, project_id)` PK with RLS |
| `reservations.dpi_image_url` | New `text` column for DPI photo URL |
| `submit_reservation()` | Added `p_dpi_image_url text DEFAULT NULL` parameter |
| `dpi` Storage bucket | Private bucket, 10MB limit, image types only |
| Receipt upload policy | Changed from public to authenticated-only |
| `v_reservations_pending` view | Added `dpi_image_url` column (appended at end) |

### RLS Policies on `salesperson_projects`

| Policy | Access |
|--------|--------|
| `Salespeople read own assignments` | SELECT for authenticated users on own records |
| `Admins manage all assignments` | ALL for master/gerencia/inventario roles |
| `Service role full access` | ALL for service_role (API routes) |

---

## Auth Infrastructure

### Server-side

| File | Purpose |
|------|---------|
| `src/lib/reservas/require-salesperson.ts` | `requireSalesperson()` — extracts auth.uid() → resolves salesperson → 401/403 |
| `src/app/api/reservas/me/route.ts` | `GET /api/reservas/me` — returns `{ salesperson, projects: [{ towers }] }` |
| `src/app/api/reservas/reservations/route.ts` | POST now calls `requireSalesperson()` + passes `p_dpi_image_url` to RPC |

### Client-side

| File | Purpose |
|------|---------|
| `src/hooks/use-current-salesperson.ts` | Fetches `/api/reservas/me`, caches in sessionStorage (5 min TTL) |

### Middleware

`middleware.ts` — removed `/reservar` from public pages. Now requires auth; unauthenticated users redirect to `/login`.

---

## Image Handling

| File | Purpose |
|------|---------|
| `src/lib/reservas/upload-image.ts` | Compress (browser-image-compression → ~500KB JPEG) + upload to Supabase Storage |
| `package.json` | Added `browser-image-compression` dependency |

Upload path: `{bucket}/{salespersonId}/{timestamp}.jpg`

Both DPI and receipt images are compressed client-side before upload. Receipt images are sent to `/api/reservas/ocr` for Claude Vision extraction in parallel.

---

## UI: 4-Step Wizard → 2-Screen Flow

### Screen 1 — Inventory Grid (`reservar-client.tsx`)

- `useCurrentSalesperson()` resolves salesperson + project(s) + towers
- Single-project salespeople see grid immediately; multi-project get project chips
- Tower filter chips (horizontally scrollable, "Todas" default)
- Unit number search input (instant filter)
- AVAILABLE units as green tap targets
- `useRealtimeUnits()` for live availability
- Offline banner with queue count

### Screen 2 — Reservation Form (`reservation-form.tsx`)

| Section | Fields |
|---------|--------|
| **Unit badge** | Auto-populated: unit number, model, bedrooms, area, price, tower (read-only) |
| **Fotos** | DPI photo (required), Receipt photo (required, triggers OCR) |
| **Datos del cliente** | Client name(s) with "+ Agregar co-comprador", phone (optional) |
| **Datos del depósito** | Amount, date, bank, receipt type, depositor — pre-filled from OCR, editable |
| **Fuente de captación** | Top 6 as chips (Facebook, Referido, Perfilan, Visita Inédita, Señalética, Web), "Ver todas" for all 24 |
| **Notas** | Optional textarea |

### Confirmation Modal (`confirmation-modal.tsx`)

Bottom-sheet modal with read-only summary of all fields. "Editar" returns to form, "Confirmar" uploads images → POST → success screen.

### Draft Auto-Save

Form state saved to `localStorage` keyed by `orion:reservation-draft:{unit_id}`. Restored on return, cleared on successful submit.

---

## Files Changed

| Action | File |
|--------|------|
| **NEW** | `scripts/migrations/022_salesperson_auth.sql` |
| **NEW** | `src/lib/reservas/require-salesperson.ts` |
| **NEW** | `src/lib/reservas/upload-image.ts` |
| **NEW** | `src/app/api/reservas/me/route.ts` |
| **NEW** | `src/hooks/use-current-salesperson.ts` |
| **NEW** | `src/app/reservar/reservation-form.tsx` |
| **NEW** | `src/app/reservar/confirmation-modal.tsx` |
| **REWRITE** | `src/app/reservar/reservar-client.tsx` |
| **MODIFIED** | `middleware.ts` |
| **MODIFIED** | `src/app/api/reservas/reservations/route.ts` |
| **MODIFIED** | `src/lib/reservas/types.ts` (added `dpi_image_url`, `ReceiptData`) |
| **MODIFIED** | `src/lib/reservas/validations.ts` (added `dpi_image_url`) |
| **MODIFIED** | `public/sw.js` (cache version v1 → v2) |
| **MODIFIED** | `package.json` (added `browser-image-compression`) |
| **DELETED** | `src/app/reservar/step-progress.tsx` |
| **DELETED** | `src/app/reservar/step-unit-select.tsx` |
| **DELETED** | `src/app/reservar/step-client-info.tsx` |
| **DELETED** | `src/app/reservar/step-receipt-upload.tsx` |
| **DELETED** | `src/app/reservar/step-review-submit.tsx` |

---

## What Remains Before Go-Live

| Item | Status |
|------|--------|
| Create Supabase Auth accounts for 32 salespeople | Pending — needs email addresses or temp password distribution |
| Populate `salesperson_projects` from existing reservation data | Pending — seed script needed |
| Distribute login credentials to sales team | Pending — coordination with Jorge |
