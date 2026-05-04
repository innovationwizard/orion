# Puerta Abierta Inmobiliaria — What They Sell & How They Operate

> Generated: 2026-04-27. Source: codebase migrations, SSOT discovery transcripts, SDD, seed scripts, business rules.

---

## I. Company Overview

**Puerta Abierta Inmobiliaria** is a Guatemalan residential real estate developer and broker. They develop, market, and sell multi-unit residential projects (apartments and single-family houses) in Guatemala City and surrounding areas.

**Scale (as of April 2026):**
- 5 active projects
- 901 units across 10 towers and 86 floors
- 649 total reservations (575 CONFIRMED, 74 DESISTED)
- 33 salespeople
- 2 currencies: GTQ and USD
- 1 control-tower operator (Patty) managing all commercial operations manually

---

## II. The Five Projects

### 1. Bosque Las Tapias (BLT)

| Field | Value |
|-------|-------|
| Slug | `bosque-las-tapias` |
| Currency | GTQ |
| Towers | 2 (Torre B, Torre C) |
| Tower B floors | 2–10 (28-month enganche installment plan) |
| Tower C floors | 1–7 (24-month enganche installment plan) |
| Unit types | A (2BR), B (3BR), C (3BR) |
| Parking | Car + tandem slots per tower |
| Bodegas | None documented |
| Reserva (deposit) | Q3,000 |
| Enganche | 7% |
| Bank rate | 5.5% (FHA) |
| Credit terms | 30 / 25 / 20 / 15 / 10 years |
| IUSI | Included in cuota (monthly) |
| Seguro | NOT included in cuota |
| Escrituración | 70% inmueble / 30% timbres (pre-tax extraction) |
| Income qualifier | 2.00× cuota banco |

**Product type:** Urban mid-rise apartment complex, multi-tower. Target buyer: families needing 2–3BR apartments. Simplest project structure; price increases are rule-based (+Q10,000 for 3-BR).

---

### 2. Benestare (BEN) / Residenciales Benestare

| Field | Value |
|-------|-------|
| Slug | `benestare` |
| Location | Chinautla (metropolitan suburb) |
| Currency | GTQ |
| Towers | 4 active (A, B, C, D) + Torre E (100% frozen — strategic hold) |
| Unit types | A (1BR, ~34 m²), B (3BR, ~47 m²), C (3BR, ~47 m²) |
| Total inventory | ~282 apartments |
| Parking | Assigned spot number + basement level (N1–N4) |
| Bodegas | None |
| Reserva | Q1,500 |
| Enganche | 5% |
| Bank rates | 5.0% ("Mi primera Casa" A), 5.5% (FHA B/C), 7.26% (sin carencia FHA), 8.5% (crédito directo) |
| Credit terms | 40 / 30 / 25 / 20 years |
| IUSI | Included in cuota (monthly) |
| Seguro | NOT included in cuota |
| Escrituración | 70% inmueble / 30% timbres (pre-tax extraction) |
| Income qualifier | 2.00× cuota banco |
| Torre E status | 100% congelado (strategic, future market release) |

**Product type:** Affordable multi-tower apartment complex with 1BR and 3BR options (no 2BR). Lowest reserva deposit of all projects (Q1,500). Suburban location. Highest historical desistimiento rate (56 cancellations) due to high sales velocity. Tower transfers (traslados) occur: clients move between towers, original sale cancelled and recreated.

**Special complexity:** 6 rounds of price increments, 1BR discount (Q8,700), tower D/E promotional discounts. Status mix: ~105 PCV, 68 reserved, 58 available, 48 congelado (Torre E), 3 liberado.

---

### 3. Boulevard 5 (B5)

