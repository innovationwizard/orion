# Cotizador — Guía de Precios, Sobreprecio y Descuentos

**Última actualización:** 2026-04-14
**Archivo:** `src/app/cotizador/cotizador-client.tsx`
**Cálculos:** `src/lib/reservas/cotizador.ts`

---

## 1. Conceptos de Precio

El cotizador maneja **tres niveles de precio**, aplicados en cadena:

```
Precio lista  →  (+) Sobreprecio  →  Precio al cliente  →  (-) Descuento  →  Precio efectivo
  (DB)              (opcional)          (lo que ve           (opcional)        (base para
                                         el cliente)                            cálculos)
```

### 1.1 Precio Lista (`price_list`)

- **Fuente:** columna `rv_units.price_list` en la base de datos.
- **Inmutable en el cotizador** — no se puede modificar desde la interfaz.
- Es el precio oficial de la unidad según Puerta Abierta.
- Cuando no hay sobreprecio, se muestra al cliente como "Precio lista".

### 1.2 Sobreprecio (markup)

- **Propósito:** Herramienta de negociación. Permite al asesor mostrar un precio **mayor** al precio de lista para tener margen al momento de ofrecer un "descuento" como gancho de cierre.
- **Tipo:** Monto fijo en la moneda del proyecto (Q o $). No porcentaje.
- **Fórmula:** `markedUpPrice = price_list + markupAmount`
- **En la impresión:** La sección de sobreprecio se oculta completamente. El precio al cliente aparece en el resumen de la unidad simplemente como **"Precio"** (sin la palabra "lista").
- **El cliente nunca ve el precio de lista real** cuando hay sobreprecio activo.
- **Efímero:** No se guarda en la base de datos ni en la URL. Se reinicia al cambiar de unidad, proyecto o torre.

### 1.3 Descuento Especial (discount)

- **Propósito:** Dos usos distintos dependiendo del contexto:
  - **Con sobreprecio:** Es el "gancho de cierre" — el asesor ofrece devolver parte o todo el sobreprecio como un "descuento". El precio final nunca baja del precio de lista.
  - **Sin sobreprecio:** Es un descuento real, pre-autorizado por gerencia, que reduce el precio por debajo del precio de lista.
- **Tipo:** Monto fijo en la moneda del proyecto.
- **Fórmula:** `effectivePrice = markedUpPrice - discountAmount`
- **En la impresión:** La sección de descuento SÍ aparece (el cliente debe ver que recibió un descuento).
- **Efímero:** Mismo ciclo de vida que el sobreprecio.

### 1.4 Precio Efectivo (`effectivePrice`)

- Es el precio final que se usa para **todos los cálculos**: enganche, cuotas, financiamiento bancario, escrituración.
- Resultado de la cadena: `price_list + sobreprecio - descuento`.

---

## 2. Reglas de Negocio

### 2.1 Tope del descuento

| Escenario | Descuento máximo permitido | Resultado |
|-----------|---------------------------|-----------|
| Con sobreprecio | = monto del sobreprecio | Precio efectivo nunca baja del precio de lista |
| Sin sobreprecio | = precio lista - 1 | Precio efectivo puede bajar del precio de lista (requiere autorización) |

### 2.2 Etiqueta dinámica en resumen

| Sobreprecio activo | Etiqueta en resumen | Valor mostrado |
|--------------------|---------------------|----------------|
| No | "Precio lista" | `price_list` |
| Sí | "Precio" | `price_list + sobreprecio` |

### 2.3 Comportamiento en impresión

| Sección | Visible en pantalla | Visible en impresión |
|---------|--------------------|--------------------|
| Sobreprecio (card verde) | Sí | **No** — se oculta completamente |
| Descuento (card ámbar) | Sí | **Sí** — el cliente ve el descuento |
| Resumen de unidad (precio) | Sí | **Sí** — muestra el precio al cliente |
| Desglose del sobreprecio | Sí | **No** — marcado `cotizador-no-print` |

### 2.4 Reinicio automático

Tanto el sobreprecio como el descuento se reinician a cero cuando:
- Se cambia de unidad
- Se cambia de proyecto
- Se cambia de torre
- Cambia la configuración resuelta (por cambio de torre/tipo/dormitorios)

---

## 3. Escenarios de Uso

### Escenario A: Sin sobreprecio ni descuento (por defecto)

```
Precio lista: Q1,000,000
→ Enganche, financiamiento, escrituración calculados sobre Q1,000,000
→ Impresión muestra: "Precio lista: Q1,000,000"
```

