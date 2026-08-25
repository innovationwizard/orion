# Puerta Abierta Inmobiliaria — Company & Project Context Brief

> **Purpose:** self-contained context for an external conversation (no repo access required).
> **Compiled:** 2026-08-24, from this repository: SSOT discovery transcripts, the Reserve Deposit
> Observer SDD, business-rule extractions, production migrations, and the 2026-08-11 data inventory.
> **Provenance labels used below:** `LIVE` = verified against the production Supabase on 2026-08-11 ·
> `SNAPSHOT` = from a dated file held in the repo · `TRANSCRIPT` = stated by the business in the
> March 2026 discovery sessions · `INFERRED` = deduction, marked as such.
> Where a number is older than another number for the same thing, the newer one is used and the
> older is noted. Nothing here is estimated silently.

---

## 1. What the company is

**Puerta Abierta Inmobiliaria (PA)** is a Guatemalan residential real-estate developer and
commercializer. It builds and sells multi-unit residential projects — mid- and high-rise apartment
towers plus one luxury horizontal (house) development — in Guatemala City and its metropolitan
area. It sells in **GTQ (Q)** for four projects and **USD** for one.

Each project is a legally separate company; PA is the commercial operator across them:

| Project | Legal entity behind it |
|---|---|
| Boulevard 5 | Inmobiliaria El Gran Jaguar, S.A. |
| Benestare | Inversiones Inmobiliarias Chinautla, S.A. (NIT 11206240-7) |
| Bosque Las Tapias | Inversiones de Castilla, S.A. |
| Casa Elisa | (Odoo company "Santa Elisa" ledger; entity not stated in repo) |
| Santa Elena | (entity not stated in repo; Odoo company "Antigua Panorama" is in scope of the v15 extraction) |

**Scale** (`LIVE`, 2026-08-11 unless noted):

| Metric | Value |
|---|---|
| Active projects | 5 (a 6th, "Torre Cobán", exists only as CRM scaffolding — undefined) |
| Units under management | **901** across **10 towers** and **86 floors** |
| Reservations (the commercial "sales" ledger) | **723** — 648 confirmed · 74 desisted · 1 other; earliest deposit 2022-08-05 |
| Analytics `sales` rows | **944**, from 2022-06-27 |
| Clients | 726 (`rv_clients`), 768 buyer-links (multi-buyer per unit) |
| Salespeople | **44** (roster is live and grows; was 33 in April 2026) |
| Payments recorded in-app | 7,616 rows, **Q57.1M** — *not* the full money history (see §8) |
| Commission rows computed | 34,651 |

**Revenue model:** sale of the units themselves. Commercial compensation is a hard **5.00 % of sale
price** per sale, split 50/50 between the sales force (2.50 %) and the company (2.50 %) — see §7.

---

## 2. What it sells — the five projects

### 2.1 Boulevard 5 (B5) — high-rise, flagship, near sold out

| Field | Value |
|---|---|
| Slug / currency | `boulevard-5` · GTQ |
| Structure | 1 tower ("Principal"), ~19 floors, ~298 apartments |
| Unit types | A (31–34 m², 1BR) · B (47–52 m², 2BR) · C (56–58 m², 2BR) · D (66–70 m², 2BR) · E (69–74 m², 3BR); 67 distinct type codes in the cotizador |
| Extras sold | Bodegas (fixed 5.3 m²), multi-level parking (S-5…S-1, numbered spots), IkiSmart home-tech add-on, **Plaza Comercial** commercial space |
| Reserva deposit | **Q10,000** (partners: Q6,000) |
| Enganche | 7 % in 8 installments (Apto Terraza: 7 % in 7) |
| Bank rate / terms | 7.26 % FHA · 30/25/20/15/10 years |
| Mantenimiento | Q16.00 / m², included in the quote |
| IUSI | included in the monthly cuota · Seguro: not included |
| Escrituración split | 70 % inmueble / 30 % timbres |
| Status | **272 units SOLD** (`LIVE`, migration 071 verification); 25 of them carry a prior desisted reservation (resale) |
| Delivery | Delivery calendar runs **from September 2026** — escrituración and key handover are being scheduled now |

