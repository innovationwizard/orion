# Plan: Cuotas de Enganche Personalizadas (Full Lifecycle)

**Created:** 2026-04-14
**Status:** Pending approval
**Item:** 2.2 from `docs/transcript-feature-extraction-2026-04-14.md`
**Solicitante:** Paula (reunión ventas 2026-04-14)

---

## 1. Problem Statement

### Business Problem

Enganche installments are currently computed as uniform monthly payments. In reality, clients regularly have non-uniform cash flows:

- **Aguinaldo** (December): clients can pay 2–3× the normal cuota
- **Bono 14** (July): same pattern
- **Extraordinary income**: any month of any year — commissions, bonuses, property sales
- **Cash-tight months**: clients may need to pay less in specific months

Salespeople need to present a realistic payment schedule in printed quotes. The current uniform-only schedule forces them back to Excel, defeating Orion's purpose.

### Technical Problem

1. **`computeEnganche()`** always generates uniform cuotas (last one absorbs rounding only)
2. **No persistence** of custom installment schedules — the installment array is computed on-the-fly and never stored
3. **PCV and carta de pago hardcode defaults** — they call `configFromDefaults()` (10% enganche, 7 cuotas, no rounding) instead of using per-reservation terms or per-project configs
4. **Pre-existing gap:** Migrations 042 and 048 added `cuotas_enganche`, `sale_price`, `enganche_pct`, `inmueble_pct` to the `reservations` table, but PCV/carta de pago ignore these fields entirely

### Financial Safety Constraint (from user)

> "any cuota changes cannot result in a financial loss or diminished gains for the company"

This translates to: **the total enganche must remain constant regardless of individual cuota changes**. The timing of payments changes; the total does not.

---

## 2. Current State — Detailed Audit

### 2.1 `computeEnganche()` (cotizador.ts:177–222)

```typescript
export function computeEnganche(
  price: number,
  config: Pick<CotizadorConfig, "round_enganche_q100" | "round_cuota_q100" | "round_cuota_q1">,
  enganche_pct: number,
  reserva: number,
  installment_months: number,
): EngancheResult
```

**Steps:**
1. `enganche_total = price × enganche_pct` (optionally rounded to Q100)
2. `enganche_neto = max(0, enganche_total - reserva)`
3. `cuota_enganche = enganche_neto / installment_months` (optionally rounded to Q100 or Q1)
4. Installment array: cuota 0 = reserva, cuotas 1..(n-1) = uniform, cuota n = remainder

**Return type:**
```typescript
interface EngancheResult {
  enganche_total: number;
  reserva: number;
  enganche_neto: number;
  cuota_enganche: number;
  installments: { number: number; amount: number }[];
}
```

### 2.2 `InstallmentTable` (installment-table.tsx)

- Read-only two-column table (Cuota | Monto)
- Props: `{ installments, currency }` — no editing capability
- Row 0 labeled "Reserva", rest "Cuota N"
- Footer: "Total enganche" with sum

### 2.3 Cotizador Client — Enganche Section (cotizador-client.tsx:426–484)

- Print-only summary line: "Enganche: N% | Cuotas de enganche: M"
- Interactive controls (hidden in print): slider (%), reserva input, cuotas count input
- Detail row: enganche_total, reserva, enganche_neto, cuota_enganche
- InstallmentTable rendering

### 2.4 PCV Document (pcv-client.tsx:422–434)

**Current (BROKEN — uses hardcoded defaults):**
```typescript
const _cfg = configFromDefaults();  // 10% enganche, 7 cuotas, no rounding
const price = unit.price_list ?? 0;
const enganche = computeEnganche(price, _cfg, _cfg.enganche_pct, reservaAmount, _cfg.installment_months);
```

**What it renders:**
- "Un primer pago de [reserva amount]" (reserva)
- "Un Enganche por la cantidad de [enganche_neto]" (net enganche)
- "Un último pago de [ultimo_pago]" (price - enganche_total)
- References "ANEXO II" for payment schedule — but ANEXO II is not implemented

