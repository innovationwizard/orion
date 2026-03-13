# 060 — PCV: Parking/Bodega Areas + Profession Column + Inline Profile Editor

**Date:** 2026-03-13
**Author:** Jorge Luis Contreras Herrera
**Status:** DEPLOYED to production

---

## Context

PCV (Promesa de Compraventa) documents were rendering with three categories of missing data:

1. **Parking area and bodega area** — always showed "________" because:
   - `parking_car_area` and `parking_tandem_area` columns never existed in `rv_units` (only declared in TypeScript types)
   - `bodega_area` existed in `rv_units` but was not included in the `v_rv_units_full` view
   - B5 `bodega_area` was seeded as 5.0 instead of the correct 5.3 per SSOT
   - CE `bodega_area` was never populated at all (17 units with NULL)
   - The seed script (`seed_prod.py`) extracted parking counts and locations but never parking areas

2. **Profesión u oficio** — the PCV buyer clause requires profession, but the field didn't exist in `rv_client_profiles` (only `occupation_type` enum was available)

3. **Edad and estado civil** — could be missing for clients whose profiles weren't created at reservation time (pre-profile-code reservations or backfill gaps)

Additionally, a React hooks violation (error #310) caused the PCV page to crash: `handleProfileSave` useCallback was defined after early returns, causing fewer hooks on loading renders.

---

## What Changed

### Migration 028 — Client Profile Profession Column

- Added `profession` text column to `rv_client_profiles`
- Backfilled 477 profiles from `occupation_type` mapping:
  - `formal` / `informal` → "Empleado(a)"
  - `independiente` → "Profesional Independiente"
  - `empresario` → "Empresario(a)"

### Migration 029 — Parking/Bodega Area Data

**Schema changes:**
- Added `parking_car_area` (numeric) and `parking_tandem_area` (numeric) columns to `rv_units`
- Updated `v_rv_units_full` view to include `parking_car_area`, `parking_tandem_area`, and `bodega_area` (appended at end per PostgreSQL view column ordering rule)

**SSOT data population:**

| Project | Parking Simple | Parking Tandem | Bodega | Source Sheet |
|---------|---------------|----------------|--------|-------------|
| Boulevard 5 | 12.5 m² | 25.0 m² | 5.3 m² (fixed) | Cesión de derechos |
| Casa Elisa | 12.5 m² | N/A | 1.78–4.9 m² (variable) | Disponibilidad |
| Bosque Las Tapias | Not in SSOT | N/A | No bodegas | — |
| Benestare | Not in SSOT | N/A | No bodegas | — |

**Data fixes:**
- B5: corrected `bodega_area` from 5.0 → 5.3 (129 units)
- CE: populated `bodega_area` for 17 units (13 × 3.0, plus 303=1.78, 603=2.26, 803=1.89, 506=4.9)
- CE unit 506: fixed missing `bodega_number` ("14") and `bodega_area` (4.9)
- CE unit 403: `bodega_area` empty in SSOT — left NULL (needs manual verification)

### PCV API (`/api/reservas/admin/pcv/[id]`)

- **GET**: Removed separate `bodega_area` query (now in view). Fetches `profession` from client profile.
- **PATCH** (new): Saves missing profile data (edad, profession, marital_status) for PCV inline editing.

### PCV Template (`pcv-client.tsx`)

- Parking and bodega lines now **conditionally rendered** — hidden when the unit has no parking/bodega
- Added `ProfileForm` component: yellow banner with inline fields when edad, estado civil, or profesión are missing
- Profile form hidden when printing (CSS `@media print`)
- Fixed React hooks violation: moved `handleProfileSave` useCallback before early returns

### Reservation API (`/api/reservas/reservations`)

- Always upserts a `rv_client_profiles` row on submission (not just when `birth_date` is available)

### Types (`types.ts`)

- Added `bodega_area: number | null` to `UnitFull` interface

---

## Known Gaps

- **BLT/BEN parking areas**: Not available in SSOT — PCV for these projects will omit the parking area line
- **CE unit 403 bodega_area**: Empty cell in SSOT spreadsheet — needs manual verification with Pati

---

## Files

| Action | File |
|--------|------|
| NEW | `scripts/migrations/028_client_profile_profession.sql` |
| NEW | `scripts/migrations/029_parking_bodega_areas.sql` |
| MODIFY | `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` |
| MODIFY | `src/app/api/reservas/admin/pcv/[id]/route.ts` |
| MODIFY | `src/app/api/reservas/reservations/route.ts` |
| MODIFY | `src/lib/reservas/types.ts` |