**Why it is the hardest project:** four different commercial managers over its life, each leaving
their own Excel conventions. Price adjustments are irregular and hand-typed (+Q23,000 on one unit,
+Q14,000 on another, +Q5,500 on a third), 9+ manual adjustment columns per unit. Antonio (Commercial
Director) called it *"mi dolor de cabeza."* `TRANSCRIPT`
It also carries **cesión de derechos** (200+ records where a buyer transfers purchase rights to a
third party, with plusvalía/appreciation analysis) and a **partners policy**: 14 named individuals
who pay a Q6,000 reserva and may skip the enganche entirely (deducted against their capital), with
no reduction to the executives' commission.

### 2.2 Benestare (BEN) — affordable, high-velocity, suburban

| Field | Value |
|---|---|
| Slug / currency / location | `benestare` · GTQ · Chinautla (metropolitan suburb) |
| Structure | 4 active towers (A, B, C, D) + **Torre E frozen 100 %** as a strategic hold; ~282 apartments |
| Unit types | A (1BR ~34 m²) · B and C (3BR ~47 m²). **No 2BR.** |
| Reserva deposit | **Q1,500** (lowest of all projects) |
| Enganche | 5 % |
| Bank rates | 5.0 % ("Mi Primera Casa") · 5.5 % FHA · 7.26 % FHA sin carencia · 8.5 % crédito directo |
| Terms | 40/30/25/20 years (longest terms of the portfolio) |
| Escrituración split | 70 / 30 |

**Its defining trait is churn.** Highest desistimiento rate in the portfolio (56 cancellations
historically) driven by sales velocity, plus a **traslado de torre** feature: a client may move
between towers, which cancels and recreates the sale. Six rounds of price increments, a Q8,700 1BR
discount, and promotional discounts on towers D/E. Casa Elisa's apartment 306 was famously **sold
three separate times** — the emblematic double-sell incident. `TRANSCRIPT`

### 2.3 Bosque Las Tapias (BLT) — mid-rise, the cleanest project

| Field | Value |
|---|---|
| Slug / currency | `bosque-las-tapias` · GTQ |
| Structure | 2 towers — Torre B (floors 2–10) and Torre C (floors 1–7); ~200 units (Torre B alone ~117) |
| Unit types | A (2BR) · B (3BR) · C (3BR) |
| Reserva deposit | **Q3,000** |
| Enganche | 7 % — Torre B over **28** installments, Torre C over **24** |
| Bank rate / terms | 5.5 % FHA · 30/25/20/15/10 years |
| Escrituración split | 70 / 30 |

Simplest cotizador in the portfolio: roughly a year old, few hands on it, and price increases are
**rule-based** (e.g. +Q10,000 across all 3BR units) — the only project whose pricing history can be
expressed as a rule rather than a list of typed exceptions.

### 2.4 Casa Elisa (CE) — mixed use, effectively closed out

| Field | Value |
|---|---|
| Slug / currency | `casa-elisa` · GTQ |
| Structure | 1 building, ~8–10 residential floors + ground-floor commercial; ~72 apartments + 3 locales (L-1/2/3) |
| Reserva deposit | **Q5,000** |
| Enganche | apartments 5 % in a single payment · unit 208: 10 % in 2 · **locales: 20 %** in 1 |
| Bank rate | 7.26 % FHA (unit 208 and locales: 7.5 %) |
| Terms | 30/25/17/15/10 years |
| Escrituración | apartments 70/30 · **locales 100 % inmueble**, no timbres split |
| Status | near sold-out (74 of ~75 units sold or under promesa by September 2025) |

Pricing is the most archaeologically complex: years of ad-hoc adjustments, promotions, cash-backs,
elevator discounts and second-bathroom adjustments, many typed with no originating formula, so a
final price often cannot be traced to its cause. `TRANSCRIPT`

### 2.5 Santa Elena (SE) — luxury horizontal, USD