**Does NOT use:**
- `reservation.sale_price` (ignored)
- `reservation.enganche_pct` (ignored)
- `reservation.cuotas_enganche` (ignored)
- Per-project cotizador_configs (not queried)

### 2.5 Carta de Pago (carta-pago-client.tsx:177–183)

**Current (same problem):**
```typescript
const _cfg = configFromDefaults();
const enganche = computeEnganche(price, _cfg, _cfg.enganche_pct, _cfg.reserva_default, _cfg.installment_months);
```

Shows only `enganche.cuota_enganche` — single uniform amount. No schedule table.

### 2.6 Reservation Table — Financial Columns

| Column | Migration | Type | Current Usage |
|--------|-----------|------|---------------|
| `deposit_amount` | 018 | numeric(14,2) | Used by PCV for reserva amount |
| `cuotas_enganche` | 042 | integer | Stored but **ignored by PCV/carta de pago** |
| `sale_price` | 048 | numeric | Stored but **ignored by PCV/carta de pago** |
| `enganche_pct` | 048 | numeric(5,4) | Stored but **ignored by PCV/carta de pago** |
| `inmueble_pct` | 048 | numeric(5,4) | Stored but **ignored by PCV/carta de pago** |

### 2.7 Blast Radius

`computeEnganche` is imported by 3 files:
- `cotizador-client.tsx` — display only, ephemeral
- `pcv-client.tsx` — legal document
- `carta-pago-client.tsx` — legal document

Installment data is **never persisted** and **never sent to APIs**. Changes to the engine function affect only these 3 rendering surfaces.

### 2.8 Who Calls What

| Caller | Price Source | Config Source | Enganche % | Cuotas Count | Schedule |
|--------|-------------|---------------|------------|--------------|----------|
| Cotizador | `selectedUnit.price_list` + sobreprecio - descuento | `resolveConfig()` (per project/tower/type) | User override or config default | User override or config default | Computed (uniform) |
| PCV | `unit.price_list` (ignores sale_price!) | `configFromDefaults()` (hardcoded!) | 10% (hardcoded!) | 7 (hardcoded!) | Computed (uniform) |
| Carta de Pago | `unit.price_list` | `configFromDefaults()` (hardcoded!) | 10% (hardcoded!) | 7 (hardcoded!) | Computed (uniform) |

---

## 3. Financial Safety Invariants

These are enforced in the computation engine and validated in the API:

1. **Total invariant:** `sum(cuota_amounts[1..n]) = enganche_neto` — ALWAYS. No edit changes the total.
2. **Redistribution:** When cuota K is overridden, all non-overridden cuotas share `(enganche_neto - sum_of_overrides)` uniformly.
3. **Floor per cuota:** `amount >= 1` (Q1 or $1). Prevents zero-value installments.
4. **Ceiling per override:** `max_for_cuota_K = enganche_neto - sum(other_overrides) - (remaining_non_overridden_count × 1)`. Prevents impossible distributions.
5. **Reserva excluded:** Cuota 0 (reserva) is separately editable via the existing reserva input field. Not part of override system.
6. **Override validation:** Override keys must be integers 1..installment_months. Keys outside this range are silently ignored.
7. **Graceful degradation:** If overrides are logically impossible (sum > enganche_neto - room), all overrides are ignored and uniform distribution is used. A warning is logged but no crash.

### Redistribution Example

```
enganche_neto = Q13,500  |  7 cuotas  |  uniform = Q1,929/cuota

User sets cuota 2 = Q4,000 (aguinaldo) and cuota 6 = Q3,000 (bono 14):
  overrideSum     = Q4,000 + Q3,000 = Q7,000
  remainingBalance = Q13,500 - Q7,000 = Q6,500
  nonOverridden    = 5 cuotas (1, 3, 4, 5, 7)
  uniformCuota     = Q6,500 / 5 = Q1,300
  lastNonOverridden (7) = Q6,500 - (Q1,300 × 4) = Q1,300

Result:
  Cuota 0 (Reserva): Q1,500    (unchanged)
  Cuota 1:           Q1,300    (redistributed)
  Cuota 2:           Q4,000 ★  (override — aguinaldo)
  Cuota 3:           Q1,300    (redistributed)
  Cuota 4:           Q1,300    (redistributed)
  Cuota 5:           Q1,300    (redistributed)
  Cuota 6:           Q3,000 ★  (override — bono 14)
  Cuota 7:           Q1,300    (redistributed, absorbs rounding)
  Sum(1..7):         Q13,500 ✓ (invariant holds)
  Total enganche:    Q15,000 ✓ (unchanged)
```

