# Plan: Phase 4 — Role-Aware Field Masking

**Date:** 2026-03-20
**Gap:** GAP-03 (No Server-Side Field Masking on Analytics Routes)
**Prerequisite:** Phase 2 (Permission Architecture) — ✅ COMPLETED 2026-03-20
**Trigger:** Activation of gerencia / financiero / contabilidad roles for real users
**Effort:** ~24 hours

---

## Problem

All analytics API routes return the same full dataset regardless of the caller's role. When `gerencia`, `financiero`, or `contabilidad` users log in, they see:

- Individual commission amounts per salesperson (ISR breakdowns, rates, paid/unpaid)
- Client PII: phone, email, DPI (13-digit national ID)
- Salesperson performance comparisons
- Payment delinquency per unit with client identity
- Commission rates per person and management role assignments

These roles have legitimate `analytics.view` access (defined in PERMISSIONS matrix), but their **field-level** visibility must be scoped to their job function.

---

## Routes in Scope

| # | Route | Guard | What it returns | Masking needed |
|---|-------|-------|-----------------|----------------|
| 1 | `GET /api/analytics/commissions` | DATA_VIEWER_ROLES | Commission amounts per recipient, ISR details, disbursement status | Redact per-recipient breakdown for gerencia |
| 2 | `GET /api/analytics/payments` | DATA_VIEWER_ROLES | Payment history per unit with client names, amounts, breakdown | Redact client contact, mask amounts for gerencia |
| 3 | `GET /api/analytics/payment-compliance` | DATA_VIEWER_ROLES | Payment compliance per unit, delinquency days, aging buckets | Redact client contact |
| 4 | `GET /api/analytics/cash-flow-forecast` | DATA_VIEWER_ROLES | Monthly expected/forecasted/actual amounts | No masking — aggregate data, safe for all viewers |
| 5 | `GET /api/commissions` | DATA_VIEWER_ROLES | Raw commission rows with amounts per payment | Redact per-row amounts for gerencia |

**Route 4 excluded from masking** — purely aggregate time-series data with no PII or per-person breakdown.

---

## Proposed Masking Rules

### DECISION POINT: Role-Specific Visibility

These are proposed defaults based on role descriptions. **Jorge must confirm before implementation.**

| Field Category | master | torredecontrol | financiero | contabilidad | gerencia |
|----------------|--------|----------------|------------|--------------|----------|
| Project-level aggregates (totals, counts, summaries) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client names (display only) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Client contact (phone, email) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Individual commission amounts per recipient | ✅ | ✅ | ✅ | ✅ | ❌ |
| Commission rates per person | ✅ | ✅ | ✅ | ❌ | ❌ |
| ISR calculations (facturar, isrRetenido, pagar) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Salesperson name + amount pairing | ✅ | ✅ | ✅ | ❌ | ❌ |
| Payment delinquency per unit | ✅ | ✅ | ✅ | ✅ | ✅ |
| Payment history per unit (amounts) | ✅ | ✅ | ✅ | ✅ | ❌ (summary only) |
| Disbursable/non-disbursable split | ✅ | ✅ | ✅ | ✅ | ❌ |

### Rationale

- **financiero (CFO):** Needs full financial visibility for budgeting, disbursement approval, and tax oversight. Sees individual commissions, ISR, rates. Does NOT need client contact info (PII minimization).
- **contabilidad (accounting):** Needs commission totals for invoicing and ISR for tax filing. Does NOT need to see which salesperson earns what (privacy). Does NOT need client contact.
- **gerencia (management):** Needs high-level KPIs: total revenue, project performance, cash flow, payment compliance trends. Does NOT need individual commission breakdowns, ISR, or per-unit payment history (aggregates suffice).

---

## Technical Architecture

### Approach: Post-Query Response Shaping

```
Supabase query → full dataset → maskResponse(role, resource, data) → jsonOk(masked)
```

Why post-query (not query-level):
- Same DB queries for all roles — simpler to maintain
- Masking is a thin transform layer, easy to audit
- Full dataset stays in server memory only (never reaches client)
- PERMISSIONS matrix already controls access-or-no-access; this layer controls field-level granularity

### File: `src/lib/field-masking.ts`

