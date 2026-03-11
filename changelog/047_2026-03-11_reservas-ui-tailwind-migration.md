# 047 — Reservas UI + Full Tailwind Migration

**Date:** 2026-03-11
**Author:** Jorge Luis Contreras Herrera

## Description

Complete UI build for the reservation system — three new pages that replace Pati's Excel workflows — plus a full migration of all existing pages and components from BEM CSS to Tailwind v4. The 1328-line `globals.css` is now 40 lines.

### Mission

**TO COMPLETELY, THOROUGHLY, AND ABSOLUTELY OBLITERATE PATI'S NEED OF EXCEL.**

## What changed

### Phase 0: Foundation

#### Tailwind v4 Setup
- Installed `@tailwindcss/postcss`
- Created `postcss.config.mjs` with CSS-first Tailwind v4 configuration
- Rewrote `globals.css` with `@import "tailwindcss"`, `@theme` block (custom design tokens), and minimal base resets
- Custom tokens: `--color-primary`, `--color-success`, `--color-danger`, `--color-muted`, `--color-border`, `--color-card`, `--color-bg`, `--color-text-primary`, `--color-unit-*`, `--shadow-card`, `--font-family-sans`

#### Custom Hooks (`src/hooks/`)
- `use-projects.ts` — Fetch projects with towers for cascading selects
- `use-salespeople.ts` — Fetch active salespeople for dropdowns
- `use-units.ts` — Fetch units with project/tower/status filters
- `use-realtime-units.ts` — Supabase Realtime subscription on `rv_units`
- `use-reservations.ts` — Fetch reservations with status/project/date filters

#### New API Endpoints
- `GET /api/reservas/reservations` — List reservations with filters
- `GET /api/reservas/admin/reservations/[id]` — Single reservation detail (superuser)

#### API Consistency
- Refactored all 10 reservas API routes to use `jsonOk`/`jsonError`/`parseJson`/`parseQuery` from `src/lib/api.ts`
- Fixed `parseJson`/`parseQuery` return types to discriminated unions for proper TypeScript narrowing

### Phase 1: BEM → Tailwind Migration (20 files)

Migrated every existing page and component from BEM classes to Tailwind utility classes. All ~95 BEM classes replaced inline.

**Pages migrated (8):**
- `layout.tsx`, `page.tsx`, `login/page.tsx`, `login/login-form.tsx`
- `auth/set-password/page.tsx`, `auth/callback/page.tsx`
- `projects/page.tsx`, `desistimientos/page.tsx`

**Components migrated (12):**
- `dashboard-client.tsx`, `filters.tsx`, `kpi-card.tsx`, `tabs.tsx`
- `data-table.tsx`, `error-banner.tsx`, `sparkline.tsx`
- `bullet-chart.tsx`, `cash-flow-chart.tsx`, `commission-bars.tsx`
- `payment-treemap.tsx`, `commission-treemap.tsx`, `payment-detail-modal.tsx`

**Result:** `globals.css` went from 1354 lines → 40 lines. Zero BEM classes remain.

### Phase 2: `/disponibilidad` — Availability Board (7 files)

Public page. Color-coded unit grid with real-time status updates.

- `page.tsx` — Server component with Suspense boundary
- `disponibilidad-client.tsx` — Main client with filters, search, tower grouping
- `availability-grid.tsx` — Tower grid grouped by floor (descending)
- `unit-cell.tsx` — Color-coded button with detail dialog and "Reservar" link
- `project-tower-filter.tsx` — Cascading project/tower selects
- `status-legend.tsx` — Color legend from `UNIT_STATUS_COLORS`
- `connection-status.tsx` — Realtime connection indicator

**Features:** Supabase Realtime live updates, URL-based filters, summary count pills, skeleton loading, responsive grid with horizontal scroll.

### Phase 3: `/reservar` — Salesperson Mobile Form (10 files)

Public page. Multi-step wizard optimized for mobile field use.

- `page.tsx` — Server component with Suspense boundary
- `reservar-client.tsx` — Step state machine (0→1→2→3→success)
- `step-progress.tsx` — Visual step indicator
- `step-unit-select.tsx` — Project → Tower → Unit grid + salesperson dropdown
- `step-client-info.tsx` — Dynamic client name fields, phone, lead source
- `step-receipt-upload.tsx` — Camera-first capture + OCR + manual override
- `step-review-submit.tsx` — Full summary + POST submission
- `camera-input.tsx` — Camera/file input with HEIC support
- `receipt-preview.tsx` — OCR result display with confidence badges
- `use-offline-queue.ts` — localStorage queue with exponential backoff

**Features:** Camera-first receipt capture, Claude Vision OCR with confidence badges, manual override fields, sticky progress bar, 48px touch targets, success screen with "Reservar otra unidad".

### Phase 4: `/admin/reservas` — Admin Review Dashboard (10 files)

Authenticated (superuser). Table + side panel.

- `page.tsx` — Server component with Suspense boundary
- `reservas-admin-client.tsx` — Main client with filters, table, side panel
- `admin-stats.tsx` — KPI cards (pending/confirmed/rejected/desisted)
- `reservation-filters.tsx` — Status tabs + project dropdown
- `reservation-table.tsx` — Full table with sortable columns
- `reservation-row.tsx` — Row with status pill
- `reservation-detail.tsx` — Side panel with full detail, receipt, audit log
- `receipt-viewer.tsx` — Receipt image + OCR extraction display
- `audit-log.tsx` — Unit status change history
- `action-confirm-dialog.tsx` — Confirm/Reject/Desist dialogs with reason/date inputs

**Features:** j/k keyboard navigation, Escape to close, status-filtered tabs, slide-in side panel, confirm/reject/desist action dialogs.

