# Tech Debt Registry

Items flagged for future resolution. Ordered by discovery date.

---

## TD-001 — Supabase migration tracking out of sync with production schema

**Flagged:** 2026-05-22
**Severity:** Low (no production impact — all SQL has been applied)
**Impact:** `npx supabase migration list --linked` does not reflect actual production state. Cannot use `supabase db push` or `supabase db reset` reliably.

**Current state:**

- `supabase/migrations/` has 8 CLI-tracked files. Only 3 are registered on the remote migration history table (`supabase_migrations.schema_migrations`). The other 5 exist locally but show blank in the Remote column.
- `scripts/migrations/` has 67 manually-run SQL files (001–067). All have been executed against production via `npx supabase db query --linked`, but none are registered in Supabase's migration tracking system.

**Root cause:** Migrations were executed with `db query` (raw SQL execution) instead of `db push` (migration-aware execution). The two approaches use different mechanisms — `db query` runs SQL directly; `db push` runs SQL and records it in `schema_migrations`.

**Resolution options:**

1. **Backfill the migration history:** Insert records into `supabase_migrations.schema_migrations` for all 67 manual migrations + fix the 5 unregistered local ones. This makes `migration list` accurate without re-running anything.
2. **Consolidate into a baseline:** Dump the current production schema as a single baseline migration in `supabase/migrations/`, clear the history, and start fresh. Simpler but loses granular history.
3. **Accept divergence:** Continue using `scripts/migrations/` + `db query` for all future migrations. Document that `supabase/migrations/` is not the canonical migration path. Lowest effort but limits future use of Supabase CLI migration features.