### Escenario B: Solo sobreprecio (venta arriba de lista)

```
Precio lista: Q1,000,000
Sobreprecio: +Q10,000
Precio al cliente: Q1,010,000
→ Todos los cálculos sobre Q1,010,000
→ Impresión muestra: "Precio: Q1,010,000" (sin "lista", sin sobreprecio visible)
```

El asesor vende la unidad a Q1,010,000 — por encima del precio de lista. Beneficio para la empresa.

### Escenario C: Sobreprecio + Descuento (gancho de cierre)

```
Precio lista: Q1,000,000
Sobreprecio: +Q10,000
Precio al cliente: Q1,010,000
Descuento: -Q10,000
Precio con descuento: Q1,000,000
→ Todos los cálculos sobre Q1,000,000
→ Impresión muestra:
  "Precio: Q1,010,000"
  "Descuento especial: -Q10,000"
  "Precio con Descuento: Q1,000,000"
```

El cliente percibe que recibió un descuento real de Q10,000. El precio final es exactamente el precio de lista. Todos ganan.

### Escenario D: Sobreprecio + Descuento parcial (margen para la empresa)

```
Precio lista: Q1,000,000
Sobreprecio: +Q15,000
Precio al cliente: Q1,015,000
Descuento: -Q5,000
Precio con descuento: Q1,010,000
→ Todos los cálculos sobre Q1,010,000
→ Venta Q10,000 por encima de lista + cliente percibe un descuento
```

### Escenario E: Solo descuento, sin sobreprecio (descuento autorizado real)

```
Precio lista: Q1,000,000
Descuento: -Q20,000
Precio con descuento: Q980,000
→ Todos los cálculos sobre Q980,000
→ Impresión muestra:
  "Precio lista: Q1,000,000"
  "Descuento especial: -Q20,000"
  "Precio con Descuento: Q980,000"
```

Este escenario requiere **autorización previa de gerencia**. El descuento baja el precio por debajo de lista.

---

## 4. Guía de Usuario para Asesores

```
NUEVA FUNCIÓN: SOBREPRECIO EN EL COTIZADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Qué es?
────────
El sobreprecio les permite cotizar un precio MAYOR al precio de lista
para tener margen de negociación con el cliente. El cliente ve
únicamente el precio que ustedes establezcan — nunca el precio
real de lista.

¿Cómo funciona?
────────────────
1. Abran el cotizador y seleccionen la unidad.

2. Debajo de los datos de la unidad, verán el enlace
   "Agregar sobreprecio". Hagan clic ahí.

3. Ingresen el monto que desean agregar al precio.
   Ejemplo: si la unidad vale Q1,000,000 y ponen Q10,000
   de sobreprecio, el precio al cliente será Q1,010,000.

4. Todos los cálculos (enganche, cuotas, financiamiento,
   escrituración) se recalculan automáticamente sobre
   el precio al cliente.

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

## 5. Implementación Técnica

### Estado del componente

```typescript
// Sobreprecio
const [showMarkup, setShowMarkup] = useState(false);
const [markupAmount, setMarkupAmount] = useState(0);

// Descuento
const [showDiscount, setShowDiscount] = useState(false);
const [discountAmount, setDiscountAmount] = useState(0);
```

### Cadena de cálculo

```typescript
const price = selectedUnit?.price_list ?? 0;
const markedUpPrice = markupAmount > 0 ? price + markupAmount : price;
const maxDiscount = markupAmount > 0 ? markupAmount : markedUpPrice - 1;
const effectivePrice = discountAmount > 0 && discountAmount <= maxDiscount
  ? markedUpPrice - discountAmount
  : markedUpPrice;
```

### Flujo a funciones de cálculo

```
effectivePrice
  → computeEnganche(effectivePrice, ...)
  → computeFinancingMatrix(effectivePrice, enganche.enganche_total, ...)
  → computeEscrituracion(effectivePrice, ...)
```

Las funciones de cálculo en `cotizador.ts` no conocen el concepto de sobreprecio ni descuento — solo reciben un precio y calculan. Toda la lógica de markup/discount está contenida en `cotizador-client.tsx`.

### CSS de impresión

```css
/* Markup: oculto en impresión (precio ya en resumen) */
.cotizador-markup { display: none !important; }