---

## 4. Implementation — Phase 1: Engine

### File: `src/lib/reservas/cotizador.ts`

**Change:** Add optional `overrides` parameter to `computeEnganche`.

```typescript
export function computeEnganche(
  price: number,
  config: Pick<CotizadorConfig, "round_enganche_q100" | "round_cuota_q100" | "round_cuota_q1">,
  enganche_pct: number,
  reserva: number,
  installment_months: number,
  overrides?: Record<number, number>,
): EngancheResult {
  // Steps 1–2 unchanged (enganche_total, enganche_neto)

  // Step 3: Handle overrides
  const validOverrides: Record<number, number> = {};
  let overrideSum = 0;

  if (overrides && installment_months > 0) {
    for (const [key, amount] of Object.entries(overrides)) {
      const k = Number(key);
      if (k >= 1 && k <= installment_months && amount > 0) {
        validOverrides[k] = amount;
        overrideSum += amount;
      }
    }

    // Safety: if overrides exceed budget, ignore all
    const nonOverriddenCount = installment_months - Object.keys(validOverrides).length;
    if (overrideSum > enganche_neto - nonOverriddenCount) {
      // Impossible distribution — fall back to uniform
      Object.keys(validOverrides).forEach(k => delete validOverrides[k]);
      overrideSum = 0;
    }
  }

  const hasOverrides = Object.keys(validOverrides).length > 0;

  // Step 3b: Compute uniform cuota
  let cuota_enganche: number;
  if (installment_months <= 0) {
    cuota_enganche = enganche_neto;
  } else if (hasOverrides) {
    const remainingBalance = enganche_neto - overrideSum;
    const remainingCount = installment_months - Object.keys(validOverrides).length;
    if (remainingCount <= 0) {
      cuota_enganche = 0; // all cuotas overridden
    } else if (config.round_cuota_q100) {
      cuota_enganche = roundUpQ100(remainingBalance / remainingCount);
    } else if (config.round_cuota_q1) {
      cuota_enganche = roundUpQ1(remainingBalance / remainingCount);
    } else {
      cuota_enganche = Math.round(remainingBalance / remainingCount);
    }
  } else {
    // Existing uniform logic (unchanged)
    if (config.round_cuota_q100) {
      cuota_enganche = roundUpQ100(enganche_neto / installment_months);
    } else if (config.round_cuota_q1) {
      cuota_enganche = roundUpQ1(enganche_neto / installment_months);
    } else {
      cuota_enganche = Math.round(enganche_neto / installment_months);
    }
  }

  // Step 4: Build installments
  const installments: { number: number; amount: number }[] = [
    { number: 0, amount: reserva },
  ];

  if (hasOverrides) {
    // Find the last non-overridden cuota (for rounding absorption)
    let lastNonOverridden = 0;
    for (let i = installment_months; i >= 1; i--) {
      if (!validOverrides[i]) { lastNonOverridden = i; break; }
    }

    let nonOverriddenSum = 0;
    for (let i = 1; i <= installment_months; i++) {
      if (validOverrides[i] != null) {
        installments.push({ number: i, amount: validOverrides[i] });
      } else if (i === lastNonOverridden && lastNonOverridden > 0) {
        // Last non-overridden absorbs rounding remainder
        const remainingBalance = enganche_neto - overrideSum;
        installments.push({ number: i, amount: remainingBalance - nonOverriddenSum });
      } else {
        installments.push({ number: i, amount: cuota_enganche });
        nonOverriddenSum += cuota_enganche;
      }
    }
  } else {
    // Existing uniform logic (unchanged)
    for (let i = 1; i <= installment_months; i++) {
      if (i === installment_months && installment_months > 1) {
        const previous_sum = cuota_enganche * (installment_months - 1);
        installments.push({ number: i, amount: enganche_neto - previous_sum });
      } else {
        installments.push({ number: i, amount: cuota_enganche });
      }
    }
  }

  return { enganche_total, reserva, enganche_neto, cuota_enganche, installments };
}
```

