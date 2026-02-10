# Commission debug – reconciliation report and fix

## Goals (from plan)

- Prove whether commission rows match the rules in `public/metadata/commission-rules.json`.
- Identify which step (rates, phase logic, trigger execution, or analytics aggregation) creates any discrepancy.

## How to generate the reconciliation numbers

1. **Validate inputs:** Run `scripts/commission-debug/01-validate-inputs.sql` in Supabase SQL Editor. Confirm rates by type and phase sum = 1.0.
2. **Inspect trigger/function:** Run `scripts/commission-debug/02-inspect-trigger-and-function.sql` in Supabase. Confirm phase selection and formula match the rules.
3. **Sample + totals:** Run  
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/commission-debug/validate-and-reconcile.ts`  
   or run `scripts/commission-debug/04-reconciliation-report.sql` in Supabase for expected vs actual totals.

## Reconciliation summary (fill after running scripts)

| Scope            | Total expected | Total actual | Difference |
|-----------------|----------------|--------------|------------|
| Overall         | _from script_  | _from script_| _diff_     |
| By recipient_type| _per type_     | _per type_   | _diff_     |

**Observed:** management matches (diff ≈ 0). **Special** can show expected > actual by a few thousand (e.g. ~3659) when commissions were only calculated on payment INSERT; after sale updates (referral_applies, walk-in) those payments never recalculated. Run **`scripts/commission-debug/backfill-commissions.sql`** once to recalc all payments; then re-run step 4 to confirm expected ≈ actual for special.

- If **expected > actual**: missing commission rows or phase/recipient logic in DB is too restrictive (or backfill needed).
- If **expected < actual**: duplicate or over-counted commissions, or phase/recipient logic is too broad.
- If **sample mismatches** but **totals close**: selective issue (e.g. certain payment_type or deed_signed_date cases).

## Step 2 findings (trigger and function)

- **Trigger (correct behavior):** Any change to a payment or sale row must trigger re-calculation of commissions for that row. By default the DB had `auto_calculate_commissions` only on **AFTER INSERT** on `payments`. Run **`scripts/commission-debug/fix-trigger-recalc-on-update.sql`** in Supabase to:
  - Fire commission recalc on **payments** on both INSERT and UPDATE.
  - Add a trigger on **sales** so that when a sale is updated (e.g. deed_signed_date, referral_applies, sales_rep_id), all that sale’s payment commissions are recalculated.
- **Function:** `trigger_calculate_commissions()` calls `calculate_commissions(new.id)`. Phase logic and formula match the plan (reservation → 1; deed + payment_date → 3; else 2; amount × rate × phase_percentage). Referral is paid when `referral_applies = true` only. Reconciliation script and SQL are aligned to this behavior.

## Rule vs implementation note (phase 1)

- **commission-rules.json** says phase 1 trigger is `promise_signed_date`.
- **fix-commissions-draft.sql** uses `payment_type = 'reservation'` for phase 1. So only reservation payments get phase 1; down_payment always gets phase 2 unless `payment_date >= deed_signed_date` (then phase 3). If your business rule is “phase 1 when promise is signed (even for a down_payment)”, the DB function must be updated to use `promise_signed_date` for phase 1 instead of reserving it for reservation only.

## Root cause (pinpoint after running reconciliation)

- **Rates/phases:** Missing or wrong rows in `commission_rates` or `commission_phases` → fix data or seed from `commission-rules.json`.
- **Phase logic:** Function uses reservation → 1, deed_signed_date + payment_date → 3, else 2. If rules differ (e.g. promise_signed_date for phase 1), adjust `calculate_commissions_for_payment` in Supabase (see `origin/fix-commissions-draft.sql`).
- **Recipient eligibility:** Function pays management (always_paid), sales_rep or walk_in, referral when applicable, special always_paid. If referral/walk_in conditions differ from rules, adjust the function.
- **Trigger:** New/updated payments must fire the trigger; if not, commissions won’t exist for those payments → run backfill (e.g. `PERFORM calculate_commissions_for_payment(id)` for each payment).
- **Analytics:** `/api/analytics/commissions` does not exclude data beyond optional date/project filters; if UI still doesn’t match DB, compare with no filters to confirm.

## Minimal fix checklist

1. **If mismatch is in calculation:** Update `public.calculate_commissions_for_payment()` (or the name your trigger uses) so phase and recipient logic match `commission-rules.json`, then re-run backfill (e.g. truncate commissions and recalc for all payments).
2. **If mismatch is in data:** Fix `commission_rates` / `commission_phases` or `sales` (e.g. `referral_applies`, `deed_signed_date`, `payment_type`) and re-run commission calculation for affected payments.
3. **If mismatch is in aggregation:** Change only the analytics query or UI summary so they align with the same scope (e.g. same date range and project filter).

## Key references

- [public/metadata/commission-rules.json](public/metadata/commission-rules.json)
- [origin/supabase_schema_2.md](origin/supabase_schema_2.md)
- [origin/fix-commissions-draft.sql](origin/fix-commissions-draft.sql) – function and backfill reference
- Trigger/function definitions – from `02-inspect-trigger-and-function.sql` in Supabase
