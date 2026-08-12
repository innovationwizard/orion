# Consolidated Data Inventory — Puerta Abierta / Odoo v19 Migration

**Compiled:** 2026-08-11, by the Orion agent.
**Scope:** every dataset we hold, know of, or know to be missing — with provenance, exact volumes,
cutoffs, quality debts, and what would close each gap.
**Prime directive honored here:** *the worst possible outcome of this assessment is to believe we
are more prepared than we really are.* Where reality is ugly, this document says so.

## How to read provenance tags

| Tag | Meaning |
|---|---|
| `LIVE-VERIFIED` | Queried by me against the production Supabase **on 2026-08-11**. Exact at that moment; DB is live. |
| `AGENT-MEASURED` | Measured by the Pipedrive / Odoo v15 extraction agents from their extracts, at their stated boundaries. I did not independently re-verify. |
| `SNAPSHOT` | A file we physically hold in the repo, with its stated cutoff. Static until replaced. |
| `REPORTED` | Stated by Jorge or a team (marketing, ventas, compliance). Not verified against any system. |
| `INFERRED` | My deduction from the above. Explicitly marked. |

---

# PART I — THE BRUTALLY HONEST POSITION

**The Odoo HUD says 64% migration readiness. Here is exactly what that number does and does not mean.**

It means: for 36 of 55 requirement items, a source system holds the data with known join keys.

It does **not** mean:
1. **Any ETL exists.** Zero mapping code to v19 has been written. Zero v19 schema decisions made.
   Zero test loads run. "Source secured" is step 1 of perhaps 6 (secure → freeze → map → transform →
   load → reconcile).
2. **The sources agree with each other.** They demonstrably don't (see Part IV — reconciliations).
   The Orion payments ledger sums **Q57.1M**; Odoo v15's sums **Q300.8M**. Pipedrive's inventory
   says 475 units PCV/Reservado; its own deal pipeline says 140. Nobody has reconciled anything yet.
3. **The counting rules are ratified.** "What is a sale" (reserva vs invoice vs won-deal), how
   multi-value channels count, how the duplicated `Tipo de Crédito` fields consolidate — these are
   my working rules, approved by Jorge for HUD display, **not ratified as migration law by the
   business**.
4. **The unknowns are small.** 65 of 69 Odoo v15 companies — holding 98% of that instance's
   attachments including 160,247 FEL legal tax files — have never been read by anyone on this
   project. That is not a gap in a dataset; that is a continent we have not visited.
5. **The data is current.** Every snapshot has a boundary; all three source systems are live and
   drifting. The v15 structured extract is ~7 weeks stale today.

A fair one-sentence summary: **we know where almost everything lives, we hold a great deal of it,
we have proven the joins are possible — and we have not yet built, reconciled, or ratified
anything.** That is a strong position for a discovery phase and a weak one for a cutover date.

---

# PART II — INVENTORY BY SOURCE FAMILY

## A. Orion production DB (Supabase, project `nqaexbpteletuwdbpixq`) — the app's own data

**Status: LIVE, production, RLS-enforced, migrations 018–069 deployed. The only source with
referential integrity (real FKs, constraints, UUID v7 keys).**
All counts `LIVE-VERIFIED` 2026-08-11 unless noted.

### A.1 Commercial spine
| Dataset | Volume | Range | Notes |
|---|---|---|---|
| `projects` | 5 (+ slug, currency, metas 068/069) | — | BLT, CE, B5, BEN (GTQ) · SE (USD). **Torre Cobán absent.** |
| `rv_units` (unit master) | 901 units, 10 towers, 86 floors | — | type/areas/parking/bodega/price_list/status + valor_inmueble, area_lot, precalificación, cesión, pcv_block. **The canonical unit master for v19.** |
| `unit_status_log` | 1,399 status changes | since 2026-03 | The only unit-status history anywhere. Starts at Orion go-live — **pre-2026-03 status history exists nowhere on earth.** |
| `reservations` | **723** (648 CONFIRMED · 74 DESISTED · 1 other) | deposit_date from **2022-08-05** | **The reserva system of record** (both external agents lack it). Carries lead_source, deposit data, receipt/DPI images, desist reason+date (constraint-enforced), enganche_schedule JSONB, cuotas_enganche, pipedrive_urlated. |
| `sales` (analytics) | **944** | sale_date from **2022-06-27** | price_with_tax, promise/deed/disbursement dates, ejecutivo_rate (ledger pattern), caso_especial (F&F). |
| `rv_clients` / `rv_client_profiles` / `reservation_clients` | **726 / 502 / 768** | — | Multi-buyer M:N with roles. Profiles: demographics + income_source, prequalification_bank, is_fha, is_cash_purchase. **No DPI numbers as data** (images only). |
| `salespeople` (+ temporal assignments, periods) | **44** | — | Unified commercial+analytics identity. Grown from 33 (memory) — roster is live. |
| `lead_sources` | 17 catalog entries | — | Plus 29 free-text variants actually present on reservations (dirty). |

