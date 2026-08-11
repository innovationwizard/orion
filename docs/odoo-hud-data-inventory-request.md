# Data inventory request — building the "Odoo HUD"

**To:** (1) the agent that extracted data from **Pipedrive**, and (2) the agent that extracted data from **Odoo v15**.
**From:** the Orion project (Puerta Abierta Inmobiliaria), where we already built a gap-analysis HUD over the commercial areas.
**This document is self-contained** — you need no additional context to answer.

Note on language: respond in English. Domain terms stay in Spanish (VENTAS, expediente, vale, etapa names, etc.) because those are the real labels in the source data — do not translate them.

---

## 1. The greater project: ODOO V19 MIGRATION

The mission: **successfully migrate the data from wherever it currently exists, in the form it currently exists, to our new Odoo v19 database, in the best possible form — so that information flows smoothly, end-to-end, without conflicts, ambiguities, or losses.**

Two operating rules:

1. **NO DATA LEFT BEHIND.** We prefer to store useless data for an undetermined period of time rather than have something break because we dropped data we shouldn't have dropped. If you extracted it, it gets reported and it gets migrated — even if nobody knows what it's for today.
2. **The v19 instance is new and not yet in production**: we get the unlimited benefit of trial and error (the instance can be deleted and rebuilt without consequences). That said, getting it right the first time is always the idea.

## 2. What the HUD is, and why its nature is "gap-analysis"

In Orion we built a **HUD** (heads-up display) that measures, area by area of the commercial operation, **how complete the available information is against each area's list of requirements**. Its central rule:

- Every information requirement has one of three states:
  - **COMPLETE** — the data exists, is linked, and is displayed in a view.
  - **VIEW NOT YET BUILT** — the data exists but nothing displays it yet.
  - **DATA NOT YET LINKED** — the necessary data does not exist in the system (red flag).
- Each area's completion % = complete requirements ÷ total requirements. **Never inflated**: if the data isn't there, the area reads 0% and the flag says exactly what's missing and why.
- Every status carries its **provenance**: where the data comes from, as of what cutoff date, and what quality problems it has. Dirty findings (mis-mapped columns, impossible dates, duplicated custom fields) **are reported as findings — never hidden or silently "fixed."**

We are going to build an **"Odoo HUD" with exactly the same structure** (same areas, same navigation, same requirements), where each item measures: *does the data extracted from Pipedrive / Odoo v15 cover this requirement well enough to migrate it to v19?*

**Your answers are the direct input to that Odoo HUD.** Answer with the same mindset: honestly assess how complete the information you managed to gather is, item by item — and "**it doesn't exist**" or "**it exists but it's dirty in this specific way**" are answers just as valuable as "here it is, complete."

## 3. The HUD structure — areas, navigation, and the questions each item answers

