# 046 — Reservas MVP Scaffolding

**Commit:** `b49b2fa`
**Date:** 2026-03-11
**Author:** Jorge Luis Contreras Herrera

## Description

Foundational integration of the Reserve Deposit Observer into the existing analytics app — the first step toward eliminating all Excel dependency in commercial operations (Pati's Control Tower).

### Mission

**TO COMPLETELY, THOROUGHLY, AND ABSOLUTELY OBLITERATE PATI'S NEED OF EXCEL.**

Pati (Patricia) is the single-operator Control Tower managing 350+ clients, 4 projects, 889 units — all in Excel. This commit lays the database schema, API layer, OCR integration, and domain logic that will replace every manual spreadsheet operation.

## What changed

### New: Database migration (`scripts/migrations/018_reservas_mvp_schema.sql`)
- 5 enum types: `rv_unit_status`, `rv_reservation_status`, `rv_receipt_type`, `rv_extraction_confidence`, `rv_freeze_request_status`
- 10 tables: `towers`, `floors`, `rv_units`, `salespeople`, `rv_clients`, `reservations`, `reservation_clients`, `receipt_extractions`, `unit_status_log`, `freeze_requests`
- ALTER `projects` to add `slug`, `updated_at` (shared with analytics)
- 6 atomic PL/pgSQL functions with `FOR UPDATE` locking: `submit_reservation`, `confirm_reservation`, `reject_reservation`, `desist_reservation`, `submit_freeze`, `release_freeze`
- 4 views: `v_rv_units_full`, `v_reservations_pending`, `v_rv_projects_with_towers`, `v_rv_unit_sale_counts`
- Full RLS policies, Realtime on `rv_units`, Storage bucket for receipts

### New: Domain library (`src/lib/reservas/`)
- `types.ts` — TypeScript types mirroring the full PostgreSQL schema
- `constants.ts` — Unit statuses, reservation statuses, receipt types, lead sources, Guatemalan banks, project slugs, formatting utilities
- `validations.ts` — Zod schemas for all API payloads

### New: Supabase clients (`src/lib/supabase/`)
- `client.ts` — Browser client for reservation pages
- `server.ts` — Server client with cookie handling
- `admin.ts` — Service-role client for SECURITY DEFINER function calls

### New: Claude Vision OCR (`src/lib/claude.ts`)
- Receipt data extraction using `claude-sonnet-4-20250514`
- Spanish system prompt for Guatemalan bank receipts
- Extracts: amount, date, bank, reference, depositor name, receipt type, confidence

### New: API routes (`src/app/api/reservas/`)
- `GET /api/reservas/projects` — Projects with towers (form cascading selects)
- `GET /api/reservas/salespeople` — Active salespeople (form dropdown)
- `GET /api/reservas/units` — Full unit view with filters (availability board)
- `POST /api/reservas/reservations` — Submit reservation (calls `submit_reservation` RPC)
- `POST /api/reservas/ocr` — Receipt image → structured data via Claude Vision
- `POST /api/reservas/freeze-requests` — Submit VIP freeze (calls `submit_freeze` RPC)
- `PATCH /api/reservas/admin/reservations/[id]/confirm` — Admin confirm
- `PATCH /api/reservas/admin/reservations/[id]/reject` — Admin reject
- `PATCH /api/reservas/admin/reservations/[id]/desist` — Admin desist
- `PATCH /api/reservas/admin/freeze-requests/[id]/release` — Admin release freeze

### Modified: Middleware (`middleware.ts`)
- Public access for `/reservar` (salesperson form) and `/disponibilidad` (availability board)

### Modified: Configuration
- `package.json` — Added `@anthropic-ai/sdk`, `tsx`
- `tsconfig.json` — Excluded `reservas-app/` from compilation
- `CLAUDE.md` — Mission statement, reservation system architecture, table mapping
- `.cursorrules` — Mission, reservation system context
- `.env.example` — Added `CLAUDE_API_KEY`, `SUPERUSER_EMAILS`

### Added: Reference scaffolding (`reservas-app/`)
- Complete standalone app scaffolding used as blueprint for integration
- Read-only reference — not compiled or deployed

## Architecture decisions

| Decision | Rationale |
|---|---|
| `rv_units`, `rv_clients` (prefixed) | Avoids conflict with existing analytics `units` and `clients` tables |
| `projects` shared (ALTERed) | Same entity enriched with `slug` — no duplication |
| `/api/reservas/` namespace | Zero conflicts with existing `/api/` routes |
| `rv_*` enum types | Avoids collision with any existing PostgreSQL types |
| `SECURITY DEFINER` + `FOR UPDATE` | Atomic state transitions prevent double-booking race conditions |
| React 18 kept | Existing app dependency — no upgrade risk |
| Tailwind for new pages only | Existing app uses globals.css — gradual adoption |

## Files changed

| Status | File |
|---|---|
| A | `.env.example` |
| A | `scripts/migrations/018_reservas_mvp_schema.sql` |
| A | `src/lib/reservas/types.ts` |
| A | `src/lib/reservas/constants.ts` |
| A | `src/lib/reservas/validations.ts` |
| A | `src/lib/supabase/client.ts` |
| A | `src/lib/supabase/server.ts` |
| A | `src/lib/supabase/admin.ts` |
| A | `src/lib/claude.ts` |
| A | `src/app/api/reservas/projects/route.ts` |
| A | `src/app/api/reservas/salespeople/route.ts` |
| A | `src/app/api/reservas/units/route.ts` |
| A | `src/app/api/reservas/reservations/route.ts` |
| A | `src/app/api/reservas/ocr/route.ts` |
| A | `src/app/api/reservas/freeze-requests/route.ts` |
| A | `src/app/api/reservas/admin/reservations/[id]/confirm/route.ts` |
| A | `src/app/api/reservas/admin/reservations/[id]/reject/route.ts` |
| A | `src/app/api/reservas/admin/reservations/[id]/desist/route.ts` |
| A | `src/app/api/reservas/admin/freeze-requests/[id]/release/route.ts` |
| A | `reservas-app/` (28 files — reference scaffolding) |
| A | `changelog/001–045` (historical changelog) |
| A | `docs/` (rules documents) |
| A | `artifacts_sales/` (sales artifacts) |
| M | `CLAUDE.md` |
| M | `.cursorrules` |
| M | `package.json` |
| M | `tsconfig.json` |
| M | `middleware.ts` |