### Phase 5: Polish

- `use-keyboard-shortcuts.ts` — Extracted keyboard shortcut hook for admin
- `use-offline-queue.ts` — Offline detection + localStorage queue + exponential backoff retry
- Global `:focus-visible` ring for accessibility (WCAG AA)

## Architecture decisions

| Decision | Rationale |
|---|---|
| Tailwind v4 (CSS-first `@theme`) | No `tailwind.config.ts` needed; design tokens in CSS |
| Full BEM migration | Zero technical debt — THE RULES say NO technical debt |
| `useSearchParams` for filters | URL-driven state = shareable links, browser back works |
| `useEffect` + `fetch` + `useState` | Simple data fetching — no heavy libraries needed |
| Native `<dialog>` | Built-in modal behavior, no library dependency |
| Discriminated unions for API helpers | Proper TypeScript narrowing after error checks |
| Camera-first input (`capture="environment"`) | Salespeople are in the field on mobile |
| Supabase Realtime on `rv_units` | Live availability — no polling needed |

## Files changed

| Status | File |
|---|---|
| A | `postcss.config.mjs` |
| A | `src/hooks/use-projects.ts` |
| A | `src/hooks/use-salespeople.ts` |
| A | `src/hooks/use-units.ts` |
| A | `src/hooks/use-realtime-units.ts` |
| A | `src/hooks/use-reservations.ts` |
| A | `src/app/api/reservas/admin/reservations/[id]/route.ts` |
| A | `src/app/disponibilidad/page.tsx` |
| A | `src/app/disponibilidad/disponibilidad-client.tsx` |
| A | `src/app/disponibilidad/availability-grid.tsx` |
| A | `src/app/disponibilidad/unit-cell.tsx` |
| A | `src/app/disponibilidad/project-tower-filter.tsx` |
| A | `src/app/disponibilidad/status-legend.tsx` |
| A | `src/app/disponibilidad/connection-status.tsx` |
| A | `src/app/reservar/page.tsx` |
| A | `src/app/reservar/reservar-client.tsx` |
| A | `src/app/reservar/step-progress.tsx` |
| A | `src/app/reservar/step-unit-select.tsx` |
| A | `src/app/reservar/step-client-info.tsx` |
| A | `src/app/reservar/step-receipt-upload.tsx` |
| A | `src/app/reservar/step-review-submit.tsx` |
| A | `src/app/reservar/camera-input.tsx` |
| A | `src/app/reservar/receipt-preview.tsx` |
| A | `src/app/reservar/use-offline-queue.ts` |
| A | `src/app/admin/reservas/page.tsx` |
| A | `src/app/admin/reservas/reservas-admin-client.tsx` |
| A | `src/app/admin/reservas/admin-stats.tsx` |
| A | `src/app/admin/reservas/reservation-filters.tsx` |
| A | `src/app/admin/reservas/reservation-table.tsx` |
| A | `src/app/admin/reservas/reservation-row.tsx` |
| A | `src/app/admin/reservas/reservation-detail.tsx` |
| A | `src/app/admin/reservas/receipt-viewer.tsx` |
| A | `src/app/admin/reservas/audit-log.tsx` |
| A | `src/app/admin/reservas/action-confirm-dialog.tsx` |
| A | `src/app/admin/reservas/use-keyboard-shortcuts.ts` |
| A | `origin/SSOT/_PLAN-reservas-ui.md` |
| M | `src/app/globals.css` (1354 → 40 lines) |
| M | `src/lib/api.ts` (discriminated union fix) |
| M | `src/app/api/reservas/reservations/route.ts` (added GET) |
| M | `src/app/api/reservas/projects/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/salespeople/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/units/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/ocr/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/freeze-requests/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/admin/reservations/[id]/reject/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` (jsonOk/jsonError) |
| M | `src/app/api/reservas/admin/freeze-requests/[id]/release/route.ts` (jsonOk/jsonError) |
| M | `src/app/layout.tsx` (BEM → Tailwind) |
| M | `src/app/page.tsx` (BEM → Tailwind) |
| M | `src/app/login/page.tsx` (BEM → Tailwind) |
| M | `src/app/login/login-form.tsx` (BEM → Tailwind) |
| M | `src/app/auth/set-password/page.tsx` (BEM → Tailwind) |
| M | `src/app/auth/callback/page.tsx` (BEM → Tailwind) |
| M | `src/app/projects/page.tsx` (BEM → Tailwind) |
| M | `src/app/desistimientos/page.tsx` (BEM → Tailwind) |
| M | `src/app/dashboard-client.tsx` (BEM → Tailwind) |
| M | `src/components/filters.tsx` (BEM → Tailwind) |
| M | `src/components/kpi-card.tsx` (BEM → Tailwind) |
| M | `src/components/tabs.tsx` (BEM → Tailwind) |
| M | `src/components/data-table.tsx` (BEM → Tailwind) |
| M | `src/components/error-banner.tsx` (BEM → Tailwind) |
| M | `src/components/bullet-chart.tsx` (BEM → Tailwind) |
| M | `src/components/cash-flow-chart.tsx` (BEM → Tailwind) |
| M | `src/components/commission-bars.tsx` (BEM → Tailwind) |
| M | `src/components/payment-treemap.tsx` (BEM → Tailwind) |
| M | `src/components/commission-treemap.tsx` (BEM → Tailwind) |
| M | `src/components/payment-detail-modal.tsx` (BEM → Tailwind) |
| M | `package.json` (added @tailwindcss/postcss) |

**Total: ~36 new files, ~32 modified files. `npm run build` — zero errors, zero warnings.**