**Backward compatibility:** The `overrides` parameter is optional. All existing callers (cotizador, PCV, carta de pago) continue working unchanged until explicitly updated.

---

## 5. Implementation — Phase 2: Cotizador UI (Ephemeral)

### File: `src/app/cotizador/installment-table.tsx`

Add editing capability via optional props:

```typescript
type Props = {
  installments: { number: number; amount: number }[];
  currency?: "GTQ" | "USD";
  editing?: boolean;                                          // NEW
  overrides?: Record<number, number>;                         // NEW
  onOverride?: (cuotaNumber: number, amount: number) => void; // NEW
  onClearOverride?: (cuotaNumber: number) => void;            // NEW
  maxOverride?: (cuotaNumber: number) => number;              // NEW
};
```

**Rendering behavior:**

| `editing` | Row behavior | Amount display |
|-----------|-------------|----------------|
| `false` / omitted | Static text | `formatCurrency(amount)` |
| `true`, cuota 0 | Static text (reserva not editable here) | `formatCurrency(amount)` |
| `true`, cuota N | Number input | Input with value, min=1, max=maxOverride(N) |
| `true`, cuota N is overridden | Input + clear "×" button | Input with override value, highlighted row |

- Overridden rows: `bg-amber-50/50 font-semibold` (subtle, print-safe)
- Clear button: small "×" next to overridden cuota input
- Footer: always shows "Total enganche" — invariant confirmation
- All inputs wrapped in `cotizador-no-print` class

### File: `src/app/cotizador/cotizador-client.tsx`

**New state (after existing sobreprecio state):**

```typescript
const [editingInstallments, setEditingInstallments] = useState(false);
const [installmentOverrides, setInstallmentOverrides] = useState<Record<number, number>>({});
```

**Reset triggers (add to all 3 existing reset locations):**
- Config change useEffect → `setEditingInstallments(false); setInstallmentOverrides({});`
- Project change handler → same
- Unit change handler → same

**Pass overrides to computeEnganche:**

```typescript
const enganche = useMemo(
  () => computeEnganche(
    effectivePrice, config, enganchePct, reserva, installmentMonths,
    Object.keys(installmentOverrides).length > 0 ? installmentOverrides : undefined
  ),
  [effectivePrice, config, enganchePct, reserva, installmentMonths, installmentOverrides],
);
```

**Max override calculator (useCallback):**

```typescript
const maxOverrideFor = useCallback((cuotaNumber: number) => {
  const otherOverrides = Object.entries(installmentOverrides)
    .filter(([k]) => Number(k) !== cuotaNumber)
    .reduce((s, [, v]) => s + v, 0);
  const nonOverriddenAfter = installmentMonths
    - Object.keys(installmentOverrides).filter(k => Number(k) !== cuotaNumber).length
    - 1; // minus the cuota being edited
  return enganche.enganche_neto - otherOverrides - Math.max(0, nonOverriddenAfter);
}, [installmentOverrides, installmentMonths, enganche.enganche_neto]);
```

**Toggle UI (after InstallmentTable):**

```tsx
<div className="flex items-center gap-3 cotizador-no-print">
  <button
    onClick={() => {
      if (editingInstallments) {
        setEditingInstallments(false);
        setInstallmentOverrides({});
      } else {
        setEditingInstallments(true);
      }
    }}
    className="text-xs text-muted underline"
  >
    {editingInstallments ? "Restaurar cuotas uniformes" : "Personalizar cuotas"}
  </button>
</div>
```

