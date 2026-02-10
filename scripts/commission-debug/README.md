# Commission debug (plan deliverables)

Run these in order to validate commission rules vs DB and get a reconciliation report.

## 1. Validate base inputs

**Supabase SQL Editor:** run `01-validate-inputs.sql`

- Check `commission_rates` counts by `recipient_type` and that management, sales_rep, special IDs match `public/metadata/commission-rules.json`.
- Check `commission_phases` has phases 1–3 with percentages summing to 1.0.

## 2. Confirm trigger and function

**Supabase SQL Editor:** run `02-inspect-trigger-and-function.sql`

- Confirm a trigger on `payments` calls the commission calculation function.
- Confirm the function uses: phase 1 = reservation, phase 3 = payment_date >= deed_signed_date, else phase 2; formula `payment.amount * rate * phase_percentage`; recipients = management (always_paid), sales_rep or walk_in, referral if applicable, special always_paid.

**Required fix:** Commissions must recalc on any change to a payment or sale row. Run **`fix-trigger-recalc-on-update.sql`** in Supabase so that:
- `payments`: trigger fires on INSERT and UPDATE.
- `sales`: new trigger recalculates commissions for all payments of that sale when the sale row is updated.

## 3 & 4. Sample + reconciliation

**In Supabase SQL Editor (use these; do not paste or run the .ts file as SQL):**

- **Step 3 – Sample:** Run `03-sample-recompute.sql`. Returns one row per sample payment with expected_total, actual_total, diff, and status (OK / MISMATCH).
- **Step 4 – Totals:** Run `04-reconciliation-report.sql` for overall expected, overall actual, and by-recipient_type comparison.

**Optional – TypeScript (terminal only, not SQL Editor):**  
From project root with env set, run in your **terminal** (not Supabase):

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/commission-debug/validate-and-reconcile.ts
```

- This script is Node/TypeScript. Do **not** run it or paste it into the Supabase SQL Editor.

## 5. Analytics endpoint

`/api/analytics/commissions` reads from `commissions` with no extra filters beyond optional `start_date`, `end_date`, and `project_id`. So UI totals match DB when no filters are applied.

## 5. Backfill and walk-in fix (if step 4 shows special expected > actual)

If **special** expected stays ~3.6k above actual even after a backfill, the DB was not treating `sales_rep_id = 'unknown'` as walk-in (Puerta Abierta). Do this in order:

1. Run **`fix-walk-in-treat-unknown.sql`** in Supabase (updates `calculate_commissions` so `'unknown'` is treated as walk-in).
2. Run **`backfill-commissions.sql`** again.
3. Re-run step 4; special expected and actual should align.

## 6. Root cause and fix

See **COMMISSION_DEBUG_REPORT.md** in the project root for reconciliation summary, pinpointed root cause, and minimal fix (DB function, data, or analytics).
