# Feature Extraction: Ventas Meeting 2026-04-14

**Date:** 2026-04-14
**Source:** `ventas20260414_limpia.txt` (weekly sales team meeting)
**Participants:** Jorge Luis, José Gutiérrez, Airway, Paula, Iván, Ronnie, Eder, Pablo, Anaí, + 1 unidentified (Santa Elena)
**Method:** Exhaustive extraction of every feature, improvement, bug, or config change — cross-referenced against `transcript-feature-extraction-2026-03-26.md` and `remaining-features.md`.

---

## Legend

- **[E]** = Explicitly requested
- **[H]** = Hinted at / implied
- **[CONFIG]** = Solvable via cotizador config, no code change
- **[EXISTS]** = Already built in Orion
- **[PREV]** = Previously captured in March 26 extraction
- **[DENIED]** = Explicitly rejected by management/Jorge
- **[BUG]** = Defect, not a feature request

---

## 1. Cotizador — Pricing & Rates

### 1.1 Add 7.26% Interest Rate for Boulevard 5 [CONFIG]
Airway reported the app doesn't accept decimal interest rates (7.26%). This is the rate used with the PAXA program. Jorge committed to adding it.
- **Project:** Boulevard 5 (torre única)
- **Action:** Add 7.26% rate line to cotizador config for B5
- **Committed by:** Jorge (in-meeting)
> Lines 87–101 — "Nosotros trabajamos 7.26%, que es la tasa... no deja; los decimales no deja cargarlos"

### 1.2 Add 8.0% Preferential Bank Rate for Santa Elena [CONFIG]
SE participant wants to calculate at 8% (some banks offer preferential rates). Currently only 8.5% is available.
- **Project:** Santa Elena
- **Action:** Add 8.0% rate option to cotizador config for SE
> Lines 349–351 — "me gustaría como poder calcular al 8, por ejemplo, porque hay bancos que a veces tienen tasa preferencial"

**Cross-ref:** Related to [PREV] §4.2 (Financing Term Configuration Per Bank) and §9.2 (Bank Configuration Management). This is the same underlying need — per-bank rate flexibility — but expressible as a quick config fix for now.

### 1.3 Enforce Minimum 30% Enganche for Santa Elena [E]
SE participant wants a floor of 30% on the enganche slider/input. Prevents accidental under-quoting.
- **Project:** Santa Elena only
- **Action:** Add `min_enganche_pct` validation to cotizador config or code for SE
> Lines 325–333 — "el 30% no se pueda dejar en menos... no permitimos menos del 30% de enganche"

### 1.4 Default 18 Cuotas de Enganche for Santa Elena [CONFIG]
Currently defaults to 15. SE uses 18.
- **Project:** Santa Elena
- **Action:** Update cotizador config `num_cuotas` default to 18 for SE
- **Note:** Jorge said this is already in the configurator — Antonio/Hope can change it, or Jorge will do it
> Lines 337–343 — "me aparecen 15 cuotas de enganche y nosotros vamos por 18 cuotas de enganche"

### 1.5 Tower-Specific Fraccionamiento Months [E]
Pablo reported Torre D should allow 26 meses and Torre C 24 meses. App may only show 24. Another participant countered that 24 is the PCV maximum. Needs confirmation with management.
- **Project:** Bosque Las Tapias (implied)
- **Action:** Confirm with Antonio/gerencia whether >24 cuotas are authorized per tower, then update config
- **Status:** Disputed — requires management decision
> Lines 287–296 — "En la torre D estamos dando fraccionados hasta 26 meses... yo estoy dando 20 o 18"

---

## 2. Cotizador — Price Markup for Negotiation

### 2.1 Show Price Above List Price (Negotiation Markup) [E]
**Multiple requesters: Ronnie, Paula, Eder.** Salespeople increase the price shown to the client above list price to create room for a "discount" as a closing technique. The cotización PDF should print the markup price. The descuento especial feature covers discounts *below* list price (authorized), but this is about showing a price *above* list price.

Jorge committed to implementing this.

- **Action:** Add "precio de venta" (or "precio al cliente") field that defaults to list price but can be increased. Cotización prints this price. Descuento then brings it back toward (but not below) list price.
- **Constraint:** The printed price must never fall below the `rv_units.total_price` (list price) without explicit descuento authorization.

> Lines 177–201 — Ronnie: "le aumentamos unos 5 mil, 10 mil... para poder jugar con eso y decirle al cliente le voy a hacer un descuento"
> Lines 191–197 — Paula confirms same practice: "a nosotros sí nos puso el precio que tenemos en la disponibilidad, y por eso pedí lo del descuento"
> Line 247 — Eder: "en el logotipo, en poder poner un precio un poquito más alto para poder negociar"