| Field | Value |
|---|---|
| Slug / currency | `santa-elena` · **USD** (only USD project) |
| Structure | 1 "tower", 1 floor — **11 detached houses** (Casa 1–11) on individual lots |
| Models | A (491.91 m² built) · B (581.00 m² built); lots 386–400.44 m²; 3BR throughout |
| Price range | **$1,065,000 – $1,639,500 USD** |
| Reserva deposit | **$10,000 USD** |
| Enganche | **30 % minimum** over 15 installments — the strictest floor in the portfolio (below 30 % the monthly cuota moves by ~$10K USD) |
| Financing | 8.50 % crédito directo (plus an 8.00 % preferential rate row) · 25/20/15/10/5 years |
| IUSI | **not** in the cuota — quarterly, `valor_inmueble × 0.9 % / 12` |
| Seguro | **included**, quarterly, 0.35 % of price |
| Escrituración | 70 % inmueble / 3 % timbres |
| Delivery | **1 October 2026** |

Onboarded as the 5th project in March 2026 via a single migration — the template for future project
onboarding. Too small to have been a priority in the original discovery, and it has no rows in the
analytics `sales` table (reservations only), which the ROAS view flags explicitly.

### 2.6 Cross-project comparison

| Metric | BLT | BEN | B5 | CE | SE |
|---|---|---|---|---|---|
| Towers | 2 | 4 + 1 frozen | 1 | 1 | 1 |
| Units | ~200 | ~282 | ~298 | ~75 | 11 |
| Currency | GTQ | GTQ | GTQ | GTQ | USD |
| Reserva | Q3,000 | Q1,500 | Q10,000 | Q5,000 | $10,000 |
| Enganche | 7 % | 5 % | 7 % | 5 % (locales 20 %) | 30 % |
| Max credit term | 30 y | 40 y | 30 y | 30 y | 25 y |
| Seguro in cuota | No | No | No | unit 208 only | Yes |
| Operational complexity | Low | Medium | **Extreme** | High | Low |

Complexity ranking stated by the business, simplest → hardest:
**Bosque Las Tapias → Santa Elena → Benestare → Casa Elisa → Boulevard 5.** `TRANSCRIPT`

---

## 3. Flow of operations — from lead to keys

```
LEAD  →  QUOTE  →  RESERVA  →  DSI/KYC  →  PCV  →  ENGANCHE  →  CRÉDITO  →  ESCRITURA  →  LLAVES
        cotizador   deposit    Pipedrive  legal   installments   bank      deed         handover
```

1. **Lead capture.** Leads arrive from 17 catalogued sources — Meta/Facebook, Instagram inbox,
   TikTok, LinkedIn, website, PBX calls, WhatsApp (Wati), mailing, expos/activaciones, on-site
   signage and billboards, cold prospecting, referrals, Friends & Family, and "cartera antigua."
   Meta paid social is the dominant paid channel (~59,504 net leads since July 2024, `SNAPSHOT`
   2026-08-04). Every lead lives in **Pipedrive**.
2. **Quote (cotización).** The salesperson quotes from the **cotizador** — historically an Excel per
   project, now the app's `/cotizador`. Price chain:
   `precio lista (DB, immutable) → + sobreprecio (negotiation markup, hidden on the printout)
   → precio al cliente → − descuento (the closing hook) → precio efectivo (basis for every
   calculation).` A discount may never push the effective price below list unless management
   pre-authorized a real discount.
3. **Reserva — this is the moment a "sale" exists commercially.** The client deposits the reserva
   amount (Q1,500–Q10,000 / $10,000). **The deposit is the trigger** for inventory lock, commission
   accrual and all downstream processing. The unit moves `AVAILABLE → RESERVED`.
4. **DSI + KYC.** The salesperson uploads the DSI (client data sheet, 2 tabs: personal data +
   apartment/payment data) to Pipedrive, along with DPI, RTU and proof of address. The DSI feeds
   every downstream legal document.
