# Solution: Ejecutivo Commission Rate — Store on the Sale

**Date:** 2026-03-16
**Status:** Recommended — pending CFO confirmation of per-unit rates
**Severity:** Critical — ejecutivo commissions silently not being calculated
**Prerequisite:** [sales-rep-commission-rates-investigation.md](sales-rep-commission-rates-investigation.md)

---

## The Core Insight

The system tries to **look up** a rate at commission calculation time, but the SSOT shows the rate is **determined at sale time** and varies per unit. This is a fundamental modeling error.

Antonio Rada has 6 different rates (0.25%–1.25%) in B5 alone. Paula Hernandez has 4 rates (0.40%–2.00%) in CE. The rate is a property of the **sale**, not of the salesperson. No lookup table — polymorphic or otherwise — can model this correctly without becoming a per-sale lookup, which is just `sales.ejecutivo_rate` with extra steps.

---

## The Fix

```sql
ALTER TABLE sales ADD COLUMN ejecutivo_rate numeric;
```

### Why This Is the Answer

1. **The SSOT proves it.** The CFO's Excel has a rate column per row (per unit/sale). It doesn't have a salesperson lookup table. The database should model reality, not an abstraction of reality.

2. **It eliminates the polymorphic anti-pattern for ejecutivo.** No more `commission_rates WHERE recipient_type = 'sales_rep'` with text discriminators, no FK constraint gap, no silent misses. The rate is right there on the row. A `NOT NULL` constraint after backfill makes missing rates impossible.

3. **It's immutable by design.** Once a sale is recorded, its ejecutivo rate doesn't change — exactly matching Stripe's Ledger pattern of capturing the price at transaction time, not looking it up later. The policy-period tables (`commission_role_rates`, `commission_policy_periods`) become the **rule engine** for determining what rate to assign to NEW sales, but the sale itself stores the final value.

4. **Per-unit granularity is inherent.** Each sale records its own rate. No need for per-unit override tables, no temporal EXCLUDE constraints, no decomposition of `commission_rates`. The same salesperson with 6 different rates across 6 units is just 6 rows in `sales` with 6 different `ejecutivo_rate` values.

5. **Simplest sufficient solution.** One `ALTER TABLE`, one backfill from SSOT data, one function change. No new tables, no temporal complexity, no migration of existing lookup tables.

---

## Implementation

### Phase 1 — Schema + Backfill

```sql
-- 1. Add the column
ALTER TABLE sales ADD COLUMN ejecutivo_rate numeric;

-- 2. Backfill from SSOT (actual rates per unit from CFO Excel)
-- Each UPDATE uses the REAL rate from the SSOT, not a default.
-- Examples (actual values TBD from SSOT extraction):
--   UPDATE sales SET ejecutivo_rate = 0.0025 WHERE unit_id = '...' AND sales_rep_id = '...';
--   UPDATE sales SET ejecutivo_rate = 0.0125 WHERE unit_id = '...' AND sales_rep_id = '...';
-- The backfill SQL will be generated per-unit from the SSOT Excel data.

-- 3. After backfill is complete and verified:
-- ALTER TABLE sales ALTER COLUMN ejecutivo_rate SET NOT NULL;
-- (Only after confirming every sale has a rate)
```

### Phase 2 — Function Change

Update `calculate_commissions()` to use `sales.ejecutivo_rate` instead of the `commission_rates` lookup:

```sql
-- CURRENT (broken — looks up commission_rates, finds nothing, silently skips):
IF v_sale.sales_rep_id IS NOT NULL THEN
  SELECT * INTO v_rate FROM commission_rates cr
  WHERE cr.recipient_id = v_sale.sales_rep_id::text
    AND cr.recipient_type = 'sales_rep'
    AND cr.active = true;
  IF FOUND THEN
    INSERT INTO commissions (...) VALUES (...);
  END IF;
END IF;

-- NEW (uses the rate stored on the sale itself):
IF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NOT NULL THEN
  SELECT display_name INTO v_salesperson_name
  FROM salespeople WHERE id = v_sale.sales_rep_id;

  INSERT INTO commissions (
    id, payment_id, sale_id, recipient_id, recipient_name,
    phase, rate, base_amount, commission_amount, status
  ) VALUES (
    uuid_v7(), p_payment_id, v_sale.id,
    v_sale.sales_rep_id::text, v_salesperson_name,
    v_phase, v_sale.ejecutivo_rate,
    v_base_amount, v_base_amount * v_sale.ejecutivo_rate,
    'pending'
  );
ELSIF v_sale.sales_rep_id IS NOT NULL AND v_sale.ejecutivo_rate IS NULL THEN
  RAISE WARNING 'Sale % has salesperson % but no ejecutivo_rate',
    v_sale.id, v_sale.sales_rep_id;
END IF;
```

### Phase 3 — Naming Cleanup (When Convenient)

| Current | Recommended | Why |
|---------|------------|-----|
| `sales.sales_rep_id` | `sales.salesperson_id` | FK name should match canonical entity name (`salespeople`) |
| `commission_rates` rows with `recipient_type = 'sales_rep'` | Remove or deactivate | Never had data anyway — zero entries across entire schema history |
| `sales_rep_periods` | `salesperson_periods` | Match canonical entity name |
| `sales_rep_project_assignments` | `salesperson_project_assignments` | Match canonical entity name |

These renames require the expand-contract migration pattern and are independent of the ejecutivo commission fix.

---

## What Stays the Same

