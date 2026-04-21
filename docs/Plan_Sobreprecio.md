# Plan: Sobreprecio (Price Markup) for Cotizador

## Context

In the April 14, 2026 sales meeting, **3 salespeople** (Ronnie, Paula, Eder) independently confirmed the same need: they regularly quote clients a price **above** list price, then "offer" a discount as a negotiation/closing technique. This is universal practice — not an edge case.

Currently the cotizador shows `price_list` directly, making this technique impossible. Salespeople fall back to Excel, defeating the app's purpose.

Jorge committed to implementing this in the meeting. It is the highest-impact feature request from the transcript.

---

## Design

### Core Concept

A new **ephemeral** "Sobreprecio" (markup) input on the cotizador, mirroring the existing "Descuento Especial" pattern. No DB migration — purely client-side state.

### Price Calculation Chain

```
price         = selectedUnit.price_list           // real list price (internal)
markedUpPrice = price + markupAmount              // what client sees
effectivePrice = markedUpPrice - discountAmount   // final after optional discount
```

**When markup is active:**
- `effectivePrice` must be `>= price` (discount capped at markup amount — never sell below list price via this flow)
- Printed PDF shows "Precio" (not "Precio lista") with `markedUpPrice` — client never sees real list price

**When markup is NOT active:**
- Everything works exactly as today (discount can go below list price for authorized descuento especial)

### Interaction Matrix

| Markup | Discount | Unit summary label | Base for calcs | Discount cap |
|--------|----------|-------------------|----------------|--------------|
| OFF | OFF | "Precio lista" | `price_list` | n/a |
| OFF | ON | "Precio lista" | `price_list - discount` | `price - 1` (existing) |
| ON | OFF | "Precio" | `markedUpPrice` | n/a |
| ON | ON | "Precio" | `markedUpPrice - discount` | `markupAmount` |

---

## Implementation — Single File Change

**File:** `src/app/cotizador/cotizador-client.tsx`

### 1. New State (after line 93)

```typescript
// Sobreprecio (negotiation markup — show price above list to client)
const [showMarkup, setShowMarkup] = useState(false);
const [markupAmount, setMarkupAmount] = useState(0);
```

### 2. Reset on Config Change (extend existing useEffect at line 96)

Add `setMarkupAmount(0)` and `setShowMarkup(false)` alongside the existing discount reset.

### 3. Price Computation (replace lines 109-110)

```typescript
const price = selectedUnit?.price_list ?? 0;
const markedUpPrice = markupAmount > 0 ? price + markupAmount : price;
const maxDiscount = markupAmount > 0 ? markupAmount : price - 1;
const effectivePrice = discountAmount > 0 && discountAmount <= maxDiscount
  ? markedUpPrice - discountAmount
  : markedUpPrice;
```

### 4. Unit Summary — Dynamic Label (line 288)

Replace the static "Precio lista" detail:

```tsx
<Detail
  label={markupAmount > 0 ? "Precio" : "Precio lista"}
  value={formatCurrency(markedUpPrice, config.currency)}
/>
```

When markup is active, the client-facing price is `markedUpPrice`, labeled simply "Precio".

### 5. Markup UI Section (insert between unit summary and discount toggle, ~line 294)

New toggle link "Agregar sobreprecio" + input card, visually distinct from discount (green/emerald theme vs amber):

- Toggle button: `text-xs text-muted underline` (same discrete style as discount)
- Card: `border-emerald-400/60 border-dashed` (green accent, vs amber for discount)
- Input: flat amount in project currency
- Validation: must be > 0
- Display when active: "Precio lista: Q1,000,000 → Sobreprecio: +Q10,000 → Precio al cliente: Q1,010,000"
- The "Precio lista" line in this breakdown is visible **only on screen** (class `cotizador-no-print`) — the client never sees the real list price in print

### 6. Discount Section Adjustments (lines 305-347)

- Change `max` prop on discount input: `max={maxDiscount}` (uses markup amount when markup active, `price - 1` otherwise)
- Update discount breakdown to use `markedUpPrice` as the base:
  - "Precio ~~lista~~" → show `markedUpPrice` (the client-facing price)
  - "Descuento especial" → `-discountAmount`
  - "Precio con Descuento" → `effectivePrice`
- Validation message updated: when markup active and discount exceeds markup, show "El descuento no puede ser mayor al sobreprecio"

### 7. Print Styles (lines 463-598)

Add print rules for the markup section:
```css
/* Markup section — hide the list price breakdown in print, keep final price */
.cotizador-markup .cotizador-no-print { display: none !important; }
.cotizador-markup {
  border-style: dashed !important;
  border-color: #059669 !important;
  padding: 3px 6px !important;
}
```