5. **PCV — Promesa de Compraventa.** Drafted from the DSI, signed by the legal representative, then
   by the client. Structure: 70 % of price = the property (with taxes), 30 % = acciones/timbres.
   Status moves `RESERVED → SOLD/PCV`. Three companion letters go with it: **Carta de Pago**
   (payment schedule), **Carta de Buró** (credit-bureau authorization), **Carta de Reserva**.
6. **Enganche (down payment).** 5–30 % of price collected over 1–28 monthly installments depending
   on project and tower. Receipts are issued from **Odoo**. The reserva is deductible from the
   enganche.
7. **Crédito.** Bank mortgage (FHA or "Mi Primera Casa") or crédito directo, 5–40 years. Handled as
   a separate créditos pipeline (1,052 deals across 6 funnels, `SNAPSHOT` 2026-08-05).
8. **Escrituración + entrega.** Deed signing and key handover. Since migration 071 (August 2026)
   these are modelled as an **entrega expediente per unit** with **independent milestones**
   (`ESCRITURA`, `LLAVES`), each `PROGRAMADA → CONFIRMADA → COMPLETADA / CANCELADA`, and both can
   be scheduled into the same appointment. Rescheduling is not a state — the cita returns to
   `PROGRAMADA` with a reschedule counter and the before/after written to the audit log. This
   replaced the Google Sheet "Boulevard 5 — Cronograma de Entregas."
9. **Desistimiento (cancellation).** Client withdraws → unit returns to market as `Liberado`
   (distinct from a never-sold `Disponible`, to preserve the audit trail), the sale is reversed
   everywhere, and the *source* of the desistimiento must be documented (formal letter, commercial
   email). That documentation rule exists because a client once appeared as desisted for
   "non-payment" while insisting he was still active and paying, with no letter to settle it.

### Unit status lifecycle

```
AVAILABLE ──deposit──► RESERVED ──PCV signed──► SOLD
    │                      │                     │
    └──commercial hold──► FROZEN                 └──desistimiento──► LIBERADO ──► back to market
```

App enum: `AVAILABLE · SOFT_HOLD (en revisión) · RESERVED · FROZEN · SOLD`.
Reservation enum: `PENDING_REVIEW · CONFIRMED · REJECTED · DESISTED`.
`FROZEN` is also applied to never-sold inventory as pure commercial strategy — e.g. all of
Benestare's Torre E is held back for market timing.

---

## 4. Flow of information — how data actually travels

### The human bottleneck

**Pati (Patricia — also written Paty/Patti)** is the single-operator "Control Tower." Every sale,
payment, cancellation, legal document and availability change passes through her. Her work splits in
two: (A) commercial administration — registering sales, maintaining the cotizadores, generating
legal documents, processing desistimientos; (B) collections — monthly enganche payments from
350–400 active clients, receipts in Odoo, payment-status tracking. **No one else edits the master
Excel files.** She is a genuine single point of failure: if she is out for a day, nothing is
processed. `TRANSCRIPT`

### The original (pre-system) information flow

A salesperson drops a **deposit voucher image** into a WhatsApp group, usually followed by scattered
text messages naming the apartment, tower, model, client and lead source. Pati then performs ~9
manual steps across two workbooks and 6+ tabs: Reporte de Ventas (monthly tab) → Origen de Ventas →
Gráficas → Buyer Persona → Cotizador (mark "Reservado", write client/salesperson/date) → Análisis de
Inventario. A desistimiento runs the same cascade in reverse.

**The core defect is not data entry — it is identity resolution.** No receipt of any kind identifies
the apartment, tower, project or salesperson:

| Input channel | What arrives | Identification problem |
|---|---|---|
| WhatsApp group | voucher image + free text | fragmented, late, sometimes wrong |
| Email | voucher | same |
| In person | physical check | manual receipt |
| **NeoLink** (payment links) | amount + transaction ID only | **no client name at all** — identifiable only if the salesperson says who paid |
| Bank transfer | sender name, amount, date | sender ≠ buyer (father pays for daughter) → retroactive corrections across every tab |
| Accounting | "pendientes de identificar" deposits | pushed back to Pati to resolve |