```typescript
// Core types
type Sensitivity = "public" | "internal" | "confidential" | "restricted";

type MaskingRule = {
  field: string;
  sensitivity: Sensitivity;
  mask: "redact" | "anonymize" | "aggregate" | "nullify";
};

type ResourceMaskingConfig = {
  resource: string;
  rules: MaskingRule[];
};

// Role → maximum sensitivity level visible
const ROLE_VISIBILITY: Record<Role, Sensitivity> = {
  master: "restricted",
  torredecontrol: "restricted",
  financiero: "confidential",
  contabilidad: "confidential",  // with exceptions
  gerencia: "internal",
  inventario: "public",
  ventas: "public",
};

// Per-resource masking configs
const MASKING_CONFIGS: ResourceMaskingConfig[] = [
  {
    resource: "commissions",
    rules: [
      { field: "recipientName", sensitivity: "confidential", mask: "anonymize" },
      { field: "totalAmount", sensitivity: "confidential", mask: "redact" },
      { field: "paidAmount", sensitivity: "confidential", mask: "redact" },
      { field: "unpaidAmount", sensitivity: "confidential", mask: "redact" },
      { field: "facturar", sensitivity: "confidential", mask: "redact" },
      { field: "isrRetenido", sensitivity: "confidential", mask: "redact" },
      { field: "pagar", sensitivity: "confidential", mask: "redact" },
    ],
  },
  // ... per resource
];

// Public API
export function maskResponse<T>(role: Role, resource: string, data: T): T;
```

### Masking behaviors

| Mask type | What it does | Example |
|-----------|-------------|---------|
| `redact` | Replace value with `null` | `totalAmount: 45000` → `totalAmount: null` |
| `anonymize` | Replace with generic label | `recipientName: "Juan Pérez"` → `recipientName: "Asesor 1"` |
| `aggregate` | Replace detail array with summary object | `byRecipient: [...]` → `byRecipient: { count: 12, total: 500000 }` |
| `nullify` | Remove field entirely | `phone: "5555-1234"` → field absent |

---

## Implementation Steps

### Step 1: Create `src/lib/field-masking.ts` (~4h)

- Define `Sensitivity` type and `ROLE_VISIBILITY` map
- Define `MaskingRule` and `ResourceMaskingConfig` types
- Create masking configs for 4 resources: `commissions`, `payments`, `payment-compliance`, `commissions-legacy`
- Implement `maskResponse(role, resource, data)` — generic deep-mask utility
- Implement `maskArray(role, resource, items)` — convenience for arrays
- Unit-testable: pure function, no side effects

### Step 2: Apply masking to `/api/analytics/commissions` (~3h)

**Current response shape:**
```json
{
  "byRecipient": [{ "recipientId": "...", "recipientName": "...", "totalAmount": 45000, ... }],
  "summary": { "total": 500000, "paid": 300000, ... }
}
```

**Masking for `gerencia`:**
- `byRecipient` → aggregated: `{ count: N, totalAmount: X }` (no per-person breakdown)
- `summary` → kept as-is (aggregates are safe)
- ISR fields → redacted

**Masking for `contabilidad`:**
- `byRecipient` → kept but `recipientName` anonymized to "Recipient 1", "Recipient 2"
- ISR fields → kept (needed for tax filing)

**Masking for `financiero`:**
- No masking (full access for financial oversight)

### Step 3: Apply masking to `/api/analytics/payments` (~3h)

**Masking for `gerencia`:**
- `byProject[].units[].clientName` → anonymize ("Cliente 1")
- `byProject[].units[].paymentHistory` → aggregate (count + total only)
- `byProject[].units[].engancheTotal`, `reserve`, `downPayment`, `installments` → redact

**Masking for `contabilidad`:**
- `byProject[].units[].clientName` → keep (needed for reconciliation)
- Payment details → keep

**Masking for `financiero`:**
- No masking

### Step 4: Apply masking to `/api/analytics/payment-compliance` (~3h)

**Masking for `gerencia`:**
- `byProject[].units[].clientName` → anonymize
- `byProject[].units[].paymentHistory` → aggregate
- Per-unit detail → redact (keep project-level summary only)

**Masking for `contabilidad` / `financiero`:**
- No masking (compliance visibility needed for both)

### Step 5: Apply masking to `/api/commissions` (legacy) (~2h)

**Masking for `gerencia`:**
- Individual commission rows → aggregate by recipient_type
- Per-row amounts → redact

**Masking for `contabilidad`:**
- `recipient_id` → anonymize

**Masking for `financiero`:**
- No masking

### Step 6: Add PERMISSIONS matrix entry (~1h)

