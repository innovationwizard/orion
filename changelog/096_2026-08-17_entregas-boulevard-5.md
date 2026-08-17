# 096 — Entregas Boulevard 5 (cronograma de escrituración y entrega)

**Date:** 2026-08-17
**Migration:** `scripts/migrations/071_entregas.sql` (deployed and verified)
**Route:** `/entregas`
**Replaces:** Google Sheet "Boulevard 5 — Cronograma de Entregas" (`18EpYL9m…`), now retired

## Problem

Delivery scheduling for Boulevard 5 lived in a Google Sheet. A standalone HTML page
had been drafted against it but could not read the data. Three independent causes:

1. Its `CSV_URL` pointed at a *publish-to-web* link (`/d/e/2PACX-1vT00s9…`) that does
   not exist for that spreadsheet — the ID is unguessable and was invented. It
   returns a redirect to an error page, not CSV.
2. The CSV parser assumed headers on row 1. The sheet has its title on row 1, a blank
   row 2, and headers on row 3.
3. Even with a correct URL, a browser-side `fetch()` to `docs.google.com` is blocked
   by CORS — the read has to happen server-side.

The sheet itself held one test row (`Antonio Rada Prueba · 306`) and 87 empty slots,
so there was nothing to migrate and no reason to keep a spreadsheet in the loop.

## Decisions (confirmed with Jorge, 2026-08-17)

| Question | Decision |
|---|---|
| Source of truth | **DB is master**, the page is the editor. Sheet retired, nothing imported. |
| Data model | Entrega links to `rv_units` + the unit's **CONFIRMED** `reservations` row. |
| Event model | **Two milestones, each independently schedulable**: `ESCRITURA` and `LLAVES`. |
| Estados | Four states + reschedule history — "Reprogramada" is history, not a state. |
| Access | Behind app RBAC. New **`entregas_viewer`** role: read-only, `/entregas` only. Admins edit. |
| Scope | Boulevard 5 only in the UI; schema carries `project_id` from day one. |
| Side effects | None. Completing a cita does **not** write to `rv_units` or `reservations`. |
| Look | Dark navy/glass treatment from the draft, inside the authenticated app. |

An earlier decision to make the page public was reversed after flagging that it would
expose client names, apartment numbers, bank and payment type on an unauthenticated URL.

## Data facts verified against production before writing the schema

- Boulevard 5: 272 SOLD units, each with exactly one CONFIRMED reservation, each with
  a primary titular. 10 have co-owners.
- 25 sold units also carry a DESISTED reservation (resale after desistimiento) — the
  CONFIRMED one is always the correct link.
- `sales.deed_signed_date` is NULL for all 343 B5 sales, as is `bank_disbursement_date`.
  Escritura dates were tracked nowhere in the DB; this is their first home.
- Créditos data is a frozen Pipedrive snapshot (boundary 2026-08-05) and is dirty: of
  569 B5 deals only 213 carry a banco and 273 have `tipoCredito: "Sin dato"`. It is
  therefore used **only as a suggestion**, never as stored truth.

## Migration 071 (database)

- **Enums:** `rv_entrega_milestone` (ESCRITURA, LLAVES), `rv_entrega_estado`
  (PROGRAMADA, CONFIRMADA, COMPLETADA, CANCELADA), `rv_entrega_tipo_pago`
  (FHA, CREDITO_DIRECTO, CONTADO).
- **`entregas`** — one expediente per unit (`UNIQUE (unit_id)`), holding what belongs
  to the sale rather than to an appointment: `tipo_pago`, `banco`, notes, and the FK
  pair `unit_id` + `reservation_id`.
- **`entrega_citas`** — one row per milestone (`UNIQUE (entrega_id, milestone)`), with
  `fecha`, `hora`, `estado`, `reprogramaciones`, `completada_at`, `cancelada_motivo`.
  CHECK constraints keep `completada_at` and `cancelada_motivo` coherent with `estado`.
- **`v_entregas_full`** — one row per cita with unit, tower, project and primary
  titular resolved. Feeds the board.
- **RLS** enabled on both tables: SELECT for data viewers + `entregas_viewer`,
  INSERT/UPDATE/DELETE for `master` + `torredecontrol`.