**Cross-ref:** [PREV] §4.1 (Dual Price Tracking: List Price vs Effective Price). The March extraction captured the *tracking* need (list vs sale price for commission calculation). This meeting adds the *sales tool* angle: salespeople actively want to quote above list price and then "discount" down to list price or above.

### 2.2 Custom Initial Enganche Installments [E]
Paula requested the ability to set the first 2–3 cuotas of enganche at different (non-standard) amounts — e.g., a larger first payment for aguinaldo or bono 14. Jorge confirmed this is NOT yet built.
- **Action:** Allow overriding individual enganche installment amounts (at least the first N cuotas)
- **Status:** Acknowledged as pending, no timeline
> Lines 137–143 — "las primeras dos, tres cuotas, una cantidad, un número de cuotas iniciales sean de montos extraños"

---

## 3. PDF / Print Improvements

### 3.1 Project Logo on Cotización PDF [E]
Ronnie requested. Jorge confirmed this is already on his list. Multiple participants echoed (Eder, SE participant).
- **Status:** In progress (acknowledged as complex — PDF layout challenges)
> Lines 215–221 — "ponerle el logo de cada proyecto, porque se ve muy... muy triste"

**Cross-ref:** Already known. Not in previous extraction (was pre-existing backlog item).

### 3.2 Reduce PDF Margins / Fit on One Page [E]
Pablo reported excessive margins (top and bottom). Content spills to a second page where only escrituración, total, and signature appear. Should compress to one page.
- **Action:** Reduce margins, tighten spacing so cotización fits on a single page
> Lines 279–283 — "Tiene demasiado margen perdido... deberíamos seguir comprimiendo para que quepa todo en una sola página"

### 3.3 Two Signature Lines on PDF [E]
Pablo reported only one signature space exists. Need two:
- Left: "Firma del cliente" / "Firma del comprador" / "Firma del inversionista"
- Right: "Firma del asesor"
> Line 279 — "solo aparece un espacio de firma, no aparecen dos... firma del cliente o firma del inversionista, y ya la de la derecha firma del asesor"

### 3.4 Payment Date Column in Cotización [E]
Pablo requested a column showing the exact date of each enganche installment (reservation date, then month-by-month dates). The Excel cotizador had this. Jorge confirmed this was already requested and is on his list. Also includes the date range preference (e.g., "18 al 20 de cada mes" or "28 al 31").
- **Action:** Add a date column to the enganche payment schedule in the cotización
> Lines 299–309 — "en la cotización donde te aparece cuántos... la reserva, qué fecha se va haciendo la reserva... puedes plasmar si por ejemplo el cliente va a pagar su mensualidad del 18 al 20"

### 3.5 Promise (PCV) Date on Cotización [E]
Pablo requested adding the fecha de la promesa de compraventa. Jorge said this was new (not previously requested).
- **Action:** Add PCV date field to cotización output
> Line 309 — "agregar la fecha de la promesa"

---

## 4. Financial Engine — Advanced

### 4.1 Graduated/Stepped Interest Rates (COTALIPO) [E]
Eder has a real client case requiring a subsidized-rate program where interest rates change by year band:
- Years 1–4: 40% reduction from base rate
- Years 5–7: 30% reduction
- Years 8–30: Full rate (100%)

This produces different monthly payments per period. Jorge committed to a 1:1 call with Eder to understand the real case.
- **Action:** Support multi-band interest rate schedules in the financing calculator
- **Status:** Discovery phase — Jorge will interview Eder for real values
- **Complexity:** High — requires amortization engine changes
> Lines 251–269 — "los primeros cuatro años es el 40% menos, después el 30, y después se queda el 100"

### 4.2 More Realistic Minimum Income Requirements [E]
Ronnie reported the minimum income shown in cotizaciones is too low because it assumes zero debt. Real clients always have existing debts, so banks require higher income (Q7,000–7,500 vs the Q5,600 shown). This confuses clients.
- **Action:** Adjust the income requirement formula to account for typical debt load, or make it configurable. Discuss with Antonio.
- **Status:** Jorge will consult with Antonio
> Lines 203–213 — "tiende a confundir un poquito a los clientes porque nosotros les solicitamos siempre un poco más... 7,000 a 7,500"

---

## 5. Bugs / Issues

