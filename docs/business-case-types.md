# Business Case Types — Puerta Abierta Inmobiliaria

This document defines non-standard sale lifecycle events that require special handling in the DB and reconciliation scripts.

---

## TRASLADO

**Definition:** A client's purchase is reassigned to a different unit than originally contracted. The client, salesperson, price, and payment history remain the same — only the unit changes.

**Trigger:** Client or commercial decision to change which physical unit the client will receive (e.g., due to unit unavailability, client preference, project re-allocation).

**DB impact:**
- The original `sale` record must be updated to reference the new `unit_id`.
- The original unit (`rv_units`) must be set back to `AVAILABLE` (or `RESERVED` if a new buyer is assigned).
- The new unit (`rv_units`) must be set to `SOLD` or `RESERVED`.
- All `payments`, `commissions`, and `reservations` linked to the `sale_id` follow the sale — no records need to be re-linked.
- A `unit_status_log` entry should be created for both units recording the TRASLADO event.

**SSOT (Excel) behavior:** The SSOT may lag behind the TRASLADO — it may still show the original unit for the client, or may already show the new unit. Always defer to the verbal/confirmed business record over the SSOT cell value.

**Reconciliation impact:**
- The reconciliation script may flag the NEW unit as `UNMATCHED_UNIT` if the DB sale is still linked to the original unit.
- The reconciliation script may flag the ORIGINAL unit as having payments with no active sale (because the sale was moved).
- Both flags are expected and non-blocking once the TRASLADO migration is applied.

### Known TRASLADOs

| Client | Original Unit | New Unit | Project | Notes |
|--------|--------------|----------|---------|-------|
| Julio Fernando Flores Interiano | 718 | 105 | Boulevard 5 (B5) | TRASLADO confirmed 2026-05-06. DB sale still under unit 718 — migration pending. |
| Angel Renato Muñoz de León | 305-B-B (artifact) | 205-B | Benestare 2.0 (BEN) | TRASLADO confirmed 2026-05-15. Active sale `019c7da9-1564...` is under unit `305-B-B` (migration artifact). Action: UPDATE sale unit_id → 205-B (`019c967f-2fc2...`). Do NOT create new sale. |

---

## DESISTIMIENTO

**Definition:** Client cancels their reservation/purchase. The unit returns to available inventory.

**DB impact:** Sale `status` set to `cancelled`. Unit `rv_units.status` set back to `AVAILABLE`. Any paid reservation deposit may generate a `reimbursement` payment record.

### Known Desistimientos (relevant to Jan/Feb/Mar 2026 reconciliation)

| Client | Unit | Project | Reservation Date | Desistimiento Date | Notes |
|--------|------|---------|------------------|--------------------|-------|
| Denis Estuardo Mazariegos Fuentes | 403 | B5 | 2023-08-20 | 2026-01-27 | DB correctly cancelled. Pre-2026 payment history (Q62,320) not in Jan/Feb/Mar 2026 scope. |
| Nery Adolfo Ortíz Alvarez | 906 | B5 | 2025-12-09 | 2026-01-26 | Client reserved apto 906, not 105. DB cancelled record on unit 105 is from the TRASLADO of Julio Flores Interiano (see above). |