| Field | Value |
|-------|-------|
| Slug | `boulevard-5` |
| Currency | GTQ |
| Towers | 1 (Principal) |
| Floors | ~19 |
| Unit types | 67 distinct types: A (31–34 m², 1BR), B (47–52 m², 2BR), C (56–58 m², 2BR), D (66–70 m², 2BR), E (69–74 m², 3BR) |
| Total inventory | ~298 apartments |
| Parking | Multi-level basement (S-5 to S-1), spot number assigned |
| Bodega | Fixed 5.3 m² area per bodega unit |
| Reserva | Q10,000 |
| Enganche (standard) | 7%, 8 cuotas |
| Enganche (Apto Terraza) | 7%, 7 cuotas |
| Bank rate | 7.26% (FHA) |
| Credit terms | 30 / 25 / 20 / 15 / 10 years |
| Mantenimiento | Q16.00/m² (included in quote) |
| IUSI | Included in cuota (monthly) |
| Seguro | NOT included in cuota |
| Escrituración | 70% inmueble / 30% timbres (pre-tax extraction) |
| Income qualifier | 2.00× cuota banco |

**Product type:** High-rise urban apartment tower, nearly sold out (273 PCV + 10 reserved out of 298). Premium unit type: "Apto Terraza" (terrace apartments) with a distinct cotizador config. Storage units available.

**Special complexity:** Most complex of all projects. 9+ manual price adjustment columns per unit in the Excel source. Per-unit-type price increments (A=5.5%, B=5%, C=5%, D=2.5%, E=2.5%) all typed manually. Antonio explicitly called this "mi dolor de cabeza." Also has:
- **Cesión de derechos (rights transfers):** 200+ records where clients transfer their purchase rights to a third party, including plusvalía (appreciation gap) analysis.
- **IkiSmart add-on:** Smart-home technology integration.
- **Commercial space:** Plaza Comercial Boulevard 5 — at least one commercial space sale (client: Cofiño), different commission structure.

---

### 4. Casa Elisa (CE)

| Field | Value |
|-------|-------|
| Slug | `casa-elisa` |
| Currency | GTQ |
| Towers | 1 (Principal) |
| Floors | ~8–10 residential + ground floor commercial |
| Unit types | 10 apartment types (A1–C2) + LOCAL (commercial) |
| Ground floor | 3 commercial locales (L-1, L-2, L-3) |
| Total inventory | ~72 apartments + 3 locales = ~75 units |
| Parking | Sótano (basement) levels with specific spot numbers |
| Bodega | Variable per unit (1.78–4.9 m²); some units have none |
| Reserva | Q5,000 |
| Enganche (standard apartments) | 5%, 1 cuota (single payment) |
| Enganche (unit 208) | 10%, 2 cuotas |
| Enganche (locales) | 20%, 1 cuota |
| Bank rate (standard) | 7.26% (FHA) |
| Bank rate (unit 208 / locales) | 7.5% |
| Credit terms | 30 / 25 / 17 / 15 / 10 years |
| IUSI | Included in cuota (monthly) |
| Seguro | NOT included (except unit 208 variant — included) |
| Escrituración (apartments) | 70% inmueble / 30% timbres |
| Escrituración (locales) | 100% inmueble (no split) |
| Income qualifier | 2.00× cuota mensual (standard); 2.50× (unit 208) |

**Product type:** Mixed-use urban building — residential apartments (1BR, 2BR, 3BR) + commercial ground-floor locales. The most price-complex project: years of ad-hoc manual adjustments, promotions, cash-backs, elevator discounts. Status: near sold-out (74 of 75 units already sold/promesa by Sept 2025).

**Special complexity:** Each bodega has its own area. Unit 208 has its own dedicated cotizador config (higher enganche, higher bank rate, higher income qualifier, seguro included). Locales are priced differently (full property, no timbres split).

---

### 5. Santa Elena (SE)

