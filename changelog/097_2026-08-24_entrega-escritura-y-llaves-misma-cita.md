# 097 — Escrituración y entrega de llaves en la misma cita

**Date:** 2026-08-24
**Migration:** none — `entrega_citas` already models this correctly
**Route:** `/entregas`
**API:** `POST /api/entregas` (breaking: `milestone` → `milestones`), `GET /api/entregas/candidatos`

## Problem

The `Agendar cita` modal offered `Escrituración` **or** `Entrega de llaves` in a single
`<select>`. A real case surfaced where both happen in the same appointment: the client
comes once, firma la escritura y recibe las llaves.

Scheduling that required two passes through the modal (search the unit, agendar, search
it again, agendar again), and the board then read the result as an accident: two cards,
two of the four daily slots consumed, and an `hora duplicada` warning meant to catch two
*different* clients booked at the same hour.

## Decision — multi-select, not a third milestone

A combined `ESCRITURA_Y_LLAVES` enum value was rejected:

- Migration 071 makes each milestone independently schedulable, confirmable, completable
  and cancellable. A combined value collapses that.
- The half-right day is a real outcome — escritura firmada, llaves retenidas por un
  detalle del apartamento. A single row cannot record it.
- `WHERE milestone = 'ESCRITURA'` would silently stop matching real escrituraciones, and
  the board filter and chip legend would grow a third value.
- Combinations of independent flags belong in a multi-select; N milestones would
  otherwise mean 2^N enum members.

Two `entrega_citas` rows sharing `entrega_id`, `fecha` and `hora` **already are** "ambos
en una sola cita". The gap was in the UI, which treated that as a collision. This is the
booking model used by appointment software everywhere: one slot, one or more services,
each service keeping its own outcome.

**No schema change. `UNIQUE (entrega_id, milestone)` still holds.**

## Changes

### `POST /api/entregas` — breaking

`milestone: EntregaMilestone` → `milestones: EntregaMilestone[]` (1..2, no repeats),
response `{ cita }` → `{ citas }`. Both rows are inserted in **one statement**, so the
pair can never land half-scheduled. A milestone already booked is rejected with a 409
that names it, checked before the insert rather than surfacing a bare unique violation;
the `23505` catch remains as the concurrent-insert net. One audit event per cita, each
carrying `agendada_con` so the pairing is visible in the trail.

### `GET /api/entregas/candidatos`

`milestones_agendados: EntregaMilestone[]` → `citas_agendadas: { milestone, fecha }[]`.
The date travels with each booked milestone so the picker can say what is already booked
instead of silently dropping the option.

### `/entregas` board

- **Hito → multi-select toggles.** One tap for the ordinary case (Escrituración stays
  preselected), one more for the shared visit. An already-booked milestone renders
  disabled with its date (`Ya agendada · 12 sep`) instead of disappearing from the list.
- **One visit, one card.** Citas grouped by `(entrega_id, fecha, hora)`. A cancelled cita
  never joins a group — what was cancelled stays its own record next to whatever stands.
  One estado chip while both hitos agree, one chip per hito once they diverge.
- **Capacity in visits, not hitos.** A shared visit takes one of the four daily slots, and
  no longer trips the `hora duplicada` warning — that warning now compares visits.
- **Detail modal acts on the visit.** Fecha/hora move both by default, with
  `Aplicar fecha y hora a: Ambos hitos / Solo …` to split them. Estado, motivo de
  cancelación and notas are per hito. Delete is per hito, and removing one leaves the
  other open.
- Stat card `Citas en el cronograma` → `Hitos agendados`, so the five numbers still sum.
  Filter option `Ambos hitos` → `Todos los hitos`, which no longer reads as a filter for
  combined visits.

## Notes

A partially-applied edit (two PATCHes, the second fails) applies what landed to the board
and names the hito that did not, rather than reporting a clean failure.

`tipo_pago` and `banco` belong to the expediente, so an edit is sent with every cita of
the visit — a redundant write that keeps the untouched hito's board row from showing the
old bank.

## Verification

Syntax-checked with esbuild. `tsc --noEmit` and `next lint` were **not** run: no Node
runtime is available on this machine's PATH, only `node_modules`. Both should be run
before deploying.
