# Plan: Completely Fix the Cotizador

**Date:** 2026-03-26
**Status:** DRAFT — 3 open questions remaining (see §10)
**Scope:** Interactive `/cotizador` page + per-project cotizador reports + PCV/Carta de Pago financial calculations + underlying data model

---

## 1. Problem Statement

"Los cotizadores todavía están malos" — Pablo, ventas meeting 2026-03-24

"Ya está amarrado sólo que está mal amarrado por eso es que no salen las cotis" — Jorge, ventas meeting 2026-03-24 (V:291-292)

**Root cause** (V:294-305): The cotizador is pulling data from multiple sources (Antonio, Isaac, Jorge, financiera, contabilidad). When there are data conflicts — e.g., a desistimiento not marked in all systems — the system uses first-found and never re-fetches. This produces stale or incorrect data in the cotizaciones. Jorge committed to defining a data source priority hierarchy.

"Cotizadores" (plural) refers to **per-project cotizador reports** that salespeople use with clients (A:728-729: "los reportes cotizadores, reporte de cada proyecto"). These are urgently needed and distinct from the interactive `/cotizador` page.

Four categories of "broken":

### 1A. Wrong Financial Parameters (confirmed bugs)
- **PCV document** (`pcv-client.tsx:426-431`) uses `COTIZADOR_DEFAULTS.ENGANCHE_PCT` (10%) and `COTIZADOR_DEFAULTS.INSTALLMENT_MONTHS` (7) for ALL reservations. The actual negotiated enganche % and installment count are NOT stored per reservation and therefore cannot vary.
- **Carta de Pago** (`carta-pago-client.tsx:176-182`) has the same bug — hardcoded defaults regardless of what was actually agreed with the client.
- `reservations.cuotas_enganche` was added in migration 042 but is **not used** in PCV or Carta de Pago generation.
- **Reserva default is wrong**: `COTIZADOR_DEFAULTS.RESERVA_AMOUNT = Q1,500` but transcript shows Q3,000 for a specific deal (A:305). The reserva amount varies per deal.
- **Enganche default is wrong**: `COTIZADOR_DEFAULTS.ENGANCHE_PCT = 10%` but transcript shows 7% for a specific deal (A:302-304: enganche Q46,800 / price Q668,000 = 7.0%). The enganche percentage varies per deal.

### 1B. Missing Business Rules
- **Q100 multiples**: "solo se puede financiar en múltiplos de 100" — financing amounts and enganche cuotas must be rounded to Q100. Zero rounding logic exists anywhere in the codebase (`grep` for `múltiplos|multiplos|multiples.*100|roundTo` = no matches).
- **40-year terms**: Max plazo is hardcoded to 30 years. Salespeople need 40. Bank-specific terms per Antonio's Excel.
- **Dual pricing**: Units sold above list price (V:188-266: unit 203 at Q1,260,000 list → Q1,300,000 effective). No `sale_price` or `effective_price` column on `reservations`.
- **Bank rate/term configuration**: 4 rates (7.5-10.5%) and 4 terms (15-30yr) are hardcoded in `COTIZADOR_DEFAULTS`. No admin UI, no per-bank differentiation.

### 1C. Data Reliability (transcript-referenced)
- Price data sourced from `rv_units.price_list` (single column). This is seeded from Excel and may be stale after valorizaciones if not updated.
- Desisted units not properly repriced (V:298-302).
- The `/cotizador` only shows AVAILABLE units, so desisted-but-not-updated units may show wrong prices if re-listed.
- Data source conflicts cause cotizaciones to show incorrect numbers (V:294-305).

### 1D. Missing Per-Project Cotizador Reports
- "Los reportes cotizadores, reporte de cada proyecto" (A:728-729) — salespeople need printable, per-project cotización sheets. These are the primary deliverable labeled "urgent" by Antonio. The interactive `/cotizador` page alone is not sufficient.

---

## 2. Current Architecture