| Field | Value |
|-------|-------|
| Slug | `santa-elena` |
| Currency | **USD** (only USD project) |
| Tower | 1 (Principal) |
| Floor | 1 (Planta Baja — single-floor horizontal) |
| Total inventory | 11 houses (Casa 1–11) |
| Models | A (491.91 m² construction) and B (581 m² construction) |
| Lot areas | 386–400.44 m² (individual lots) |
| Bedrooms | 3 (all units) |
| Price range | $1,065,000–$1,639,500 USD |
| Reserva | $10,000 USD |
| Enganche | 30% minimum (15 cuotas) |
| Bank rate | 8.50% (crédito directo) |
| Credit terms | 25 / 20 / 15 / 10 / 5 years |
| IUSI | NOT included in cuota; quarterly (valor_inmueble × 0.9% / 12) |
| Seguro | INCLUDED in cuota; quarterly; rate = 0.35% of price |
| Escrituración | 70% inmueble / 3% timbres (pre-tax extraction) |
| Income qualifier | 2.00× cuota mensual |
| Delivery date | Oct 1, 2026 |
| Primary salesperson | Luccia Calvo |

**Per-unit pricing (production data from migration 049):**

| Casa | Model | Lot m² | House m² | Price USD | Status |
|------|-------|--------|----------|-----------|--------|
| 1 | A | 400.44 | 491.91 | $1,065,000 | RESERVED |
| 2 | A | 400.25 | 491.91 | $1,090,000 | RESERVED |
| 3 | B | 386.00 | 581.00 | $1,639,500 | AVAILABLE |
| 4 | B | 398.38 | 581.00 | $1,639,500 | AVAILABLE |
| 5 | A | 399.20 | 491.91 | $1,300,000 | AVAILABLE |
| 6 | B | 386.00 | 581.00 | $1,639,500 | FROZEN |
| 7 | B | 386.00 | 581.00 | $1,639,500 | RESERVED |
| 8 | B | 386.00 | 581.00 | $1,639,500 | AVAILABLE |
| 9 | B | 386.00 | 581.00 | $1,639,500 | AVAILABLE |
| 10 | A | 400.36 | 491.91 | $1,300,000 | AVAILABLE |
| 11 | A | 400.00 | 491.91 | $1,095,000 | RESERVED |

**Product type:** Luxury horizontal housing. Highest price point of all projects ($1M–$1.6M USD). Individual lots with construction. Only project billed in USD. Simplest structural configuration (1 tower, 1 floor, 11 units). 30% minimum enganche is strictest across all projects — below this threshold, the monthly cuota changes by ~$10K USD.

---

## III. Inventory Summary (Cross-Project)

| Metric | BLT | BEN | B5 | CE | SE | **Total** |
|--------|-----|-----|----|----|----|---------:|
| Towers | 2 | 4+1 frozen | 1 | 1 | 1 | 10 |
| Total units | ~200 | ~282 | ~298 | ~75 | 11 | **~901** |
| Currency | GTQ | GTQ | GTQ | GTQ | USD | Mixed |
| Min enganche | 7% | 5% | 7% | 5% | 30% | — |
| Reserva deposit | Q3,000 | Q1,500 | Q10,000 | Q5,000 | $10,000 | — |
| Max credit years | 30 | 40 | 30 | 30 | 25 | — |
| Seguro in cuota | No | No | No | Unit 208 only | Yes | Mixed |
| Complexity | Low | Medium | Extreme | High | Low | — |

---

## IV. What a "Sale" Means

**For the commercial team:** A sale = the moment a reservation deposit is made. This is the trigger event for commission calculation, inventory lock, and all downstream processing.

**For legal/accounting:** A sale = signed Promesa de Compraventa (PCV). This requires client DSI data, unit price agreement, legal review, and physical or digital signatures.

**This distinction drives all reporting ambiguity.** Pati must reconcile the salesperson's definition with the legal one across every Excel tab.

---

## V. Unit Status Lifecycle

```
AVAILABLE
    │
    ▼  (reservation deposit received)
RESERVED
    │
    ├──► FROZEN  (VIP hold / commercial strategy / board decision)
    │
    ▼  (PCV signed)
SOLD / PCV
    │
    ▼  (desistimiento)
DESISTED → LIBERADO (returned to market with audit trail, distinct from fresh AVAILABLE)
```