**InstallmentTable invocation update:**

```tsx
<InstallmentTable
  installments={enganche.installments}
  currency={config.currency}
  editing={editingInstallments}
  overrides={installmentOverrides}
  onOverride={(n, amt) => setInstallmentOverrides(prev => ({ ...prev, [n]: amt }))}
  onClearOverride={(n) => setInstallmentOverrides(prev => {
    const next = { ...prev };
    delete next[n];
    return next;
  })}
  maxOverride={maxOverrideFor}
/>
```

---

## 6. Implementation — Phase 3: DB Persistence

### File: `scripts/migrations/054_enganche_schedule.sql`

```sql
-- Migration 054: Custom enganche installment schedule
-- Allows non-uniform cuota amounts on reservations.
-- NULL = uniform distribution (computed on-the-fly from enganche_pct + cuotas_enganche).

ALTER TABLE reservations
ADD COLUMN enganche_schedule jsonb DEFAULT NULL;

COMMENT ON COLUMN reservations.enganche_schedule IS
  'Custom enganche installment schedule. JSON array of objects:
   [{"cuota": 1, "amount": 5000}, {"cuota": 2, "amount": 8000}, ...].
   NULL = compute uniform distribution from enganche_pct and cuotas_enganche.
   When set, PCV and carta de pago render this schedule.
   Invariant: sum(amounts) must equal enganche_neto.';
```

**JSONB schema:**

```json
[
  { "cuota": 1, "amount": 5000.00 },
  { "cuota": 2, "amount": 8000.00 },
  { "cuota": 3, "amount": 5000.00 }
]
```

- `cuota`: integer, 1-indexed (cuota 0 = reserva, stored separately as `deposit_amount`)
- `amount`: numeric, positive, >= 1
- Array length must equal `cuotas_enganche`
- Sum of amounts must equal `enganche_neto` (computed: `sale_price × enganche_pct - deposit_amount`)
- NULL = uniform (backward compatible, existing reservations unaffected)

---

## 7. Implementation — Phase 4: Fix PCV & Carta de Pago

### Pre-existing Bug: PCV/Carta de Pago Ignore Reservation-Level Pricing

**Current state (WRONG):**
```
PCV calls configFromDefaults() → 10% enganche, 7 cuotas, Q1,500 reserva
Carta de Pago same pattern
```

**Expected state (CORRECT):**
```
PCV reads reservation.sale_price, reservation.enganche_pct, reservation.cuotas_enganche
Falls back to per-project cotizador_configs (via resolveConfig)
Falls back to configFromDefaults() only if no project config exists
```

### File: `src/app/api/reservas/admin/pcv/[id]/route.ts`

Update GET handler to include resolved cotizador config:

```typescript
// After fetching reservation + unit data...

// Resolve cotizador config for this unit's project/tower/type
const { data: configRows } = await supabase
  .from("cotizador_configs")
  .select("*")
  .eq("project_id", unit.project_id)
  .eq("is_active", true)
  .order("display_order");

// Include in response
return jsonOk({
  ...existingResponse,
  cotizador_configs: configRows ?? [],
});
```

### File: `src/app/admin/reservas/pcv/[id]/pcv-client.tsx`

Replace hardcoded defaults with reservation-aware resolution:

```typescript
// Import resolveConfig
import { resolveConfig } from "@/hooks/use-cotizador-config";

// Resolve config from project configs (or fallback to defaults)
const cfg = cotizadorConfigs.length > 0
  ? resolveConfig(cotizadorConfigs, unit.tower_id, unit.unit_type, unit.bedrooms)
  : configFromDefaults();

// Use reservation-level overrides where available
const price = reservation.sale_price ?? unit.price_list ?? 0;
const enganchePct = reservation.enganche_pct ?? cfg.enganche_pct;
const cuotasCount = reservation.cuotas_enganche ?? cfg.installment_months;
const reservaAmount = reservation.deposit_amount ?? cfg.reserva_default;

// Convert stored schedule to overrides format
const scheduleOverrides = reservation.enganche_schedule
  ? Object.fromEntries(
      reservation.enganche_schedule.map((s: { cuota: number; amount: number }) => [s.cuota, s.amount])
    )
  : undefined;

const enganche = computeEnganche(price, cfg, enganchePct, reservaAmount, cuotasCount, scheduleOverrides);
```

