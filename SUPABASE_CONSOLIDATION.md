# Supabase consolidation — status & playbook

**Purpose:** orion is the destination project into which other standalone Supabase
projects are being merged (schema-per-app) to cut costs. This file is the shared
memory of where the consolidation stands — read it at the start of any
consolidation work.

_Last updated: 2026-07-01_

---

## Destination project

- **orion** — ref `nqaexbpteletuwdbpixq`, org `drmalqeolfsoiprrkhfy`, region `us-east-2`.
- Each merged app gets its **own Postgres schema** inside orion (not `public`).
- **Auth is shared:** one project = one `auth` schema. All merged apps
  authenticate against orion's single `auth.users` pool. This is the accepted
  design ("keep the destination auth").
- Currently exposed schemas (Data API → Settings → Exposed schemas):
  `graphql_public`, `history`, `public`, and one per merged app (below).

---

## Merge status

| Source app | Old project ref | orion schema | State | Old project |
|---|---|---|---|---|
| landbank (Forma land-evaluator) | `ychohtntxvkvbxjpmups` | `landbank` | ✅ **complete** | 🗑️ **deleted 2026-07-01 (irreversible)** |

### landbank — details (done 2026-07-01)
- 6 tables recreated in schema `landbank` (profiles, zone_benchmarks,
  eliminatory_criteria, rubric_categories, user_weights, assessments).
  Verified present. No user data migrated.
- Rubric **config** re-seeded: 20 zone_benchmarks / 11 eliminatory_criteria /
  8 rubric_categories. Verified.
- SQL lives in the **landbank** repo: `supabase/orion_landbank_migration.sql`
  (committable) and `supabase/orion_landbank_seed.sql` (gitignored — confidential
  rubric). Run via orion SQL Editor.
- Functions namespaced `landbank.handle_new_user` / `landbank.touch_updated_at`;
  auth trigger uniquely named `on_auth_user_created_landbank` so it ADDS to,
  never replaces, orion's own auth trigger. Side effect: every future orion
  signup also creates a `landbank.profiles` row (harmless).
- App wiring: `db.schema: "landbank"` set in the three `@supabase/ssr` client
  factories; helpers typed via exported `SchemaClient`. `.env.local` + Vercel
  env vars repointed to orion. `tsc --noEmit` clean.
- Auth redirect allowlist: added `https://forma-landbank.vercel.app/**`
  (+ `http://localhost:3000/**`) to orion → Authentication → URL Configuration.
- **Onboarding = manual.** New landbank users are created by setting their
  password directly (no invite/reset emails). This sidesteps the shared-template
  limitation below. Sign-in (`signInWithPassword`) needs no redirect and works.

**Remaining for landbank:**
- [x] Old landbank project deleted (2026-07-01). Rollback to the old DB is no
      longer possible — orion's `landbank` schema is now the sole source of truth.
- [ ] If not already done: smoke-test the deployed app (log in → rubric loads →
      run + save an evaluation). Data was empty/re-seeded, so nothing was lost,
      but confirm the live app works against orion.

---

## Known limitation — shared auth email flows

orion + all merged apps share **one** Site URL and **one** set of email
templates. So password-reset / invite emails build their link from orion's
Site URL and would drop a merged app's user on orion's domain, not the app's.

- **Not an issue for password sign-in** (no redirect).
- Merged apps that need email-based reset/invite must pass an explicit
  `redirectTo: <app-domain>/auth/confirm?next=...` in their auth calls AND have
  that URL in the redirect allowlist.
- landbank avoids this entirely via manual onboarding.

---

## Playbook for the next merge (schema-per-app)

1. **Inspect** the source repo: schema (`supabase/migrations/*`), auth usage,
   how the client connects, any `public.`-qualified refs, `.rpc()`/storage.
2. **Namespace everything** into a new schema `<app>`: tables, functions
   (`<app>.fn`), and uniquely-rename any `auth.users` trigger
   (`on_auth_user_created_<app>`) so it can't clobber orion's.
3. **Grants + expose:** `grant usage on schema <app> ...`, grant tables/sequences,
   then add `<app>` to Data API → Exposed schemas.
4. **Seed** config data (not user data) if the app needs it to function.
5. **App code:** set `{ db: { schema: "<app>" } }` in the client factory/factories;
   if helpers are typed with the default `SupabaseClient`, export
   `type SchemaClient = ReturnType<typeof createClient>` and use it. Bare
   `.from("table")` calls need no change. Repoint env + Vercel vars to orion.
6. **Auth:** add the app's domain (`https://<app>/**`) to orion's redirect
   allowlist. Decide onboarding (manual password vs. patched email redirect).
7. **Verify:** `tsc --noEmit`, deployed smoke-test, then pause + delete the old
   project.

**Working agreement:** Jorge drives git (no add/commit/push by the assistant).
DB DDL is run by Jorge pasting SQL into the orion SQL Editor.