**Congelado (Frozen)** is also applied directly to AVAILABLE units as a commercial strategy (e.g., all 48 Torre E Benestare units held until market timing is right).

---

## VI. How Pricing Works — The Cotizador

### Three-Level Price System

```
Precio Lista  →  (+) Sobreprecio  →  Precio al Cliente  →  (-) Descuento  →  Precio Efectivo
  (DB, fixed)      (optional markup)   (what client sees)    (optional)        (calculation base)
```

- **Precio Lista:** The official listed unit price. Immutable in the UI.
- **Sobreprecio (Markup):** Optional. Allows quoting above list price, giving room to offer a "discount" as a closing hook. Hidden on printed quotes.
- **Descuento (Discount):** Either absorbs the markup (effective price never goes below list), or is a real discount below list (requires management approval).
- **Precio Efectivo:** Base for all financial calculations (enganche, cuotas, financing, escrituración).

### Cotizador Configurations in Production

| Config | Project | Scope | Key Difference |
|--------|---------|-------|----------------|
| Torre B | BLT | Torre B only | 28-month enganche installments |
| Torre C | BLT | Torre C only | 24-month enganche installments |
| Torre A | BEN | Torre A | Standard |
| Torre B | BEN | Torre B | Standard |
| Torre C | BEN | Torre C | Standard |
| Torre D | BEN | Torre D | Standard |
| Automático | B5 | Standard units | 8-cuota enganche, Q16/m² mant. |
| Apto Terraza | B5 | Terrace units | 7-cuota enganche, different rounding |
| Automático | CE | Standard apts | 5% enganche, 1 cuota, 7.26% |
| 208 | CE | Unit 208 only | 10% enganche, 2 cuotas, 7.5%, seguro |
| Locales | CE | Commercial L-1/2/3 | 20% enganche, 100% inmueble |
| Default | SE | All casas | 30% enganche, 15 cuotas, USD, seguro |

**13 active cotizador configs across 5 projects.**

### Payment Structure Per Sale

Every sale generates a 3-phase payment timeline:

1. **Phase 1 — Reserva:** Deposit (Q1,500–Q10,000 / $10,000 USD). Locks the unit.
2. **Phase 2 — Enganche:** Down payment installments. Ranges from 5–30% of sale price, paid over 1–28 months depending on project/tower config.
3. **Phase 3 — Crédito:** Bank financing or direct credit (crédito directo). Monthly payments over 5–40 years depending on project and buyer qualification.

Additional costs:
- **IUSI:** Guatemala municipal property tax. Monthly or quarterly depending on project. Some projects include in cuota, some bill separately.
- **Seguro:** Property insurance. SE includes quarterly; others bill separately.
- **Escrituración:** Transfer tax + stamp duties. Split 70/30 (inmueble/timbres) for residential; 100% inmueble for CE locales.
- **Mantenimiento:** Maintenance fee. B5: Q16/m². Others: pending or not applied.

---

## VII. Commission Structure

### Global Rule

**5.00% of sale price** on every confirmed sale. Always. No exceptions.

Split: **2.50% → Sales Force** | **2.50% → Puerta Abierta**

### Sales Force Split (Current Policy — July 2025 onwards)

| Role | Rate | Payment Trigger |
|------|------|----------------|
| Dirección General | 0.60% | — |
| Gerencia Comercial | 0.30% | 30% upon reservation |
| Supervisor Comercial | 0.15% (updated 2026-03-16) | 30% upon monthly collections |
| Ejecutivos de Venta | 1.00% or 1.25% | 40% upon delivery + bank disbursement |
| Ahorro (savings pool) | Residual (0.15%–0.70%) | Accumulated |
| **Total** | **2.50%** | |

**Ahorro is dynamic:** It absorbs whatever is left after all named recipients. Guarantees the 5% cap is never exceeded.

### Ejecutivo Escalation (Threshold Incentive)