### A.2 Money
| Dataset | Volume | Range | Notes |
|---|---|---|---|
| `payments` | **7,616** rows, **Q57,149,941.88** (non-reimbursement) | — | Reserva/enganche installments per sale. **⚠️ This is NOT the complete money history** — see the v15 delta in Part IV. Phase 3 (bank credit) deliberately out of scope. 13 reimbursement rows. |
| `payment_compliance` (view) | 691 accounts (382 delinquent at 2026-08-07) | — | **Contractual expected-to-date per account** — the structured "plan de cuotas" the v15 agent thought needed OCR. Denominator source for all % metrics. |
| `commissions` | **34,651** rows | — | Full 5%-cap engine: ejecutivo/GC/supervisor/PA/ahorro residual/ISR/phase proration. All 13 audit DIFFs resolved (2026-03). |
| `rv_price_history` | **30** rows | — | **Brutally honest: this is thin.** "Price history per unit" is 30 manual entries, not a systematic series. |
| `rv_referrals` | 13 | — | |
| `audit_events` | 3,076 | since 2026-03 | Append-only who-did-what. |

### A.3 Storage & config
Buckets `receipts` / `dpi` / `pcv` (auth-only; receipt + DPI images per reservation) ·
`system_settings` · cotizador configs per project · `commission_gerencia_assignments` ·
access-control matrix (8 roles × 53 actions).

### A.4 Honest limits of source A
- Money: partial (Q57M of a Q300M+ world; starts 2022, v15 money starts 2021-07-30).
- Client identity: names/phones; **no DPI numbers, no NIT** as data.
- Price history: 30 rows. Status history: 5 months old.
- Analytics sales for SE don't exist in `sales` (reservations only) — the ROAS view already flags it.

## B. Orion-held snapshots (files in the repo, feeding app views)