```
rv_units.price_list (DB)
  ↓  GET /api/reservas/units
UnitFull.price_list (client)
  ↓  user selects unit
cotizador-client.tsx
  ↓  pure functions
cotizador.ts → computeEnganche(), computeFinancingMatrix(), computeEscrituracion()
  ↓  render
InstallmentTable + FinancingMatrix + EscrituracionPanel
```

**Constants (all hardcoded in `COTIZADOR_DEFAULTS`):**

| Parameter | Value | Configurable? |
|-----------|-------|---------------|
| Reserva | Q1,500 | No |
| Enganche % | 10% | User slider (5-50%) |
| Installment months | 7 | User input (1-24) |
| Inmueble/Acciones | 70/30 | User dropdown (60/40, 70/30, 80/20, 100/0) |
| IVA | 12% | No |
| IUSI | 0.9% | No |
| Insurance | 0.35% | No |
| Bank rates | 7.5%, 8.5%, 9.5%, 10.5% | No |
| Plazos | 15, 20, 25, 30 years | No |
| Income multiplier | 3x | No |

**Consumers of cotizador functions (4 files):**
1. `src/app/cotizador/cotizador-client.tsx` — interactive page
2. `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` — PCV document
3. `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` — Carta de Pago
4. `src/app/cotizador/financing-matrix.tsx` — reads `COTIZADOR_DEFAULTS.BANK_RATES` and `PLAZOS_YEARS`

---

## 3. Target Architecture

```
system_settings (DB) ← bank_configs (new table) ← rv_units.price_list
  ↓                        ↓                          ↓
  cotizador_config API     bank rates/terms API        unit pricing API
          ↓                        ↓                          ↓
       COTIZADOR_CONFIG (runtime)                     UnitFull.price_list
                    ↓
            cotizador.ts (pure functions, parameterized)
                    ↓
     Interactive page + PCV + Carta de Pago + PDF export
```

**Key change:** All parameters become configurable at runtime via database, not compiled into code.

---

## 4. Implementation Phases

### Phase 1: Per-Reservation Financial Terms (Bug Fix — Critical)
**Goal:** PCV and Carta de Pago use the correct, per-reservation financial parameters.

**Migration (~047):**
```sql
-- Add per-reservation financial terms
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS sale_price numeric(14,2),
  ADD COLUMN IF NOT EXISTS enganche_pct numeric(5,4),
  ADD COLUMN IF NOT EXISTS installment_months integer,
  ADD COLUMN IF NOT EXISTS inmueble_pct numeric(5,4);

COMMENT ON COLUMN reservations.sale_price IS 'Effective sale price (may differ from price_list if sold above/below)';
COMMENT ON COLUMN reservations.enganche_pct IS 'Down payment percentage agreed for this reservation';
COMMENT ON COLUMN reservations.installment_months IS 'Number of monthly enganche installments agreed';
COMMENT ON COLUMN reservations.inmueble_pct IS 'Deed split: property portion percentage';
```

