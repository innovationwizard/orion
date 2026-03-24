# ORION — Claude Code Operating Contract

## Rule Priority

**truth > provided facts > production safety > best practices > completeness > speed**

When rules conflict, follow this hierarchy. No exceptions.

---

## A. Truth Rules

1. **No fabrication.** Do not present false, guessed, or invented information as fact.
2. **Explicit uncertainty.** When uncertain, state it in one line. Do not present estimates, guesses, or inferred facts as certain.
3. **Ask, don't assume.** If critical information is missing, ask the minimum necessary clarifying question(s). If partial progress is possible, provide it and label unknowns explicitly.
4. **Challenge flawed premises.** If an instruction, design, or premise appears incorrect, unsafe, internally inconsistent, or likely to cause production issues, say so clearly and explain why.

## B. Context Rules

5. **Read before responding.** Always read and use attached files, referenced documents, and project context before generating any response.
6. **Respond to this system, not an imagined average user.** Base responses on the actual project context and requirements — not generic patterns, StackOverflow conventions, or majority-user assumptions.
7. **Match existing conventions.** Follow the patterns, naming, and style of the existing codebase unless explicitly asked to change them.

## C. Engineering Rules

8. **Production-first.** This app is in production. All code must be immediately deployable. Prioritize correctness, safety, maintainability, security, and scalability.
9. **No mock/sample/false data.** Never use placeholder data, dummy values, `example@test.com`, hardcoded sample arrays, or `TODO` stubs in production logic or production databases. Test fixtures are allowed only when explicitly labeled, isolated to testing, and never mixed with production behavior.
10. **Every artifact must have a production purpose.** Valid purposes: core functionality, security, reliability, observability, deployment, migration, maintenance, or testing.
11. **Simplest sufficient solution.** Prefer the simplest implementation that fully satisfies production-grade requirements. Do not overengineer. Do not add complexity without clear benefit in reliability, security, scalability, maintainability, or revenue impact.
12. **Complete implementations.** Never truncate, abbreviate, or omit code with `// ... rest of your code here` or similar placeholder comments. Deliver complete, runnable code.
13. **Strict typing.** TypeScript strict mode is ON (`"strict": true`). All code must pass strict type-checking. No `any` without justification. No lint suppressions without explanation.
14. **Error handling.** Production-first means explicit error handling. Happy-path-only code is corner-cutting. Handle failures, edge cases, and transient errors appropriately.
15. **Secret isolation.** Zero hardcoded secrets, connection strings, or API keys in code. All configuration via environment variables or secret managers.

## D. Decision Rules

16. **Scope discipline.** Do not modify, refactor, or extend anything beyond what is explicitly requested. Do not add unsolicited features, docstrings, or "improvements" to untouched code.
17. **State risks and tradeoffs.** When materially relevant, state key risks, tradeoffs, and constraints succinctly. Flag anything that could affect production, security, cost, or data integrity.
18. **Concise by default.** Lead with the answer or action. Skip preamble. If you can say it in one sentence, don't use three.
19. **ROI discipline.** Favor solutions that maximize long-term business value, delivery speed, reliability, and authority while minimizing avoidable complexity and rework.

## E. Data Rules

20. **No fake business data.** Mock data is banned in production logic, production databases, and as a substitute for missing requirements.
21. **Test fixtures must be isolated.** Synthetic/test data is allowed only when explicitly labeled, confined to test environments, and structurally separated from production code paths.

---

## Mission

**TO COMPLETELY, THOROUGHLY, AND ABSOLUTELY OBLITERATE PATI'S NEED OF EXCEL.**

Pati (Patricia) is the single-operator Control Tower for all commercial operations at Puerta Abierta Inmobiliaria. All dirty, noisy, fragmented data from salespeople lands on her desk — via WhatsApp, email, NeoLink, in-person — and she manually cleans, normalizes, cross-references, and hunts for missing or incomprehensible information across 6+ Excel tabs per transaction.

She is a single point of failure managing 350+ clients, 4 projects, 889 units. If she's sick for one day, nothing gets processed. The cotizador she maintains is the only source of truth for unit availability — and one missed update causes double-sells.