| Project | Unit Threshold | Below Threshold | At/Above Threshold |
|---------|---------------|----------------|-------------------|
| Casa Elisa | 3 units | 1.00% | 1.25% |
| Boulevard 5 | 5 units | 1.00% | 1.25% |
| Benestare | 5 units | 1.00% | 1.25% |
| Santa Elena | 2 units | 1.00% | 1.25% |
| Bosque Las Tapias | 5 units | 1.00% | 1.25% |

F&F (Friends & Family) sales do **not** count toward unit thresholds.

### Referral Commission Rules

| Scenario | Referrer Rate | Notes |
|----------|--------------|-------|
| Standard referral | 0.35% | Paid upon deed signing only |
| Inter-project referral | Variable | Ahorro = 0.45% |
| External referrer / broker | 1.00% | Upon escrituración only |
| F&F lead | 1.00% | Excluded from threshold count |

### Management Role Timeline (Commission Gerencia Assignments)

Commission rates for Gerencia Comercial + Supervisor depend on the sale date, not the payment date:

| Period | GC | Supervisor |
|--------|-----|----------|
| Start → 2025-07-04 | Ronaldo Ogaldez 0.50% | — |
| 2025-07-07 → 2026-03-15 | Alek Hernández 0.30% | Antonio Rada 0.25% |
| 2026-03-16 → present | Antonio Rada 0.30% | Job Jiménez 0.15% |

### ISR (Tax) Retention

Commission recipients are subject to ISR (Guatemalan income tax) retention where applicable:
- Formula: `×107/112` to separate tax from gross commission
- Exempt: puerta_abierta, ahorro, ahorro_comercial, ahorro_por_retiro

### Special Cases

- **Plaza Comercial B5 (Cofiño):** Commercial space sale. All 5% goes to Puerta Abierta. Sales force receives zero.
- **Walk-ins:** Eliminated — CFO confirmed they don't exist.
- **Partners (B5):** 14 named individuals with Q6,000 reserva and right to skip enganche. Commission treatment pending full definition.

---

## VIII. Legal Documents Generated Per Sale

Patty produces the following documents for each reservation/sale:

| Document | Purpose | Template |
|----------|---------|---------|
| Promesa de Compraventa (PCV) | Primary purchase agreement | Word → PDF |
| Carta de Pago | Payment schedule | Word → PDF |
| Carta de Buró | Credit bureau authorization | Word → PDF |
| Carta de Reserva | Reservation confirmation | Word → PDF |

All are Word templates with fields replaced from the client DSI data. The system now generates PCV and Carta de Pago programmatically (using per-reservation sale price, enganche %, cuotas, and resolved project config). As of migration 054, enganche_schedule (custom installment overrides) is also applied to these documents.

---

## IX. Lead Sources (How Clients Arrive)

All 5 projects share the same 17 lead source categories (from `lead_sources` table):

| # | Source | Channel Type |
|---|--------|-------------|
| 1 | Facebook | Paid social (Meta ads) |
| 2 | Meta | Paid social (Meta umbrella) |
| 3 | Referido | Client referral |
| 4 | Visita Inédita | Unsolicited walk-in |
| 5 | Señalética | On-site signage |
| 6 | PBX | Phone inquiry |
| 7 | Página Web | Website |
| 8 | Inbox | Direct message (social) |
| 9 | Mailing | Email campaign |
| 10 | Prospección | Cold outreach by salesperson |
| 11 | F&F | Friends & Family |
| 12 | Wati | WhatsApp Business (Wati platform) |
| 13 | Activación | Brand activation / event marketing |
| 14 | Evento | Real estate expo / fair |
| 15 | TikTok | Organic or paid TikTok |
| 16 | LinkedIn | Professional network |
| 17 | Valla | Billboard advertising (SE-specific addition) |

---

## X. Buyer Profile Data Collected

Once reservation is confirmed and DSI (client data sheet) arrives:

