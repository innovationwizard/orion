# Editar nombre del titular desde Entregas — hallazgos y propuesta

**Fecha:** 2026-09-28
**Alcance:** permitir que `entregas_editor` corrija la ortografía del nombre del titular desde la tarjeta o el modal de `/entregas`.
**Estado:** investigación terminada. **No se ha escrito código ni se ha tocado la base de datos.** Hay 3 decisiones pendientes al final.

---

## 1. De dónde sale el nombre

El nombre que se ve en el tablero **no pertenece a entregas**. La vista `v_entregas_full`
([071_entregas.sql:171](../scripts/migrations/071_entregas.sql#L171)) lo resuelve así:

```sql
cl.full_name AS cliente
...
LEFT JOIN reservation_clients rc ON rc.reservation_id = r.id AND rc.is_primary
LEFT JOIN rv_clients cl          ON cl.id = rc.client_id
```

Cadena completa: `entrega_citas → entregas → reservations → reservation_clients (is_primary) → rv_clients.full_name`

**Consecuencia central:** `rv_clients` es la tabla de clientes de *todo* el sistema de reservas
(766 filas). Corregir un nombre desde Entregas escribe en el mismo registro que usan reservas,
PCV, comisiones, créditos y los portales de ventas. **No existe una copia del nombre local a
entregas.** Esto no es un problema — es lo correcto, un typo debe arreglarse en un solo lugar —
pero significa que esta función *no está contenida dentro de entregas* y debe diseñarse sabiéndolo.

### Dato de producción medido

| Métrica | Valor |
|---|---|
| Filas en `v_entregas_full` | 54 citas |
| Titulares distintos en el tablero | 25 |
| Citas sin titular (`cliente` null) | 0 |
| Citas con copropietarios (`titulares_count > 1`) | 6 (3 reservas) |
| Total `rv_clients` | 766 |
| `rv_clients` ligados a >1 reserva | 32 |

Las 3 reservas con copropietarios:

| Apto | Titular (`is_primary`) | Copropietario (oculto hoy en el tablero) |
|---|---|---|
| 209 | Igor Salazar | Natalí Molina |
| 203 | Edlen Isaí Reyes Matus | Gladys Adelina Reyes Matus |
| 211 | Nery Aroldo Castañeda Cerna | Sara Beatriz Castro Tebalán de Castañeda |

---

## 2. Qué tan malos son los nombres realmente

Corrí heurísticas de formato sobre los 25 nombres del tablero (espacios dobles, TODO MAYÚSCULAS,
todo minúsculas, caracteres raros, espacios al inicio/final):

**0 coincidencias.** Los 25 nombres están bien formateados.

Esto es un hallazgo importante: **los errores que usted reporta no son de formato, son de
ortografía real** — letras cambiadas, acentos faltantes, apellidos mal escritos. Ningún
script los puede detectar ni corregir automáticamente. Requieren juicio humano contra el DPI
o la escritura, que es exactamente por qué pidió una edición manual en la UI.

Observación adicional, revisando la lista contra patrones del español guatemalteco — posibles
candidatos a acento faltante (**no confirmados, requieren cotejo documental**):

- `Ricardo Alberto Vasquez Monterroso` (×2, aptos 304 y 308) → ¿Vásquez?
- `Allan Omar Alvarado Vasquez` → ¿Vásquez?
- `Josue Alejandro Arias Perez` → ¿Josué … Pérez?
- `Antonio Meneses Hernandez` → ¿Hernández?
- `Aracely Abigail Contreras Zuñiga` → ¿Zúñiga?
- `Sergio Velasquez` → ¿Velásquez?
- `Lesly Franzoli Cortez Avila` → ¿Ávila?

No los toqué. Los listo solo para dimensionar el trabajo: parece ser **~7 de 25**, no un
problema masivo. Nótese que `Ricardo Alberto Vasquez Monterroso` aparece en dos apartamentos
(304 y 308) — hay que verificar si son el **mismo** `rv_clients.id` (una corrección arregla
ambos) o dos registros duplicados (dos correcciones, y además un duplicado que limpiar).

---

## 3. Ya existe el endpoint — y ya existe el patrón de UI

**No hay que inventar nada.** El sistema ya sabe editar clientes:

### Endpoint
[`PATCH /api/reservas/admin/clients/[id]`](../src/app/api/reservas/admin/clients/[id]/route.ts)
— actualiza `full_name`, `phone`, `email`, `dpi` sobre `rv_clients`. Valida con
`updateClientSchema` ([validations.ts:72](../src/lib/reservas/validations.ts#L72)), que ya
exige `full_name` no vacío.

**Está cerrado a `rolesFor("clients", "update")` = `A` = `["master", "torredecontrol"]`**
([permissions.ts:124-127](../src/lib/permissions.ts#L124-L127)). `entregas_editor` recibe 403 hoy.

### Patrón de UI
[`reservation-detail.tsx:100-160`](../src/app/admin/reservas/reservation-detail.tsx#L100-L160)
ya implementa edición inline de cliente: `startEditClient` carga el formulario, `saveClient`
manda solo los campos que cambiaron (diff contra el original), y si no cambió nada cierra sin
llamar al API. Ese comportamiento de diff es el correcto y conviene copiarlo, no reescribirlo.

---

## 4. Los tres obstáculos reales

### 4.1 La vista no expone `client_id` — bloqueante

`v_entregas_full` devuelve `cliente` (el texto) pero **nunca el `rv_clients.id`**. El endpoint
de edición se direcciona por id. Hoy el tablero no tiene forma de decir *a quién* editar.

Opciones:
- **(a)** Agregar `cl.id AS cliente_id` a la vista. Una línea, cambio aditivo, no rompe nada
  — las vistas de Postgres devuelven columnas por nombre y ningún consumidor usa `SELECT *`
  posicional. Requiere migración (`CREATE OR REPLACE VIEW`).
- **(b)** Que el cliente haga un fetch extra a `reservation_clients` al abrir el modal.
  Evita la migración pero suma un round-trip y lógica que la vista ya podría dar resuelta.

**Recomiendo (a).** Es el cambio más pequeño y deja el dato donde corresponde.

### 4.2 Los permisos no alcanzan — decisión suya

`entregas_editor` no tiene `clients.update`. Tres caminos, de menor a mayor alcance:

| Opción | Qué implica | Riesgo |
|---|---|---|
| **A. Endpoint nuevo acotado** `PATCH /api/entregas/titular/[clientId]` con gate `entregas`+`update`, que **solo** acepta `full_name` y **solo** si ese cliente es titular de una unidad con entrega agendada | Isaac corrige nombres del tablero y nada más. No toca teléfono, email ni DPI. No puede tocar los otros 741 clientes que no están en entregas. | **Mínimo.** Recomendado. |
| **B. Agregar `entregas_editor` a `clients.update`** | Reusa el endpoint existente, cero código nuevo | Le da acceso de escritura a **los 766 clientes** del sistema y a `phone`/`email`/`dpi`, no solo a los 25 del tablero. Desproporcionado para arreglar acentos. |
| **C. Recurso nuevo `client_names` en la matriz** | Más limpio conceptualmente | Más piezas para un caso de uso de un solo campo. Overkill hoy. |

**Recomiendo A.** Es la única que mantiene el privilegio proporcional al problema. El costo
extra es ~40 líneas de route handler.

### 4.3 RLS de `rv_clients` no tiene política de UPDATE — verificar

[040_ventas_ownership_rls.sql:59](../scripts/migrations/040_ventas_ownership_rls.sql#L59) crea
`"Role-scoped read rv_clients"` **solo `FOR SELECT`**. No encontré ninguna política
`FOR UPDATE` sobre `rv_clients` en las migraciones.

Esto **no rompe** la propuesta: todas las rutas usan `createAdminClient()` (service_role), que
salta RLS por diseño. Pero significa que la autorización vive **únicamente** en la capa de API.
Es consistente con cómo ya funciona el endpoint de admin hoy, así que no introduce una
desviación nueva — solo conviene tenerlo consciente y documentado.

> ⚠️ **Corrección a la documentación existente:** la migración
> [072_entregas_editor_role.sql](../scripts/migrations/072_entregas_editor_role.sql) dice en su
> cabecera que «`torredecontrol` pasa a SOLO LECTURA en entregas» y define sus políticas RLS con
> `jwt_role() IN ('master', 'entregas_editor')`. Pero
> [permissions.ts:71](../src/lib/permissions.ts#L71) tiene `EW = ["master", "torredecontrol", "entregas_editor"]`.
> **La matriz de la app y el RLS divergen**, justo lo que esa migración advierte que no debe pasar.
> Hoy no se manifiesta porque las rutas usan service_role y RLS nunca se evalúa. Es una bomba de
> tiempo si alguna ruta migra a cliente con sesión de usuario. **Fuera del alcance de esta tarea,
> pero conviene decidir cuál de las dos es la intención real.**
>
> En la misma línea: 4 docblocks de rutas dicen `Auth: master + entregas_editor` y omiten
> `torredecontrol` ([route.ts:60](../src/app/api/entregas/route.ts#L60),
> [candidatos/route.ts:82](../src/app/api/entregas/candidatos/route.ts#L82),
> [citas/[id]/route.ts:30](../src/app/api/entregas/citas/[id]/route.ts#L30) y
> [:203](../src/app/api/entregas/citas/[id]/route.ts#L203)).

---

## 5. UI/UX — la opción más simple

Investigué el patrón y la conclusión es **editar en el modal, no en la tarjeta.**

### Por qué no en la tarjeta

La tarjeta del tablero ([entregas-client.tsx:866](../src/app/entregas/entregas-client.tsx#L866))
es una celda de una cuadrícula semanal densa. Meter un input ahí:
- rompe la altura de la fila y descuadra la semana completa;
- invita al clic accidental mientras se navega el cronograma;
- obliga a resolver guardado/cancelado/error en un espacio de ~200px.

Un typo de ortografía es una tarea **rara y deliberada** (7 nombres, una vez). No merece
ocupar espacio permanente en la vista de trabajo diaria.

### El modal ya tiene modo de edición — hay que usarlo, no agregar otro

Confirmado en el código: el modal ya opera en dos modos
([entregas-client.tsx:1262](../src/app/entregas/entregas-client.tsx#L1262)). El botón
**«Editar»** ([:1320](../src/app/entregas/entregas-client.tsx#L1320)) hace `setEditing(true)`
y cambia la vista de lectura por un formulario de fecha / hora / alcance / reprogramación.
Ese botón ya está detrás de `canEdit`.

**Esto descarta el lápiz junto al título que había propuesto antes.** Habría dos maneras
distintas de editar la misma tarjeta: un lápiz que guarda solo el nombre y un botón «Editar»
que guarda el resto. Dos flujos, dos estados de guardado, dos sitios donde mirar. La opción
verdaderamente minimalista es **agregar el nombre como un campo más del formulario que ya existe.**

```
Modo lectura (hoy)                    Modo edición (propuesto)
┌────────────────────────────┐        ┌────────────────────────────────────┐
│ Narvesters Gabriell …  ✎?  │        │ Titular                            │  ← campo NUEVO,
│ Apartamento 216 · Principal│        │ ┌────────────────────────────────┐ │    primero del form
│                            │   →    │ │ Narvesters Gabriell Moreno Ce… │ │
│ Fecha        1 oct 2026    │        │ └────────────────────────────────┘ │
│ Hora            10:30 a.m. │        │ Cambia el nombre en todo el        │
│ Tipo de pago      Contado  │        │ sistema, no solo en entregas.      │
│ …                          │        ├────────────────────────────────────┤
│ [Editar] [Eliminar…] [Cerrar]       │ Fecha          │ Hora              │  ← lo que ya existe
└────────────────────────────┘        │ Aplicar a…     │ ¿Reprogramada?    │
                                      │        [Cancelar]  [Guardar]       │
                                      └────────────────────────────────────┘
```

Por qué esto es lo más simple:
- **Cero elementos nuevos en modo lectura.** La tarjeta que usted mostró no cambia de aspecto.
- **Un solo botón «Guardar»**, un solo estado `saving`, un solo lugar donde puede fallar.
- Reusa `canEdit`, que el modal **ya recibe** ([page.tsx:43](../src/app/entregas/page.tsx#L43)).
  No hay props nuevas.
- El campo va **primero** en el formulario: es lo que el usuario vino a arreglar y evita que
  tenga que buscarlo debajo de fecha/hora.

Detalle de implementación que sí importa:
- El nombre y la cita viven en **tablas distintas** (`rv_clients` vs `entrega_citas`). Un solo
  «Guardar» dispara potencialmente dos llamadas. Deben ser **independientes y con diff**: si
  solo cambió el nombre, no se toca la cita (y no se dispara el contador de reprogramaciones);
  si solo cambió la fecha, no se llama al endpoint de nombre. Es el mismo patrón de diff de
  `saveClient` ([reservation-detail.tsx:124-140](../src/app/admin/reservas/reservation-detail.tsx#L124-L140)).
- Si la llamada del nombre falla y la de la cita funciona (o al revés), el mensaje de error debe
  decir **qué sí se guardó**. No hay transacción entre las dos.
- Tras guardar, el nombre aparece en **varias citas de la misma unidad** (escritura + llaves).
  Hay que actualizar todas las que compartan ese `cliente_id`, no solo la abierta.

**Costo estimado:** ~1 columna en la vista, ~40 líneas de endpoint, ~45 líneas de UI (menos que
el lápiz, porque no hay un segundo flujo de guardado). Sin dependencias nuevas, sin refactor del
monolito de 2002 líneas.

---

## 6. Qué NO incluye esta propuesta

Deliberadamente fuera de alcance, para no ampliar el privilegio más de lo pedido:

- **Editar copropietarios.** Hoy el tablero solo muestra el titular `is_primary`. Los 3
  copropietarios (Natalí Molina, Gladys Adelina Reyes Matus, Sara Beatriz Castro Tebalán) no
  son visibles ni editables. Si también tienen typos, hace falta decidirlo aparte — cambia la
  UI de un campo a una lista.
- **Editar teléfono, email o DPI.** Usted pidió nombres.
- **Crear o borrar clientes.** Fuera de alcance.
- **Corrección masiva por script.** Los errores son ortográficos y requieren cotejo documental
  uno por uno.

---

## 7. Auditoría — hueco que conviene cerrar de paso

El endpoint de clientes existente **no llama a `logAudit`**. Un cambio de nombre de titular es
exactamente lo que se quiere poder rastrear después ("¿quién cambió esto y cuándo?"),
especialmente si el nombre va en una escritura.

El endpoint nuevo debería registrar `entrega.titular_renombrado` con `{ antes, después,
client_id, unit_number }`. El patrón ya está en uso en
[`/api/entregas` POST](../src/app/api/entregas/route.ts#L224-L242). Costo: 8 líneas.

---

## 8. Preguntas antes de implementar

1. **¿Opción A (endpoint acotado, solo `full_name`, solo titulares con entrega) o B (dar
   `clients.update` a `entregas_editor`)?** — Recomiendo A. B es 20 minutos menos de trabajo
   pero abre los 766 clientes.

2. **¿Incluir copropietarios?** Son 3 personas en 3 apartamentos. Si sus nombres también están
   mal, decirlo ahora cambia la UI de "un campo" a "una lista de titulares" (~30 líneas más).

3. **¿`Ricardo Alberto Vasquez Monterroso` en 304 y 308 es la misma persona?** Si es un solo
   `rv_clients.id`, una corrección arregla ambos apartamentos. Si son dos registros, hay un
   duplicado que probablemente también quiera consolidar. Puedo verificarlo en un minuto si
   quiere.

---

## Apéndice — archivos relevantes

| Archivo | Rol |
|---|---|
| [scripts/migrations/071_entregas.sql](../scripts/migrations/071_entregas.sql) | Define `v_entregas_full`; aquí se agrega `cliente_id` |
| [scripts/migrations/072_entregas_editor_role.sql](../scripts/migrations/072_entregas_editor_role.sql) | RLS del rol; divergencia con la matriz |
| [src/lib/permissions.ts](../src/lib/permissions.ts) | Matriz de permisos; `EW` línea 71 |
| [src/lib/entregas/types.ts](../src/lib/entregas/types.ts) | `EntregaCitaFull`; agregar `cliente_id` |
| [src/app/entregas/entregas-client.tsx](../src/app/entregas/entregas-client.tsx) | Tablero; modal en 1258, tarjeta en 866 |
| [src/app/api/reservas/admin/clients/[id]/route.ts](../src/app/api/reservas/admin/clients/[id]/route.ts) | Endpoint existente de edición |
| [src/app/admin/reservas/reservation-detail.tsx](../src/app/admin/reservas/reservation-detail.tsx) | Patrón de edición inline a copiar (100-160) |
| [src/lib/reservas/validations.ts](../src/lib/reservas/validations.ts) | `updateClientSchema` línea 72 |