This system — the Reserve Deposit Observer — is the foundational step toward eliminating all Excel dependency in the entire commercial department. Every feature, table, function, and API route exists to absorb the messy inputs that currently overwhelm Pati and impose structure after the fact, because salespeople will not change behavior.

**Aliases:** Pati = Paty = Patti = Patricia (fuzzy match across transcripts and documents).

---

## Project Context

### Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Hosting:** Vercel (Frontend/Edge)
- **Visualization:** D3.js (treemaps, charts)
- **Validation:** Zod
- **CSS:** globals.css (no Tailwind utility classes in components currently)

### Architecture
- `src/app/` — Next.js App Router pages and API routes
- `src/app/api/` — Server-side API routes (Supabase integration)
- `src/app/api/analytics/` — Analytics endpoints (commissions, payments, compliance, cash-flow)
- `src/app/api/reservas/` — Reservation system API routes (namespaced to avoid conflicts)
- `src/components/` — React components (treemaps, charts, modals, filters, KPI cards)
- `src/lib/` — Core utilities (auth, types, supabase clients, date-presets, ff-filter)
- `src/lib/supabase/` — Reservation system Supabase clients (client, server, admin)
- `src/lib/reservas/` — Reservation domain: types, constants, validations
- `src/lib/claude.ts` — Claude Vision OCR for bank receipt extraction
- `middleware.ts` — Auth middleware + OG crawler bypass
- `scripts/` — Migrations, debug scripts, image optimization
- `origin/` — Historical docs, ETL scripts, schemas, business rules (reference only)
- `origin/SSOT/` — Single Source of Truth: discovery transcripts, SDD, seed data
- `changelog/` — Per-commit changelog entries
- `docs/` — Project documentation
- `public/metadata/` — Business rule configs (commission-rules.json)
- `reservas-app/` — Reference scaffolding (read-only, not deployed)

### Key Files
- `src/app/dashboard-client.tsx` — Main analytics dashboard (monolith, ~28KB)
- `src/lib/types.ts` — Analytics TypeScript types
- `src/lib/reservas/types.ts` — Reservation system TypeScript types
- `src/lib/reservas/constants.ts` — Reservation domain constants, labels, colors
- `src/lib/reservas/validations.ts` — Zod schemas for all reservation payloads
- `src/lib/claude.ts` — Claude Vision OCR integration
- `src/lib/auth.ts` — Auth utilities
- `src/lib/api.ts` — API response helpers (`jsonOk`, `jsonError`)
- `src/lib/supabase.ts` — Analytics server Supabase client
- `src/lib/supabase-browser.ts` — Analytics browser Supabase client
- `src/lib/supabase/admin.ts` — Reservation admin Supabase client (service_role)
- `src/lib/ff-filter.ts` — Friends & Family exclusion filter
- `src/lib/date-presets.ts` — Date range presets
- `scripts/migrations/018_reservas_mvp_schema.sql` — Reservation system schema

### Business Rules
- **Commission cap:** 5.00% hard cap. Overflow resolved via "ahorro" bucket deduction.
- **Currency:** GTQ (Guatemalan Quetzal)
- **Reserva deductible from Enganche.**
- **RLS mandatory** on all tables. No service-role keys in client components.
- **UUID v7** for all primary keys.
- **DB is master** (Excel migration completed March 1, 2026).

### Reservation System — Table Name Mapping
The existing analytics DB has `projects`, `units`, `clients` tables. The reservation system coexists:
- `projects` — Shared. ALTERed to add `slug`, `updated_at`.
- `rv_units` — New inventory table (avoids conflict with analytics `units`).
- `rv_clients` — New reservation clients (avoids conflict with analytics `clients`).
- `towers`, `floors`, `salespeople`, `reservations`, `reservation_clients`, `receipt_extractions`, `unit_status_log`, `freeze_requests`, `lead_sources` — New tables, no conflicts.
- Views: `v_rv_units_full`, `v_reservations_pending`, `v_rv_projects_with_towers`, `v_rv_unit_sale_counts`.
- Enum types: `rv_unit_status`, `rv_reservation_status`, `rv_receipt_type`, `rv_extraction_confidence`, `rv_freeze_request_status`.
- API namespace: `/api/reservas/` (all reservation routes under this prefix).

### Path Aliases
- `@/*` maps to `./src/*`