- **`commission_rates`** continues serving management/special recipients (puerta_abierta, otto_herrera, alek_hernandez, ahorro_comercial, antonio_rada, ahorro, ahorro_por_retiro). Those are company-wide flat rates; the polymorphic pattern works fine for them.
- **Policy-period tables** remain as the rule engine for assigning rates to future sales. When a new sale is created, the system consults `commission_policy_periods` + `commission_role_rates` to determine the ejecutivo_rate, then stores it on the sale.
- **60% cap logic** untouched.
- **Frontend/API** untouched — the `commissions` output table is the same shape. The new ejecutivo rows will render automatically in bars/treemap.
- **Referral logic** untouched.
- **Ahorro/ahorro_por_retiro** untouched.

---

## Why the Other Options Are Inferior

| Option | Problem |
|--------|---------|
| **Restore policy-period function** | Produces 1.00%/1.25% via escalation — SSOT shows this is wrong for many units (0.25%, 0.40%, 2.00% exist). Calculating commissions based on an approximation violates Rule 4 (no false data). |
| **Seed `commission_rates` per salesperson** | One rate per salesperson can't model per-unit variation. You'd need a rate per sale, which is just `sales.ejecutivo_rate` in a separate table with extra joins. |
| **Decompose `commission_rates` into typed tables** | Correct architecturally but overengineered for the actual problem. Management/special recipients work fine in the current table. Only ejecutivo needs fixing, and `sales.ejecutivo_rate` is simpler than decomposition. |
| **New `salesperson_commission_rates` table with temporal + per-unit** | Solves the problem but introduces temporal EXCLUDE constraints, new table, complex lookup logic. `sales.ejecutivo_rate` achieves the same result with zero new tables. |

---

## Verification Queries

After implementation, these queries validate correctness:

```sql
-- 1. Every sale with a salesperson should have an ejecutivo_rate
SELECT COUNT(*) AS sales_missing_rate
FROM sales s
JOIN salespeople sp ON s.sales_rep_id = sp.id
WHERE sp.display_name NOT IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
  AND s.ejecutivo_rate IS NULL;
-- Expected: 0

-- 2. Every payment with a salesperson should now have an ejecutivo commission row
SELECT
  p.id AS payment_id,
  sp.display_name AS salesperson,
  c_ev.commission_amount AS ejecutivo_amount
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN salespeople sp ON s.sales_rep_id = sp.id
LEFT JOIN commissions c_ev ON c_ev.payment_id = p.id
  AND c_ev.recipient_id = s.sales_rep_id::text
WHERE sp.display_name NOT IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
  AND c_ev.id IS NULL
LIMIT 20;
-- Expected: 0 rows (no missing ejecutivo commissions)

-- 3. Ejecutivo commission count should approximate puerta_abierta count
SELECT
  COUNT(*) FILTER (WHERE recipient_id = 'puerta_abierta') AS pa_rows,
  COUNT(*) FILTER (
    WHERE recipient_id NOT IN (
      'puerta_abierta', 'otto_herrera', 'alek_hernandez',
      'ahorro_comercial', 'antonio_rada', 'ahorro', 'ahorro_por_retiro',
      'referral', 'walk_in'
    )
  ) AS ejecutivo_rows
FROM commissions;
-- Expected: ejecutivo_rows close to pa_rows

-- 4. Spot-check rates match SSOT
SELECT s.id, sp.display_name, u.unit_number, p2.name AS project,
  s.ejecutivo_rate
FROM sales s
JOIN salespeople sp ON s.sales_rep_id = sp.id
JOIN units u ON s.unit_id = u.id
JOIN projects p2 ON s.project_id = p2.id
WHERE sp.display_name = 'Antonio Rada'
  AND p2.name ILIKE '%boulevard%'
ORDER BY u.unit_number;
-- Expected: rates matching SSOT (0.25%, 0.30%, 0.40%, 0.50%, 1.00%, 1.25%)
```

---

## The Blocking Question

The backfill requires extracting every per-unit ejecutivo rate from the SSOT Excel files. These rates cannot be fabricated.

**The CFO must confirm:** Are the rates in `ComisionesFebrero/01.26 Comisiones nuevo formato - Enero 2026.xlsx` the canonical per-unit rates for all historical sales? Or are some legacy rates that have been superseded?

Once confirmed, the backfill SQL can be generated directly from the SSOT data — one UPDATE per distinct (unit, salesperson, rate) combination.

---

## References

### Data Science & Database Design Principles Applied
- **Stripe Ledger pattern**: Capture the rate at transaction time, don't look it up later. Source: [stripe.com/blog/ledger](https://stripe.com/blog/ledger-stripe-system-for-tracking-and-validating-money-movement)
- **DDD Ubiquitous Language** (Evans, 2003): One canonical name per entity within a bounded context
- **Celko, *SQL Antipatterns*** (Chapter 7): Polymorphic associations prevent FK enforcement — decompose or avoid
- **GitLab Engineering**: [Polymorphic Associations](https://docs.gitlab.com/development/database/polymorphic_associations/) — explicitly banned in their schema guidelines
- **Kimball SCD Type 2**: Rate changes over time are best captured as immutable snapshots (the sale row IS the snapshot)
- **Fowler Expand-Contract**: Schema renames must go through expand → migrate → verify → contract. Source: [martinfowler.com/bliki/ParallelChange.html](https://martinfowler.com/bliki/ParallelChange.html)

### Orion-Specific References
- [sales-rep-commission-rates-investigation.md](sales-rep-commission-rates-investigation.md) — full root cause analysis, schema evolution, 12 snapshot timeline
- [commission-audit-plan.md](commission-audit-plan.md) — 13 diffs between SSOT and app (DIFF-06 = per-unit rate granularity)
- `schemas_history/` — 12 schema snapshots confirming `commission_rates` structure never changed
- `scripts/migrations/032_puerta_abierta_always_paid.sql` — current production function
- `ComisionesFebrero/01.26 Comisiones nuevo formato - Enero 2026.xlsx` — SSOT per-unit rates
