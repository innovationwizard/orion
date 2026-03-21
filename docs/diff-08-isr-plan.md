# DIFF-08: ISR Retention — Presentation Layer

## Context

**Problem:** The SSOT (CFO's Excel "Pagos" sheet) applies ISR retention to commission disbursements: `Total a pagar = Total a facturar × 107/112`. The app has zero ISR logic — it shows raw commission amounts with no differentiation between "to invoice" and "to pay." Pati needs this distinction for payment instructions.

**SSOT formula (Guatemalan tax):**
```
commission_amount    = base commission (pre-IVA) — what's in the DB
Total a facturar     = commission_amount × 1.12  (add 12% IVA)
ISR retenido         = commission_amount × 0.05  (5% retention on base)
Total a pagar        = commission_amount × 1.07  (base + IVA - ISR)

Verification: 1.07 / 1.12 = 107/112 ✓
```

**ISR exemption:** Some recipients are exempt (company-internal accounts that don't receive actual disbursements). User confirmed split rules exist but doesn't have them at hand — so exemption must be **configurable per recipient**. Sensible defaults: ahorro, ahorro_comercial, ahorro_por_retiro are accumulation-only accounts (never disbursed). Puerta Abierta is the company's own share. All others (people) get ISR applied.

**Scope:** Presentation-layer only. No changes to `calculate_commissions()`. No new pages. No export/CSV (future).

---

## Changes

### File 1: `scripts/migrations/036_isr_exempt.sql` (NEW)

Add `isr_exempt` boolean to `commission_rates`:

```sql
ALTER TABLE commission_rates ADD COLUMN isr_exempt boolean NOT NULL DEFAULT false;

-- Set exempt for company-internal accounts (never disbursed to a person)
UPDATE commission_rates SET isr_exempt = true
WHERE recipient_id IN ('puerta_abierta', 'ahorro', 'ahorro_comercial', 'ahorro_por_retiro');
```

- Default `false` = ISR applies (safe default for all new recipients)
- Recipients NOT in `commission_rates` (ejecutivos, GC/Supervisor) = ISR always applies (they're individuals)
- User can adjust exemptions anytime via direct DB update or future admin UI

No recalculation needed — no commission data changes.

### File 2: `src/lib/isr.ts` (NEW)

ISR utility module with constants and compute function:

```typescript
// Guatemala tax constants
export const IVA_RATE = 0.12;
export const ISR_RATE = 0.05;
export const PAGO_FACTOR = 107 / 112; // 1.07 / 1.12

export type ISRBreakdown = {
  base: number;          // commission_amount (pre-IVA)
  facturar: number;      // base × 1.12
  isrRetenido: number;   // base × 0.05
  pagar: number;         // base × 1.07 (= facturar × 107/112)
};

export function computeISR(base: number, isExempt: boolean): ISRBreakdown {
  if (isExempt) {
    return { base, facturar: base, isrRetenido: 0, pagar: base };
  }
  return {
    base,
    facturar: base * (1 + IVA_RATE),
    isrRetenido: base * ISR_RATE,
    pagar: base * (1 + IVA_RATE - ISR_RATE),
  };
}
```

For exempt recipients: facturar = pagar = base (no IVA, no ISR — internal account).

### File 3: `src/app/api/analytics/commissions/route.ts` (EDIT)

Changes to the existing commission analytics endpoint:

1. **Fetch `isr_exempt`** alongside `recipient_type` from `commission_rates`:
   ```typescript
   .select("recipient_id, recipient_type, isr_exempt")
   ```
   Build a `Map<string, boolean>` for exempt lookup (default `false` for recipients not in the table).

2. **Add ISR fields to per-recipient response:**
   ```typescript
   // After computing totalAmount, paidAmount, unpaidAmount:
   const isExempt = exemptMap.get(recipientId) ?? false;
   const isr = computeISR(item.totalAmount, isExempt);
   return {
     ...existing fields,
     isrExempt: isExempt,
     facturar: isr.facturar,
     isrRetenido: isr.isrRetenido,
     pagar: isr.pagar,
   };
   ```

3. **Add ISR fields to summary:**
   ```typescript
   summary: {
     total, paid, unpaid,           // existing
     facturar, isrRetenido, pagar   // new (summed across non-exempt recipients)
   }
   ```

### File 4: `src/components/commission-bars.tsx` (EDIT)

1. **Extend `CommissionBarItem` type** with ISR fields:
   ```typescript
   export type CommissionBarItem = {
     ...existing,
     isrExempt?: boolean;
     facturar?: number;
     isrRetenido?: number;
     pagar?: number;
   };
   ```

2. **Show "a pagar" amount** in the bar row:
   - Right side: show both base amount and net pagar amount for non-exempt recipients
   - Exempt recipients: show base amount only (no ISR line)
   - Format: `Q10,000` with a secondary line `Neto: Q9,554` (smaller, muted text)

### File 5: `src/app/dashboard-client.tsx` (EDIT)

1. **Update `CommissionAnalyticsResponse` type** to include ISR summary fields.

2. **Add ISR summary KPI cards** below existing ones in the Comisiones tab:
   ```
   [Total a Facturar] [ISR Retenido] [Total a Pagar]
   ```
   - "Total a Facturar" = sum of `facturar` for non-exempt recipients
   - "ISR Retenido" = sum of `isrRetenido`
   - "Total a Pagar" = sum of `pagar`

### File 6: `public/metadata/commission-rules.json` (EDIT)

Add ISR section:

```json
"isr": {
  "formula": "Total a pagar = Total a facturar × 107/112",
  "iva_rate": 0.12,
  "isr_rate": 0.05,
  "description": "5% ISR retention on pre-IVA amount. Applied to all recipients except company-internal accounts.",
  "exempt_recipients_note": "Configurable via commission_rates.isr_exempt column. Defaults: puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro.",
  "migration": "036"
}
```

---

## Files Summary

| # | File | Action |
|---|------|--------|
| 1 | `scripts/migrations/036_isr_exempt.sql` | NEW |
| 2 | `src/lib/isr.ts` | NEW |
| 3 | `src/app/api/analytics/commissions/route.ts` | EDIT |
| 4 | `src/components/commission-bars.tsx` | EDIT |
| 5 | `src/app/dashboard-client.tsx` | EDIT |
| 6 | `public/metadata/commission-rules.json` | EDIT |

---

## What This Does NOT Change

- `calculate_commissions()` function — untouched (ISR is presentation-layer)
- `commissions` table schema — no new columns on commission rows
- No new pages or routes
- No export/CSV feature (future enhancement)
- No changes to any other API endpoints

---

## Verification

1. Deploy migration 036 via Management API (just an ALTER + UPDATE, no recalculation)
2. Verify `commission_rates` has `isr_exempt = true` for the 4 company accounts
3. `next build` — confirm TypeScript compiles
4. Deploy to Vercel
5. Dashboard → Comisiones tab: confirm ISR KPI cards appear with correct math
6. Spot-check: recipient with Q10,000 base → facturar Q11,200, ISR Q500, pagar Q10,700
7. Spot-check: exempt recipient (e.g., ahorro) shows no ISR
8. Update `docs/commission-audit-plan.md` → DIFF-08 RESOLVED
9. Changelog entry + MEMORY.md update


---

## ADDENDUM 2026-03-20: BLT Torre B — Authoritative Correction

**Source:** Jorge (project owner), direct confirmation.
**Cross-reference:** `docs/creditos-33-units-investigation.md` (UPDATE 2026-03-20)

During the Créditos dashboard backfill investigation, 24 BLT Torre B units were flagged with credit data but no reservations. The "INFO PARA REPORTES" Excel sheet listed 58 rows of client data, suggesting 58 hidden sales. Upon authoritative review:

1. **Only 3 sales exist in Bosque Las Tapias — Torre B.** The 58 rows in "INFO PARA REPORTES" do NOT represent real sales. The true number is **3**.
2. **All existing BLT Torre B sales records will be dropped from the production database** to establish a clean baseline.
3. **Only the 3 currently existing sales will be uploaded** as the sole BLT Torre B transactions.

Any prior references in this document to BLT Torre B having 11 hidden reservations (Category C), 13 orphan income markers (Category D), or 58 clients missing from the DB are **superseded** by this correction.