- PKs use `uuid_v7()` per the project rule.

Reschedule history is written to `audit_events` (`resource_type = 'entrega_cita'`,
events `entrega.agendada` / `entrega.reprogramada` / `entrega.estado_cambiado` /
`entrega.eliminada`) rather than to a third table.

## Application code

| File | Change |
|------|--------|
| `src/lib/auth.ts` | Added `entregas_viewer` to `Role` and `ROLE_LEVEL` (with a note that its level carries no hierarchical meaning) |
| `src/lib/permissions.ts` | New `entregas` resource: view = data viewers + `entregas_viewer`; create/update/delete = admins |
| `middleware.ts` | `entregas_viewer` is restricted to `/entregas`, `/auth`, `/login`; `/login` redirects it to `/entregas` |
| `src/app/page.tsx` | `entregas_viewer` hitting `/` is sent to `/entregas` instead of `/login` |
| `src/components/nav-bar.tsx` | `/entregas` nav link; `ENTREGAS_VIEWER_LINKS` so the role sees only what it can open; role label + color |
| `src/lib/entregas/types.ts` | `EntregaCitaFull`, `EntregaCandidato`, milestone/estado/tipo-pago unions |
| `src/lib/entregas/constants.ts` | es-GT labels, estado colors, agenda shape (4 citas/day, 09:00–18:00, Mon–Fri) |
| `src/lib/entregas/validations.ts` | Zod schemas for agendar / actualizar / board query |
| `src/app/api/entregas/route.ts` | `GET` board (data viewers + `entregas_viewer`), `POST` agendar (admins) — resolves the CONFIRMED reservation, rejects non-SOLD units, reuses the expediente for the second milestone |
| `src/app/api/entregas/citas/[id]/route.ts` | `PATCH` reschedule/confirm/complete/cancel, `DELETE` for corrections. Moving a cita increments `reprogramaciones` and voids a prior confirmation |
| `src/app/api/entregas/candidatos/route.ts` | Sold units with a confirmed reservation, milestones already scheduled, and a snapshot suggestion emitted only when exactly one open deal matches the apartment (276 of 569 qualify; 3 ambiguous are dropped) |
| `src/app/entregas/page.tsx` | Server component; resolves role → `canEdit` |
| `src/app/entregas/entregas-client.tsx` | Weekly board, KPI row, filters, unbounded week navigation, detail/edit modal, agendar modal |
| `public/brand/*.png` | The four logos extracted from the draft's base64 (480 KB of inline data → 4 files) |
| `scripts/generate-access-matrix.ts` | `entregas_viewer` added to the generated matrix |
| `docs/access-control-matrix.md` | Regenerated: 26 resources, 64 permission triples, 164 role grants |

## Improvements over the draft

- Week navigation is unbounded. The draft built its week list from the data range, so
  with an empty cronograma it could not navigate at all.
- A "próxima cita" hint jumps to the first upcoming appointment when it falls outside
  the visible week.
- Day columns show occupancy (`n de 4`), flag over-capacity, and flag two active citas
  sharing an hour. Neither is enforced in the DB — an exceptional fifth cita is always
  possible, it is just visible.
- ISO dates are parsed by parts, not `new Date(iso)`, which shifts the day in GMT-6.

## Verification

- `npx tsc --noEmit` clean; `npx next build` succeeds, `/entregas` builds as dynamic.
- Migration dry-run in a rolled-back transaction before deploy; deployed and confirmed:
  RLS on, 4 policies per table, 3 enums, view queryable.
- End-to-end insert against a real sold unit inside a rolled-back transaction: the view
  resolves unit, titular and project correctly; a reschedule increments the counter;
  cascade delete removes citas. Every guard rejects what it should — `COMPLETADA`
  without `completada_at`, a cancellation motive on a non-cancelled cita, a duplicate
  milestone, and a second expediente for the same unit.
- Tables are empty in production; the first entrega is scheduled through the app.

## Follow-up not done

- `entregas_viewer` must be assigned in Supabase Auth (`app_metadata.role`) — there is
  no admin UI for assigning non-`ventas` roles.
- The Google Sheet still exists and is still link-shared publicly. It should be
  unshared or deleted so it cannot drift back into use.
