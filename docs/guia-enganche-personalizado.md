# Cuotas de Enganche Personalizadas — Guía para Asesores

**Fecha:** 2026-04-14

---

## Guía de Usuario — CUOTAS DE ENGANCHE PERSONALIZADAS
```
NUEVA FUNCIÓN: CUOTAS DE ENGANCHE PERSONALIZADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¿Qué es?
────────
Ahora pueden modificar el monto de cuotas individuales de enganche
directamente en el cotizador. Esto sirve para reflejar pagos
extraordinarios que el cliente ya tiene planeados — por ejemplo,
aguinaldo, bono 14, o cualquier ingreso extra en un mes específico.

El total del enganche NUNCA cambia. Si suben una cuota, las demás
se ajustan automáticamente para que el total siempre cuadre.

¿Cómo funciona?
────────────────
1. Abran el cotizador y seleccionen la unidad.

2. En la tabla de cuotas de enganche (debajo del resumen),
   verán el enlace "Personalizar cuotas". Hagan clic ahí.

3. Cada cuota ahora tiene un campo editable. Modifiquen el
   monto de las cuotas que necesiten cambiar.
   Ejemplo: Cuota 3 cae en diciembre → súbanla a Q8,000
   porque el cliente recibe aguinaldo.

4. Las cuotas que NO modifiquen se redistribuyen solas para
   que el total siga siendo exactamente el mismo.

5. Las cuotas modificadas aparecen resaltadas en la tabla.

6. Para quitar una modificación, hagan clic en la "✕" junto
   a la cuota. Para restaurar TODO a cuotas iguales, hagan
   clic en "Restaurar cuotas uniformes".

Ejemplo
───────
Enganche neto: Q42,000 en 7 cuotas

  Sin personalizar:
  ┌────────┬───────────┐
  │ Cuota  │   Monto   │
  ├────────┼───────────┤
  │   1    │  Q 6,000  │
  │   2    │  Q 6,000  │
  │   3    │  Q 6,000  │
  │   4    │  Q 6,000  │
  │   5    │  Q 6,000  │
  │   6    │  Q 6,000  │
  │   7    │  Q 6,000  │
  ├────────┼───────────┤
  │ Total  │ Q42,000   │
  └────────┴───────────┘

  Con cuota 3 personalizada (aguinaldo):
  ┌────────┬───────────┬─────────────────┐
  │ Cuota  │   Monto   │                 │
  ├────────┼───────────┼─────────────────┤
  │   1    │  Q 5,667  │                 │
  │   2    │  Q 5,667  │                 │
  │   3    │  Q10,000  │ ← modificada    │
  │   4    │  Q 5,667  │                 │
  │   5    │  Q 5,667  │                 │
  │   6    │  Q 5,667  │                 │
  │   7    │  Q 3,665  │ ← absorbe resto │
  ├────────┼───────────┼─────────────────┤
  │ Total  │ Q42,000   │ siempre igual   │
  └────────┴───────────┘─────────────────┘

  Las 6 cuotas restantes se redistribuyeron para que el
  total siga siendo exactamente Q42,000.

Reglas importantes
──────────────────
• El total del enganche NUNCA cambia — es el mismo monto,
  solo distribuido diferente entre las cuotas.

• Cada cuota debe ser de al menos Q1 (o $1 en proyectos
  en dólares). No se puede poner Q0.

• Al imprimir la cotización, las cuotas personalizadas se
  imprimen tal cual — el cliente ve los montos reales.

• Si cambian de unidad, proyecto o torre, las
  personalizaciones se reinician (igual que el sobreprecio).

• Pueden combinar cuotas personalizadas con sobreprecio
  y descuento — todo funciona junto.

¿Dónde lo encuentro?
─────────────────────
En el cotizador (orion-intelligence.vercel.app/cotizador),
en la tabla de cuotas de enganche, verán el enlace
"Personalizar cuotas" debajo de la tabla.

Cualquier duda, escríbanme un mensaje.
```