/* Descuento: visible en impresión */
.cotizador-discount {
  border-style: dashed !important;
  border-color: #b45309 !important;
}
```

### Campos de base de datos relacionados (referencia)

| Campo | Tabla | Uso |
|-------|-------|-----|
| `price_list` | `rv_units` | Precio de lista oficial. Fuente para el cotizador. |
| `price_suggested` | `rv_units` | Precio sugerido para cesión de derechos. **No usado en cotizador.** |
| `sale_price` | `reservations` | Precio efectivo de venta por reserva. Nullable. **No usado en cotizador** (preparado para futuro). |

---

## 6. Historial de Cambios del Cotizador

| Changelog | Fecha | Cambio |
|-----------|-------|--------|
| 081 | 2026-03-26 | Zero-Diff: reescritura completa del motor de cálculo + sistema de config por proyecto |
| 084 | 2026-04-07 | Disclaimers siempre muestran los del proyecto (no los específicos de unidad) |
| 085 | 2026-04-07 | Rediseño UX de financiamiento + fix IUSI + optimización de impresión |
| 086 | 2026-04-07 | Descuento especial: soporte para descuentos planos pre-autorizados |
| 087 | 2026-04-14 | Sobreprecio: markup de negociación para cotizar arriba del precio de lista |

---

## 7. Solicitudes Pendientes del Equipo de Ventas (2026-04-14)

Extraídas de la reunión de ventas del 14 de abril de 2026. Fuente completa: `docs/transcript-feature-extraction-2026-04-14.md`.

### 7.1 Cambios de Configuración (sin código — `cotizador_configs` table)

| # | Solicitud | Proyecto | Solicitante | Estado |
|---|-----------|----------|-------------|--------|
| 1.1 | Agregar tasa 7.26% (programa PAXA) | Boulevard 5 | Airway | Pendiente — insertar fila en `cotizador_configs` con `bank_rates` incluyendo 0.0726 |
| 1.2 | Agregar tasa preferencial 8.0% | Santa Elena | Participante SE | **Completado 2026-04-14** — fila "Tasa Preferencial" creada (8.00%, 18 cuotas, 30% enganche, `tower_id = NULL`) |
| 1.4 | Cuotas de enganche default = 18 | Santa Elena | Participante SE | **Completado 2026-04-14** — ambas filas de config (Default + Tasa Preferencial) usan 18 cuotas |

**Cómo aplicarlos:** Cada uno es un `UPDATE cotizador_configs SET ... WHERE project_id = '...'` o puede hacerse desde `/admin/cotizador-config` si la UI de admin está habilitada.

### 7.2 Funcionalidades de Código — Implementadas

| # | Solicitud | Changelog | Fecha |
|---|-----------|-----------|-------|
| 1.3 | Enganche mínimo por config (`min_enganche_pct`) | 053 (migración) | 2026-04-14 |
| 2.1 | Sobreprecio (markup de negociación) | 087 | 2026-04-14 |

### 7.3 Funcionalidades de Código — Pendientes

#### 2.2 — Cuotas iniciales de enganche con montos personalizados [Mediano plazo]
- **Solicitante:** Paula
- **Problema:** Las primeras 2–3 cuotas de enganche a veces tienen montos distintos (aguinaldo, bono 14, pago extraordinario). La app solo permite cuotas uniformes.
- **Solución propuesta:** Permitir que el usuario sobreescriba el monto de las primeras N cuotas. El motor de enganche ya genera un array de `installments` — se trataría de permitir editar los primeros elementos y recalcular el resto para que el total cuadre.
- **Complejidad:** Media. Requiere UI de edición inline en `InstallmentTable` + ajuste en `computeEnganche`.

#### 3.1 — Logo del proyecto en el PDF de cotización [Mediano plazo]
- **Solicitantes:** Ronnie, Eder, participante SE
- **Problema:** La cotización impresa se ve "triste" sin branding. El Excel tenía logo.
- **Estado:** En backlog de Jorge (reconocido como complejo por layout PDF).
- **Complejidad:** Media-alta. Requiere carga de imagen por proyecto + posicionamiento en `@media print` CSS o migración a jsPDF.

#### 3.2 — Reducir márgenes del PDF / caber en una página [Corto plazo]
- **Solicitante:** Pablo
- **Problema:** Demasiado margen superior e inferior. El contenido se desborda a una segunda página donde solo aparece escrituración, total y firma.
- **Solución propuesta:** Ajustar `@page { margin }` y spacing en `printStyles`. Ya hubo una optimización en changelog 085 — puede necesitar ajustes adicionales.
- **Archivos afectados:** `cotizador-client.tsx` (sección `printStyles`).

#### 3.3 — Dos líneas de firma en el PDF [Corto plazo]
- **Solicitante:** Pablo
- **Problema:** Solo hay una línea de firma ("Firma" debajo del asesor). Necesitan dos:
  - Izquierda: "Firma del cliente" / "Firma del comprador" / "Firma del inversionista"
  - Derecha: "Firma del asesor"
- **Solución propuesta:** Modificar el bloque `.cotizador-print-footer` para tener dos columnas de firma con etiquetas explícitas.
- **Archivos afectados:** `cotizador-client.tsx` (sección del footer de impresión, líneas ~426–437).

#### 3.4 — Columna de fechas de pago en tabla de enganche [Mediano plazo]
- **Solicitante:** Pablo
- **Problema:** El Excel mostraba la fecha exacta de cada cuota (mayo, junio, julio...). La app solo muestra "Cuota 1, Cuota 2...". El cliente necesita ver cuándo paga.
- **Solución propuesta:** Agregar columna de fecha a `InstallmentTable`. Requiere un campo de "fecha de inicio" (o usar la fecha actual como base) y generar fechas mensuales. También incluir la preferencia de rango de pago ("18 al 20 de cada mes").
- **Archivos afectados:** `installment-table.tsx`, posiblemente `cotizador-client.tsx` para input de fecha base.

#### 3.5 — Fecha de promesa (PCV) en la cotización [Corto plazo]
- **Solicitante:** Pablo
- **Problema:** La cotización no incluye la fecha estimada de la promesa de compraventa.
- **Solución propuesta:** Agregar input de fecha (opcional) en la sección de datos de cotización. Mostrar en impresión.
- **Archivos afectados:** `cotizador-client.tsx` (nuevo input + print output).

#### 4.1 — Tasas de interés escalonadas / COTALIPO [Largo plazo]
- **Solicitante:** Eder (caso real con cliente)
- **Problema:** Programas subsidiados como COTALIPO tienen tasas que cambian por bandas de años:
  - Años 1–4: tasa base con 40% de reducción
  - Años 5–7: tasa base con 30% de reducción
  - Años 8–30: tasa completa (100%)
- **Impacto:** Genera diferentes cuotas mensuales por período. El motor actual (`pmt()`) asume tasa fija para todo el plazo.
- **Solución propuesta:** Extender `computeFinancingMatrix` para aceptar un array de bandas `{ fromYear, toYear, rateMultiplier }`. Calcular amortización por tramos y mostrar cuota por período.
- **Complejidad:** Alta. Requiere reescritura parcial del motor de amortización + nueva UI para definir bandas.
- **Estado:** En descubrimiento — Jorge hará entrevista 1:1 con Eder para obtener los valores reales.

#### 4.2 — Ingresos mínimos más realistas [Corto plazo]
- **Solicitante:** Ronnie
- **Problema:** El ingreso mínimo mostrado asume que el cliente tiene cero deudas. En la realidad los bancos piden más (Q7,000–7,500 en vez de los Q5,600 que muestra la app) porque todos los clientes tienen deudas existentes.
- **Solución propuesta:** Ajustar el `income_multiplier` en la config, o agregar un factor de ajuste por deuda. Requiere consulta con Antonio sobre cuál es el multiplicador realista.
- **Archivos afectados:** `cotizador_configs.income_multiplier` (config) o `computeFinancingMatrix` (código) dependiendo de la decisión.

### 7.4 — Bugs Pendientes

| # | Bug | Proyecto | Estado |
|---|-----|----------|--------|
| 5.1 | IUSI no aparece en la cuota general (aparece como apartado separado) — Unidad 614 | Boulevard 5 | Verificar — puede ser un issue de config (`include_iusi_in_cuota`) |
| 5.3 | Iván no puede autenticarse | — | Pendiente resolución individual |
| 5.4 | José Gutiérrez queda en loop de restablecimiento de contraseña | — | Pendiente resolución individual |

### 7.5 — Solicitudes Rechazadas

| # | Solicitud | Razón del rechazo |
|---|-----------|-------------------|
| 6.1 | Mostrar costo de mantenimiento en la cotización | Rechazado por gerencia: los montos de mantenimiento pueden cambiar, y un documento firmado con un monto específico sería legalmente vinculante. |

### 7.6 — Necesitan Decisión de Gerencia

| # | Solicitud | Pregunta pendiente |
|---|-----------|-------------------|
| 1.5 | Meses de fraccionamiento por torre (Torre D: 26, Torre C: 24) | ¿Se autoriza más de 24 cuotas? Un participante dice que 24 es el máximo por PCV. Pablo dice que Torre D debe permitir 26. Requiere confirmación de Antonio/gerencia. |
