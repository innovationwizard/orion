# 082 — Multi-Buyer Reservation Form

**Date:** 2026-03-27
**Scope:** Reservation form UI (mobile + desktop), confirmation modal, API route, validation schema

## Summary

Enhanced the salesperson reservation form to collect per-buyer contact information when adding multiple buyers to a single reservation. The database already supported M:N buyer-unit relationships (migration 030), but the form only collected names as flat text inputs with a single shared phone number. Now each buyer gets their own card with name and phone fields, and co-buyer phones are persisted to `rv_clients` via a post-RPC update in the API route.

## DB Confirmation

No migration needed. The production database already supports multiple buyers per reservation:
- `reservation_clients` junction table with `UNIQUE(reservation_id, client_id)`
- `rv_buyer_role` enum: `PROMITENTE_COMPRADOR`, `CO_COMPRADOR`, `REPRESENTANTE_LEGAL`, `GARANTE`
- `submit_reservation()` RPC loops through `p_client_names[]`, auto-assigns roles and `document_order`
- Per-buyer metadata columns deployed since migration 030: `role`, `ownership_pct`, `legal_capacity`, `document_order`, `signs_pcv`

## Changes

### Form state restructure
- **Before:** `clientNames: string[]` + `clientPhone: string` (single phone for primary only)
- **After:** `clients: ClientEntry[]` where `ClientEntry = { name: string; phone: string }`
- Draft save/restore handles both old and new localStorage format (backward compatible)

### `src/app/reservar/reservation-form.tsx` (mobile salesperson form)
- Each buyer rendered as a bordered card with label ("Comprador principal" / "Co-comprador N")
- Per-buyer name + phone inputs stacked vertically
- Primary buyer card cannot be removed; co-buyer cards have red × remove button
- Section header changed from "Datos del cliente" to "Compradores"

### `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx` (desktop ventas portal)
- Same buyer card pattern as mobile form
- Name and phone side-by-side on desktop (`sm:grid-cols-2`)

### `src/app/reservar/confirmation-modal.tsx`
- **Before:** Single `SummaryRow` with comma-joined names + separate phone row
- **After:** Per-buyer display with role labels ("Principal", "Co-comp. 1") and inline phone
- Props changed: `clientNames: string[]` + `clientPhone: string` → `clients: ClientEntry[]`

### `src/lib/reservas/validations.ts`
- Added `client_phones: z.array(z.string().nullable()).optional().default([])` to `submitReservationSchema`
- Parallel array to `client_names` — index-aligned

### `src/app/api/reservas/reservations/route.ts`
- After `submit_reservation()` RPC returns, fetches `reservation_clients` ordered by `document_order`
- Updates `rv_clients.phone` for each co-buyer (index > 0) that has a phone number
- Primary buyer's phone still handled by the RPC via `p_client_phone`
- Graceful degradation: phone update failures are logged but don't block reservation creation

## Files changed
- `src/app/reservar/reservation-form.tsx`
- `src/app/reservar/confirmation-modal.tsx`
- `src/app/ventas/portal/nueva-reserva/nueva-reserva-client.tsx`
- `src/lib/reservas/validations.ts`
- `src/app/api/reservas/reservations/route.ts`
