# Gap Prioritization — Post Phase 1 Security Hardening

**Date:** 2026-03-19
**Last updated:** 2026-03-20 (Phase 4 completed)
**Context:** Phase 1 (changelogs 074 + 075) resolved 6 of 24 gaps. Phases 3 + 5 resolved 6 more. Phase 2 resolved 4 more. Phase 4 resolved 1 more (GAP-03). This document prioritizes the remaining 7 gaps by criticality and practical urgency.
**Reference documents:**
- `docs/roles-gap-analysis.md` — full gap inventory
- `docs/plan-fix-high-severity-gaps.md` — 6-phase remediation plan
- `docs/plan-fix-critical-gaps.md` — critical gaps plan (completed)
- `docs/plan-phase3-audit-phase5-dashboard.md` — audit + operations plan (completed)
- `docs/roles-current-state.md` — current enforcement state
- `docs/roles-industry-best-practices.md` — enterprise benchmarks

---

## Status: 20 of 24 Gaps Resolved (+ 7 DISC/AUTH = 27 of 34 total)

| Gap | Description | Resolution |
|-----|-------------|------------|
| GAP-01 | API routes too permissive | 30 routes secured with `requireRole()` (changelog 074) |
| GAP-02 | Public OCR without auth/rate limit | `requireAuth()` + 20 req/hr rate limiting (changelog 074) |
| GAP-04 | Inactive roles have uncontrolled access | Explicit 5-category middleware routing + NavBar filtering (changelog 075) |
| GAP-05 | No DB-level ownership enforcement | Ownership-scoped RLS on 4 tables + `jwt_role()` helper (changelog 075, migration 040) |
| GAP-06 | No role hierarchy | `ROLE_LEVEL`, `ADMIN_ROLES`, `DATA_VIEWER_ROLES`, `hasMinimumRole()` (changelog 074) |
| GAP-10 | No role-specific dashboards | `/admin/operaciones` operations dashboard for Pati (2026-03-19) |
| GAP-11 | No operations dashboard for Pati | `/admin/operaciones` — 3-tab work queue + activity feed (2026-03-19) |
| GAP-16 | No maker-checker on provisioning | Audit trail captures `salesperson.invited` events (2026-03-19, migration 041) |
| GAP-18 | No escalation for rate confirmation | `financiero` added to ejecutivo-rate PATCH (changelog 074) |
| GAP-22 | Incomplete audit trail | `audit_events` table + `logAudit()` utility + 10 routes instrumented (2026-03-19, migration 041) |
| DISC-02 | No `desisted_by` tracking | Resolved via audit trail (`event_type = 'reservation.desisted'`) — no schema change |
| DISC-05 | No assignment audit logging | `assignment.created`/`assignment.ended` events logged (2026-03-19) |
| GAP-07 | No formal access control matrix | `PERMISSIONS` matrix in `src/lib/permissions.ts` — 22 resources, 49 triples, 119 grants (changelog 078, 2026-03-20) |
| GAP-08 | No `can(action, resource)` utility | `can()` + `rolesFor()` in `src/lib/permissions.ts` — 15 routes migrated (changelog 078, 2026-03-20) |
| GAP-21 | No formal access control document | Auto-generated `docs/access-control-matrix.md` from PERMISSIONS object (SOC 2 CC6.1) (changelog 078, 2026-03-20) |
| DISC-03 | `hasMinimumRole()` unused dead code | Retained with "Currently unused" JSDoc — 5 lines, zero cost, future UI value (changelog 078, 2026-03-20) |
| GAP-03 | No server-side field masking on analytics routes | `src/lib/field-masking.ts` — 4 masking functions on 4 routes. gerencia: aggregates only. contabilidad: anonymized names. financiero/master/torredecontrol: full. Dashboard: Comisiones tab hidden for gerencia. (changelog 079, 2026-03-20) |

---

## Tier 1 — Do Next

### ~~Phase 3: Audit Trail (~20 hours)~~ ✅ COMPLETED (2026-03-19)

| Gap | Severity | What | Status |
|-----|----------|------|--------|
| GAP-22 | High | `audit_events` table — log all admin actions | ✅ Migration 041 + `logAudit()` + 10 routes |
| GAP-16 | High | Provisioning audit | ✅ Via audit trail (no `provisioned_by` column — audit events are source of truth) |
| DISC-02 | — | `desisted_by` tracking | ✅ Via audit trail (`event_type = 'reservation.desisted'`) |
| DISC-05 | — | Assignment audit logging | ✅ `assignment.created`/`assignment.ended` events |

