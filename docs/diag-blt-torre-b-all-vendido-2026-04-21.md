# Diagnostic: BLT Torre B — All Units Showing "Vendido"

**Date:** 2026-04-21
**Reporter:** Jorge
**Severity:** Critical — production data integrity
**Scope:** `/disponibilidad` → Bosque Las Tapias → Torre B (117 units)

---

## Symptom

The `/disponibilidad` page shows **every unit** in BLT Torre B as "Vendido" (gray, `#6b7280`). The SSOT Excel file (`BOSQUE_LAS_TAPIAS_2_Precios_y_Disponibilidad.xlsx`, sheet "Precios Torre B") shows only **4 units** with any status — 1 "Reservado" and 3 "PCV". All other units should be "Disponible".

---

## Root Cause

**Stale column mapping** in `src/lib/sync/constants.ts:115-124`.

The "Precios Torre B" sheet had columns inserted since the mapping was created. The column indices in `DISP_COLUMNS.blt_b` no longer point at the correct columns.

### Column Drift

| Field | Config Index | Config Column | Actual Column | What Config Reads |
|-------|-------------|---------------|---------------|-------------------|
| `statusCol` | **23** (X) | "Estatus" | **Z (25)** | "Total" — numeric value (e.g., `4426.18`) |
| `clientCol` | **24** (Y) | "Cliente" | **AA (26)** | "Precio Final" — numeric value (e.g., `678000`) |
| `asesorCol` | **25** (Z) | "Asesor" | **AB (27)** | "Estatus" — text ("Reservado", "PCV") |
| `priceCol` | **15** (P) | "Aproximación FHA" | **Q (16)** | "Estrategia Comercial" — value `10,000` |

### The Kill Chain

1. **Hourly cron** (`/api/cron/onedrive-sync`) triggers `runSync()`.
2. Sync downloads `BOSQUE_LAS_TAPIAS_2_Precios_y_Disponibilidad.xlsx` from OneDrive.
3. `parseDispBlt()` reads the "Precios Torre B" sheet using `DISP_COLUMNS.blt_b`.
4. For each row, `cellStr(ws, row, 23)` reads column X — which is **"Total"** (a monetary value like `4426.18`), NOT "Estatus".
5. `normalizeStatus("4426.18")` hits the numeric regex on line 216:
   ```typescript
   if (/^\d+(\.\d+)?$/.test(key)) return "SOLD";
   ```
   Every unit with a total price → `"SOLD"`.
6. `syncUnitStatuses()` compares parsed status against DB. For all non-`SOFT_HOLD` units, it writes `status = "SOLD"` to `rv_units`.
7. `/disponibilidad` reads `v_rv_units_full` and renders all 117 units as gray "Vendido".

### Secondary Issues

| Issue | Impact |
|-------|--------|
| `priceCol` reads "Estrategia Comercial" (Q10,000) instead of "Aproximación FHA" (Q668,000) | Unit prices in DB are wrong — showing Q10,000 instead of real list prices |
| `clientCol` reads "Precio Final" (numeric) instead of "Cliente" (name) | Client names from sync are garbage (numeric strings) |
| `asesorCol` reads "Estatus" instead of "Asesor" | Salesperson association from sync is wrong |
| `normalizeStatus()` numeric heuristic treats ANY number as SOLD | Dangerous default — any future column mis-read with numeric data → mass SOLD |

### Affected Data in Production

- **117 units** in Torre B have incorrect `status = "SOLD"` (only ~4 should be non-AVAILABLE)
- **117 units** have incorrect `price_list` (Q10,000 instead of real prices)
- **unit_status_log** has 117+ incorrect status change entries from the sync
- Every hourly cron run **re-applies** the damage (no-ops now since status is already SOLD, but locks in the error)

---

## Evidence

### From the Excel (user-provided screenshots)

**Row 1 headers confirmed:**

| Column | Index | Header |
|--------|-------|--------|
| B | 1 | unit number |
| P | 15 | Estrategia Comercial |
| Q | 16 | Aproximación FHA |
| X | 23 | Total |
| Y | 24 | Precio Final |
| Z | 25 | **Estatus** |
| AA | 26 | **Cliente** |
| AB | 27 | **Asesor** (user-confirmed) |

**Data rows (only 4 non-empty in Estatus):**

| Unit | Excel Row | Estatus (Z) | Cliente (AA) |
|------|-----------|-------------|--------------|
| 508 | 46 | Reservado | Andrea Sarahi Solorzano Alvarez |
| 702 | 58 | PCV | Josue Emanuel Coronado Lara |
| 1305 | 115 | PCV | Evelin Yanira Ramos Regalado |
| 1307 | 117 | PCV | José Ariel Miranda Aldana |

All other rows have empty Estatus → should be `"AVAILABLE"` (per `normalizeStatus(null) → "AVAILABLE"`).

### From the App (user-provided screenshot)

All 117 units rendered in uniform gray (`#6b7280` = SOLD color) with 0.6 opacity. No green (AVAILABLE), no blue (RESERVED), no purple (FROZEN).

### From the Code

- **`normalizeStatus()`** — `src/lib/sync/excel-parser.ts:211-219`
- **`DISP_COLUMNS.blt_b`** — `src/lib/sync/constants.ts:115-124`
- **`syncUnitStatuses()`** — `src/lib/sync/sync-engine.ts:205-280`
- **`parseDispBlt()`** — `src/lib/sync/excel-parser.ts:241-275`

---

## Risk: Torre C May Also Be Affected

Torre C has a separate mapping (`DISP_COLUMNS.blt_c`) with `statusCol: 26` (AA). If the "Precios Torre C" sheet also had columns inserted, Torre C could have the same bug. **Requires verification against the actual Excel.**

---

## Timeline

The bug was introduced when column(s) were inserted into the "Precios Torre B" Excel sheet. The sync has been overwriting all Torre B units to SOLD on every hourly run since the column shift occurred. The exact date depends on when the Excel was modified — this can be checked via the `sync_runs` table or OneDrive file history.