| Field | Source |
|-------|--------|
| Full name | DSI + signature |
| DPI (Guatemalan national ID — CUI 13 digits) | ID photo (OCR via Claude Vision) |
| RTU (Tax ID) | DSI |
| Email | DSI |
| Phone | DSI + salesperson |
| Gender | DSI |
| Age | DSI |
| Education level | DSI |
| Marital status | DSI |
| Children | DSI |
| Address | DSI |
| Income | DSI |
| Employer | DSI |
| Employment type (formal/informal) | DSI |
| Industry | DSI |
| Profession | DSI (typed, not from DPI — DPI does NOT contain profession) |

**Important:** Guatemalan DPI contains ONLY: CUI (13 digits), full name, date of birth, place of birth, gender, nationality, and photo. It does NOT contain profession, marital status, address, or education level.

**Multi-buyer support:** Reservations support multiple buyers per unit. First buyer = PROMITENTE_COMPRADOR; additional buyers = CO_COMPRADOR. Legal roles available: PROMITENTE_COMPRADOR, CO_COMPRADOR, REPRESENTANTE_LEGAL, GARANTE.

---

## XI. Sales Portfolio Health (April 2026)

| Metric | Value |
|--------|-------|
| Total reservations | 649 |
| CONFIRMED | 575 |
| DESISTED | 74 |
| Desistimiento rate | ~11.4% |
| Expected collections (PPTO) | Q130M+ |
| Actual collections | Q586M+ |
| Collection performance | 449% above budget minimum |
| Units ahead of schedule | ~84% |
| Units on track | ~14% |
| Units behind (delinquent) | ~1.6% (5 of 316 tracked) |

The portfolio is **financially healthy** — strong payment discipline, low delinquency, collections far exceed minimum schedule targets.

---

## XII. Competitive Context (Antonio's Analysis)

Antonio maintains zone-by-zone competitor tracking spreadsheets covering:
- Zones 5, 10, 11, Cobán, Antigua Guatemala, Carretera a El Salvador
- Data collected per competitor: project name, delivery date, bedrooms, bathrooms, parking, area, prices (with/without tax), reserva, enganche %, installment months, bank cuotas, IUSI

He also maintains a **Valorización tracker** showing how each project's total market value has changed from launch to present — used for sales argumentation (appreciation story).

---

## XIII. The Operational Problem This System Solves

### Patty's Workload (Before This System)

Patty is the single control-tower operator for all commercial operations. Every sale, payment, cancellation, legal document, and availability update passes through her manually, across 6+ Excel tabs per transaction.

**Per-sale workflow (9 manual steps across 2 Excel workbooks):**
1. Download voucher from WhatsApp/email
2. Read client name from voucher (sometimes not present)
3. Cross-reference apartment + tower from salesperson's separate message
4. Enter into Reporte de Ventas (current month tab)
5. Update Origen de Ventas tab
6. Update Gráficas tab
7. Update Buyer Persona tab (once DSI arrives)
8. Open Cotizador Excel → mark unit as "Reservado"
9. Update Análisis de Inventario tab

**Compounding problems:**
- Name mismatches: sender ≠ buyer. Patty corrects retroactively.
- Double-selling: same unit sold 2–3 times before cotizador update.
- NeoLink payments: arrive with zero identifying context (just amount + transaction ID).
- Weekly Excel export to salespeople = 0–7 day availability blind spot.
- Desistimiento reversal = 6-tab cascade, source of most data integrity errors.
- No audit trail on price adjustments.

### What This System Does

- Replaces the cotizador Excel with a real-time, RLS-enforced database (`rv_units`, `reservations`, `unit_status_log`)
- Allows salespeople to submit reservations via mobile (`/reservar`) without going through Patty
- Auto-locks units on submission (no double-selling)
- Patty reviews and confirms from the admin dashboard (`/admin/reservas`)
- Generates PCV and Carta de Pago programmatically with correct per-reservation financial terms
- Tracks payment collections, enganche schedules, desistimientos with full audit trail
- Provides real-time inventory availability to the entire team
- Exposes business analytics (velocity, buyer persona, lead source attribution, commission disbursement) without manual Excel work

---

*File: docs/puerta-abierta-what-they-sell.md*
*Last updated: 2026-04-27*