**Delivered:** Migration 041, `src/lib/audit.ts`, `/api/admin/audit-log`, `/admin/audit` page.

### ~~Phase 2: Permission Architecture (~16 hours)~~ ✅ COMPLETED (2026-03-20)

| Gap | Severity | What | Status |
|-----|----------|------|--------|
| GAP-07 | High | Formal access control matrix (code-level `PERMISSIONS` object) | ✅ `src/lib/permissions.ts` — 22 resources, 49 triples, 119 grants |
| GAP-08 | High | `can(role, action, resource)` utility replacing scattered role checks | ✅ `can()` + `rolesFor()` — 15 routes migrated from hardcoded arrays |
| GAP-21 | High | Auto-generated access control document (SOC 2 CC6.1) | ✅ `docs/access-control-matrix.md` via `scripts/generate-access-matrix.ts` |
| DISC-03 | — | `hasMinimumRole()` cleanup (unused dead code) | ✅ Retained with JSDoc comment — zero cost, future UI value |

**Delivered:** `src/lib/permissions.ts`, `scripts/generate-access-matrix.ts`, `docs/access-control-matrix.md`, 15 routes migrated, 3 duplicate constants eliminated, 19 files modified. Changelog 078.

---

## ~~Tier 2 — Highest ROI for the Mission~~ ✅ COMPLETED

### ~~Phase 5: Pati's Operations Dashboard (~40 hours)~~ ✅ COMPLETED (2026-03-19)

| Gap | Severity | What | Status |
|-----|----------|------|--------|
| GAP-11 | High | Operations command center | ✅ `/admin/operaciones` — 3-tab work queue + activity feed |
| GAP-10 | High | Role-specific dashboard routing | ✅ Separate `/admin/operaciones` page (simpler approach) |

**Delivered:** `/admin/operaciones` with stats strip (5 KPIs), work queue (Pendientes/Tasas EV/Documentos tabs), activity feed (audit events), NavBar links.

---

## Tier 3 — Defer Until Triggered

| Phase | Gaps | Trigger |
|-------|------|---------|
| ~~Phase 4 (~24 hrs)~~ ✅ | ~~GAP-03 (field masking)~~ | ~~When gerencia/financiero/contabilidad roles are activated for real users~~ ✅ COMPLETED 2026-03-20 (changelog 079) |
| Phase 6 (~32 hrs) | GAP-09 (project scoping), GAP-17 (desist workflow), GAP-19 (notifications), GAP-20 (permission expiry), GAP-16b (full maker-checker) | When admin team grows or external audit is scheduled |
| Medium-severity | GAP-12/13/14/15 (ventas portal UX), GAP-23/24 (compliance) | User feedback or compliance requirement |

---

## Recommendation

~~**Start with Phase 3 (audit) + Phase 5 (Pati's dashboard) in parallel.**~~ ✅ Done.

~~**Next:** Phase 2 (permission architecture) is the only remaining high-severity work.~~ ✅ Done (2026-03-20, changelog 078).

~~**Next:** Phase 4 (field masking) is the only remaining work before activating gerencia/financiero/contabilidad for real users. Phase 6 items are deferred until admin team grows.~~ ✅ Phase 4 completed 2026-03-20 (changelog 079).

**Status:** All pre-activation work is complete. **gerencia/financiero/contabilidad roles are now safe to activate for real users.** Only Phase 6 (advanced capabilities, ~32h) remains — deferred until admin team grows or external audit is scheduled.

**Completed plans:** `docs/plan-phase3-audit-phase5-dashboard.md` (✅), `docs/plan-fix-critical-gaps.md` (✅), `docs/plan-phase2-permission-architecture.md` (✅), `docs/plan-phase4-field-masking.md` (✅).

---

## Effort Summary (Remaining)

| Phase | Scope | Estimated Hours | Status |
|-------|-------|-----------------|--------|
| Phase 2 | GAP-07 + GAP-08 + GAP-21 + DISC-03 | ~16 | ✅ COMPLETED |
| Phase 3 | GAP-22 + GAP-16 + DISC-02/05 | ~20 | ✅ COMPLETED |
| Phase 4 | GAP-03 | ~24 | ✅ COMPLETED (changelog 079, 2026-03-20) |
| Phase 5 | GAP-10 + GAP-11 | ~40 | ✅ COMPLETED (MVP) |
| Phase 6 | GAP-09 + GAP-16b (deferred) | ~32 | Deferred |
| **Total remaining** | **7 gaps** | **~32 hours** (Phase 6 only) |
