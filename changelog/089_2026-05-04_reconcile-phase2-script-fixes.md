# 089 — Phase 2 Reconciliation Script: Three Extraction + Key-Mapping Bugs Fixed

**Date:** 2026-05-04
**Scope:** `scripts/reconcile_phase2_payments.py` (no app code changed)
**Origin:** Dry-run against `CIERRE_MARZO_RESERVAS.xlsx` produced 0 MATCH rows for BEN and only 18/59 extracted rows for BLT — clearly wrong.

---

## Summary

Three bugs caused the Phase 2 reconciliation script to silently extract data from the wrong rows in the BEN and BLT XLSX sheets, and then collide all BEN tower variants onto a single DB key. All three bugs are fixed. The final dry-run now produces 4,533 MATCH rows (vs 0/18 for BEN/BLT previously), with 149 genuine blocking issues remaining.

---

## Root Cause Investigation

### XLSX Sheet Structure (discovered via direct openpyxl inspection)

Both BEN and BLT sheets contain **two sections**:

| Section | Rows | Content |
|---------|------|---------|
| Primary | 6–283 (BEN) / 1–250 (BLT) | Active sale units — authoritative SSOT |
| Secondary | 295–352 (BEN) / 251–271 (BLT) | Stale/desistimiento tracking — integer apto format |

The secondary section separator row (BEN row 293) is labeled "Desistimiento" — confirming it is auxiliary, not part of the payment timeline SSOT.

**BEN primary section:** Apto column (col index 1) has string format `"101 A"` (NOT numeric). Column 0 has the exact DB key `"101-A"`.

**BLT primary section:** Apto column has string format `"101 B"`, `"1305 B"`, `"101 C"` — NOT numeric. Secondary section rows have integer aptos.

---

## Bug 1 — BEN: Wrong Section Extracted (58/277 units)

**Root cause:** The legacy extraction filter `not apto_raw.strip().isdigit()` rejected all `"101 A"` string values in the primary section. Only the 58 secondary-section integer rows (desistimiento data) were extracted.

**Fix:** Added `apto_source = "col0"` for BEN. Column 0 is `"101-A"` in primary rows and `None` in secondary/separator rows. Extraction now uses column 0 with regex `r"^(\d+)-([A-Za-z])$"` — rejects None and separator rows cleanly.

**Result:** BEN extraction went from 58 → 181 units.

---

## Bug 2 — BLT: Wrong Section Extracted (18/59 units)

**Root cause:** Same `isdigit()` filter. BLT primary section has string aptos (`"101 B"`), all rejected. Only 20 secondary-section integer rows were extracted (stale data, Torre='C').

**Fix:** Added `apto_source = "string"` for BLT. Primary-section rows are strings → parsed with `_parse_apto_str()`. Integer-format rows (secondary section) are explicitly skipped by `isinstance(apto_raw, str)` guard.

**Result:** BLT extraction went from 18 → 59 units.

---

## Bug 3 — BEN: Composite Key Collision (MATCH=0)

**Root cause:** `normalise_unit_number("101-A") = "101"` — all non-digits stripped. Five tower variants (101-A, 101-B, 101-C, 101-D, 101-E) collapsed to the same bare key `"101"`. The last entry in the dict won the slot, causing random mismatches. BEN produced 0 MATCH rows.

**Fix:** Added `composite_key = True` for BEN (and separately diagnosed + fixed for BLT). When `composite_key=True`, the DB key is the full `unit_number` as-is (`"101-A"`). The XLSX lookup key is `f"{apto}-{tower}"`.

**BLT composite key (diagnosed separately):** BLT active sales split across bare integers (`"101"`), Tower B (`"102-B"`), and Tower C (`"101-C"`). The XLSX primary section encodes tower in the apto string: `"101 C"` → DB key `"101-C"`. Without `composite_key=True`, bare integer lookup matched stale/cancelled sales instead of active ones.

---

## Code Changes

### New `_parse_apto_str()` helper

```python
def _parse_apto_str(raw: str) -> tuple[str | None, str | None]:
    m = re.match(r"^(\d+)\s*([A-Za-z]?)$", raw.strip())
    if m:
        return m.group(1), m.group(2) or None
    return None, None
```

### `PROJECT_CONFIG` — two new fields per project

```python
# apto_source: "col0" | "string" | "integer"
# composite_key: True → DB key = f"{apto}-{tower}"; False → bare digits
"ben": { ..., "apto_source": "col0",    "composite_key": True  }
"blt": { ..., "apto_source": "string",  "composite_key": True  }
"b5":  { ..., "apto_source": "integer", "composite_key": False }
"ce":  { ..., "apto_source": "integer", "composite_key": False }
```

### `extract_project()` — three branches

| Branch | Trigger | Behaviour |
|--------|---------|-----------|
| `col0` | BEN | Read col 0; skip if None or doesn't match `r"^\d+-[A-Za-z]$"` |
| `string` | BLT | Read apto col; skip if not a string (integer rows = secondary section) |
| `integer` | B5, CE | Existing behaviour unchanged |

### `discover_db_payments()` — `make_db_key()` replaces `normalise_unit_number`

```python
def make_db_key(unit_number: str) -> str:
    if composite_key:
        return unit_number          # "101-A" as-is
    digits = "".join(c for c in unit_number if c.isdigit())
    return digits if digits else unit_number
```

### `compare()` — project-aware lookup key

```python
if composite_key:
    tower = (unit.tower or "").strip().upper()
    lookup_key = f"{unit.apto}-{tower}" if tower else unit.apto
else:
    lookup_key = make_db_key(unit.apto)
sale = unit_to_sale.get(lookup_key)
```

---

## Final Dry-Run Results (2026-05-04)

| Project | Extracted | MATCH | MISSING_IN_DB | MISMATCH | AMBIGUOUS | UNMATCHED |
|---------|-----------|-------|---------------|----------|-----------|-----------|
| B5      | 333       | 2,806 | 1,698         | 3        | 75        | 2         |
| BEN     | 181       | 755   | 130           | 4        | 24        | 9         |
| BLT     | 59        | 184   | 48            | 1        | 6         | 4         |
| CE      | 85        | 788   | 161           | 21       | 0         | 0         |
| **Total** | **658** | **4,533** | **2,037** | **29** | **105** | **15** |

**Blocking issues: 149** — all confirmed as genuine data gaps (not script bugs):
- **105 AMBIGUOUS:** reserva + down_payment amounts combined in one XLSX cell; require business confirmation to split.
- **29 AMOUNT_MISMATCH:** human review required per row (CE unit 1001: 21 months all ~2.5× delta suggests a systematic pricing issue).
- **15 UNMATCHED_UNIT:** units in XLSX with no active sale in DB (BEN: 9 units with zero sale records; BLT: 3 cancelled + 1 no sale; B5: 2 no active sales).

**Ready to insert once blocking issues resolved:** 2,037 MISSING_IN_DB payments.

---

## Retracted Claim (no SSOT basis)

An earlier session statement — "These are early-buyer deposits from before the project launched (B5 initially charged Q6,000 reserva)" — had no SSOT source. Retracted. The Q6,000 amounts in B5 reservation months remain correctly classified as AMBIGUOUS pending business confirmation from Patty/Antonio.

---

## Files Changed

| File | Change |
|------|--------|
| `scripts/reconcile_phase2_payments.py` | Added `import re`; `apto_source`/`composite_key` to `PROJECT_CONFIG`; `_parse_apto_str()` helper; three-branch `extract_project()`; `make_db_key()` replacing `normalise_unit_number`; composite-aware `compare()` |
