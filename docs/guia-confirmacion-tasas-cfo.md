# Confirmación de Tasas de Comisión — Guía CFO

**Objetivo:** Revisar y confirmar la tasa de comisión ejecutivo (%) de cada venta. Al confirmar, el sistema recalcula automáticamente todas las comisiones asociadas.

---

## 1. Acceso

1. Abrir **orion-intelligence.vercel.app** e iniciar sesión.
2. En la barra de navegación, ir a **Reservas → Admin**.
   - URL directa: `orion-intelligence.vercel.app/admin/reservas`

---

## 2. Identificar tasas pendientes

En la tabla de reservas, cada fila muestra un **indicador de punto** junto al estado:

| Punto | Significado |
|-------|-------------|
| ● verde | Tasa ya confirmada |
| ● ámbar | Tasa pendiente de confirmación |
| sin punto | Sin venta vinculada en comisiones (no requiere acción) |

> **Filtro recomendado:** Seleccionar estado **"Confirmada"** para ver solo ventas activas. Los puntos ámbar son los que requieren acción.

---

## 3. Confirmar o asignar una tasa

1. **Hacer clic en la fila** de la reserva → se abre un panel lateral derecho.
2. **Desplazarse hacia abajo** hasta la sección **"TASA EV"**.

### Si la tasa ya tiene un valor pre-poblado:

Se muestra:
- **Tasa:** porcentaje actual (ej. `1.25%`)
- **Estado:** "Pendiente" (ámbar) o "Confirmada" (verde)

**Para confirmar:**
- En el campo **"Tasa ejecutivo (%)"**, verificar o modificar el porcentaje (rango: 0 – 5).
- Presionar **"Confirmar tasa"**.
- El botón cambia a "Confirmando..." y luego aparece el mensaje **"Confirmada"** en verde.

### Si la tasa está vacía (venta sin tasa pre-poblada):

Se muestra:
- **Tasa:** —
- **Estado:** "No asignada" (rojo)

**Para asignar:**
- Ingresar el porcentaje en el campo **"Tasa ejecutivo (%)"**.
- Presionar **"Asignar y confirmar"**.
- El sistema asigna la tasa y la confirma en un solo paso.

> **Nota:** Si al abrir una reserva no aparece la sección "TASA EV", significa que esa reserva aún no tiene venta registrada en el sistema de comisiones. No requiere acción.

---

## 4. Qué ocurre al confirmar

Al presionar "Confirmar tasa", el sistema ejecuta automáticamente:

1. Registra la tasa, la fecha y el usuario que confirmó.
2. Recalcula las comisiones de **todos los pagos** asociados a esa venta.
3. El punto en la tabla cambia a verde.
4. Los KPIs del dashboard de comisiones se actualizan con los nuevos montos.

No es necesario hacer nada más por venta. Una confirmación = todo recalculado.

---

## 5. Verificar el impacto

Para ver el efecto acumulado de las confirmaciones:

1. Ir al **dashboard principal** (página de inicio).
2. Seleccionar la pestaña **"Comisiones"**.
3. Revisar:
   - **"Total comisiones"** — suma de todas las comisiones.
   - **"A desembolsar"** — comisiones que se pagan a personas (ejecutivos, gerencia).
   - **"Acumulado"** — reservas internas de la empresa (ahorro, Puerta Abierta).
   - **"Total a pagar"** — neto después de ISR (5%).
4. En **"Comisiones por Beneficiario"**, las barras muestran pagado (verde) vs. pendiente (gris) por persona.

---

## 6. Atajos para ir más rápido

| Tecla | Acción |
|-------|--------|
| `j` | Siguiente reserva en la tabla |
| `k` | Reserva anterior |
| `Esc` | Cerrar panel lateral |

**Flujo eficiente:** Abrir fila → verificar tasa → confirmar → `Esc` → `j` → repetir.

---

## Referencia rápida de tasas

La tasa ejecutivo escala por volumen de ventas del asesor **por proyecto, por mes**:

| Proyecto | Umbral | Tasa inicial | Tasa escalada |
|----------|--------|-------------|--------------|
| Boulevard 5 | 5 unidades/mes | 1.00% | 1.25% |
| Benestare | 5 unidades/mes | 1.00% | 1.25% |
| Bosque Las Tapias | 5 unidades/mes | 1.00% | 1.25% |
| Casa Elisa | 2 unidades/mes | 1.00% | 1.25% |

Si un asesor vende **menos** del umbral en el mes → 1.00%. Si alcanza o supera el umbral → 1.25%. Las ventas por referido no cuentan para el umbral.

Las tasas pre-pobladas en el sistema ya reflejan esta escalación según el historial de cada asesor.

| Concepto | Valor |
|----------|-------|
| Máximo permitido por el sistema | 5.00% |
| Tope total de comisión por venta | 5.00% (el sistema calcula el residuo automáticamente) |

---

*Dudas o errores: contactar a Jorge.*
