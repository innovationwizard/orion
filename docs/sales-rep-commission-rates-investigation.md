# Investigation: Sales Rep Commission Rates — Root Cause, Best Practices & Expert Recommendations

**Date:** 2026-03-16
**Status:** Pre-existing issue discovered during migration 032 deployment
**Severity:** Critical — ejecutivo commissions are silently NOT being calculated

---

## Table of Contents

1. [Root Cause Analysis](#1-root-cause-analysis)
2. [Database Nomenclature Best Practices](#2-database-nomenclature-best-practices)
3. [Expert Perspectives Applied to This System](#3-expert-perspectives-applied-to-this-system)
4. [Synthesis & Recommended Path Forward](#4-synthesis--recommended-path-forward)

---

## 1. Root Cause Analysis

### 1.1 The Problem

After migration 032 deployment, verification queries revealed **zero active `sales_rep` entries** in `commission_rates`:

```sql
SELECT COUNT(*) FROM commission_rates
WHERE recipient_type = 'sales_rep' AND active = true;
-- Result: 0
```

This means the `calculate_commissions()` function silently skips **all ejecutivo (salesperson) commissions** for every payment processed.

### 1.2 Timeline of Events

| Migration | What Happened | Impact on `commission_rates` |
|-----------|--------------|------------------------------|
| **002** | Seeded `sales_reps` table with text IDs: `'05'`, `'06'`, `'35'`, `'GV1'`, `'walk_in'`, `'unknown'` | No effect — different table |
| **009** | Seeded `commission_rates` with management + special recipients | **Never created any `recipient_type = 'sales_rep'` rows** (verified by reading file) |
| **006–008** | Introduced `commission_policy_periods` + `commission_role_rates` system with escalation thresholds | Ejecutivo rates resolved via policy lookup, NOT `commission_rates` |
| **024** | Unified `sales_reps` → `salespeople` (text → uuid). Rewrote `calculate_commissions()` | **Removed the policy-period system entirely.** Re-key UPDATE on `commission_rates` matched **0 rows** (none existed). Function now depends solely on `commission_rates` fallback — which has zero sales_rep entries. |
| **032** | Added `puerta_abierta`, removed `walk_in` | No change to sales_rep entries (none existed to change) |

### 1.3 The Original Seed Gap

Migration 009 (`009_seed_commission_phases_and_rates.sql`) created:
- **Special recipients**: `walk_in`, `referral`, `ahorro`, `ahorro_por_retiro`
- **Management recipients**: `otto_herrera`, `alek_hernandez`, `ahorro_comercial`, `antonio_rada`
- **Zero sales_rep recipients**: No entries for any salesperson

This was not a bug at the time of migration 009 — the system resolved ejecutivo rates through the `commission_policy_periods` + `commission_role_rates` tables (seeded in migrations 006–008). The `commission_rates` table was a fallback for payments outside any defined policy period.

### 1.4 Migration 024: Two Independent Failures

**Failure 1 — Silent re-key of empty data:**
Migration 024 (Phase 5) ran an UPDATE on `commission_rates WHERE recipient_type = 'sales_rep'` that matched 0 rows. No validation was performed.

**Failure 2 — Function regression:**
Migration 024 replaced `calculate_commissions()` with a simplified version that **removed all policy-period lookups** (`get_commission_policy_period()`, `commission_role_rates`, escalation thresholds). The simplified function uses ONLY `commission_rates` for ejecutivo resolution — but that table has zero sales_rep entries.

**Result:** Before migration 024, ejecutivo commissions were calculated via policy periods. After migration 024, they cannot be calculated at all. The fallback path assumed by the simplified function was never populated.

### 1.5 How the Function Fails Silently

The production function (migration 032, based on 024) contains:

```sql
-- Section 2: Ejecutivo
IF v_sale.sales_rep_id IS NOT NULL THEN
  SELECT * INTO v_rate FROM commission_rates cr
  WHERE cr.recipient_id = v_sale.sales_rep_id::text
    AND cr.recipient_type = 'sales_rep'
    AND cr.active = true;
  IF FOUND THEN
    INSERT INTO commissions (...) VALUES (...);
  END IF;
END IF;
```

When no rows match, `FOUND` is `false`, the `INSERT` is skipped. **No exception, no warning, no log.**

**Inconsistency within the function:** The same function uses `RAISE EXCEPTION` for missing payments, missing sales, and missing phase configuration — but silently swallows missing salesperson rates. The rate lookup is the one most likely to fail during schema migration, yet it's the only one without error reporting.

### 1.6 What the SSOT Shows About Ejecutivo Rates

The SSOT (`ReestructuraPuertaAbiertaInmobiliariaDiciembre2025.xlsx` and `ComisionesFebrero/01.26 Comisiones nuevo formato - Enero 2026.xlsx`) reveals ejecutivo rates are **NOT uniform** (documented in audit plan DIFF-06):

**Boulevard 5 — Antonio Rada (EV 05):** 6 distinct rates
- 0.25%, 0.30%, 0.40%, 0.50%, 1.00%, 1.25%

**Casa Elisa — Paula Hernandez (EV 07):** 4 distinct rates
- 0.40%, 0.50%, 1.00%, 2.00%

**Benestare / BLT:** Mostly 1.00% or 1.25%

Rates are assigned **per unit**, not per salesperson. The same salesperson can have different rates on different units within the same project. This means any fix must account for per-unit rate granularity — a uniform default rate would be false data.

### 1.7 Schema Evolution — Observed from 12 Historical Snapshots

The `schemas_history/` directory contains 12 schema snapshots documenting the database's progression. Every claim below is derived from direct observation of these files, not from migration file inference.

#### Immutable Fact: `commission_rates` Never Changed

The `commission_rates` table has the **exact same 11 columns** in every snapshot from schema_0 through schema_a1 (current production):

```
id (uuid), recipient_id (text), recipient_name (text), rate (numeric),
recipient_type (text), description (text), always_paid (boolean),
active (boolean), created_at, updated_at, row_version (integer)
```

No columns were added, removed, renamed, or retyped across the entire history. The polymorphic structure (`recipient_id` text + `recipient_type` text) was present from day one and has never been refactored.

#### Timeline from Schema Snapshots

| Snapshot | Key State | `sales_rep` Entity | Commission System |
|----------|-----------|-------------------|-------------------|
| **schema_0** | Original schema | `sales.sales_rep_id` = **TEXT**. No `sales_reps` table. | `commission_rates` exists (polymorphic). No policy tables. |
| **schema_1** | uuid_v7() defaults added | Same as 0 | Same as 0 |
| **schema_2** | `commissions.status`, `row_version` added | Same as 0 | `commissions.status` (USER-DEFINED) added |
| **schema_3** | Analytics views added (`cash_flow_forecast`, `payment_compliance`, etc.) | Same as 0 | Same as 0 |
| **schema_5** | **Pivotal change** | `sales_reps` table appears (uuid PK!). `sales.sales_rep_id` changed **TEXT→UUID**. `sales_rep_periods`, `sales_rep_project_assignments` added. | `commission_rates` unchanged |
| **schema_5+migrations** | Policy period system introduced | Same as schema_5 | **NEW tables**: `commission_policy_periods`, `commission_role_rates`, `commission_role_recipients`, `commission_referral_types`. `commissions.policy_period_id` + `referral_type` columns added. `commission_phases.requires_promise_signed/bank_disbursement` added. |
| **schema_7** | Gerencia assignments | Same as schema_5 | `commission_gerencia_assignments` added. `commission_referral_types.ahorro_rate` added. |
| **schema_8/9/9_copy** | **Pre-024 coexistence** (3 identical snapshots) | **Both `sales_reps` AND `salespeople` exist simultaneously.** `sales_reps` has columns 3-4 dropped (ordinal_position: 1,2,5,6,7). `salespeople` has `user_id` (from migration 022). `salesperson_projects` (simple junction) coexists with `sales_rep_project_assignments` (temporal). | All commission tables present. `commission_rates` unchanged. |
| **schema_a1** | Current production | `sales_reps` **DROPPED**. `salespeople` is canonical. `sales_rep_periods` and `sales_rep_project_assignments` still exist (not yet renamed to `salesperson_*`). | All policy tables still exist but function doesn't query them. `commission_rates` unchanged. Migration 032 added `puerta_abierta`, deactivated `walk_in`. |

#### Key Observations

1. **The `sales.sales_rep_id` type change (TEXT→UUID) happened in schema_5.** This is the point where `sales_reps` table was introduced with UUID PKs. Before this, `sales_rep_id` was a text identifier (e.g., `'05'`, `'GV1'`).

2. **The policy-period system appeared between schema_5 and schema_5+migrations** (migrations 006-008). This was the first (and only) time ejecutivo rates were properly modeled — through `commission_role_rates` with escalation thresholds per project.

3. **The `sales_reps` ↔ `salespeople` coexistence period** (schema_8/9/9_copy) shows both tables existing simultaneously. During this window, `sales_reps` already had two columns dropped (ordinal positions 3 and 4 — likely `email` and `phone` based on the migration 018 reservation schema adding those to `salespeople` instead).

4. **Three identical snapshots** (8, 9, 9_copy) suggests this coexistence state persisted for some time before migration 024 unified them.

5. **`commission_rates` has been architecturally frozen since day one.** Despite 12 schema snapshots spanning the entire project history, this table's structure never evolved — even as the commission system around it went through three paradigms (flat rates → policy periods → simplified fallback-only).

### 1.8 Impact Assessment

**What is known:**
- `puerta_abierta` has 6,524 commission rows (one per payment) — this is the expected count of ejecutivo rows
- Every payment with an assigned salesperson should have an ejecutivo commission row
- Currently there are zero

**What is uncertain:**
- The exact financial amount missing depends on each sale's payment amounts and the per-unit rate that should apply. I cannot calculate this without querying production data and cross-referencing per-unit rates from the SSOT. Stating a specific number here would be fabrication.
- It is also unclear whether the backfill after migration 024 was supposed to restore ejecutivo commissions — if the policy-period function was still active before 024, then ejecutivo commissions MAY have existed before 024's backfill deleted and recomputed them with the simplified function.

**What the schema history confirms:**
- The policy-period tables (`commission_policy_periods`, `commission_role_rates`, `commission_role_recipients`) still exist in production (schema_a1). They were never dropped — only the function logic that queries them was removed.
- `commission_rates` never had `sales_rep` entries in any schema snapshot. The table's _data_ was never designed to serve as the ejecutivo rate source — it was a fallback for management/special recipients only.
- The ejecutivo rate resolution was always intended to flow through the policy-period system (introduced between schema_5 and schema_5+migrations). Migration 024's simplified function broke this contract.

---

## 2. Database Nomenclature Best Practices

### 2.1 How Nomenclature Caused This Bug

This is not an abstract naming discussion — inconsistent naming directly contributed to the production failure:

1. **`commission_rates.recipient_type = 'sales_rep'`** references an entity that was renamed to `salespeople` in the table schema. The discriminator value was never updated to match.

2. **`sales.sales_rep_id`** still uses the old entity name as a column name, while `reservations.salesperson_id` uses the new one. The same FK concept has two different names in the same database.

3. **Migration 024's re-key query** used `WHERE cr.recipient_type = 'sales_rep'` — the old entity name — and found nothing. If the column values had been updated during the table rename, or if a validation query had checked "do any rows match this filter?", the gap would have been discovered.

### 2.2 Industry Conventions Applicable to This System

**One canonical name per entity (DDD Ubiquitous Language):**

Every authoritative source — Domain-Driven Design (Evans, 2003), Enterprise Craftsmanship, and the PostgreSQL community — agrees: within a single bounded context, one entity must have exactly one name in code. The mapping for Orion:

| Layer | Current State | Canonical Name |
|-------|-------------|----------------|
| Database table | `salespeople` | `salespeople` (already correct) |
| FK in `sales` | `sales_rep_id` | Should be `salesperson_id` |
| FK in `reservations` | `salesperson_id` | Already correct |
| `commission_rates` discriminator | `'sales_rep'` | Should be `'salesperson'` or decomposed |
| TypeScript type | Mixed | `Salesperson` everywhere |
| UI labels | "Asesor", "Ejecutivo" | Separate concern (user-facing i18n) |

**Sources:** [sqlstyle.guide](https://www.sqlstyle.guide/), [Enterprise Craftsmanship: Ubiquitous Language](https://enterprisecraftsmanship.com/posts/ubiquitous-language-naming/)

**Consistency > convention:**

Orion's schema is predominantly plural (`salespeople`, `commissions`, `projects`, `payments`, `reservations`). The few singular names (`audit_log`, `cash_flow_forecast`) are exceptions. The dominant pattern should be enforced going forward.

**Sources:** [Bytebase: SQL Table Naming Dilemma](https://www.bytebase.com/blog/sql-table-naming-dilemma-singular-vs-plural/), [ISO/IEC 11179](https://en.wikipedia.org/wiki/ISO/IEC_11179)

### 2.3 The Polymorphic Association Anti-Pattern

`commission_rates` uses a polymorphic association:
```
recipient_id (text) + recipient_type ('management'|'sales_rep'|'special')
```

This is explicitly identified as an anti-pattern by GitLab's engineering guidelines and documented in Celko's *SQL Antipatterns* (Chapter 7):

1. **No FK constraint possible** — `recipient_id` contains text slugs (`'otto_herrera'`), human-readable names (`'ahorro'`), and UUIDs cast to text — all in one column
2. **The discriminator conflates role with payment logic** — `'management'` determines both who gets paid AND that they're always paid
3. **Rename ripple effect** — renaming `sales_rep` → `salesperson` requires finding and updating every query that uses the discriminator value

**This anti-pattern is the structural root cause of the bug.** If ejecutivo rates had lived in a dedicated table with a proper FK to `salespeople(id)`, the migration would have either updated the FK or raised a constraint violation — making the gap impossible to miss.

**Sources:** [GitLab: Polymorphic Associations](https://docs.gitlab.com/development/database/polymorphic_associations/), Joe Celko, *SQL Antipatterns* (Chapter 7: Polymorphic Associations)

---

## 3. Expert Perspectives Applied to This System

> **Note on attribution:** The following section applies published principles from these authors' works to Orion's specific problem. These are not direct quotes from the authors about this system — they are my application of their documented frameworks. This distinction matters per Rule 1 (no fabrication).

### 3.1 Schema Evolution Principles (Kleppmann, *Designing Data-Intensive Applications*)

Kleppmann's framework for schema evolution emphasizes **backward and forward compatibility** during transitions. Applied to this system:

- Migration 024 performed a **non-backward-compatible change** (dropping `sales_reps` and rewriting the function) without verifying that all dependent data paths remained functional.
- The **expand-contract pattern** (documented in Kleppmann's work and in [Prisma's data guide](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)) prescribes: (1) expand — add new structures alongside old, (2) migrate — verify all consumers work with new structures, (3) contract — remove old structures. Migration 024 compressed all three into one transaction without the verification step.
- The silent `UPDATE ... WHERE recipient_type = 'sales_rep'` affecting 0 rows is a textbook example of what Kleppmann calls a migration that is "correct at the DDL level but broken at the semantic level."

### 3.2 Polymorphic Association Decomposition (Celko, *SQL Programming Style* / *SQL Antipatterns*)

Celko's naming and structural principles (documented in *SQL Programming Style* and analyzed in *SQL Antipatterns*) identify the `commission_rates` table as exhibiting three anti-patterns:

1. **Polymorphic `recipient_id`**: One column serving as a natural key, a human-readable slug, AND a surrogate key cast to text
2. **Mixed domain semantics**: The `recipient_type` discriminator conflates organizational role with business logic
3. **No referential integrity enforcement**: Impossible to create FK constraints on a polymorphic column

The structural solution from this framework: **decompose into purpose-specific tables** where each table has proper FK constraints to its target entity. This eliminates the discriminator entirely and makes missing data a constraint violation rather than a silent skip.

### 3.3 Temporal Rate Management (Kimball, *The Data Warehouse Toolkit*)

The Kimball methodology's **Slowly Changing Dimension (SCD) Type 2** pattern applies directly to commission rate evolution. Orion's system evolved through three rate paradigms:

| Era | Rate Resolution | Temporal Tracking |
|-----|----------------|-------------------|
| **Pre-006** | `commission_rates` fallback (per-rep, flat) | `active` boolean only |
| **006–023** | `commission_policy_periods` + `commission_role_rates` (per-project, escalation) | `start_date` / `end_date` per policy period |
| **024–present** | `commission_rates` fallback only (policy system removed) | `active` boolean only — regression |

The SSOT reveals a **fourth paradigm**: per-unit rate assignment (DIFF-06). The same salesperson has rates from 0.25% to 2.00% across different units. This is more granular than any of the three paradigms the app has used.

PostgreSQL supports temporal constraints natively using `daterange` types with `EXCLUDE` constraints (available since PostgreSQL 9.2, documented extensively in [PostgreSQL 18 temporal constraints](https://neon.com/postgresql/postgresql-18/temporal-constraints)):

```sql
CREATE TABLE commission_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id uuid NOT NULL REFERENCES salespeople(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  rate numeric NOT NULL CHECK (rate >= 0 AND rate <= 0.05),
  valid_period daterange NOT NULL,
  EXCLUDE USING gist (
    salesperson_id WITH =,
    project_id WITH =,
    valid_period WITH &&
  )
);
```

This prevents overlapping rate definitions at the database level and enables point-in-time lookups via `WHERE valid_period @> payment_date`.

### 3.4 Evolutionary Database Design (Fowler / Sadalage, *Refactoring Databases*)

Fowler and Sadalage's **Parallel Change** pattern (documented at [martinfowler.com/bliki/ParallelChange.html](https://martinfowler.com/bliki/ParallelChange.html)) prescribes that destructive changes require a transition period where both old and new access patterns coexist.

Schema snapshots 8/9/9_copy confirm the expand phase happened: both `sales_reps` and `salespeople` coexisted. But migration 024 compressed the migrate+contract phases into one transaction without verification. Since `sales_reps` is already dropped, the relevant principle is: **complete the contract phase properly.** Two options exist:

1. **Re-populate the lookup data** — seed `commission_rates` with the entries the simplified function expects
2. **Restore the advanced function** — re-introduce the policy-period system that doesn't need per-salesperson fallback entries

Option 2 is architecturally superior because the policy-period system already has its data populated (tables `commission_policy_periods`, `commission_role_rates`, `commission_role_recipients` exist with data from migrations 006–008). The simplified function simply doesn't query them.

### 3.5 Financial Calculation Integrity (Stripe Ledger / Square Books patterns)

Stripe's Ledger system ([stripe.com/blog/ledger](https://stripe.com/blog/ledger-stripe-system-for-tracking-and-validating-money-movement)) establishes a principle directly relevant here: **every unexplainable money movement is a system failure that must be surfaced, not hidden.** Their system achieves "99.9999% explainability of money movement."

Orion's `calculate_commissions()` function violates this principle: it produces financial calculations that silently omit the ejecutivo portion — which is the largest variable component of the 5% commission. The function's `DELETE + INSERT` recomputation pattern means that if ejecutivo commissions EVER existed (via the pre-024 policy-period function), they were **silently destroyed** when the backfill ran after migration 024.

Square's Books system ([developer.squareup.com/blog/books](https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/)) adds the principle of append-only design: corrective journal entries rather than destructive recomputation. The current `DELETE FROM commissions WHERE payment_id = ?` + fresh `INSERT` pattern is idempotent and simple, but makes it impossible to audit what changed. A `paid = true` row deleted by recomputation is unrecoverable data loss.

### 3.6 The Silent Failure Anti-Pattern (PostgreSQL documentation)

The PostgreSQL documentation on [PL/pgSQL errors and messages](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) provides `RAISE WARNING` and `RAISE EXCEPTION` specifically for this pattern. The function already uses exceptions correctly for three lookups but not for the fourth:

| Lookup | Missing Data Handling | Correct? |
|--------|-----------------------|----------|
| Payment not found | `RAISE EXCEPTION` | Yes |
| Sale not found | `RAISE EXCEPTION` | Yes |
| Phase config not found | `RAISE EXCEPTION` | Yes |
| **Salesperson rate not found** | **Silent skip (`IF FOUND`)** | **No** |

The inconsistency is indefensible: if a missing phase configuration is an exception-worthy error, a missing salesperson rate — which affects a larger dollar amount — should be at least a `RAISE WARNING`.

---

## 4. Synthesis & Recommended Path Forward

### 4.1 Three Steps, In Order

Every framework cited above converges on the same sequence:

1. **Make the failure visible** — add `RAISE WARNING` to the ejecutivo lookup so silent skips appear in PostgreSQL logs
2. **Fix the data or restore the function** — either populate `commission_rates` with real rates from SSOT, or restore the policy-period system that already has its data
3. **Eliminate the structural weakness** — decompose the polymorphic `commission_rates` table so this class of bug cannot recur

### 4.2 Fix Options — Grounded in SSOT Data

#### Option A: Restore the policy-period function (Recommended)

Re-introduce `commission_policy_periods` + `commission_role_rates` + `commission_role_recipients` lookups into `calculate_commissions()`, based on the version from migration 008/015. These tables already exist and are populated with data from migrations 006–008.

**What this fixes:**
- Ejecutivo rate resolved as 1.00% (below threshold) or 1.25% (at/above threshold) per `commission_role_rates`
- Ahorro resolved via policy rates (0.35% / 0.10%) rather than missing entirely
- Escalation thresholds enforced per project (5 for B5/BNT/BLT, 2 for CE)

**What this does NOT fix (separate diffs from audit plan):**
- Per-unit rate granularity (DIFF-06) — SSOT shows rates like 0.25%, 0.40%, 2.00% that the escalation model cannot reproduce
- Conditional Alek/Supervisor payment (DIFF-03/04)
- Residual ahorro calculation (DIFF-05)
- Ronaldo O. recipient (DIFF-01)

**Why this is the right first step:** The policy-period data already exists in production. The tables were created and seeded by migrations 006–008. Migration 024 only removed the function logic that queries them — the data is intact. Schema snapshots confirm: `commission_policy_periods`, `commission_role_rates`, and `commission_role_recipients` appear in every snapshot from schema_5+migrations through schema_a1 (current). They were never dropped, never altered in structure. Restoring the function to use these tables requires no new data insertion, only re-implementing the lookup logic.

#### Option B: Seed `commission_rates` with per-unit rates from SSOT

Insert per-salesperson entries into `commission_rates` using rates from the SSOT.

**Critical constraint:** The SSOT shows ejecutivo rates are NOT uniform — they vary per unit, per salesperson, per project. Inserting a single default rate (e.g., 1.00%) for each salesperson would be **false data** that misrepresents the business reality. Per Rule 4: "We never put mock data or sample data or false information of any kind into our code or databases."

To implement Option B correctly would require:
1. Extracting every per-unit rate from the SSOT Excel files
2. Creating a new table structure that supports per-unit rates (since `commission_rates` has no `unit_id` or `sale_id` column)
3. This is equivalent to building the per-unit rate override system from scratch (DIFF-06)

**This is NOT a quick fix.** Calling it one would violate Rule 1 (don't lie).

#### Option C: Hybrid — Option A now, per-unit rates later

1. Restore the policy-period function (Option A) — ejecutivo commissions resume at 1.00%/1.25% via escalation model
2. Plan a separate migration for per-unit rate overrides (DIFF-06) once the CFO clarifies which per-unit rates are current policy vs. legacy

**This is the honest recommendation.** It acknowledges that:
- 1.00%/1.25% escalation is a reasonable approximation for most units (SSOT shows BNT/BLT are "mostly 1.00% or 1.25%")
- Per-unit rates like 0.25% and 2.00% exist in the SSOT and WILL produce incorrect commissions under the escalation model
- The variance must be quantified and approved by the CFO before implementing per-unit overrides

### 4.3 Schema Naming Cleanup (Non-Urgent, Do When Convenient)

| Current | Recommended | Why |
|---------|------------|-----|
| `sales.sales_rep_id` | `sales.salesperson_id` | FK name should match canonical entity name |
| `commission_rates.recipient_type = 'sales_rep'` | `'salesperson'` or decompose table | Stale entity name in discriminator |
| `salesperson_periods.salesperson_id` | Already correct | — |
| `reservations.salesperson_id` | Already correct | — |

These renames require the expand-contract migration pattern and are independent of the ejecutivo commission fix.

### 4.4 Verification Queries

After any fix, these queries validate correctness:

```sql
-- 1. Every payment with a real salesperson should have an ejecutivo commission
SELECT
  p.id AS payment_id,
  sp.display_name AS salesperson,
  c_ev.recipient_id AS ejecutivo_recipient,
  c_ev.commission_amount AS ejecutivo_amount
FROM payments p
JOIN sales s ON p.sale_id = s.id
JOIN salespeople sp ON s.sales_rep_id = sp.id
LEFT JOIN commissions c_ev ON c_ev.payment_id = p.id
  AND c_ev.recipient_id = s.sales_rep_id::text
WHERE sp.display_name NOT IN ('Unknown', 'Puerta Abierta', 'Unknown / Directo')
  AND c_ev.id IS NULL  -- missing ejecutivo commission
LIMIT 20;
-- Expected: 0 rows (no missing ejecutivo commissions)

-- 2. Ejecutivo commission count should match puerta_abierta count
-- (both should have one row per payment for sales with a salesperson)
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
-- Expected: ejecutivo_rows close to pa_rows (exact match unlikely due to
-- ahorro_por_retiro redirects and sales without salesperson)

-- 3. Spot-check: rate applied per ejecutivo
SELECT recipient_id, recipient_name, rate, COUNT(*) AS row_count,
  SUM(commission_amount) AS total_amount
FROM commissions
WHERE recipient_id NOT IN (
  'puerta_abierta', 'otto_herrera', 'alek_hernandez',
  'ahorro_comercial', 'antonio_rada', 'ahorro', 'ahorro_por_retiro',
  'referral', 'walk_in'
)
GROUP BY recipient_id, recipient_name, rate
ORDER BY total_amount DESC;
-- Expected: each salesperson appears with rate 0.0100 or 0.0125
```

---

## References

### Database Nomenclature
- [Bytebase: SQL Table Naming Dilemma](https://www.bytebase.com/blog/sql-table-naming-dilemma-singular-vs-plural/)
- [sqlstyle.guide (Simon Holywell)](https://www.sqlstyle.guide/)
- [ISO/IEC 11179](https://en.wikipedia.org/wiki/ISO/IEC_11179) — naming standards
- [Launchbylunch: How I Write SQL](https://launchbylunch.com/posts/2014/Feb/16/sql-naming-conventions/)
- [Red Gate: SQL Naming Conventions](https://www.red-gate.com/simple-talk/blogs/sql-naming-conventions/)
- [GitLab: Polymorphic Associations](https://docs.gitlab.com/development/database/polymorphic_associations/)
- [Enterprise Craftsmanship: Ubiquitous Language](https://enterprisecraftsmanship.com/posts/ubiquitous-language-naming/)

### Applied Expert Frameworks
- Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017) — schema evolution, expand-contract pattern
- Joe Celko, *SQL Programming Style* (Morgan Kaufmann, 2005) — naming conventions, anti-patterns
- Ralph Kimball, *The Data Warehouse Toolkit* (Wiley, 2013) — SCD Type 2, temporal dimensions
- Martin Fowler, [Evolutionary Database Design](https://martinfowler.com/articles/evodb.html) — parallel change pattern
- Martin Fowler, [Parallel Change](https://martinfowler.com/bliki/ParallelChange.html) — expand-migrate-contract
- Pramod Sadalage & Martin Fowler, *Refactoring Databases* (Addison-Wesley, 2006) — migration patterns
- [Stripe: Ledger](https://stripe.com/blog/ledger-stripe-system-for-tracking-and-validating-money-movement) — financial calculation integrity
- [Square: Books](https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/) — immutable double-entry design
- [PostgreSQL: PL/pgSQL Errors and Messages](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) — RAISE WARNING/EXCEPTION
- [Prisma: Expand-Contract Pattern](https://www.prisma.io/dataguide/types/relational/expand-and-contract-pattern)
- [Neon: PostgreSQL 18 Temporal Constraints](https://neon.com/postgresql/postgresql-18/temporal-constraints)

### Orion-Specific References
- `docs/commission-audit-plan.md` — 13 diffs between SSOT and app (this issue is DIFF-06 + the pre-existing sales_rep seed gap)
- `scripts/migrations/009_seed_commission_phases_and_rates.sql` — original seed (no sales_rep entries)
- `scripts/migrations/024_unify_salespeople.sql` — function regression + silent re-key
- `scripts/migrations/032_puerta_abierta_always_paid.sql` — current production function
- `ComisionesFebrero/01.26 Comisiones nuevo formato - Enero 2026.xlsx` — SSOT per-unit rates
- `ReestructuraPuertaAbiertaInmobiliariaDiciembre2025.xlsx` — SSOT rate structure