| Snapshot | Cutoff | Volume | Provenance / notes |
|---|---|---|---|
| Meta Ads source xlsx (`ARTIFACT/Performance-Report-Puerta-Abierta.xlsx`) | 2026-08-04 | 9,329 daily rows, 2024-07-05→ | `SNAPSHOT`. **Divisa column is authoritative** (4 GTQ accounts Q150,378 + 2 USD $109,749); the "(USD)" column label lies. Leads net of a mis-mapped campaign (104,290 fake leads excluded per the artifact's own audit): **59,504**. |
| Power BI reconstruction (`public/mercadeo/performance.html`) | 2026-08-04 | camp grain 458 · pipedrive res 379 · inventario 814 · presupuesto 29 | `SNAPSHOT` via pbixray. Includes its own FINDINGS page. Presupuesto table (29 rows) is the only structured media-budget data anywhere. |
| Derived: `leads-snapshot.json`, `spend-snapshot.json` | 2026-08-04 | per-account monthly | Regenerable by scripts. |
| Vales CSV → `vales-snapshot.json` | 2026-08-07 | 27 B5 deals, Q490K | `SNAPSHOT` from a Pipedrive UI export (mojibake fixed). **Superseded in scope by the PD extraction's 168 project-agnostic promotion deals** — keep for cross-check. |
| Créditos export (`creditos_export_2026-08-07/`) | data boundary **2026-08-05** | 1,052 deals × 46 cols + aggregates + 15 embudos/133 etapas | `SNAPSHOT` from the PD extraction conversation. Now largely superseded by the full PD inventory (boundary 2026-08-09) but is the version wired into the app. |
| Compliance officer xlsx → expedientes snapshots | 2026-08-07 | 265 B5 expedientes, 327 buyers | `SNAPSHOT`. DPI status: 94 vigente / 48 vencido / **159 impossible dates** / 26 none. Officer's casework notes on 159 units. **B5 only.** |
| Historical reference archive (repo root / `origin/`) | various | Comisiones Excels (Feb–Abr), Reestructura Dic-2025 xlsx (11 sheets), SSOT transcripts, cotizadores | `SNAPSHOT`. Business-rule provenance — the *why* behind the commission engine and cotizador configs. |

## C. Pipedrive extraction (`repo-orion-odoo19-etl-pipedrive`) — boundary 2026-08-09 23:59:59 GT

All `AGENT-MEASURED`. Source **LIVE** (~500 new deals / 4 days).

| Dataset | Volume | Range | The honest read |
|---|---|---|---|
| Deals | **81,441** | 2022-06-08→ | **A lead list, 94.4% dead.** 55 won (flag set at armado, not at sale) · 140 in Reserva stages. `deal.value` collapsed 72.7%→0.5% (2022→2026) — unusable as a value series. |
| Persons | 75,149 | 2022→ | 99.4% phone coverage — the dedup goldmine and the dedup nightmare. |
| Activities | **439,299** | 2022-06-02→ | calls 247K · tasks 73.5K · WhatsApp 65K · emails 43.7K · **`reserva`-type 581** — a 4× larger sales trail than the 140 Reserva-stage deals; unreconciled against Orion's 723 reservations. |
| Unit products | 931 (3 of 6 projects) | created 2025-10/11 | Estatus: Disponible 414 · PCV 404 · Reservado 71 · Congelado 42. **No history; single snapshot.** SE/CE/TCA absent. Contradicts its own deal pipeline (475 vs 140). |
| Créditos deals | 1,052 across 6 embudos | | Milestone dates for ~90–215 deals each; `stage_change_time` 97%. **Stage-change history NOT extracted — retrievable (~1,052 calls) and destroyed at cutover.** |
| Files | 294,574 rows → **212,053 blobs, 161.9 GiB** | post-**2025-08-29** only | 89.9% duplicates (21,019 distinct, 15.4 GiB); 63,938 purged upstream (**gone forever**); 16,463 forbidden 🔒; one brochure = 61 GB. KYC classes by filename: DPI 578 · RTU 450 · bank statements 301 · promesas 550 distinct. |
| Mail | 140,370 messages, 2.35 GB | post-2025-09-02 | **No deal/person link** (thread id only) — routing unsolved. Plus **29,960 private messages: ids recorded, bodies deliberately never stored** 🔒. |
| Notes | 16,153 | post-2025-08-29 | Unclassified free text. |
| Config | 15 pipelines / 137 stages · 112+27+11 custom fields · 24 users | | User id 24650716 REUSED (Alma Soto → Alejandro Morales) — join users by email. ~14 deal fields 100% empty. BLV5 restructured 2026-08-10 (12→16 stages). |

**The documentary horizon:** notes/files/mail all begin 2025-08-29 (migration fingerprint
`Propietario Pipe 1.0`, 26,799 deals). **26,557 pre-horizon deals carry 345 files and 382 notes
total. There was a "Pipe 1.0" instance; its documentary content was not carried over and is not in
our possession. Nobody has asked whether Pipe 1.0 still exists or can be exported.** `INFERRED`
gap worth chasing.

## D. Odoo v15 extraction (`clave.odoo.com`, db `piensom-clave-sh-main-4550777`)

All `AGENT-MEASURED`. Cutoffs: structured **2026-06-25** (~7 weeks stale) · files 2026-08-09 ·
chatter 2026-08-10. Source **LIVE** (63 active users).
**Hard scope bound: 4 of 69 companies** (El Gran Jaguar, Chinautla, Inversiones de Castilla,
Antigua Panorama).

| Dataset | Volume | The honest read |
|---|---|---|
| `account.move` | 24,639 (Q1.35B) — 7,944 customer invoices, 2022-01→2026-11(!) | An invoice ≈ an installment, **not** a sale (~19× overcount if confused). 13 future-dated. Chinautla stops dead 2025-03-06 (unexplained). 3,292 carry FEL numbers. |
| `account.payment` | **11,029, Q300.8M** (8,032 in / 2,997 out), 2021-07-30→2026-06-24 | **The deepest money history in existence** — predates Orion by a year. Dates live on `account.move` (join 100% via move_id — standalone reads are dateless). Studio fields `x_no_recibo` 72.8% / `x_doc_no` 94.8% = physical receipt numbers, lost in vanilla v19 unless recreated. ≥1 USD journal. |
| `res.partner` | 21,963 | **300 are apartments** (name convention `02-0101-A7.1-…`); 5,716 invoices (72%) bill to unit-partners. Free-text key — one rename breaks it. `vat` (NIT) 46.8%. `comment` "88.8% filled" = 100% `<p><br></p>` (a lie to naive audits). **Zero custom fields — zero KYC/PEP.** |
| CRM / Sales / Stock / HR / POS | **All zero rows** | Configured, never used. The instance is an accounting system wearing an ERP costume. `product.template`/`stock.quant` = **auto parts and appliances** (another business) — mapping them to apartments produces garbage. |
| Documents | 1,023 blobs, 7.2 GB — 931 PDFs / 17,756 pages, OCR'd (97.4% conf) | B5 expediente bundles: PCVs, DPI/RTU scans, cotizaciones **with PLAN DE CUOTAS printed**, checklists-as-paper. 98% image-only. Folder≠content cases verified. 14/293 folders empty. 144 payment-receipt PDFs. |
| B5 escrituración dataset (derived) | 400 names · 293 cotizaciones · 291 filled forms · finca/folio/libro | **The only etapa-12 structured data anywhere.** 25 units with contradictory cotización values (unresolved) · 13 folder-vs-document mismatches (need human ruling) · registral data from an **external xlsx** (unit 1001 deliberately absent). B5 only. |
| Chatter | 109,048 messages | ~99.7% system audit trail ("Validated", "Paid") — a who-did-what log, not correspondence. |
| **Unreachable** | 65 companies · 384K attachments (99.73%) · **160,247 FEL legal files** · field-change history | **The single biggest unknown in the entire project.** Fix = an Odoo.sh backup — an email, not an engineering project. |

## E. Sources known to exist that we do NOT hold (with exactly what's missing)

| # | Missing thing | Where it is | What exactly to obtain | What it unlocks | Effort |
|---|---|---|---|---|---|
| 1 | **Odoo.sh backup** (dump + filestore) | Odoo support / account owner | Full PostgreSQL dump + filestore zip of production branch | 65/69 companies · 160,247 FEL legal tax files · `mail.tracking.value` history · closes "the continent" | **An email + download.** Highest leverage anywhere. |
| 2 | **PD créditos stage-change history** | Pipedrive live API | Per-deal flow/updates for 1,052 créditos deals (~1,052 calls, minutes) | Real cycle times & bottlenecks; the only trajectory record; **destroyed at cutover** | Needs Jorge's go + endpoint verification |
| 3 | Descuentos | Scanned PDFs (physical/wherever ventas keeps them) + inside cotización PDFs we hold | The PDFs themselves; or OCR pass over PD's ~1,037 cotización PDFs + v15 pages | v10 — the last VENTAS red | OCR infra exists (Claude Vision); output needs human review |
| 4 | Compliance xlsx, 4 remaining projects | Compliance officer ("data complete in xlsx files, pending download" — `REPORTED`) | The 4 files | m4 full scope; KYC per ~400+ more expedientes | Download + rerun existing extractor |
| 5 | CPE definition + casos específicos definition | Compliance team (asked, unanswered) | Two definitions in writing | m2/m3 design for v19; officer xlsx re-read | A conversation |
| 6 | Manuales de cumplimiento register | Possibly only in the officer's head/files | List of required manuals + status/versions | m1 | A conversation + a small table |
| 7 | PEP/CPE classification data | **Nowhere — confirmed zero in all four sources** | Born-in-v19 fields + a classification exercise over ~726 clients | m2 | Business process, not extraction |
| 8 | Etapas 13/14/18/19 records (entrega, firmas, liquidación, testimonio, archivado) | Unknown — possibly paper only, possibly nowhere | Ask créditos team where (if anywhere) these are recorded | CRÉDITOS tail | A conversation first |
| 9 | Pre-2026-03 unit status history · pre-Orion price history · historical metas | **Nowhere (confirmed)** | Nothing to obtain — accept and document | Honest v19 series starting points | Zero (acceptance) |
| 10 | TikTok spend · Google Ads existence | Ad platforms / marketing | TikTok Ads export; answer "does Google run?" | Completes AREA 2 beyond Meta | Export request |
| 11 | Torre Cobán — everything | Unknown (PD scaffolding only) | What is it, when, where will its data live? | Prevents a 6th-project surprise mid-migration | A question to Jorge/gerencia |
| 12 | "Pipe 1.0" instance | Unknown (fingerprint: `Propietario Pipe 1.0` on 26,799 deals) | Does it still exist? Can it be exported? | Documentary evidence for 2022–2025 deals | A question, then maybe an export |
| 13 | Final deltas of all three live systems | Orion / PD / v15 | Freeze plan + re-extraction at cutover | Data that is actually current on day one | Scheduling discipline |

---

# PART III — INVENTORY BY BUSINESS ENTITY (the spine v19 will be built on)

| Entity | Canonical source | Coverage | The gap, stated plainly |
|---|---|---|---|
| **Project** | Orion `projects` (5) | 5 of possibly 6 | Torre Cobán undefined. |
| **Unit** | Orion `rv_units` (901, real FKs) | All 5 projects | PD has 3/6 projects (snapshot only); v15's "unit" is a contact name string. Status history starts 2026-03. |
| **Person/Client** | Orion `rv_clients` (726) as golden-record seed | Buyers well covered | **75,149 PD persons + 21,963 v15 partners + 726 Orion clients, no shared key.** DPI exists as data only in the officer's B5 xlsx; NIT only in v15 (46.8%). Dedup = fuzzy name+phone. **This is the largest unbuilt workstream in the migration.** |
| **Salesperson** | Orion `salespeople` (44, temporal assignments) | Complete | PD owner joins by email only (id reuse). |
| **Sale (reserva)** | Orion `reservations` (723, from 2022-08) | The system of record | PD's 140/55 must never be presented as sales; 581 reserva-activities unreconciled; v15 invoices are installments. |
| **Contract terms / plan** | Orion `payment_compliance` + enganche schedules (691 accounts) | Strong | Pre-Orion contracts: terms live in scanned cotizaciones (B5 extracted: 293; **25 contradictory**). |
| **Payment** | **Odoo v15 `account.payment` (Q300.8M, 2021→)** for history; Orion for plan-linked detail | Deep but unreconciled | **Q57.1M (Orion) vs Q300.8M (v15) has never been explained line-by-line.** v15 also mixes 3 non-PA companies. Reconciliation is mandatory before any v19 load. |
| **Invoice (legal)** | v15 FEL (3,292 numbered) | B5-heavy | The 160,247 FEL payload files are behind the backup. |
| **Escrituración** | v15 B5 dataset (291 forms, finca/folio/libro) | **B5 only** | Other projects: nothing structured anywhere. |
| **Credit expediente** | PD créditos deals (1,052) | Etapas 4–11 current-state | History pending (item 2); etapas 1–3 are paper; 12 in v15; 13–19 nowhere. |
| **Marketing** | Orion-held Meta xlsx + PD attribution IDs | Meta complete 2024-07→ | TikTok spend, Google unknown; Excel↔PD join by campaign *name*. |
| **Compliance/KYC** | Officer xlsx (B5) + document piles (PD/v15) | B5 structured only | PEP/CPE born-in-v19; 4 projects' xlsx pending; document OCR optional. |
| **Documents** | PD blobs (21,019 distinct) + v15 PDFs (931) + Orion buckets | Massive | Post-2025-08-29 bias (PD); folder≠content traps; 63,938 purged forever; privacy boundary undecided (29,960 + 16,463 items 🔒). |

---

# PART IV — RECONCILIATIONS THAT MUST HAPPEN (none started)

1. **Money:** Orion `payments` (7,616, Q57.1M) ↔ v15 `account.payment` (11,029, Q300.8M, includes
   other businesses and outbound). Define: which rows describe the same real-world payment? What is
   PA-only in v15? What exists in only one ledger? **Until this table exists, no v19 collections
   load should run.**
2. **Inventory:** Orion 901 units/status ↔ PD 931 units/Estatus (3 projects) ↔ PD's own 140
   Reserva-deals. PD internally contradicts itself (475 vs 140); Orion is the referee.
3. **Sales trail:** Orion 723 reservations ↔ PD 581 `reserva`-type activities ↔ PD 140 Reserva-stage
   deals ↔ v15 unit-partners with invoices (300). Four numbers, one reality.
4. **Clients:** the three-way person dedup (Part III). Requires golden-record rules ratified by the
   business (who wins on conflict: Orion? newest? most complete?).
5. **Campaigns:** Meta xlsx names ↔ PD Meta IDs (name-based; verify collision-free).
6. **Créditos:** Orion créditos snapshot (2026-08-05) ↔ PD inventory (2026-08-09) ↔ BLV5's
   2026-08-10 restructure — three slightly different pictures of the same pipelines already.

---

# PART V — DECISIONS THE BUSINESS MUST RATIFY (data exists; rulings don't)

1. What counts as "a sale" in v19 (reserva date? PCV date? invoice?). HUD rule (CONFIRMED+DESISTED
   by deposit_date) was approved for display, not for accounting.
2. Golden-record rules for person dedup.
3. `Tipo de Crédito` consolidation rule (my prefer-#1-normalize-contado rule is a working rule).
4. The 25 contradictory B5 cotización values and 13 folder mismatches — need an authority to pick.
5. Confidentiality boundary: 29,960 private PD messages + 16,463 forbidden attachments — load, skip,
   or restricted-load? Must be decided **before** anything touches v19.
6. Channel taxonomy: merge Orion's 29 dirty variants with PD's 16-option catalog into one v19 list.
7. Whether Studio fields (`x_no_recibo` et al.) are recreated in v19 (recommendation: yes — they are
   the operational receipt keys).
8. Torre Cobán and Pipe 1.0 (see Part II.E).

---

# PART VI — RISK REGISTER (what actually breaks the migration if ignored)

| Risk | Severity | Why |
|---|---|---|
| Money loaded without the Orion↔v15 reconciliation | 🔴 Fatal | Double-counted or missing collections in the ERP that runs the company. |
| PD deals presented as sales anywhere in v19 | 🔴 Fatal to trust | 81,441 looks rich; it is 94% dead leads. The most dangerous number in the project. |
| v15 payments read standalone (no move join) | 🔴 High | A dateless collections ledger, silently. |
| Stage-history not pulled before PD cutover | 🟠 Irreversible loss | The only credit-process trajectory record dies. |
| Backup never requested | 🟠 High | 160,247 legal tax files + 65 companies stay dark; any later legal/audit need hits a wall. |
| Unit name-convention trusted unvalidated | 🟠 High | 5,716 invoices hang from a free-text string. |
| Snapshots treated as current at cutover | 🟠 High | All three systems are live; drift is guaranteed; re-extraction must be scheduled. |
| Quality debts migrated as fact (159 DPI dates, 25 cotizaciones, future-dated moves) | 🟡 Medium | Poisoned reference data in a fresh system. |
| Believing "Odoo v15 has been assessed" | 🟡 Medium | It has not. 4/69 companies have. |

---

# PART VII — WHAT "READY" WOULD LOOK LIKE (closure criteria)

The honest checklist against which to re-run this assessment:

- [ ] Odoo.sh backup obtained and inventoried (kills the 65-company unknown).
- [ ] PD stage-history pulled and archived.
- [ ] Money reconciliation table exists and balances (or documented residual).
- [ ] Person golden-record ruleset ratified; dedup executed on a test load.
- [ ] The 8 business rulings of Part V signed off.
- [ ] Remaining compliance xlsx + descuentos PDFs ingested (or formally declared out of scope).
- [ ] v19 target schema drafted; unit/person/sale/payment mapping documents written.
- [ ] One full trial load into a disposable v19 instance, reconciled against sources. (We have
      unlimited trial and error — **use it**; "getting it right the first time" is the goal for
      production, and rehearsal is how first times go right.)
- [ ] Freeze-and-delta plan for all three live systems, with owners and dates.
- [ ] This document re-issued post-trial-load, with the failures it surfaced.

**Bottom line, no varnish:** we hold a genuinely large and well-understood corpus — a live
system of record for sales and plans, the deepest money ledger, a priced unit master, rich
attribution, and hundreds of gigabytes of documents — and the joins between them are proven
possible but not yet performed. The 64% is a *sourcing* number. The *migration* number — mapped,
loaded, reconciled, ratified — is today **0%**, and the path from one to the other is the work
listed in Parts IV–VII, most of which is conversations and reconciliation discipline rather than
heroic engineering. The cheapest three moves remain: send the backup email, pull the stage history,
and start the money reconciliation.
