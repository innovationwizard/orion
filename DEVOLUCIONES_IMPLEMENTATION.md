# Devoluciones: Negative Payments Implementation

## Context

"Devolución de aportaciones" are exceptional board-approved refunds to desisted clients (e.g., death of client whose life insurance issuer is the mortgage bank). They appear in the actuals sheet below the desistimientos section with payment amounts in the same monthly columns.

These must be recorded as **negative payments** on the corresponding **cancelled sale**.

---

## 1. Schema Change

Add `reimbursement` to the `payment_type` enum.

```sql
-- Check current enum values first
SELECT enum_range(NULL::payment_type);

-- Add the new value
ALTER TYPE payment_type ADD VALUE 'reimbursement';
```

No other schema changes required. The `payments.amount` column is `numeric` with no CHECK constraint, so negative values are already permitted.

**Optional safety net** — add a CHECK to enforce that only reimbursements can be negative:

```sql
ALTER TABLE payments
ADD CONSTRAINT payments_amount_sign_check
CHECK (
    (payment_type = 'reimbursement' AND amount < 0)
    OR (payment_type != 'reimbursement' AND amount >= 0)
);
```

> ⚠️ Run the CHECK against existing data first:
> ```sql
> SELECT id, sale_id, amount, payment_type
> FROM payments
> WHERE amount < 0 OR (payment_type = 'reimbursement');
> ```
> Should return 0 rows before adding the constraint.

---

## 2. Downstream Impact Assessment

Before applying, verify these views/functions handle negative amounts correctly:

| Object | Risk | Action |
|---|---|---|
| `payment_compliance` view | Uses `SUM(amount)` — negatives reduce total automatically | ✅ Correct behavior |
| `delinquent_accounts` view | Same SUM logic | ✅ Correct behavior |
| `cash_flow_forecast` view | Budget-side only, no actuals | ✅ No impact |
| `commissions` table / triggers | Commissions should NOT be computed on reimbursements | ⚠️ **Verify**: any trigger or function that auto-generates commissions from payments must filter `WHERE payment_type != 'reimbursement'` |

### Commission trigger audit

```sql
-- Find all triggers on the payments table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payments';
```

If any commission-generating trigger exists, it must be updated to exclude reimbursements.

---

## 3. ETL Script Updates

### 3a. Existing scripts (etl_boulevard.py and any others already deployed)

Boulevard's devoluciones section (if it exists) was not parsed. Check each project's actuals sheet for a "Devolución de aportaciones" section below the desistimientos.

**For each existing ETL script:**

1. **Audit the workbook** — scan rows below desistimientos for a `"Devolución"` label row.
2. If present, add parsing (see template below).
3. If absent, no changes needed for that project.

### 3b. Parsing template for devoluciones

Add these constants (adjust row numbers per project):

```python
# Row boundaries — example for Santa Elisa
SE_DEVOL_LABEL_ROW = 102   # Row containing "Devolución de aportaciones"
SE_DEVOL_START = 103        # First data row
SE_DEVOL_END = 106          # Last data row
```

Parse identically to desistimientos (same column layout, same monthly column positions from main header row), but tag as `source_section = "devolucion"`.

### 3c. Insertion logic for devoluciones

Devolución payments differ from regular payments in two ways:
- `amount` is **negated** (the Excel value is positive, representing money out)
- `payment_type` is `"reimbursement"`

```python
# In insert_payments(), when processing a unit from the devolucion section:
for idx, (pdate, amount) in enumerate(sorted(u.actual_payments)):
    if u.source_section == "devolucion":
        ptype = "reimbursement"
        amount = -abs(amount)  # Force negative
    else:
        ptype = "reservation" if idx == 0 else "down_payment"

    rows.append({
        "sale_id": sale_id,
        "payment_date": pdate.isoformat(),
        "amount": amount,
        "payment_type": ptype,
        "notes": f"ETL import from {u.source_section}",
    })
```

### 3d. Sale linkage for devoluciones

A devolución row references an apto + client that must match an existing **cancelled** sale. The ETL must:

1. Parse the devolución row to get `apto` and `cliente`.
2. Look up the cancelled sale for that `(unit_id, client_id, status='cancelled')`.
3. Attach the negative payment to that sale.

If no matching cancelled sale exists, log an ERROR — a refund without a prior cancellation is a data integrity issue.

### 3e. Unit creation edge case

Some devolución aptos may reference units whose current owner in the main section is a different client (e.g., Apto 103: devolución client = `Juan Luis Pinto Gomez De Liaño`, current owner = `Chelsy Amarilis Orellana`). This is expected — the unit was desisted and re-sold. The devolución client should already exist from the desistimientos section, and their cancelled sale should already be inserted.

**However**, if a devolución client does NOT appear in the desistimientos section, the ETL must:
1. Create the client (upsert on `full_name`)
2. Create a cancelled sale for the `(unit, client)` pair
3. Then attach the reimbursement payment

---

## 4. Validation Additions

Add these checks to the validation phase:

```python
# Devolución aptos must have a corresponding desistimiento record
devol_aptos_clients = {(u.apto, u.cliente) for u in devol_units}
desist_aptos_clients = {(u.apto, u.cliente) for u in desist_units + prob_desist}

orphan_devols = devol_aptos_clients - desist_aptos_clients
if orphan_devols:
    report.warnings.append(
        f"Devolución records with no matching desistimiento ({len(orphan_devols)}): "
        f"{sorted(orphan_devols)} — will create cancelled sale from devol data"
    )
```

---

## 5. Execution Order

1. Run the schema migration (ALTER TYPE, optional CHECK constraint)
2. Audit commission triggers
3. Update and deploy ETL scripts
4. Re-run affected project ETLs with `--execute`
5. Verify with:

```sql
-- Confirm reimbursements loaded
SELECT p.payment_type, p.amount, p.payment_date, c.full_name, u.unit_number
FROM payments p
JOIN sales s ON s.id = p.sale_id
JOIN clients c ON c.id = s.client_id
JOIN units u ON u.id = s.unit_id
WHERE p.payment_type = 'reimbursement'
ORDER BY u.unit_number, p.payment_date;
```