### File: `src/app/api/reservas/admin/carta-pago/[id]/route.ts`

Same pattern: include cotizador_configs in response.

### File: `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx`

Same resolution pattern as PCV.

### Rendering Changes in PCV

When `enganche_schedule` is set (non-uniform cuotas):
- In ANEXO II or the enganche section, render the full installment table instead of just the total
- Show each cuota with its specific amount
- Maintain the existing legal language format

When `enganche_schedule` is NULL (uniform):
- Current behavior (single cuota_enganche amount)
- But now computed from per-project config instead of hardcoded defaults

---

## 8. Implementation — Phase 5: Admin UI

### File: `src/app/admin/reservas/reservation-detail.tsx`

Add a "Plan de Enganche" section (visible for CONFIRMED reservations):

1. Read-only display of current schedule (from DB or computed uniform)
2. "Personalizar cuotas" toggle → InstallmentTable in editing mode
3. "Guardar plan de enganche" button → PATCH to API
4. Financial invariant enforced in UI and validated server-side

**Data flow:**
```
Admin clicks "Personalizar cuotas"
  → InstallmentTable enters editing mode
  → Admin edits individual cuotas
  → Overrides tracked in local state
  → Admin clicks "Guardar"
  → PATCH /api/reservas/admin/reservations/[id] { enganche_schedule: [...] }
  → Server validates: sum = enganche_neto, all cuotas >= 1, sequential 1..N
  → Stored in reservations.enganche_schedule (JSONB)
  → Next PCV/carta de pago render uses stored schedule
```

### File: `src/app/api/reservas/admin/reservations/[id]/route.ts`

Add `enganche_schedule` to accepted PATCH fields:

```typescript
// In Zod schema for PATCH
enganche_schedule: z.array(z.object({
  cuota: z.number().int().min(1),
  amount: z.number().min(1),
})).nullable().optional(),
```

**Server-side validation:**
1. All cuota numbers must be sequential 1..N where N = `reservation.cuotas_enganche`
2. Each amount >= 1
3. `sum(amounts)` must equal computed `enganche_neto`:
   - `price = reservation.sale_price ?? unit.price_list`
   - `enganche_total = price × reservation.enganche_pct`
   - `enganche_neto = enganche_total - reservation.deposit_amount`
   - Tolerance: ±1 (rounding)

**Audit:** `logAudit(user, { eventType: "reservation.schedule_updated", ... })`

### File: `src/lib/reservas/validations.ts`

Add Zod schema for enganche schedule:

```typescript
export const engancheScheduleSchema = z.array(z.object({
  cuota: z.number().int().min(1),
  amount: z.number().min(1),
}));
```

---

## 9. Phase 6: Signed Quotes & PDF Storage (Future — Not This Ticket)

The user mentioned:
- "Most printed cotizador views will not be signed. We will need a column to sort out those that were signed."
- "Saving all printed documents to an additional storage bucket is allowed."

### Proposed Architecture (for future ticket)

