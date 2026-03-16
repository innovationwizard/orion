# 061 — M:N Buyer-Unit Support (Multi-Buyer Reservations)

**Date:** 2026-03-13
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

The reservation system's `reservation_clients` junction table only had an `is_primary` boolean — insufficient for real-world scenarios where multiple people buy a single apartment (husband/wife, friends, investor groups). The PCV (Promesa de Compraventa) legal document requires per-buyer clauses with role, ownership percentage, age, profession, marital status, and domicilio. Admin needed the ability to view and manage multi-buyer metadata.

### Business scenarios supported:
- **1:1** — One buyer, one apartment (majority of cases, ~98%)
- **M:1** — Multiple buyers, one apartment (husband/wife, co-investors, groups)
- **1:M** — One buyer, multiple apartments (separate PCV per unit — handled by existing schema)

### Legal foundation:
- Guatemala Civil Code Art. 485 — equal aliquot parts presumption for copropiedad
- Silverston Party Role pattern for transaction-party modeling

---

## What Changed

### Migration 030 — Junction Table Enrichment

**New enum type:**
- `rv_buyer_role`: `PROMITENTE_COMPRADOR`, `CO_COMPRADOR`, `REPRESENTANTE_LEGAL`, `GARANTE`

**New columns on `reservation_clients`:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `role` | `rv_buyer_role` | `PROMITENTE_COMPRADOR` | Legal role in PCV |
| `ownership_pct` | `numeric(5,2)` | `NULL` | Ownership share (0–100%) |
| `legal_capacity` | `text` | `NULL` | Free-text legal capacity |
| `document_order` | `smallint` | `1` | Ordering in PCV document |
| `signs_pcv` | `boolean` | `true` | Whether this client signs the PCV |

**Constraints:**
- `rc_ownership_pct_range`: ownership_pct IS NULL OR (> 0 AND <= 100)
- `rc_document_order_positive`: document_order > 0

**Backfill (682 rows):**
- `role`: primary → `PROMITENTE_COMPRADOR`, non-primary → `CO_COMPRADOR`
- `document_order`: primary → 1, non-primary → 2
- `ownership_pct`: single-buyer → 100%, multi-buyer → equal split per Art. 485
- `signs_pcv`: true for all

**View update:**
- `v_reservations_pending`: appended `client_count` column (COUNT of reservation_clients)

**RPC update:**
- `submit_reservation`: now sets `role` and `document_order` using a `v_client_index` counter

### TypeScript Types & Constants

- Added `RvBuyerRole` type to `types.ts`
- Added 5 new fields to `ReservationClient` interface: `role`, `ownership_pct`, `legal_capacity`, `document_order`, `signs_pcv`
- Added `client_count` to `ReservationPending` interface
- Added `BUYER_ROLES` array, `BUYER_ROLE_LABELS`, `BUYER_ROLE_LABELS_SHORT` to `constants.ts`
- Added `updateReservationClientSchema` Zod schema to `validations.ts`

### API Routes

**`GET /api/reservas/admin/reservations/[id]`:**
- Expanded `reservation_clients` select to include all 5 new junction columns
- Added ordering by `document_order`

**`GET /api/reservas/admin/pcv/[id]`:**
- Fetches profiles for ALL signing clients (`signs_pcv = true`), not just primary
- Returns `client_profiles` map keyed by `client_id` (plus backward-compat `client_profile`)

**`PATCH /api/reservas/admin/pcv/[id]`:**
- Accepts optional `client_id` to target any buyer's profile (falls back to primary)
- Supports `domicilio` field

**`PATCH /api/reservas/admin/reservation-clients/[id]`** (NEW):
- Updates junction-level metadata: role, ownership_pct, document_order, legal_capacity, signs_pcv
- Requires `master` or `torredecontrol` role

### Admin Detail UI (`reservation-detail.tsx`)

- Each client rendered as a bordered card with role badge and ownership percentage
- Per-client edit button (replaces primary-only editing)
- `editingClientId` state replaces `editingClient` boolean for multi-client support
- Clients sorted by `document_order`

### Reservation List (`reservation-row.tsx`)

- Client count badge: shows `(N)` when `client_count > 1`

### PCV Template (`pcv-client.tsx`)

- **PROMITENTE COMPRADORA section**: Per-signer paragraphs with ownership percentages
- **Notification clause (DÉCIMA CUARTA)**: Lists each buyer's domicilio separately
- **Signature blocks**: Dynamic width per signing client, rendered for both signature sections
- **Notary DOY FE**: Lists each signer with letter indices (B, C, D...)
- **ProfileForm**: Accepts `clientId` and `clientLabel` props, passes `client_id` in save payload
- **Missing fields detection**: Checks ALL signing clients, shows per-client form with name label

---

## Design Decisions

1. **`is_primary` kept** — Used in 18+ files; removed only when deprecated naturally. `role` is the canonical field going forward.
2. **No Party supertype** — Overengineering for current scale. Junction enrichment is sufficient.
3. **No `legal_capacity` enum** — Guatemalan legal capacity forms are too varied for enum. Free text.
4. **Equal split backfill** — Per Civil Code Art. 485, in absence of explicit percentages, copropiedad is equal parts.
5. **`signs_pcv` flag** — Enables scenarios like a guarantor (GARANTE) who appears in the reservation but doesn't sign the PCV.

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/030_reservation_clients_m2n.sql` |
| NEW | `src/app/api/reservas/admin/reservation-clients/[id]/route.ts` |
| MODIFY | `src/lib/reservas/types.ts` |
| MODIFY | `src/lib/reservas/constants.ts` |
| MODIFY | `src/lib/reservas/validations.ts` |
| MODIFY | `src/app/api/reservas/admin/reservations/[id]/route.ts` |
| MODIFY | `src/app/api/reservas/admin/pcv/[id]/route.ts` |
| MODIFY | `src/app/admin/reservas/reservation-detail.tsx` |
| MODIFY | `src/app/admin/reservas/reservation-row.tsx` |
| MODIFY | `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` |

---

## Reference

- [M:N Analysis](../memory/m2m-buyer-unit-analysis.md) — Full research document
- [Implementation Plan](../memory/m2m-implementation-plan.md) — 6-phase plan