Actually, the markup section itself should be **hidden in print entirely** — its purpose is to let the salesperson SET the markup. The result (the inflated price) is already shown in the unit summary as "Precio". The client never needs to see a "Sobreprecio" card.

```css
.cotizador-markup { display: none !important; }
```

### 8. Signature Section — No changes

The existing signature section (lines 426-437) remains unchanged. The dual-signature request (3.3 in the extraction doc) is a separate task.

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/cotizador/cotizador-client.tsx` | Add markup state, UI section, price chain update, print CSS |

**No other files change.** The computation functions (`computeEnganche`, `computeFinancingMatrix`, `computeEscrituracion`) already receive `effectivePrice` as input — they don't need to know about markup vs discount.

---

## What the Printed PDF Looks Like

### Without Markup (unchanged)
```
Unidad: 614 | Proyecto: Boulevard 5 | Torre: Única | Precio lista: Q1,000,000
[enganche table]
[financing matrix]
[escrituración]
```

### With Markup Only
```
Unidad: 614 | Proyecto: Boulevard 5 | Torre: Única | Precio: Q1,010,000
[enganche table based on Q1,010,000]
[financing matrix based on Q1,010,000]
[escrituración based on Q1,010,000]
```

### With Markup + Discount (negotiation close)
```
Unidad: 614 | Proyecto: Boulevard 5 | Torre: Única | Precio: Q1,010,000

--- Descuento Especial ---
Precio: Q1,010,000
Descuento especial: -Q10,000
Precio con Descuento: Q1,000,000

[enganche table based on Q1,000,000]
[financing matrix based on Q1,000,000]
[escrituración based on Q1,000,000]
```

---

## Guía de Usuario — SOBREPRECIO
```
NUEVA FUNCIÓN SOBREPRECIO EN EL COTIZADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Qué es?
────────
El sobreprecio les permite cotizar un precio MAYOR al precio de lista
para tener margen de negociación con el cliente. El cliente ve
únicamente el precio que ustedes establezcan — nunca el precio real de lista.

¿Cómo funciona?
────────────────
1. Abren el cotizador y seleccionan la unidad.

2. Debajo de los datos de la unidad, verán el enlace
   "Agregar sobreprecio". Le dan clic.

3. Ingresan el monto que deseen agregar al precio.
   Ejemplo: si la unidad vale Q1,000,000 y ponen Q10,000
   de sobreprecio, el precio al cliente será Q1,010,000.

4. Todos los cálculos (enganche, cuotas, financiamiento, escrituración) 
   se recalculan automáticamente sobre el precio al cliente.

5. Al imprimir, la cotización muestra "Precio: Q1,010,000".
   El precio de lista real NO aparece en la impresión.

¿Cómo uso el descuento junto con el sobreprecio?
─────────────────────────────────────────────────
Este es el uso principal: agregar sobreprecio y después
ofrecer un "descuento" como gancho de cierre.

1. Agreguen el sobreprecio (ejemplo: +Q10,000).
2. Luego hagan clic en "Agregar descuento".
3. Pongan el monto del descuento (ejemplo: Q10,000).
4. La cotización impresa mostrará:
   • Precio: Q1,010,000
   • Descuento especial: -Q10,000
   • Precio con Descuento: Q1,000,000

   El cliente ve que le están dando un descuento real.
   El precio final nunca baja del precio de lista.

Reglas importantes
──────────────────
• El sobreprecio es solo para la cotización — no se guarda
  en el sistema ni afecta la reserva.
• Si cambian de unidad, el sobreprecio se reinicia a cero.
• Cuando hay sobreprecio activo, el descuento máximo permitido
  es igual al sobreprecio (no se puede vender debajo del
  precio de lista con esta función).
• Para descuentos autorizados debajo del precio de lista,
  usen el descuento especial SIN sobreprecio — eso requiere
  autorización previa de gerencia.

¿Dónde lo encuentro?
─────────────────────
En el cotizador (orion-intelligence.vercel.app/cotizador),
debajo de la información de la unidad, verán el enlace
"Agregar sobreprecio" junto a "Agregar descuento".

Cualquier duda, escríbanme un mensaje.
```

---

## Verification

1. **Build:** `next build` must pass with zero errors
2. **Manual test scenarios:**
   - Select unit → no markup → verify "Precio lista" label and current behavior unchanged
   - Add markup Q10,000 → verify label changes to "Precio" with increased value
   - Add markup + discount → verify discount capped at markup amount
   - Add markup + discount > markup → verify validation error
   - Change unit → verify markup resets to 0
   - Print with markup → verify "Precio lista" does NOT appear, only "Precio"
   - Print with markup + discount → verify breakdown shows correctly
   - Print without markup → verify unchanged from today
3. **No regressions:** existing discount-only flow must work identically when markup is 0
