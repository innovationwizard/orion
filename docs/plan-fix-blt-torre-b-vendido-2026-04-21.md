# Fix Plan: BLT Torre B — All Units Showing "Vendido"

**Date:** 2026-04-21
**Ref:** `docs/diag-blt-torre-b-all-vendido-2026-04-21.md`
**Estimated phases:** 4
**Risk level:** High (production data must be corrected)

---

## Phase 1 — Fix Column Mapping (Code)

**File:** `src/lib/sync/constants.ts`

Update `DISP_COLUMNS.blt_b` to match the current Excel layout:

```typescript
// BEFORE (wrong — columns shifted)
blt_b: {
    sheet: "Precios Torre B",
    towerName: "Torre B",
    unitCol: 1,      // B
    statusCol: 23,   // X — WRONG: reads "Total"
    clientCol: 24,   // Y — WRONG: reads "Precio Final"
    asesorCol: 25,   // Z — WRONG: reads "Estatus"
    priceCol: 15,    // P — WRONG: reads "Estrategia Comercial"
    headerRow: 1,
},

// AFTER (correct — verified from Excel screenshots + user confirmation)
blt_b: {
    sheet: "Precios Torre B",
    towerName: "Torre B",
    unitCol: 1,      // B — unit number (unchanged)
    statusCol: 25,   // Z — "Estatus"
    clientCol: 26,   // AA — "Cliente"
    asesorCol: 27,   // AB — "Asesor"
    priceCol: 16,    // Q — "Aproximación FHA"
    headerRow: 1,
},
```

---

## Phase 2 — Harden `normalizeStatus()` (Code)

**File:** `src/lib/sync/excel-parser.ts:211-219`

The current numeric heuristic (`/^\d+/ → SOLD`) is a ticking bomb. If any future column drift causes a numeric column to be read as status, the same mass-SOLD bug recurs.

**Fix:** Remove the numeric-to-SOLD heuristic. Only map **known status strings** from `STATUS_MAP`. Anything else → `"AVAILABLE"` (safe default for unknown values).

```typescript
// BEFORE
export function normalizeStatus(raw: string | null | undefined): RvUnitStatus {
  if (raw == null) return "AVAILABLE";
  const key = String(raw).trim().toLowerCase();
  if (/^\d+(\.\d+)?$/.test(key)) return "SOLD";  // DANGEROUS
  return STATUS_MAP[key] ?? "AVAILABLE";
}

// AFTER
export function normalizeStatus(raw: string | null | undefined): RvUnitStatus {
  if (raw == null) return "AVAILABLE";
  const key = String(raw).trim().toLowerCase();
  return STATUS_MAP[key] ?? "AVAILABLE";
}
```

**Rationale:** If the SSOT Excel uses dates as status markers (e.g., a sale date in the status column), those dates should be added to `STATUS_MAP` as explicit mappings, or the Excel convention should be clarified. A blanket "any number = SOLD" is too dangerous.

---

## Phase 3 — Repair Production Data (Migration)

**File:** `scripts/migrations/058_fix_blt_torre_b_statuses.sql` (new)

The sync has overwritten all Torre B units with incorrect statuses. We need to:

1. Reset all Torre B units to `AVAILABLE` (the safe default).
2. Re-apply the correct statuses for the 4 known non-available units.
3. Fix `price_list` values that were overwritten with Q10,000.

```sql
-- Step 1: Reset all Torre B units to AVAILABLE
-- (except units that have an active reservation — those should stay RESERVED/SOLD)
UPDATE rv_units u
SET status = 'AVAILABLE',
    status_changed_at = NOW(),
    status_detail = 'Fix: column-drift mass-SOLD bug (2026-04-21)'
FROM towers t
JOIN projects p ON t.project_id = p.id
WHERE u.tower_id = t.id
  AND p.slug = 'bosque-las-tapias'
  AND t.name = 'Torre B'
  AND u.status = 'SOLD'
  AND u.id NOT IN (
    SELECT unit_id FROM reservations
    WHERE status IN ('PENDING_REVIEW', 'CONFIRMED')
  );

-- Step 2: Set correct statuses for the 4 known units from SSOT
-- Unit 508 = Reservado
UPDATE rv_units u
SET status = 'RESERVED',
    status_changed_at = NOW(),
    status_detail = 'Fix: restored from SSOT Excel (2026-04-21)'
FROM towers t
JOIN projects p ON t.project_id = p.id
WHERE u.tower_id = t.id
  AND p.slug = 'bosque-las-tapias'
  AND t.name = 'Torre B'
  AND u.unit_number = '508';

-- Units 702, 1305, 1307 = PCV → SOLD
UPDATE rv_units u
SET status = 'SOLD',
    status_changed_at = NOW(),
    status_detail = 'Fix: restored from SSOT Excel (2026-04-21)'
FROM towers t
JOIN projects p ON t.project_id = p.id
WHERE u.tower_id = t.id
  AND p.slug = 'bosque-las-tapias'
  AND t.name = 'Torre B'
  AND u.unit_number IN ('702', '1305', '1307');
```

**Note:** The `price_list` correction requires knowing the actual prices from the Excel. The next sync run (after Phase 1 deploys) will automatically correct prices from the "Aproximación FHA" column (Q). If immediate price correction is needed, the values from the Excel must be provided.

---

## Phase 4 — Verify Torre C Mapping

**Action:** Manually inspect the "Precios Torre C" sheet in the same Excel file and verify that `DISP_COLUMNS.blt_c` column indices are still correct:

| Field | Config Index | Expected Header |
|-------|-------------|-----------------|
| `statusCol` | 26 (AA) | "Estatus" |
| `clientCol` | 27 (AB) | "Cliente" |
| `asesorCol` | 28 (AC) | "Asesor" |
| `priceCol` | 17 (R) | "Aproximación FHA" |

If the headers don't match, apply the same column-index correction as Phase 1.

---

## Execution Order

1. **Phase 1 + Phase 2** → Code changes → Deploy to Vercel
2. **Phase 3** → Migration → Deploy via `supabase db push` (or Management API)
3. **Phase 4** → Manual verification (can be done in parallel with Phase 3)
4. After Phase 1+2 deploy, the **next hourly sync** will re-read the correct columns and update any remaining drift

---

## Verification Checklist

- [ ] After deploy: trigger manual sync via POST `/api/cron/onedrive-sync` (admin auth)
- [ ] Check `sync_runs` table — latest run should show status `SUCCESS` with reasonable `units_updated` count
- [ ] Visit `/disponibilidad` → BLT → Torre B: verify ~113 units green (AVAILABLE), 1 blue (RESERVED), 3 gray (SOLD)
- [ ] Spot-check unit 508 detail → status "Reservado", client "Andrea Sarahi Solorzano Alvarez"
- [ ] Spot-check unit 702 detail → status "Vendido", client "Josue Emanuel Coronado Lara"
- [ ] Verify prices are in the ~Q580K–Q786K range (not Q10,000)
- [ ] If Torre C was also affected, repeat verification for Torre C

---

## Future Prevention

Consider adding a **header validation step** to `parseDispBlt()`: before parsing data rows, read the header row and verify that the configured columns contain expected header text (e.g., `statusCol` header should contain "estatus", `clientCol` should contain "cliente"). If headers don't match, log an error and skip the file instead of silently parsing wrong columns. This would catch future column drift immediately.