**Backfill strategy:**
- `sale_price`: set to `rv_units.price_list` for existing reservations (conservative — actual effective prices unknown without Antonio's data)
- `enganche_pct`: **DO NOT default to 0.10 (10%)**. Transcript proves this varies per deal (A:302-304 shows 7%). Set to NULL for existing reservations → signals "not yet confirmed" and forces manual review. PCV/Carta de Pago code falls back to `COTIZADOR_DEFAULTS` only when NULL.
- `reserva`: Already exists as `reservations.deposit_amount`. Transcript shows Q3,000 for a deal (A:305), not always Q1,500. The existing column handles this — no additional column needed.
- `installment_months`: set from existing `cuotas_enganche` where non-null, else NULL (same rationale — 7 is not universally correct)
- `inmueble_pct`: set to 0.70 for existing (no transcript evidence of variation)

**Code changes:**
- `pcv-client.tsx`: read `reservation.sale_price`, `reservation.enganche_pct`, `reservation.installment_months`, `reservation.inmueble_pct` — fall back to defaults only when null
- `carta-pago-client.tsx`: same
- `SubmitReservationPayload`: add optional `sale_price`, `enganche_pct`, `installment_months`, `inmueble_pct`
- Reservation creation API: store these values when provided
- `v_reservations_pending` view: append new columns

**Files changed:** ~8 files
**Risk:** Low — additive columns, backward-compatible with null defaults.

---

### Phase 2: Q100 Rounding (Business Rule Fix — Critical)
**Goal:** All enganche cuotas and financing amounts round to nearest Q100.

**Add to `cotizador.ts`:**
```typescript
/** Round amount to nearest Q100 (Guatemalan financing standard). */
export function roundToQ100(amount: number): number {
  return Math.round(amount / 100) * 100;
}
```

**Apply in `computeEnganche()`:**
- `enganche_total` → `roundToQ100(price * enganche_pct)`
- `cuota_enganche` → `roundToQ100(enganche_neto / installment_months)`
- Last installment absorbs rounding remainder: `enganche_neto - (cuota × (months - 1))`

**Apply in `computeFinancingMatrix()`:**
- `monto_financiar` → `roundToQ100(price - enganche_total)`

**Edge case:** When rounding causes enganche installments to not sum to enganche_neto exactly, the last installment adjusts. This is standard practice.

**Files changed:** 1 file (`cotizador.ts`), affects all consumers automatically.
**Risk:** Low — pure math change. May cause minor visual differences in existing cotizaciones.

---

### Phase 3: Bank Configuration Table (New Feature — High Priority)
**Goal:** Bank rates and terms are configurable per bank, not hardcoded.

**Migration (~048):**
```sql
CREATE TABLE IF NOT EXISTS bank_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  -- Financing terms
  min_rate numeric(6,4),       -- e.g., 0.0750 = 7.50%
  max_rate numeric(6,4),       -- e.g., 0.1050 = 10.50%
  default_rate numeric(6,4),   -- suggested rate for this bank
  min_plazo_years integer,     -- e.g., 5
  max_plazo_years integer,     -- e.g., 40
  plazos_years integer[],      -- e.g., {15,20,25,30,40}
  -- Income requirements
  income_multiplier numeric(4,2) DEFAULT 3.00,
  -- Metadata
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with current Guatemalan banks
INSERT INTO bank_configs (bank_name, display_order, default_rate, plazos_years) VALUES
  ('Banrural', 1, 0.0850, '{15,20,25,30}'),
  ('Industrial', 2, 0.0850, '{15,20,25,30}'),
  ('G&T Continental', 3, 0.0850, '{15,20,25,30}'),
  ('BAM', 4, 0.0850, '{15,20,25,30}'),
  ('Bantrab', 5, 0.0850, '{15,20,25,30}'),
  ('Inmobiliario', 6, 0.0850, '{15,20,25,30}'),
  ('CHN', 7, 0.0850, '{15,20,25,30}'),
  ('Agromercantil', 8, 0.0850, '{15,20,25,30}'),
  ('BAC', 9, 0.0850, '{15,20,25,30}'),
  ('Promerica', 10, 0.0850, '{15,20,25,30}'),
  ('Vivibanco', 11, 0.0850, '{15,20,25,30}'),
  ('Ficohsa', 12, 0.0850, '{15,20,25,30}');

-- RLS: all auth read, admin write
ALTER TABLE bank_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_configs_read ON bank_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY bank_configs_write ON bank_configs FOR ALL TO authenticated
  USING (jwt_role() IN ('master','torredecontrol','financiero'))
  WITH CHECK (jwt_role() IN ('master','torredecontrol','financiero'));
```

**NOTE:** The seed data above uses placeholder rates (0.0850) for all banks. The actual rates, terms, and per-bank rules MUST come from Antonio's Excel. I do not have this data and will NOT fabricate it. See Question 2 in §10.

**API routes:**
- `GET /api/reservas/bank-configs` — authenticated read (all users)
- `GET/POST/PATCH /api/admin/bank-configs` — admin CRUD

**Admin UI:** `/admin/bank-configs` — table of banks with editable rate/term fields.

**Cotizador integration:**
- Fetch active bank configs at page load
- Replace hardcoded `BANK_RATES` and `PLAZOS_YEARS` with DB values
- Financing matrix: one row per active bank (showing bank name), columns = that bank's plazos
- User can optionally select a specific bank to see detailed scenario

**Files changed:** ~10 files (migration, types, API routes, admin page, cotizador-client, financing-matrix)
**Risk:** Medium — requires Antonio's Excel data to seed correctly.

---

### Phase 4: 40-Year Term Support (Quick Win)
**Goal:** Support financing terms up to 40 years.

**If Phase 3 is done first:** This is automatic — just add 40 to the bank's `plazos_years` array.

**If Phase 3 is deferred:** Quick fix — add 40 to `COTIZADOR_DEFAULTS.PLAZOS_YEARS`:
```typescript
PLAZOS_YEARS: [15, 20, 25, 30, 40] as readonly number[],
```
And update `FinancingMatrix` to handle 5 columns.

**Files changed:** 1-2 files.
**Risk:** None.

---

### Phase 5: Cotizador in Reservation Form (UX Improvement)
**Goal:** When a salesperson creates a reservation, they can set financial terms (sale price, enganche %, installment months) that get stored on the reservation.

**Changes to `/reservar` reservation form:**
- Add collapsible "Términos financieros" section after unit selection:
  - Sale price (pre-filled from `price_list`, editable — allows selling above/below list)
  - Enganche % (slider, default 10%)
  - Cuotas de enganche (input, default 7)
  - Inmueble % (dropdown: 60/40, 70/30, 80/20, 100/0)
- Show computed summary: enganche total, cuota enganche, monto a financiar
- These values are submitted with the reservation and stored in the new columns from Phase 1

**Changes to admin reservation detail:**
- Show the financial terms agreed for this specific reservation
- Allow admin to edit (for correction after negotiation)

**Files changed:** ~6 files (reservation-form, confirmation-modal, admin detail, API create/update)
**Risk:** Low — additive UI, optional fields.

---

### Phase 6: Per-Project Cotizador Reports + PDF Output (Urgent — A:728-729)
**Goal:** Generate per-project printable cotización reports that salespeople can share with clients (WhatsApp, print, email). This is what "cotizadores" (plural) means when Pablo says "los cotizadores todavía están malos."

**Two output modes:**

**6A. Interactive → Print (from `/cotizador` page):**
- Add "Imprimir / Compartir" button to cotizador page
- Print-optimized CSS (similar to existing PCV/Carta de Pago print styles)
- Output: single page with header (Puerta Abierta logo, project name), unit details, enganche schedule, financing matrix, escrituracion split
- Footer: "Cotización generada el {date}. Precios sujetos a cambios sin previo aviso."

**6B. Per-Project Cotizador Report (the urgently needed feature):**
- Route: `/cotizador/[project_slug]` or `/cotizador?project=bosque-las-tapias`
- Pre-filtered to one project: shows all available units with their pricing
- Summary format: unit number, type, area, price, enganche schedule at configured default, financing scenarios
- Printable as multi-page PDF — one section per unit or one page per unit
- This is what Antonio currently maintains as a spreadsheet per project

**Data authority:** Once cotizaciones come from the system, the price becomes authoritative (A:379-386: "la cotización ahora va a salir del mismo sistema... ahí vamos a poder estar seguros del precio"). This eliminates salesperson data-entry errors in Pipedrive.

**Optional enhancement:** Save cotización as a record (unit, salesperson, date, parameters) for tracking which scenarios salespeople explored. Lower priority.

**Files changed:** ~5 files (cotizador-client print button + print CSS, per-project route, optional API)
**Risk:** None. Priority: **P1** (Antonio flagged as urgent).

---

### Phase 7: Price Audit & Data Integrity (Operational)
**Goal:** Ensure `rv_units.price_list` reflects current authorized prices.

**Actions (not code — operational):**
1. Cross-reference `rv_units.price_list` against the latest per-project pricing Excel
2. Identify stale prices (especially re-listed desisted units)
3. Apply corrections via admin or migration
4. Ensure `/valorizacion` price changes propagate to `rv_units.price_list`

**Code check:** Verify that when a valorización is recorded in `rv_price_history`, it triggers an update to `rv_units.price_list` for affected units. If not, add this linkage.

**Files changed:** Depends on findings.
**Risk:** Must be done carefully — price changes affect PCV, Carta de Pago, commissions.

---

## 5. Dependency Graph

```
Phase 1 (per-reservation terms) ← CRITICAL, do first
  ↓
Phase 2 (Q100 rounding) ← independent, can parallel
  ↓
Phase 5 (cotizador in reservation form) ← depends on Phase 1
  ↓
Phase 3 (bank config table) ← independent
  ↓
Phase 4 (40-year terms) ← depends on Phase 3 OR standalone quick fix
  ↓
Phase 6 (PDF output) ← independent
  ↓
Phase 7 (price audit) ← independent, operational
```

**Recommended execution order:** 1 → 2 → 3+4 → 5 → 6 → 7

---

## 6. Files Affected (Complete Inventory)

| File | Phases | Change Type |
|------|--------|-------------|
| `scripts/migrations/047_*.sql` | 1 | New migration |
| `scripts/migrations/048_*.sql` | 3 | New migration |
| `src/lib/reservas/cotizador.ts` | 1,2,3 | Add Q100 rounding, parameterize bank config |
| `src/lib/reservas/types.ts` | 1,3 | Add reservation financial fields, BankConfig type |
| `src/lib/reservas/validations.ts` | 1,5 | Add/update Zod schemas |
| `src/app/cotizador/cotizador-client.tsx` | 3,6 | Fetch bank configs, add print button |
| `src/app/cotizador/financing-matrix.tsx` | 3 | Dynamic bank rows instead of hardcoded rates |
| `src/app/admin/reservas/pcv/[id]/pcv-client.tsx` | 1 | Use per-reservation terms |
| `src/app/admin/reservas/carta-pago/[id]/carta-pago-client.tsx` | 1 | Use per-reservation terms |
| `src/app/reservar/reservation-form.tsx` | 5 | Add financial terms section |
| `src/app/reservar/confirmation-modal.tsx` | 5 | Show financial summary |
| `src/app/admin/reservas/reservation-detail.tsx` | 1,5 | Show/edit financial terms |
| `src/app/api/reservas/create/route.ts` (or equivalent) | 1,5 | Store financial terms |
| `src/app/api/reservas/bank-configs/route.ts` | 3 | New GET route |
| `src/app/api/admin/bank-configs/route.ts` | 3 | New CRUD route |
| `src/app/admin/bank-configs/page.tsx` | 3 | New admin page |
| `src/hooks/use-bank-configs.ts` | 3 | New hook |
| `src/lib/permissions.ts` | 3 | Add bank_configs resource |

---

## 7. Business Rules Summary (What the Cotizador Must Enforce)

| Rule | Source | Current State | Fix |
|------|--------|---------------|-----|
| Enganche cuotas in Q100 multiples | V:330-336 | Not enforced | Phase 2 |
| Financing amount in Q100 multiples | V:330-336 | Not enforced | Phase 2 |
| Up to 40-year terms | V:392-409 | Max 30 years | Phase 4 |
| Per-bank rates and terms | V:400-409 | 4 hardcoded rates | Phase 3 |
| Per-reservation financial terms | PCV/Carta bug | Hardcoded defaults | Phase 1 |
| Sale price can differ from list price | V:188-266 | No sale_price field | Phase 1 |
| Reserva varies per deal (Q1,500–Q3,000+) | A:305 | Hardcoded Q1,500 default | Phase 1 |
| Enganche % varies per deal (7%+ found) | A:302-304 | Hardcoded 10% default | Phase 1 |
| Per-project cotizador reports | A:728-729 | Not built | Phase 6 |
| Data source priority hierarchy | V:294-305 | No priority defined | Phase 7 |
| Reserva deductible from enganche | Existing | Correct ✓ | — |
| IVA 12% on inmueble only | Existing | Correct ✓ | — |
| IUSI 0.9% annual | Existing | Correct ✓ | — |
| Insurance 0.35% annual on financed amount | Existing | Correct ✓ | — |
| Income requirement 3x monthly obligation | Existing | Correct ✓ | — |
| PMT annuity formula | Existing | Correct ✓ | — |

---

## 8. What Is NOT Broken (Verified Correct)

- PMT formula implementation — standard annuity, mathematically correct
- Escrituracion IVA calculation — correct 12% on inmueble portion only
- IUSI monthly calculation — correct annual-to-monthly conversion
- Insurance monthly calculation — correct on financed amount
- Income multiplier — correct 3x
- Unit data flow — `rv_units.price_list` → `v_rv_units_full` → API → client is clean
- RLS on unit data — properly secured

---

## 9. Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| Existing PCV/Carta de Pago change behavior for historical reservations | Backfill Phase 1 columns with current defaults → no visible change for existing docs |
| Q100 rounding causes installments to not sum exactly to enganche_neto | Last installment absorbs remainder (standard industry practice) |
| Bank config seed data might be wrong | Do NOT seed with invented rates. Use Antonio's Excel as source. Ask first (§10). |
| Valorización price changes don't propagate to rv_units.price_list | Audit in Phase 7. May need trigger or manual process. |
| Sale price column enables salespeople to enter inflated prices | Admin review catches anomalies. Price_list remains as reference point for comparison. |

---

## 10. Transcript-Answered Questions

The following questions were originally open but are now answered by data in the transcripts:

### Q1: What specifically is "broken" about the cotizadores? → ANSWERED
**Answer (V:289-305, A:728-729):** Multiple things:
- **(b)** Per-project cotizador reports exist as separate documents and are urgently needed in-app (A:728-729: "los reportes cotizadores, reporte de cada proyecto... este si ha sido urgente")
- **(c)** PCV/Carta de Pago use hardcoded defaults (confirmed bug in code)
- **(d)** Data source conflicts: the system pulls from multiple DBs and uses first-found, causing stale data (V:294-305: "está jalando datos de la base de datos de antonio, de isaac, de jorge")
- Jorge committed to defining a data source priority hierarchy (V:304-305: "voy a darle el orden específico en que tiene que buscar")

### Q3: Does the reserva amount vary? → ANSWERED
**Answer (A:305):** YES. A specific deal shows reserva = Q3,000 (not Q1,500). The reserva is negotiated per deal. The existing `reservations.deposit_amount` column already handles this — no new column needed for reserva. But the default of Q1,500 in `COTIZADOR_DEFAULTS` must not be assumed as universal.

### Q4: Does the default enganche % vary? → ANSWERED
**Answer (A:302-304):** YES. The same deal shows enganche = Q46,800 on price Q668,000 = ~7.0% (not 10%). The enganche percentage is negotiated per deal and must be stored per reservation.

### Q7: Is there a per-project cotizador PDF? → ANSWERED
**Answer (A:728-729):** YES. "Los reportes cotizadores, reporte de cada proyecto" — these are per-project documents, urgently needed. Antonio confirmed "este es el único que debería realmente subir a la reserva si este si ha sido urgente." Addressed in Phase 6B.

---

## 11. Remaining Open Questions

### Q2: What is in Antonio's bank configuration Excel?
> V:400-409 — "Antonio me pasó un Excel donde tiene separados los términos que cada banco acepta"

The transcript confirms this Excel exists and Jorge has it, but the contents are not detailed in the transcript. I need this Excel to seed `bank_configs` correctly. Specifically:
- Which banks?
- What interest rates per bank (fixed? range?)?
- What terms (plazos) each bank accepts?
- Any bank-specific requirements (minimum income, maximum age, FHA-only, etc.)?

**Impact:** Phase 3 cannot be seeded without this data. I will NOT invent bank rates.

### Q5: Does the escrituracion split (inmueble/acciones) vary by project?
Currently hardcoded at 70/30 with user-selectable options (60/40, 70/30, 80/20, 100/0). Is the default always 70/30?

**Impact:** If per-project, need a `default_inmueble_pct` on `projects`.

### Q6: Should the cotizador show ALL units or only AVAILABLE?
Currently filters to `status === 'AVAILABLE'` only. Should RESERVED or FROZEN units also be quotable (e.g., for informational purposes or re-offers)?

---

## 12. Estimation (Rough)

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Per-reservation financial terms | ~4-6h | **P0** (fixes confirmed bug in PCV/Carta de Pago) |
| Phase 2: Q100 rounding | ~1-2h | **P0** (business rule violation) |
| Phase 3: Bank configuration table | ~6-8h | **P1** (blocked on Q2 answer) |
| Phase 4: 40-year terms | ~30min (standalone) or free (with Phase 3) | **P1** |
| Phase 5: Cotizador in reservation form | ~4-6h | **P2** (depends on Phase 1) |
| Phase 6: Per-project cotizador reports + PDF | ~5-7h | **P1** (flagged urgent by Antonio) |
| Phase 7: Price audit | ~2-4h | **P1** (operational, low code) |

**Total:** ~22-33h across all phases

---

## 13. Definition of Done

The cotizador is "completely fixed" when:

1. PCV and Carta de Pago use per-reservation financial terms (not hardcoded defaults)
2. All monetary amounts in enganche schedule are rounded to Q100 multiples
3. Bank rates and terms are configurable via admin UI (not hardcoded)
4. 40-year financing terms are supported
5. Both list price and effective sale price are tracked per reservation
6. Salespeople can set financial terms during reservation creation
7. Per-project cotizador reports can be generated and printed/shared as PDF
8. Data source priority is defined and implemented (single source of truth per data point)
9. `rv_units.price_list` reflects current authorized prices (post-valorización audit)
10. Every formulated amount matches what the salesperson would calculate by hand using the same inputs

---

## 14. Status Update (2026-03-26)

### Superseded by `docs/plan-zero-diff-cotizador-2026-03-26.md`
This plan was written before the cotizador-diff-report was completed. The zero-diff plan supersedes this document and is grounded in the 37 discrete diffs identified from direct Excel extraction.

### Key changes since this plan was written:
- **Phase 1 (per-reservation terms)** → Implemented as migration 048 (`sale_price`, `enganche_pct`, `inmueble_pct` on `reservations`).
- **Phase 2 (Q100 rounding)** → Implemented in `cotizador.ts` rewrite with per-config rounding flags (`round_enganche_q100`, `round_cuota_q100`, `round_cuota_q1`, `round_saldo_q100`).
- **Phase 3 (bank config table)** → **Superseded.** Instead of a separate `bank_configs` table, bank rates are stored per cotizador variant in `cotizador_configs.bank_rates[]` and `bank_rate_labels[]`. This approach is simpler and matches Excel reality (each cotizador tab has its own rate(s), not per-bank rates).
- **Phase 4 (40-year terms)** → Implemented via `cotizador_configs.plazos_years[]` (Benestare has `{40,30,25,20}`).
- **Santa Elena onboarded** (migration 049): Full project seed (11 units, 5 reservations, cotizador config) loaded. SE was previously blocked on "data not loaded to DB." Now live with USD currency, 30% enganche, 8.50% crédito directo, quarterly IUSI, 15-month enganche plan.
- **New `area_lot` column** on `rv_units` (migration 049): Lot/plot area for horizontal projects (casas). Added to `v_rv_units_full` view and `UnitFull` TypeScript type. SE units populated with lot areas from Excel (386–400.44 m²).
- **`PROJECT_SLUGS`** updated with `SE: "santa-elena"` in constants.ts.
- **Q2 (Antonio's bank Excel)** remains open — bank-specific per-bank configuration not yet built, but per-project rates are now correct.
- **Q5 (escrituracion split)** → Resolved: 70/30 is default for all residential, 100/0 for CE-Locales. Configurable via `cotizador_configs.inmueble_pct`.
- **Q6 (show all units or AVAILABLE only)** → Remains open.