Two structural consequences: **double-selling** (the read-only cotizador copy sent to salespeople
weekly creates a 0–7 day availability blind spot) and **name drift** (the transfer name is entered
first and corrected later, which has broken reconciliation with accounting).

### The systems landscape

| System | Role | Honest state |
|---|---|---|
| **Orion** (this app — Next.js 15 + Supabase, RLS-enforced) | System of record for units, reservations, clients, salespeople, commissions, entregas | The only source with referential integrity. Migrations 018–071 in production. |
| **Pipedrive** | CRM: leads, deals, activities, client documents (DSI, DPI, RTU), créditos pipelines | 81,441 deals — effectively a lead list, ~94 % dead; 439,299 activities; 75,149 persons; document history only from 2025-08-29 |
| **Odoo v15** | Receipts and the official financial record; one company per project | Deepest money history (Q300.8M, from 2021-07-30) but CRM/Sales/Stock/HR modules are empty — an accounting system wearing an ERP costume |
| **NeoLink** | Digital payment links | Vouchers carry no identity; the full backend data exists but is not surfaced to Pati |
| **Wati / WhatsApp** | Primary human channel for both leads and vouchers | Unstructured by nature |
| **Meta Ads** | Paid acquisition | 9,329 daily rows since 2024-07-05, 4 GTQ + 2 USD accounts |
| **Excel / SharePoint** | The legacy master: cotizadores, Reporte de Ventas, cierres de mes, competitive analysis, valorización | What the system exists to replace |

An **Odoo v19 migration** is in flight; the 2026-08-11 assessment puts it at "64 % readiness" and is
blunt that this means *sources located*, not *ETL built* — zero mapping code, unreconciled ledgers
(Q57.1M in-app vs Q300.8M in v15), and no ratified counting rules.

### What the Orion system now does

- Replaces the cotizador Excel with a real-time, RLS-enforced database (`rv_units`, `reservations`,
  `unit_status_log`) — availability is live for everyone, killing the weekly-export blind spot.
- Salespeople submit reservations from mobile (`/reservar`) without going through Pati; the unit
  locks on submission, so the same unit cannot be sold twice.
- **Claude Vision OCR** reads bank receipts and DPI images into structured fields with a confidence
  score (HIGH/MEDIUM/LOW), so a fragmented voucher becomes a reviewable record instead of a message.
- Pati reviews and confirms from `/admin/reservas`; every state change is logged.
- Generates PCV and Carta de Pago programmatically with each reservation's real financial terms,
  including custom enganche schedules.
- Surfaces the operational and analytical surface: `/cotizador`, `/disponibilidad`, `/ventas`,
  `/entregas`, `/creditos`, `/cumplimiento`, `/desistimientos`, `/cesion`, `/valorizacion`,
  `/buyer-persona`, `/mercadeo`, `/referidos`, `/promociones`, `/descuentos`, `/hud`.
- Access control: 9 roles (`master`, `torredecontrol`, `gerencia`, `financiero`, `contabilidad`,
  `marketing`, `inventario`, `ventas`, `entregas_viewer`) × 53 actions, plus an append-only audit
  log (3,076 events since March 2026).

---

## 5. Who does what

| Role | Person(s) | Function |
|---|---|---|
| Control Tower / Admin-Ops | **Pati (Patricia)** | Sales registration, cotizador master, legal documents, collections, receipts. The single operator. |
| Commercial Director / Gerencia Comercial | **Antonio Rada** (since 2026-03-16; before him Alek Hernández 2025-07→2026-03, Ronaldo Ogaldez →2025-07) | Commercial strategy, pricing, competitive intelligence, valorización |
| Supervisor Comercial | **Job Jiménez** (since 2026-03-16; Antonio Rada before) | Collections supervision |
| Ejecutivos de venta | 44 in roster (assignments are temporal, per project) | Sell, quote, submit reservations, chase documents |
| Compliance | compliance officer | Expedientes, KYC — structured data exists for B5 only (265 expedientes, 327 buyers) |
| Development | **Jorge** | Builds and operates Orion |

