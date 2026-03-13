# 059 — Unify Salespeople: One Person, One Row, One UUID

**Date:** 2026-03-13
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

The system had two parallel identity tables for salespeople:
- `sales_reps` (analytics) — 33 rows, UUID PK, used by `sales`, `commission_rates`, `commissions`
- `salespeople` (reservation) — 32 rows, UUID PK, used by `reservations`, `salesperson_projects`

Plus two parallel project-assignment tables:
- `sales_rep_project_assignments` — temporal model (start_date/end_date), used by analytics
- `salesperson_projects` — simple junction, used by reservation system

This created data fragmentation: a salesperson like "Andrea González" existed as two separate rows with different UUIDs, different name spellings (accented vs unaccented), and no cross-reference.

---

## What Changed

### Database (Migration 024)

**Data corrections:**
- Canonicalized 9 salespeople names with proper accents (e.g., "Abigail Garcia" → "Abigail García")
- Inserted 5 missing salespeople from analytics that had no reservation counterpart (Daniel Veliz, Gloria Cante, Jose Franco, Lilian G., Unknown)
- Manual-matched 2 abbreviated names: "Francisco S." → Francisco Osuna, "Ricardo O." → Ricardo Oliva
- Merged 2 duplicate pairs: Andrea Gonzalez/González, Rony Ramirez/Ramírez

**Re-keyed tables:**
- `sales.sales_rep_id` — mapped from old `sales_reps` UUIDs to `salespeople` UUIDs
- `salesperson_periods` (renamed from `sales_rep_periods`) — column `rep_id` → `salesperson_id`
- `salesperson_project_assignments` (renamed from `sales_rep_project_assignments`) — column `rep_id` → `salesperson_id`
- `commission_rates.recipient_id` and `commissions.recipient_id` — text IDs remapped

**PK standardization:**
- `salesperson_project_assignments.id`: bigint → uuid
- `salesperson_periods.id`: bigint → uuid

**Dropped tables:**
- `sales_reps` (replaced by `salespeople`)
- `salesperson_projects` (replaced by `salesperson_project_assignments` with temporal model)

**Rewrote:** `fn_calculate_commissions()` to reference `salespeople` instead of `sales_reps`

### TypeScript

- `src/lib/types.ts` — `SalesRep` type updated to match unified `salespeople` columns
- `src/app/api/sales-reps/route.ts` — queries `salespeople` table instead of `sales_reps`
- `src/app/api/sales/route.ts` — joins `salespeople!sales_rep_id` instead of `sales_reps`
- `src/app/api/reservas/me/route.ts` — queries `salesperson_project_assignments` (temporal model)
- `src/app/api/admin/salespeople/route.ts` — reads from `salesperson_project_assignments`
- `src/app/api/admin/salespeople/projects/route.ts` — temporal assignment model with soft-delete (end_date)

### Auth & Navigation

- `src/lib/auth.ts` — added `requireRole()` helper for admin API routes
- `src/components/nav-bar.tsx` — added "Asesores" link for admin navigation

---

## Canonical Table Structure (Post-Migration)

| Table | Purpose |
|-------|---------|
| `salespeople` | Single identity table (analytics + reservation) |
| `salesperson_project_assignments` | Temporal project assignments (start_date/end_date) |
| `salesperson_periods` | Contract/employment timelines |
| `sales` → `sales_rep_id` | UUID FK → `salespeople(id)` |

Active assignment = `end_date IS NULL`.

---

## Migration Execution Notes

Deployed via `supabase db push`. Key obstacles resolved during deployment:
- `unaccent()` lives in `public` schema (not `extensions`)
- `sales_reps.id` and `sales.sales_rep_id` are both UUID type — required `::text` casts for cross-type comparisons in the mapping table
- `sales` table has `calculate_commissions()` trigger — disabled with `DISABLE TRIGGER USER` during re-key
- Multiple FK/unique constraints with non-obvious names discovered iteratively
- Duplicate assignments from merged sales_reps pairs required dedup logic

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/024_unify_salespeople.sql` |
| NEW | `supabase/migrations/20260313_unify_salespeople.sql` |
| MODIFY | `src/lib/types.ts` |
| MODIFY | `src/lib/auth.ts` |
| MODIFY | `src/app/api/sales-reps/route.ts` |
| MODIFY | `src/app/api/sales/route.ts` |
| MODIFY | `src/app/api/reservas/me/route.ts` |
| MODIFY | `src/app/api/admin/salespeople/route.ts` |
| MODIFY | `src/app/api/admin/salespeople/projects/route.ts` |
| MODIFY | `src/components/nav-bar.tsx` |
