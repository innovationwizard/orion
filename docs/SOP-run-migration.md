# SOP: Running a Production Migration

**Version:** 2.0
**Created:** 2026-05-20
**Updated:** 2026-05-22 — Corrected execution methods to use Supabase CLI (`npx supabase db query --linked`)

---

## Purpose

This SOP governs the safe execution of numbered SQL migration files (`scripts/migrations/NNN_*.sql`) against the production Supabase database. It applies to all migrations: schema changes, data corrections, bulk imports, and commission recalculations.

**This is a production database. Every migration is permanent unless explicitly wrapped in a `BEGIN/ROLLBACK` block. There is no undo button.**

---

## Prerequisites

- Migration file exists at `scripts/migrations/NNN_*.sql`
- Migration is fully reviewed and any blocking questions are resolved
- Supabase CLI installed (`npx supabase --version`) and authenticated (`npx supabase login`)
- Project is linked (`npx supabase projects list` — `orion` should show `●`)

---

## Execution Method — Supabase CLI (canonical)

The Supabase CLI is installed, authenticated, and linked to the `orion` project. All migrations run via `npx supabase db query --linked`.

```bash
# Execute migration file against linked remote project:
npx supabase db query --linked -f scripts/migrations/NNN_migration_name.sql

# Execute an inline query (for verification):
npx supabase db query --linked "SELECT count(*) FROM rv_units WHERE status = 'SOLD';"

# Output as JSON (for scripting):
npx supabase db query --linked -o json "SELECT ..."
```

**No `DATABASE_URL` or `psql` required.** The CLI handles authentication and connection via the linked project.

---

## Step-by-Step Procedure

### Step 1 — Pre-Execution Checklist

- [ ] All blocking flags from the relevant manifest are resolved.
- [ ] Migration file reviewed end-to-end — no placeholders, no hardcoded UUIDs that need to be swapped, no unresolved `[TODO]` markers.
- [ ] If migration includes UPDATEs or DELETEs: verify target row count via a `SELECT` query first.
- [ ] If migration disables triggers: confirm re-enable statement is present at end.
- [ ] If migration calls `calculate_commissions()`: confirm the payment IDs / date range filter is correct.

### Step 2 — Dry-Run (optional, for data mutations)

For migrations that modify existing data (UPDATE/DELETE), dry-run by temporarily changing the migration's `COMMIT` to `ROLLBACK`:

```bash
# Edit migration: change COMMIT → ROLLBACK at the end
# Then run:
npx supabase db query --linked -f scripts/migrations/NNN_migration_name.sql

# Verify output shows no errors
# Then revert: change ROLLBACK → COMMIT
```

For schema-only migrations (CREATE FUNCTION, ALTER TABLE ADD COLUMN), dry-run is not necessary — these are safe and idempotent.

### Step 3 — Execute

```bash
npx supabase db query --linked -f scripts/migrations/NNN_migration_name.sql
```

Successful output: `{ "rows": [], ... }` with no error messages.

### Step 4 — Post-Execution Validation

Run the verification queries embedded in the migration file (typically commented out):

```bash
# Example: verify a new function exists
npx supabase db query --linked \
  "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'my_function';"

# Example: verify a new column exists
npx supabase db query --linked \
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'my_table' AND column_name = 'my_column';"
```

### Step 5 — Create Changelog Entry

Create: `changelog/NNN_YYYY-MM-DD_migration-short-description.md`

Include:
- Migration number and name
- What was changed and why
- Row counts affected
- Any anomalies encountered
- Open items (if any)

Reference: existing entries in `changelog/`.

---

## Rollback

SQL migrations against Supabase production **cannot be automatically rolled back** after `COMMIT`. If a migration must be reversed:

1. Write a compensating migration (e.g., `NNN+1_revert_NNN_description.sql`).
2. Follow the same SOP for the compensating migration.
3. Document the reversal in the changelog.

---

## Connection Details

| Property | Value |
|----------|-------|
| Project ref | `nqaexbpteletuwdbpixq` |
| Supabase URL | `https://nqaexbpteletuwdbpixq.supabase.co` |
| CLI version | `2.101.0` |
| CLI auth | `npx supabase login` (already authenticated) |
| CLI link status | Linked to `orion` (verified via `npx supabase projects list`) |

---

## Key Reference Files

| File | Purpose |
|------|---------|
| `scripts/migrations/` | All numbered migration files |
| `changelog/` | Per-migration changelog entries |
| `docs/SOP-monthly-commission-etl.md` | Monthly RESERVAS import SOP |
| `docs/SOP-monthly-cobros-reconciliation.md` | Monthly COBROS import SOP |