### 5.1 IUSI Not Visible in General Cuota (B5, Unit 614) [BUG]
Airway reported that the IUSI is not loaded in the general cuota line — it appears as a separate section below. Jorge mentioned this was previously fixed with Antonio but will re-verify for unit 614.
- **Project:** Boulevard 5, Unit 614
- **Action:** Verify IUSI integration in cuota for B5 unit 614
> Lines 79–85 — "en la cuota general no aparece el UCI cargado, pero aparece abajo un apartado que dice UCI"

### 5.2 Discount Feature Not Appearing (Browser Cache) [BUG — RESOLVED]
Paula couldn't see "agregar descuento" — resolved by opening in incognito tab (browser cache).
- **Status:** No code change needed. Users need to clear cache.
> Lines 125–149

### 5.3 Iván — Authentication Issue [BUG]
Iván couldn't log in. Deferred for individual troubleshooting.
- **Status:** Pending individual resolution
> Lines 163–165

### 5.4 José Gutiérrez — Login/Password Reset Loop [BUG]
José kept being redirected to password reset. Deferred.
- **Status:** Pending individual resolution
> Lines 39–55

---

## 6. Declined Requests

### 6.1 Maintenance Cost on Cotización [DENIED]
SE participant asked for maintenance cost to appear on the cotización. Jorge explained that management ("altas autoridades") explicitly rejected this because maintenance amounts may change in the future, and a signed document with a specific amount would be legally binding.
> Lines 353–359 — "puede haber cambios en el monto del mantenimiento en el futuro. Y si nosotros dejamos un documento firmado que diga el monto, solitos nos clavamos"

---

## Summary

| # | Item | Type | Status | Project |
|---|------|------|--------|---------|
| 1.1 | 7.26% rate for B5 | CONFIG | Committed | B5 |
| 1.2 | 8.0% preferential rate for SE | CONFIG | Committed | SE |
| 1.3 | Min 30% enganche for SE | CODE | New | SE |
| 1.4 | Default 18 cuotas for SE | CONFIG | Committed | SE |
| 1.5 | Tower-specific cuota months | CONFIG? | Needs decision | BLT |
| 2.1 | Price markup for negotiation | CODE | Committed | All |
| 2.2 | Custom initial enganche installments | CODE | Acknowledged, no ETA | All |
| 3.1 | Project logo on PDF | CODE | In backlog | All |
| 3.2 | Reduce PDF margins / one page | CODE | New | All |
| 3.3 | Two signature lines on PDF | CODE | New | All |
| 3.4 | Payment date column | CODE | In backlog | All |
| 3.5 | PCV date on cotización | CODE | New | All |
| 4.1 | Graduated interest rates (COTALIPO) | CODE | Discovery | All |
| 4.2 | Realistic minimum income | CODE/CONFIG | Needs Antonio input | All |
| 5.1 | IUSI bug on B5 unit 614 | BUG | Verify | B5 |
| 5.2 | Discount not visible (cache) | BUG | Resolved | — |
| 5.3 | Iván auth issue | BUG | Pending | — |
| 5.4 | José login loop | BUG | Pending | — |
| 6.1 | Maintenance on cotización | DENIED | Rejected | SE |

### By Priority

**Immediate (config changes, no code):**
- 1.1, 1.2, 1.4 — rate/cuota config updates (minutes each)

**Short-term (code, committed by Jorge):**
- 2.1 — Price markup (highest impact — requested by 3+ salespeople)
- 1.3 — Min 30% enganche enforcement for SE
- 3.2 + 3.3 — PDF margin + dual signatures (quick PDF fixes)
- 3.5 — PCV date on cotización
- 5.1 — IUSI bug verification for B5 614

**Medium-term (code, in backlog or acknowledged):**
- 3.1 — Project logo on PDF (complex, already in progress)
- 3.4 — Payment date column (already requested previously)
- 2.2 — Custom initial enganche installments
- 4.2 — Realistic minimum income

**Long-term / Discovery:**
- 4.1 — Graduated interest rates (COTALIPO) — needs Eder interview
- 1.5 — Tower-specific cuota months — needs management decision

### Net New vs Previously Captured

**Net new (not in March 26 extraction):**
- 1.3 — Min 30% enganche for SE
- 3.2 — PDF margin reduction
- 3.3 — Dual signature lines
- 3.5 — PCV date on cotización
- 4.1 — Graduated/stepped interest rates (COTALIPO)
- 4.2 — Realistic minimum income requirements

**Previously captured (March 26), re-confirmed:**
- 2.1 → was §4.1 (Dual Price Tracking)
- 2.2 → was §4.7 (Variable Enganche Percentage) — related but more specific
- 3.1 → pre-existing backlog
- 3.4 → pre-existing backlog

**Config-only (no code change):**
- 1.1, 1.2, 1.4 — cotizador_config table updates