Historical project assignments (`SNAPSHOT`, Dec-2025 restructure workbook): Benestare — Efrén
Sánchez, Eder Veliz, Pablo Marroquín, Ronny Ramírez · Boulevard 5 — Anahí Cisneros, Erwin Cardona ·
Bosque Las Tapias — Paula Hernández, José Gutiérrez, Gloria Canté. The live roster has since grown
and changed.

---

## 6. The two definitions of "a sale" — the single most important ambiguity

| Who | A sale is… | Consequence |
|---|---|---|
| Commercial team | the **reserva deposit** | drives commissions, inventory lock, monthly targets |
| Legal / accounting | the **signed PCV** (or the invoice) | drives the financial statements |

Every reporting discrepancy in this business traces back to this. In the source systems it gets
worse: Pipedrive shows 140 deals in Reserva stages, its own product inventory says 475 PCV/Reservado,
it logs 581 `reserva`-type activities, and Orion holds 723 reservations. Four numbers, one reality —
**Orion's reservation ledger is the referee.** In Odoo, an invoice is an *installment*, not a sale:
treating invoices as sales overcounts by roughly 19×.

---

## 7. Commission structure (the compensation engine)

**Invariant: total commission = 5.00 % of sale price, always.** Split 2.50 % sales force /
2.50 % Puerta Abierta. (One documented exception scenario at 6.00 % has never occurred.)

Current policy (July 2025 onward), sales-force side:

| Role | Rate | Paid when |
|---|---|---|
| Dirección General | 0.60 % | — |
| Gerencia Comercial | 0.30 % | 30 % at reserva |
| Supervisor Comercial | 0.15 % (0.25 % before 2026-03-16) | 30 % during monthly collections |
| Ejecutivo de venta | 1.00 % or 1.25 % | 40 % at delivery + bank disbursement |
| **Ahorro** (savings pool) | the residual | accumulated |

**Ahorro is the pressure valve:** it absorbs whatever is left after every named recipient, which is
what mathematically guarantees the 5 % cap is never breached.

**Escalation:** the ejecutivo earns 1.00 % below a monthly unit threshold and 1.25 % at or above it.
Thresholds: Casa Elisa 3 · Boulevard 5, Benestare, Bosque Las Tapias 5 · Santa Elena 2.
Friends & Family and referral sales **never** count toward the threshold.

**Referrals:** standard referrer 0.35 %; inter-project referrer 0.40 %; external referrer or broker
1.00 %. Referrers are paid **only upon escrituración**, never earlier.

**Special cases:** the Plaza Comercial B5 sale sends 4.80 % of the 5 % to the company and nothing to
the sales force; the 14 named B5 partners pay a Q6,000 reserva and may skip the enganche without
reducing executive commissions; ISR (Guatemalan income tax) is withheld via a ×107/112 factor,
exempting the company and ahorro buckets.

Structural change worth knowing: before July 2025, Gerencia earned 0.50 %, there was no Supervisor
role, and there were "incentivos personales/equipo" (0.10 % / 0.05 %) that were folded into Ahorro.
Because rates depend on the **sale date**, not the payment date, the engine carries a temporal map
of who held which management role when.

---

## 8. Data realities worth stating plainly

- **The money ledgers do not agree.** The app records Q57.1M in payments; Odoo v15 records Q300.8M
  since 2021. Neither has been reconciled line by line, and Odoo's figure mixes in companies that
  are not Puerta Abierta. No conclusion about total collections should be drawn from either alone.
- **Unit status history begins March 2026.** Anything earlier exists nowhere — it was Excel cells
  overwritten in place.
- **Price history is 30 rows.** It is a handful of manual entries, not a series.
- **Client identity has no shared key** across 75,149 Pipedrive persons, 21,963 Odoo partners and
  726 app clients. DPI numbers exist as *images*, and as data only in one compliance spreadsheet
  (B5 only). Deduplication is fuzzy name + phone, and it is the largest unbuilt workstream in the
  migration.
