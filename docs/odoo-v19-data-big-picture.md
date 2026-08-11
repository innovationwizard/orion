# Odoo v19 Migration — The Complete Data Big Picture

**Compiled:** 2026-08-11, by the Orion agent, unifying three inventories:
`ODOO_HUD_DATA_INVENTORY_PIPEDRIVE.md` (boundary 2026-08-09) · `ODOO_HUD_DATA_INVENTORY_ODOO15.md`
(cutoffs 2026-06-25 / 2026-08-10) · the **Orion app itself** (Supabase prod DB, live, + linked
snapshots), which the two external inventories could not see.

**Mission:** migrate the data from wherever it currently exists, in the form it currently exists,
to the new Odoo v19 DB, in the best possible form — information flowing end-to-end without
conflicts, ambiguities, or losses. **Hard rule: NO DATA LEFT BEHIND.**

Rendered as a live page at `/odoo-hud` in the Orion app (same structure as `/hud`, migration-readiness
semantics). Current reading: **VENTAS 82% · MERCADEO 100% · COBROS 100% · CRÉDITOS 37% ·
CUMPLIMIENTO 0% → total 64%.**

---

## 1. The four source families

| Source | What it is | Cutoff / status | Reach |
|---|---|---|---|
| **Orion (Supabase)** | Production app, **system of record for reservas since 2026-03-01** (DB is master; Excel retired). 901 units × 5 projects, 646 CONFIRMED + 74 DESISTED reservations, sales + payments + contractual payment plans + compliance engine, 33 unified salespeople, metas (068/069), migrations 018–069. | **LIVE** — no cutoff | All 5 Orion projects |
| **Orion-linked snapshots** | Meta Ads source xlsx (9,329 rows, 2024-07→2026-08, real per-account currency) · Power BI reconstruction · vales CSV (B5) · compliance officer's xlsx (B5, 265 expedientes) · Pipedrive créditos export | Various, 2026-08-04 → 08-07 | Varies |
| **Pipedrive extraction** | 81,441 deals · 75,149 persons · 439,299 activities · 931 units (3 projects) · 1,052 créditos deals · 212,053 file blobs (161.9 GiB) · 140,370 emails | 2026-08-09 23:59:59 GT — **source LIVE** (~500 new deals / 4 days) | Whole instance |
| **Odoo v15 extraction** | Accounting: 24,639 moves (Q1.35B) · 11,029 payments (Q300.8M) · 21,963 partners · 3,292 FEL invoices · B5 escrituración dataset · 360 scanned PDFs (17,756 pages, OCR'd) · 109,048 chatter messages | 2026-06-25 (structured, ~6 weeks stale) / 2026-08-09 (files) — **source LIVE** | ⚠️ **4 of 69 companies only** |

---

## 2. Headline findings — including three cross-resolutions the individual inventories could not see

### 2.1 ✅ RESOLVED: the "missing sales ledger" exists — it is Orion
Both agents escalated the same alarm: Pipedrive has only 140 Reserva-stage deals ("the deal pipeline
is not the sales ledger… if v15 doesn't have it either, escalate immediately") and v15 has no reserva
object ("the sale event itself is unrecorded in any system"). **Both were right about their own
systems and wrong about the world: Orion IS the reserva system of record** — live, constrained,
auditable, with per-reserva salesperson, unit, client, deposit, status and desistimiento data.
The v19 sales ledger ETLs from Orion. Pipedrive's 140/55 numbers must never be presented as sales.

### 2.2 ✅ RESOLVED: the "PLAN DE CUOTAS via OCR" is unnecessary — Orion has it structured
The v15 agent's #1 recommendation ("cheapest large win: OCR the plan de cuotas from cotización
images — unlocks acumulados %, del mes %, déficit/superávit, aging") is **superseded**: Orion's
`payment_compliance` engine already holds the contractual expected-to-date per account (691
accounts), installment schedules including custom `enganche_schedule` JSONB, days delinquent, and
aging. All four COBROS items the OCR would have unlocked are already computed in production.

### 2.3 ✅ PARTIALLY RESOLVED: the "Meta Ads export" Pipedrive asked for is already held
Pipedrive's #2 recommendation ("a Meta Ads Manager export would unlock most of AREA 2") is
substantially satisfied: Orion holds the Meta source xlsx (daily × account × campaign: reach,
impressions, clicks, leads, spend **with real per-account currency**). Caveat: the xlsx carries
campaign **names**, Pipedrive carries campaign **IDs** — the join is by name (workable, not ideal).
TikTok spend and Google Ads remain absent everywhere (Google absent even as a Fuente option —
confirm whether it runs untagged or doesn't run).

### 2.4 🔴 The true remaining holes (no system has them)
- **Etapas 13, 18, 19** (entrega, liquidación/testimonio, archivado) + firmas (14) as history.
- **Descuentos** — scanned PDFs only, everywhere.
- **PEP/CPE risk classification** — exhaustively confirmed zero in all four sources. Must be born in v19.
- **Manuales de cumplimiento** status; **casos específicos** (definition itself still pending).
- **Historical target series** (only current metas exist), **pre-Orion price history**, **unit status
  history before 2026-03**.

### 2.5 🟠 The clock-sensitive item: Pipedrive stage-change history
The "premio gordo" — per-deal changelog for the 1,052 créditos deals — is retrievable (~1,052 API
calls, minutes) and **is destroyed at cutover**. Both this document and the Pipedrive agent flag it.
Needs Jorge's go-ahead. Milestone date fields reconstruct only a partial trajectory.

### 2.6 🟠 The unassessed continent: 65 of 69 Odoo v15 companies
The v15 inventory covers 4/69 companies; the other 65 hold **98% of the instance's attachments**
including the **160,247 FEL legal tax files**. The fix is administrative, not technical: **an
Odoo.sh backup (PostgreSQL dump + filestore) — an email to Odoo support**. Until then, "Odoo v15 has
been assessed" is a false sentence; "Odoo v15 as visible to one limited user has been assessed" is
the true one.

### 2.7 🟠 Torre Cobán exists only as scaffolding
Pipedrive has TCA pipelines (comercial + créditos) with **zero deals and zero units**; Orion's DB
doesn't know the project; v15 wasn't checked for it. Someone is preparing a 6th project. The
migration should ask what Torre Cobán is and where its data will live.

### 2.8 🔴 The documentary horizon: 2025-08-29
Pipedrive deals/persons/activities go back to 2022, but notes/files/mail **all start 2025-08-29**
(migration fingerprint: `Propietario Pipe 1.0`). 26,557 pre-horizon deals carry 345 files and 382
notes between them. **Evidence (signed PCV, DPI, receipts) for 2022–mid-2025 deals does not exist in
Pipedrive** — much of it exists instead in Orion (reservas + receipts) and v15 (B5 bundles).

---

## 3. Per-area unified assessment

Statuses: 🟢 source secured (ready to ETL) · 🟡 partial / needs work (OCR, heuristics, backup,
single-project) · 🔴 no source anywhere. Full notes live in `/odoo-hud` (`src/app/odoo-hud/areas.ts`).

### VENTAS — 9/11 🟢 (82%)
| Item | Status | Primary source → note |
|---|---|---|
| Ventas totales | 🟢 | **Orion** (reserva ledger). PD deals ≠ sales; v15 invoices ≠ sales (~19× overcount) |
| Ventas vs objetivos | 🟢 | Orion metas 068 + full asesor attribution. No historical target series anywhere |
| Déficit/excedente vs cierre | 🟢 | Orion metas + towers.delivery_date (only source of delivery dates) |
| Ventas por canales | 🟢 | Orion lead_source (dirty free-text) + PD Fuente catalog (clean, 16 options, **multi-value set** — naive counts double) |
| Funnel Leads→Reserva→PCV | 🟡 | Stages secured individually (PD leads · Orion reservas · Orion/v15 PCV); **cross-system lead↔reserva linkage unresolved** (fuzzy person match only) |
| Inventario general | 🟢 | **Orion = canonical unit master** (901 units, 5 projects, status history since 2026-03). PD: 3/6 projects, no history, 475-vs-140 internal contradiction. v15 "inventory" = auto parts |
| Split por modelo | 🟢 | Orion unit_type 100%. PD Modelo 0/931; v15 modelo inside partner name string |
| Desistimientos | 🟢 | Orion (constraint-enforced date+reason, refunds, retención Q2.17M) + PD ~150 penalización cases |
| Valor / trazabilidad | 🟢 | Orion price_history + status log. Pre-Orion history exists nowhere |
| Control de descuentos | 🔴 | Scanned PDFs only (PD ~1,037 cotización PDFs; v15 pages). OCR route; unverified output |
| Control de promociones | 🟢 | **PD is the full source** (168 deals, `Valor Vale` monetary) — bigger than Orion's B5 CSV. Never parse money from the `Valor Promoción` enum labels |

### MERCADEO — 11/11 🟢 (100%)
All eleven items secured via Orion-held snapshots + DB metas + Pipedrive attribution IDs. Standing
caveats: Meta only (TikTok spend absent, Google Ads invisible everywhere); leads = netos of the
mis-mapped campaign (104,290 fake "leads" excluded per the artifact's own audit); Excel↔PD campaign
join is by name, not ID; spend currency is per-account (4 GTQ + 2 USD — the Power BI mixed them).

### COBROS — 9/9 🟢 (100%)
All items secured via Orion's payment engine. **Migration-critical notes:**
- **Two ledgers must be reconciled**: Orion payments (per-unit, with plans) vs v15 `account.payment`
  (11,029, Q300.8M, 2021→2026, includes non-B5-companies money). Overlap and gaps unknown until
  reconciled — do not double-migrate.
- v15 trap: payments **inherit dates from `account.move`** — standalone reads produce a dateless
  ledger (join resolves 100%).
- v15 Studio fields `x_no_recibo` (72.8%) / `x_doc_no` (94.8%) are the physical receipt numbers —
  they don't exist in vanilla v19; recreate deliberately or lose them.
- At least one USD bank journal in v15; SE is USD in Orion. Currency is never assumable.
- F&F flag (`caso_especial`, 52) exists only in Orion.

### CRÉDITOS — 7/19 🟢, 8 🟡, 4 🔴 (37%)
| Group | Status |
|---|---|
| Etapas 4, 6–11 (armado → resguardo/resolución) | 🟢 PD stages + milestone dates + aging (97% stage_change_time). History pull pending & dying at cutover |
| Etapas 1–3 (controles documentales) | 🟡 Documents secured (v15 B5 bundles 17,756 OCR'd pages; PD 212K blobs post-horizon); no checklist object anywhere; folder≠content cases verified |
| Etapa 5 (contado) | 🟡 No authorization record; identification via duplicated `Tipo de Crédito` fields (~55% empty) + Orion flags. Consolidate without silent merge |
| Etapa 12 (escrituración/facturación) | 🟡 v15 delivers: 3,292 FEL invoices + B5 escrituración dataset (291 forms, finca/folio/libro; **25 units with contradictory cotización values unresolved; 13 folders need human decisions**). FEL legal payloads (160,247 files) locked behind the backup. B5 only |
| Etapas 15–17 (impuestos, registro, desembolso) | 🟡 Evidence exists unlabeled (v15 tax postings; B5 finca/folio/libro from external xlsx, unit 1001 deliberately absent; disbursements buried in v15 payments needing heuristics) |
| Etapas 13, 14, 18, 19 | 🔴 Nothing anywhere. PD built the fields and nobody ever filled them (Título de Acción 0/81,441). BLV5's 2026-08-10 restructure (12→16 stages) starts capturing 11/14 **going forward, B5 only, zero history** |

### CUMPLIMIENTO — 0/5 🟢, 1 🟡, 4 🔴 (0%)
| Item | Status |
|---|---|
| Manuales | 🔴 No register anywhere (PD's "manuales" are commercial PDFs in a mail archive) |
| Normal/PEP/CPE | 🔴 **Confirmed zero across all four sources** (PD: all 139 custom fields checked; v15: zero custom fields on res.partner; Orion: demographics only; officer xlsx: zero mentions). Born-in-v19 data |
| Casos específicos | 🔴 Definition itself still pending (confirmed NOT the officer's observaciones) |
| Expedientes KYC | 🟡 B5 structured in Orion (265/327, with the 159-absurd-DPI-dates finding); massive unstructured document reserves (PD: 578 DPI + 450 RTU + 301 bank statements distinct, filename-classified, post-horizon only; v15: B5 scans). Remaining 4 projects' xlsx pending |
| Archivado | 🔴 No outcome field anywhere (`lost` ≠ desistido) |

---

## 4. Entity spine & join keys for v19

| Entity | Canonical source | Join keys across systems |
|---|---|---|
| **Unit** | **Orion `rv_units`** (real FKs, 5 projects, status history) | Orion `project_id`+`unit_number` ↔ PD `Proyecto`+`Torre`+`Número de Apartamento` (931) / `code` (BNA605) ↔ v15 partner-name convention `02-0101-A7.1-…` (300 partners, 5,716 invoices — **free-text, one rename breaks it; validate before trusting**) ↔ officer xlsx apto |
| **Sale/reserva** | **Orion `reservations`+`sales`** | Orion unit key ↔ PD `deal_id` (weak: `# Apartamento` sparse/two formats) ↔ v15 invoices via unit-partner |
| **Person/client** | Orion `rv_clients` (653) as seed | Cross-system dedup is a real workstream: PD 75,149 persons (99.4% phone) ↔ v15 21,963 partners (46.8% NIT in `vat`) ↔ Orion clients. **DPI number exists as data only in the officer's xlsx** (not extracted; sensitive) — elsewhere it's pixels. Fuzzy name+phone matching required |
| **Salesperson** | Orion `salespeople` (33, unified) | PD `owner_id` → **join on email, not id** (PD reused user id 24650716: Alma Soto → Alejandro Morales) |
| **Campaign** | Meta xlsx (names) + PD (IDs) | Name-based join; IDs are the durable key if a fresh ads export with IDs is pulled |
| **Payment** | Orion payments + v15 `account.payment` (reconcile!) | v15 `move_id` (100%), `x_no_recibo` ↔ physical receipts; Orion sale_id |
| **Pipeline stage** | PD `stage_id` | **Never map by name** — trailing spaces are load-bearing (`Resguardo FHA `), and BLV5 diverged twice from sibling embudos |

---

## 5. Quality traps compendium (all sources, one list)

1. v15 `account.payment` has no own date — join `move_id` or ship a dateless ledger.
2. v15 `res.partner.comment`: "88.8% populated" = 100% `<p><br></p>`. Fill-rate audits lie.
3. v15 `product.template`/`stock.quant` = auto parts. Never map to apartments.
4. v15 unit key = naming convention in free text. Validate before per-unit aggregates.
5. v15 Studio fields (`x_no_recibo`, `x_doc_no`, `anulado`…) vanish in vanilla v19 unless recreated.
6. v15: 13 future-dated moves (to 2026-11-20); Chinautla invoicing stops dead 2025-03-06 (confirm).
7. PD `deal.value` collapsed 72.7%→0.5% (2022→2026) — value-over-time charts show data entry, not commerce.
8. PD `Tipo de Crédito` ×2 fields, crossed typos (`Condado Banco`/`Contado banco`); `Enganche pactado` vs `acordado`; `Último Pago de enganche` mixes scheduled and actual (46 future dates).
9. PD `Valor Promoción` = enum of currency strings; `Valor Vale` is the monetary. Never parse labels.
10. PD stage names carry load-bearing trailing whitespace; map by `stage_id`.
11. PD user id reuse (24650716) — user joins on email.
12. PD ~0.9% of files have extension≠bytes (sniff magic bytes); 63,938 blobs purged upstream (gone forever); 89.9% of blobs are duplicates (21,019 distinct; one brochure = 61 GB).
13. Meta export: "Importe gastado (USD)" is mislabeled — Divisa column is authoritative (4 GTQ + 2 USD accounts). The Power BI mixes currencies.
14. Meta export: one campaign's 104,290 "leads" = mis-mapped site events (excluded by the artifact's own audit — keep excluding).
15. Officer xlsx: 159/327 DPI expiry dates are impossible (birth dates in the wrong column).
16. Orion lead_source free text: 29 variants incl. typo families ("leds"); normalize with the existing rules.
17. Encoding: PD API extraction is clean UTF-8; UI CSV exports arrive as mojibake (latin-1) — prefer API-sourced data, fix CSVs deterministically.
18. Confidentiality: PD holds 29,960 private messages + 16,463 forbidden attachments — ids recorded, bodies never stored. **Decide the confidentiality boundary before any v19 load.**

---

## 6. Ranked actions (value ÷ effort, deduplicated across all three inventories)

1. **Request the Odoo.sh backup** (email to Odoo support). Unlocks 65/69 companies, 160,247 FEL
   legal files, field-change history, full model space. Highest leverage, lowest effort.
2. **Pull Pipedrive créditos stage-change history now** (~1,052 calls; needs Jorge's go). It dies at
   cutover and exists nowhere else.
3. **Reconcile the two payment ledgers** (Orion ↔ v15) and define the canonical collections history
   for v19. Includes recreating `x_no_recibo`.
4. **Validate the v15 unit-partner naming convention** against Orion's unit master (300 partners,
   5,716 invoices depend on it).
5. **Person dedup workstream** (PD 75K ↔ v15 22K ↔ Orion 653) — fuzzy name+phone; decide the
   golden-record rules.
6. **Get the remaining compliance xlsx files** (4 projects) and the CPE/casos específicos
   definitions; design the born-in-v19 risk-classification fields.
7. **Answer the open business questions**: What is Torre Cobán? Does Google Ads run? Is Chinautla's
   2025-03 stop real? Why zero new créditos deals 08-05→08-09 while commercial added 581? Which of
   PD's 475 PCV/Reservado units vs Orion's ledger is right (reconcile inventories)?
8. **Decide OCR scope**: descuentos (only route), KYC structuring (3,200+ identity docs), etapa 1–3
   document classification (17,756 pages ready). All produce human-review queues, not truth.
9. **Re-extract before cutover**: v15 structured (6 weeks stale) and PD (~500 deals per 4 days) are
   both live; Orion is live. Freeze windows and final deltas need scheduling.

---

## 7. Explicit unknowns (kept visible on purpose)

- 65/69 v15 companies: **unknown, not established absence** — could contain CRM/reserva/unit objects.
- PD pre-2025-08-29: rows without evidence; the documents may exist only on paper or in v15.
- The 25 contradictory B5 cotización values and 13 folder-vs-document mismatches: awaiting an
  authority decision — **do not migrate as fact**.
- Casos específicos: undefined; CPE: acronym still unconfirmed by the compliance team.
- Residual inventories (both agents) are preserved in their respective files and must ride along in
  the migration regardless of HUD mapping: PD activities 439K / mails 140K / notes 16K / 634 fee
  products / 11 line-items; v15 chatter 109K / 1,023 binaries / auto-parts catalog / Chilean & US
  localization leftovers. NO DATA LEFT BEHIND applies to all of it.
