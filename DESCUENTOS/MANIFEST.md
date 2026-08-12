# DESCUENTOS/ — File Manifest

Delivered 2026-08-12. Line-level discount extraction from the scanned expediente
PDFs (Boulevard 5 only). Two CSVs, UTF-8, clean encoding. Fields whose meaning is
inferred from content (not documented by the producer) are marked *(inferred)*.

---

## 1. `descuentos_b5.csv` — 42,571 bytes, 135 data rows + header

One row per **line-level "descuento" hit** found by OCR inside a scanned PDF.
135 hits across **87 distinct partner folders**. Multiple rows can describe the
SAME discount (e.g. partner 23447 / Laura Ovalle: the 6% pago-al-contado clause
produces 3 rows from adjacent lines of legal prose).

| Column | Meaning |
|---|---|
| `partner_folder` | Source folder: `{partner_id}__{unit-code}-{client-name}` *(inferred: Odoo filestore folder; names are dash-mangled and lossy, e.g. `GONZ-LEZ`)* |
| `partner_id` | Odoo partner id *(inferred)* |
| `taxon` | 4-digit unit number, e.g. `0106`, `1216` *(inferred from unit-code segment)* |
| `pdf` | Source document: `{attachment_id}__{original filename}.pdf` |
| `page`, `line_index` | Location of the hit inside the PDF |
| `descuento_type` | Classifier label: `generico` 86 · `pago_contado` 13 · `family_friends` 11 · `volumen` 6 · `autorizacion` 6 · `especial` 4 · `motivo` 4 · `cliente_directo` 3 · `promocion` 2 |
| `amount_gtq` | Extracted amount in GTQ; **empty in 22 rows** (`no_amount_found`) |
| `percent` | Extracted percentage (23 rows): 1% ×13, 6% ×4, 2% ×2, 10% ×2, 90% ×2 (the 90% pair is suspect — unverified) |
| `label_line` | The OCR line that triggered the hit |
| `context` | Surrounding lines, pipe-separated |
| `line_conf` | OCR confidence 61.6–99.8 |
| `amount_source` | Where the amount was found relative to the label line: `next_line+2` ×55, `next_line+4` ×31, `next_line+3` ×12, `next_line+1` ×8, `same_line` ×5, `same_row_bbox` ×2, empty ×22 |
| `flags` | Semicolon-separated quality flags — see below |

**Quality flags on detail rows:** `eegsa_bill` ×24 (EEGSA electricity bills scanned
into expedientes; their "DESCUENTO" lines are NOT sales discounts), `no_amount_found`
×22, `implausible_vs_total` ×15 (amount ≈ or > the unit's total price — price
mentions misread as discounts; worst case 28459%), `percent_only` ×11,
`legal_prose` ×6, `low_conf` ×11 (61.6–88.1).

## 2. `descuentos_por_folder.csv` — 5,264 bytes, 52 data rows + header

Per-folder rollup of the **plausible** hits only. The 35 folders present in the
detail file but absent here contain nothing but noise (21 EEGSA hits, 13
implausible amounts, 2 no-amount mentions) — verified row by row.

| Column | Meaning |
|---|---|
| `partner_folder`, `partner_id`, `taxon` | As above |
| `instances` | Plausible hit count in the folder: 1 ×34, 2 ×15, 3 ×2, 4 ×1 |
| `distinct_amounts` | Distinct plausible amounts (always a single value in this delivery) |
| `max_amount_gtq` | Max plausible amount — never empty |
| `types` | Distinct types, `;`-joined: `generico` 25, `family_friends` 7, `volumen` 5, `generico;pago_contado` 4, `cliente_directo;generico` 3, `especial` 3, `family_friends;generico` 2, `pago_contado` 2, `promocion` 1 |
| `percents` | Distinct percents where captured |
| `review_flags` | 7 folders flagged: `low_conf` ×6 (64.3–88.1), `legal_prose` ×1 |

**Headline numbers:** 52 expedientes B5 with plausible discount evidence,
Σ max_amount = **Q1,359,642.30**. Largest: Alan Gonzalez Choc (unit 1216,
`especial`, Q240,944), then two Q100,000 (`promocion` unit 0106, `generico`
unit 0102) and Q100,000 unit 0614.

## Open questions (not answerable from the files)

- Producer/pipeline of these CSVs is undocumented (no README). Extraction rules
  (classifier vocabulary for `autorizacion`, `motivo`; the plausibility filter
  threshold) are inferred from the data, not stated.
- The two `percent = 90` rows look like OCR misreads — unverified.
- Whether `max_amount_gtq` is the correct dedup rule when a folder has several
  hits of the same discount (it is for the visible cases, e.g. 23447).
- Coverage: only B5. Other projects' expedientes not yet extracted.