Below: the **5 areas** (the tabs), the **first-click navigation** (each area's side panel), and the **second-click items** (the requirements), each with the specific questions it intends to answer. For EACH item, tell us what you have.

### AREA 1: VENTAS

| Nav (1st click) | Item (2nd click) | Questions it answers |
|---|---|---|
| Resumen | Ventas totales | How many sales (reservas) exist, by project, by month, at what values? Is the historical series complete? |
| Objetivos | Ventas vs objetivos — totals and per asesor | Do sales targets exist per project/asesor/period? Are sales attributable to each asesor? |
| Objetivos | Déficit/excedente vs closing date, per project and asesor | Monthly sales vs target, with delivery/closing dates per project or tower? |
| Canales y Conversión | Ventas por canales | Does every sale carry a source/channel (lead source)? Is there a channel catalog? |
| Canales y Conversión | Conversion funnel: Leads → Reserva → PCV firmada | Lead counts, reservas, and signed promesas — linkable to each other, with dates? |
| Inventario | Inventario general: vendido, congelado, disponible | Unit inventory with current status and status-change history? |
| Inventario | Split de ventas por modelo | Does every unit have a modelo/typology? Are sales crossable by modelo? |
| Desistimientos y Valor | Desistimientos — reembolsos, retención, valorización | Cancellations with date and reason? Prior payments, refunds, and retained amounts per case? |
| Desistimientos y Valor | Valor de proyecto — traceability through desistimientos | Price history per unit? What happened to each desisted unit (resale, new price)? |
| Descuentos y Promociones | Control de descuentos | Price reductions per sale: amount, authorization, date? (Today these exist only in scanned PDFs — does either of your systems have anything?) |
| Descuentos y Promociones | Control de promociones | Promotions/vales per deal: amount, type, validity? (We already have B5 vales from Pipedrive; the remaining projects are missing.) |

### AREA 2: MERCADEO

| Nav (1st click) | Item (2nd click) | Questions it answers |
|---|---|---|
| Resumen | Reporte maestro | Consolidated ad-performance data (reach, impressions, clicks, leads, spend) by account/campaign/day? |
| Leads y Metas | Meta mensual de lead | Lead targets/ranges per project? Actual lead counts per month and project? |
| Leads y Metas | Meta diaria de lead | Same at daily granularity? |
| Presupuesto de Pauta | Daily ad-budget usage | Daily spend per account/campaign, with its REAL currency? (Prior finding: a column labeled "USD" that actually mixed GTQ and USD by account.) |
| Presupuesto de Pauta | Monthly ad-budget usage | Budgets assigned vs spent per month/project/concept/provider? |
| Presupuesto de Pauta | Cumulative monthly investment evolution | Historical investment series sufficient for cumulative curves? |
| Costos y Retorno | ROAS / ROI | Spend linkable against sales value per project and period? |
| Costos y Retorno | Costo por cierre / sales medium | Closings (sales) with their medium/source, crossable against spend per channel? |
| Costos y Retorno | Monthly CPL evolution | Cost per lead by month/account/campaign? |
| Campañas | Efectividad de campañas | Per-campaign data: leads, spend, clicks, and if possible attributed sales (campaign/ad IDs on persons or deals)? |
| Canales Digitales | Operatividad de canales digitales | Which digital channels exist and which ones have data flowing (Meta, Google, TikTok, WhatsApp/Wati, web forms)? |

### AREA 3: COBROS

| Nav (1st click) | Item (2nd click) | Questions it answers |
|---|---|---|
| Cobros | Cobros por proyecto | Payments received, with date, amount, type, and project? Complete series? |
| Cobros | Cobros acumulados: amount and percentage | Expected-to-date vs collected cumulative, per unit/client? |
| Cobros | Cobros del mes: amount and percentage | Same, monthly? |
| Déficit / Superávit | Déficit · Superávit · Report | Contractual payment plan per sale (installments, dates, amounts) to compute variance vs paid? |
| Alertas | Reporte de alertas | Days delinquent, compliance status, aging per account? |
| Decisiones de Desistimiento | Decision analytics | Delinquent accounts with paid vs owed (desistimiento candidates)? |
| Casos Especiales — F&F | Casos especiales | Sales flagged as special case / friends & family, distinguishable from the rest? |

### AREA 4: CRÉDITOS

The canonical expediente pipeline has **19 etapas** (listed below). Prior finding from Pipedrive: the real embudos have ~11 etapas; etapas 1–3, 5, 13–16, and 19 **do not exist** in Pipedrive, and Escritura/Desembolso/Liquidación exist but hold **zero deals** (operational recording stops at Resguardo/Resolución). **Key question for both agents: do any of the missing etapas live in your system?** (Odoo v15 could plausibly hold facturación, escrituración, desembolsos, impuestos, registro…)

| Nav (1st click) | Items (2nd click) — expediente etapas | Questions it answers |
|---|---|---|
| Expediente Inicial | 1 Control de expediente inicial (paperwork checklist) · 2 Control de scanners · 3 Control de PCVs (physical/digital/scanner) · 4 Armado de expediente (request, collection, filling, signing) | Do records of these document controls exist in any system? Checklists, scans, per-document status? |
| Análisis y Aprobación | 5 Autorización ventas al contado · 6 Envío a análisis (FHA/Banco) · 7 Suspendidos · 8 Re-análisis · 9 Aprobación | Deals per etapa with entry dates? Reliable financing type (FHA/Banco/Contado)? Stage-change history (not just current state)? |
| Trámite Técnico y Resolución | 10 Expediente técnico / Avalúo · 11 Aprobación final (resguardo, resolución bancaria) | Dates and states of appraisals and resolutions? |
| Escrituración y Entrega | 12 Escrituración (facturación) · 13 Entrega · 14 Recaudación de firmas | Deeds, invoices, delivery acts, signatures — with dates? **Strong suspicion: this lives in Odoo v15, not Pipedrive.** |
| Cierre y Archivo | 15 Pago de impuestos · 16 Ingreso al registro · 17 Desembolso · 18 Liquidación (entrega de testimonio) · 19 Archivado | Taxes paid, registry entries, bank disbursements, settlements, testimonios, archived expedientes? |

### AREA 5: CUMPLIMIENTO

| Nav (1st click) | Item (2nd click) | Questions it answers |
|---|---|---|
| Manuales | Manuales de cumplimiento — general status | Is there any record of compliance manuals/policies status (validity, versions)? |
| Clientes | Breakdown Normal / PEP / CPE | Any client risk classification? (Prior finding: **zero** PEP/CPE fields in Pipedrive and zero in the compliance officer's xlsx — if your system has ANYTHING here, it's gold.) |
| Clientes | Casos específicos | Enhanced due-diligence cases or similar? (The exact definition is still pending with the compliance team — report anything that smells like this.) |
| Expedientes | Status por proyecto | KYC documents per client: DPI + expiry, RTU + update date, income source, bank of origin of funds? |
| Expedientes | Archivado (aprobado / desistido) | Closed expedientes with their outcome? |

## 4. What we need from each of you

For **each item** in the tables above, report:

1. **Coverage**: `FULL` / `PARTIAL` / `NONE` — can your extraction answer the item's questions?
2. **Exact source**: system, module/entity/table, relevant fields (real names).
3. **Volume and range**: record counts and date range covered.
4. **Cutoff**: extraction date/boundary, and whether the source is still live (data after the cutoff not captured).
5. **Quality**: empty fields (with %), duplicates, encoding issues, impossible values, duplicated custom fields, inconsistent labels — every dirty finding, unpolished.
6. **Join keys**: IDs or natural keys available to link with other systems (e.g., apartment # + project, DPI, deal_id, Odoo ids) — critical for deduplicating and joining during the v19 migration.

### Additionally — mandatory under the NO DATA LEFT BEHIND rule:

7. **Residual inventory**: EVERYTHING you extracted that does **not** fit any HUD item. Listed by entity/table with counts and a brief description. The HUD not having a place for that data today does not mean it won't be migrated — it means the Odoo HUD needs to know it exists.

## 5. Suggested response format

```
## [AREA] › [Nav] › [Item]
Coverage: FULL | PARTIAL | NONE
Source: <system> › <entity/table> › <fields>
Volume: <n records> | Range: <from> → <to> | Cutoff: <date>
Quality: <findings, with numbers>
Join keys: <ids/keys available>
Notes: <what a migrator must know>
```

And at the end:

```
## RESIDUAL INVENTORY (fits no HUD item, migrates anyway)
- <entity>: <n records> — <what it is>
- ...
```

**Final reminder**: the goal is not to look good with high percentages — it is for the Odoo HUD to be born telling the truth, so the v19 migration flows end-to-end without conflicts, ambiguities, or losses. "It doesn't exist," said early, is worth more than a hole discovered in production.