Add field-level visibility to PERMISSIONS or create a parallel `FIELD_VISIBILITY` matrix in `src/lib/field-masking.ts`:

```typescript
// Which roles see which sensitivity levels for which resources
const RESOURCE_OVERRIDES: Partial<Record<string, Partial<Record<Role, Sensitivity>>>> = {
  commissions: {
    contabilidad: "confidential",  // Override: contabilidad sees ISR but not names
  },
};
```

### Step 7: Update `docs/access-control-matrix.md` (~1h)

- Regenerate via `scripts/generate-access-matrix.ts` (extend to include field-level visibility)
- Add "Field Masking" section showing per-role data visibility

### Step 8: Dashboard UI graceful degradation (~4h)

- Commission bars: show "Acceso restringido" placeholder for gerencia
- Payment table: show anonymized client names, hide payment detail columns
- Compliance table: show project-level summary for gerencia (skip unit breakdown)
- Cash flow chart: no changes (aggregate data, visible to all)
- KPI cards: adjust to show only accessible aggregates

### Step 9: Build verification (~3h)

- `npx next build` — must pass clean
- Manual verification for each role:
  - `master` → full data, no masking
  - `torredecontrol` → full data, no masking
  - `financiero` → full financial data, no client contact
  - `contabilidad` → commission totals with ISR, anonymized recipients
  - `gerencia` → aggregates only, no per-person breakdown
- Verify dashboard renders correctly with masked responses

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/field-masking.ts` | **NEW** — masking utility + configs |
| `src/app/api/analytics/commissions/route.ts` | Add `maskResponse()` call before `jsonOk()` |
| `src/app/api/analytics/payments/route.ts` | Add `maskResponse()` call |
| `src/app/api/analytics/payment-compliance/route.ts` | Add `maskResponse()` call |
| `src/app/api/commissions/route.ts` | Add `maskResponse()` call |
| `src/app/dashboard-client.tsx` | Handle masked/null fields gracefully |
| `scripts/generate-access-matrix.ts` | Extend to include field-level visibility |
| `docs/access-control-matrix.md` | Regenerated with field masking section |

**Total: 1 new file, 7 files modified.**

---

## Open Questions for Jorge

1. **Visibility rules confirmation:** Does the proposed masking table (above) match what each role should see? Specifically:
   - Should `gerencia` see per-unit payment history, or only project-level summaries?
   - Should `contabilidad` see salesperson names next to commission amounts?
   - Should `financiero` see client phone/email, or only names?

2. **Activation timeline:** When are gerencia/financiero/contabilidad users being activated? This determines urgency.

3. **Aggregate vs. hidden:** For redacted data, should the UI show "Acceso restringido" banners, or simply hide those sections entirely?

4. **`/api/analytics/cash-flow-forecast` exemption:** This route returns only aggregate monthly data with no PII. Confirm it needs no masking.

---

## Verification Checklist

- [ ] `src/lib/field-masking.ts` — `maskResponse()` is pure, typed, handles all 4 resources
- [ ] Commission route — gerencia gets aggregate only, contabilidad gets anonymized recipients
- [ ] Payment route — gerencia gets project summaries, client names anonymized
- [ ] Compliance route — gerencia gets project summary only
- [ ] Legacy commissions route — masking applied consistently
- [ ] Dashboard UI — renders correctly with masked data (no crashes on null fields)
- [ ] `npx next build` — passes clean
- [ ] Access control matrix — regenerated with field visibility column
- [ ] Cash flow route — confirmed no masking needed

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Dashboard crashes on `null` masked fields | TypeScript strict mode catches missing null checks at build time |
| Inconsistent masking between routes | Centralized `maskResponse()` with shared configs |
| Over-masking blocks legitimate work | Start permissive (financiero sees everything financial), tighten based on feedback |
| Under-masking leaks data | Default to redact; whitelist fields per role rather than blacklist |
| Performance impact of post-query masking | Negligible — JSON field manipulation on already-fetched data |

---

## Effort Breakdown

| Step | Hours |
|------|-------|
| 1. `field-masking.ts` core utility | 4 |
| 2. Commissions route | 3 |
| 3. Payments route | 3 |
| 4. Payment compliance route | 3 |
| 5. Legacy commissions route | 2 |
| 6. PERMISSIONS / field visibility matrix | 1 |
| 7. Access control matrix update | 1 |
| 8. Dashboard UI graceful degradation | 4 |
| 9. Build + role-based verification | 3 |
| **Total** | **24** |