- **Escrituración data is structured for Boulevard 5 only** (291 filled forms with finca/folio/libro,
  25 of them carrying contradictory cotización values that need a human ruling).
- **Documents skew recent.** Pipedrive's file, note and mail history starts 2025-08-29; 63,938 files
  were purged upstream and are gone permanently. A prior CRM instance ("Pipe 1.0") left fingerprints
  on 26,799 deals; nobody has established whether it still exists.
- **Torre Cobán** appears in CRM scaffolding but is not a defined project; a Zona 11 project was
  also announced for mid-2026. Neither has an inventory in the system.
- **Portfolio health** (April 2026, `SNAPSHOT`): 649 reservations, ~11.4 % desistimiento rate,
  collections far ahead of the budgeted minimum, ~84 % of units ahead of their payment schedule and
  ~1.6 % delinquent. As of 2026-08-07 the compliance view tracked 691 accounts with 382 flagged
  delinquent — the two figures use different denominators and periods and should not be compared
  directly.

---

## 9. Competitive and valuation context

The Commercial Director maintains zone-by-zone competitor files — Zona 5, Zona 10, Zona 11, Cobán,
Antigua Guatemala, Carretera a El Salvador, plus a direct-competition study for Bosque Las Tapias —
tracking per competitor: project name, delivery date, bedrooms, bathrooms, parking, area, prices with
and without tax, reserva amount, enganche %, installment count, bank cuota and IUSI. He also keeps a
**valorización** tracker showing how each project's total value has moved from launch to today, used
as the appreciation argument in the sales pitch.

---

## 10. Glossary (Guatemalan real-estate / PA-specific)

| Term | Meaning |
|---|---|
| **Cotizador** | Pricing + availability sheet per project. Historically Excel; the single source of truth for what is available. |
| **Reserva** | Deposit that locks a unit. Deductible from the enganche. |
| **Enganche** | Down payment, paid in installments before the mortgage starts. |
| **PCV / Promesa de Compraventa** | Binding pre-sale contract. 70 % property / 30 % acciones-timbres. |
| **Escrituración** | Deed signing / title transfer. |
| **Entrega** | Handover of the unit (keys). |
| **Desistimiento** | Buyer withdrawal; the sale is reversed and the unit returns to market. |
| **Liberado** | A unit that returned to market after a desistimiento (distinct from never-sold). |
| **Congelado** | Frozen: VIP/F&F hold, commercial strategy, or a pending board decision. |
| **Cesión de derechos** | Transfer of purchase rights from one buyer to another before escrituración. |
| **DSI** | Client data sheet filled by the salesperson (personal data + unit/payment data). |
| **DPI** | Guatemalan national ID. Contains **only** CUI (13 digits), name, birth date and place, sex, nationality, photo — *not* profession, marital status, address or education. |
| **RTU** | Tax registry ID. |
| **IUSI** | Municipal property tax. |
| **FHA** | Guatemalan mortgage-insurance scheme enabling preferential bank rates. |
| **Sobreprecio** | Negotiation markup above list price, hidden from the printed quote. |
| **Ahorro** | Residual commission bucket that absorbs unearned escalation and enforces the 5 % cap. |
| **F&F** | Friends & Family sale — excluded from commission escalation thresholds. |
| **Cartera** | A salesperson's client portfolio; transfers between advisors have their own commission policy. |
| **Torre de Control** | Pati's role, and the app's top operational permission role. |

---

## 11. The mission in one line

Everything above exists to absorb messy, fragmented, identity-less inputs that salespeople will not
stop producing, and impose structure on them after the fact — so that the commercial department
stops depending on one person and six Excel tabs per transaction.

---

*File: `docs/contexto-puerta-abierta.md` · compiled 2026-08-24 from this repository.*
*Companion document: `docs/puerta-abierta-what-they-sell.md` (2026-04-27) — deeper per-unit pricing,
cotizador configs and per-project inventory tables.*