```sql
CREATE TABLE cotizador_quotes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id         uuid NOT NULL REFERENCES rv_units(id),
  salesperson_id  uuid NOT NULL REFERENCES salespeople(id),
  project_id      uuid NOT NULL REFERENCES projects(id),

  -- Snapshot of pricing
  price_list      numeric(14,2) NOT NULL,   -- unit price at time of quote
  sobreprecio     numeric(14,2) DEFAULT 0,  -- markup amount
  descuento       numeric(14,2) DEFAULT 0,  -- discount amount
  effective_price numeric(14,2) NOT NULL,   -- final price for calculations

  -- Enganche terms
  enganche_pct    numeric(5,4) NOT NULL,
  reserva         numeric(14,2) NOT NULL,
  cuotas_count    integer NOT NULL,
  enganche_schedule jsonb,                  -- custom cuota array (null = uniform)

  -- Config snapshot
  config_id       uuid REFERENCES cotizador_configs(id),
  config_snapshot jsonb NOT NULL,           -- full config at time of quote

  -- Lifecycle
  is_signed       boolean NOT NULL DEFAULT false,
  signed_at       timestamptz,
  pdf_url         text,                     -- Supabase Storage URL
  created_at      timestamptz DEFAULT now(),

  -- Link to reservation (set when quote leads to a reservation)
  reservation_id  uuid REFERENCES reservations(id)
);
```

- `quotes` Storage bucket for PDFs
- PDF capture via `html2canvas` + `jsPDF` (or server-side rendering)
- Admin UI to mark a quote as "signed"
- When creating a reservation, optionally link to a signed quote → auto-populate financial terms

**Not implemented in this ticket** — noted for future planning.

---

## 10. Files Summary

| Phase | File | Change Type |
|-------|------|-------------|
| 1 | `src/lib/reservas/cotizador.ts` | Modify `computeEnganche` — add optional `overrides` param |
| 2 | `src/app/cotizador/installment-table.tsx` | Add editing mode (optional props, backward compatible) |
| 2 | `src/app/cotizador/cotizador-client.tsx` | Add state, reset, toggle, max calculator, wire props |
| 3 | `scripts/migrations/054_enganche_schedule.sql` | Add `enganche_schedule` JSONB to `reservations` |
| 4 | `src/app/api/reservas/admin/pcv/[id]/route.ts` | Include cotizador_configs in GET response |
| 4 | `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` | Use reservation pricing + project config + custom schedule |
| 4 | `src/app/api/reservas/admin/carta-pago/[id]/route.ts` | Include cotizador_configs in GET response |
| 4 | `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` | Use reservation pricing + project config + custom schedule |
| 5 | `src/app/admin/reservas/reservation-detail.tsx` | Add "Plan de Enganche" editable section |
| 5 | `src/app/api/reservas/admin/reservations/[id]/route.ts` | Accept `enganche_schedule` in PATCH, server-side validation |
| 5 | `src/lib/reservas/validations.ts` | Add `engancheScheduleSchema` |
| 5 | `src/lib/reservas/types.ts` | Add schedule-related types |

---

## 11. Debugging Guide

### Common Issues

**Q: Custom cuotas don't appear in PCV.**
Check:
1. `reservation.enganche_schedule` is not NULL in DB
2. PCV API route returns `cotizador_configs` array
3. PCV client calls `computeEnganche` with `scheduleOverrides`
4. `resolveConfig` finds the right project config

**Q: Total enganche doesn't match after editing cuotas.**
Check:
1. `computeEnganche` invariant: print `installments.reduce((s, i) => s + i.amount, 0)` vs `enganche_neto + reserva`
2. Rounding mode: `round_cuota_q100` or `round_cuota_q1` can cause drift in the last-non-overridden calculation
3. The safety valve: if overrideSum exceeded budget, all overrides were silently dropped

**Q: PCV still shows 10% / 7 cuotas after fix.**
Check:
1. `cotizador_configs` has active rows for that project
2. The API route queries with `project_id = unit.project_id`
3. `resolveConfig` receives the correct tower_id, unit_type, bedrooms from unit data
4. `reservation.enganche_pct` and `reservation.cuotas_enganche` are set (not NULL)

**Q: Admin saves schedule but PCV doesn't reflect it.**
Check:
1. PATCH response includes updated `enganche_schedule` JSONB
2. PCV API re-fetches reservation data (no caching)
3. `scheduleToOverrides` correctly maps `[{cuota, amount}]` → `Record<number, number>`

**Q: Schedule validation fails on server.**
Check:
1. Sum of amounts matches `enganche_neto` within ±1 tolerance
2. All cuota numbers are 1..N (no gaps, no duplicates)
3. `reservation.cuotas_enganche` is set (not NULL) — needed to know expected N
4. `reservation.sale_price` or `unit.price_list` is available for computing enganche_neto

**Q: Cotizador edits reset unexpectedly.**
Check:
1. Overrides reset in the config-change useEffect (dep array includes `config.enganche_pct`, `config.reserva_default`, `config.installment_months`)
2. Changing enganche slider, reserva, or cuotas count also triggers recomputation — overrides are intentionally preserved (only reset on config/unit/project change)

### Key Invariants to Verify

```typescript
// In computeEnganche, after building installments:
const totalFromInstallments = installments.reduce((s, i) => s + i.amount, 0);
const expected = enganche_total; // = enganche_neto + reserva
console.assert(
  Math.abs(totalFromInstallments - expected) <= 1,
  `Invariant violation: ${totalFromInstallments} !== ${expected}`
);
```

### Database Queries for Debugging

```sql
-- Check if a reservation has a custom schedule
SELECT id, enganche_schedule, sale_price, enganche_pct, cuotas_enganche, deposit_amount
FROM reservations WHERE id = '<reservation_id>';

-- Verify schedule sum matches enganche_neto
SELECT
  r.id,
  r.sale_price * r.enganche_pct AS enganche_total,
  r.sale_price * r.enganche_pct - r.deposit_amount AS enganche_neto,
  (SELECT sum((e->>'amount')::numeric) FROM jsonb_array_elements(r.enganche_schedule) e) AS schedule_sum
FROM reservations r
WHERE r.enganche_schedule IS NOT NULL;

-- List all reservations with custom schedules
SELECT r.id, u.unit_number, p.name AS project, r.enganche_schedule
FROM reservations r
JOIN rv_units u ON u.id = r.unit_id
JOIN v_rv_units_full v ON v.id = u.id
JOIN projects p ON p.id = v.project_id
WHERE r.enganche_schedule IS NOT NULL;
```

---

## 12. Verification Plan

### Financial Safety (Critical)
- [ ] Edit any cuota → verify total enganche footer NEVER changes
- [ ] Edit cuota to maximum → verify remaining cuotas = Q1 each (floor)
- [ ] Try to exceed max → verify input is clamped
- [ ] Edit multiple cuotas → verify remaining redistribute correctly
- [ ] Clear an override → verify cuotas return to uniform for remaining
- [ ] "Restaurar cuotas uniformes" → verify all overrides cleared

### Persistence
- [ ] Set custom schedule on confirmed reservation → verify saved to DB
- [ ] Reload page → verify schedule persists
- [ ] Set schedule to NULL (uniform) → verify DB column is NULL
- [ ] API validation: reject schedule where sum ≠ enganche_neto
- [ ] API validation: reject schedule with gaps (cuota 1, 3 — missing 2)
- [ ] API validation: reject schedule with amount < 1

### PCV & Carta de Pago
- [ ] PCV with custom schedule → renders custom amounts
- [ ] PCV without schedule (NULL) → computes uniform from per-project config
- [ ] PCV for BLT → uses BLT config (7%, 24 cuotas), NOT defaults (10%, 7)
- [ ] PCV for SE → uses SE config (30%, 18 cuotas, USD)
- [ ] Carta de pago same tests

### Cotizador (Ephemeral)
- [ ] Without editing: InstallmentTable identical to current
- [ ] Edit cuotas → custom amounts in table, total unchanged
- [ ] Print with custom cuotas → prints custom amounts, no toggle/inputs visible
- [ ] Change enganche %, reserva, cuotas count → overrides cleared
- [ ] Change unit → overrides cleared
- [ ] Change project → overrides cleared

### Backward Compatibility
- [ ] Existing reservations (no enganche_schedule) → PCV/carta de pago unchanged
- [ ] `computeEnganche` without overrides → identical output
- [ ] InstallmentTable without editing props → identical rendering
- [ ] PCV/carta de pago for projects with no cotizador_configs → falls back to defaults

### Build
- [ ] `next build` passes with zero errors
