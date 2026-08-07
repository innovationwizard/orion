# Export CRÉDITOS — Pipedrive Puerta Abierta · corte 2026-08-07

Responde a `pipedrive-creditos-data-spec.md`. Generado desde la extracción local completa de Pipedrive
(no desde un export manual de la UI), por lo que **no hay mojibake**: todo es UTF-8 limpio.

> **⚠️ Fecha del dato ≠ fecha del export.** Los archivos se generaron el **2026-08-07**, pero la data
> corresponde al **boundary de extracción 2026-08-05 23:59:59 America/Guatemala**. Pipedrive sigue
> vivo, así que cualquier trato creado o modificado después del 5 de agosto **no** está aquí.

## Archivos

| Archivo | Contenido |
|---|---|
| `creditos_snapshot_2026-08-07.csv` | **Entregable B.** 1,052 filas — un trato por fila, de los 6 embudos de créditos. 46 columnas. |
| `creditos_agregado_2026-08-07.csv` | **Entregable C.** Conteo por `embudo × etapa × estado`. |
| `embudos_y_etapas_2026-08-07.csv` | **Pregunta 1.** Los 15 embudos y sus 133 etapas, verbatim y en orden, con flag `es_credito`. |

Sin filtrar ni limpiar, según lo pedido. Los valores enum vienen resueltos a su etiqueta legible; los
campos monetarios traen `valor moneda`.

## Entregable A (historial de cambios de etapa) — NO DISPONIBLE

**No está en esta extracción.** La extracción capturó el estado *actual* de cada trato, no su bitácora.
Lo que sí hay, y sirve para antigüedad en etapa:

- `fecha_entrada_etapa` (`stage_change_time`) — **poblado en 1,023 / 1,052 tratos (97%)**. Da el tiempo
  en la etapa actual, no la trayectoria completa.
- Fechas de hito por campo custom: `Fecha de Armado de Expediente`, `Fecha Aprobación FHA`,
  `Fecha de Aprobación Banco`, `Suspendido FHA`, `Suspendido Banco`, `Revisión PCV Legal`,
  `Fecha de PCV- Dcto`. Reconstruyen parcialmente la trayectoria del track de crédito.

Para el historial real haría falta una **nueva extracción contra la API en vivo**, deal por deal
(endpoint de flow/updates de Pipedrive). Alcance estimado: **1,052 tratos ⇒ ~1,052 llamadas**, minutos,
muy por debajo del presupuesto diario de 2.7M tokens. Requiere (a) el visto bueno de Jorge para tocar la
API en vivo y (b) verificar el endpoint contra la doc vigente de Pipedrive antes de escribir el código.

## Respuestas a la sección 5

**1. Embudos y etapas.** Ver `embudos_y_etapas_*.csv`. Hay **15 embudos**, de los cuales **6 son de
crédito** — uno más de los 5 proyectos que asume el spec:

| Embudo | id | Etapas | Tratos |
|---|--:|--:|--:|
| Créditos BLV5 | 9 | **12** | 569 |
| Créditos Benestare | 7 | 11 | 246 |
| Créditos Casa Elisa | 11 | 11 | 162 |
| Créditos BLT | 8 | 11 | 74 |
| Créditos Santa Elena | 10 | 11 | 1 |
| Créditos TCA (Torre Cobán) | 18 | 11 | 0 |

Las 11 etapas comunes son: Promesa · Armado de Expediente · Análisis · Suspendido · Re-análisis ·
Aprobación · Expediente Técnico · Resguardo / Resolución · Escritura · Desembolso · Liquidación.
**Créditos BLV5 difiere**: renombró `Expediente Técnico` → `Ingreso E. Técnico / Avalúo` y agregó
`Aprobación E. Técnico / Avalúo` (id 163). Un mapeo por nombre verá dos nombres para lo que antes era
una sola etapa.

**2. Campos custom en tratos de crédito.** Sí existen; los relevantes, con cobertura sobre los 1,052:

| Campo | Poblado | Valores |
|---|--:|---|
| `Tipo de Crédito` **#1** | 293 | FHA 136 · Crédito Directo 81 · Contado 73 · Condado Banco 3 |
| `Tipo de Crédito` **#2** | 285 | FHA 262 · Contado 13 · Crédito directo 9 · Contado banco 1 |
| `Banco Seleccionado` | 214 | G&T Continental 136 · Industrial 43 · BAC 13 · CHN 8 · Banrural 8 |
| `Participantes en Crédito` | 260 | 1 → 189 · 2 → 68 · 3 → 3 |
| `Armado de Expediente` (+fecha) | 218 / 212 | Sí |
| `Aprobación Banco` (+fecha) | 143 / 148 | Sí |
| `Aprobación FHA` (+fecha) | 89 / 89 | Sí |
| `# Caso FHA` | 118 | número de caso |
| `Suspendido FHA` / `Suspendido Banco` | 67 / 10 | fecha |
| `Actualización Papelería vencida` | 3 | Sí |

> 🚩 **`Tipo de Crédito` existe DOS VECES como campos custom distintos**, con listas de opciones
> distintas y erratas cruzadas (`Crédito Directo` vs `Crédito directo`, `Condado Banco` vs
> `Contado banco` — ambas parecen ser "Contado"). Se exportan **por separado** (`#1`, `#2`) sin
> fusionar. Cualquier lectura de "tipo de financiamiento" debe decidir cómo consolidarlos.
> Cobertura conjunta: **≈55%** de los tratos de crédito no declara tipo en ninguno de los dos.

**No hay checklist de papelería como campo estructurado** más allá de `Armado de Expediente` (sí/no) y
`Actualización Papelería vencida`.

**3. ¿Historial exportable en bloque?** No en esta extracción — ver arriba. Vía API sería deal por deal.

**4. ¿"Ganado" = desembolso?** **No.** De los 47 tratos ganados, **46 están en `Armado de Expediente`** y
1 en `Aprobación`. El flag de ganado se marca temprano, al armar el expediente — **no** representa
desembolso ni liquidación. No lo usen como proxy de crédito completado.

> Relacionado y relevante para el HUD: **ningún trato abierto está en `Escritura`, `Desembolso` ni
> `Liquidación`**. Los abiertos se concentran en Promesa (360), Aprobación (121),
> Resguardo/Resolución (67), Armado de Expediente (38), Suspendido (27), Ingreso E. Técnico (19),
> Re-análisis (13), Análisis (11). En la práctica el pipeline deja de registrarse alrededor de
> Resguardo/Resolución; las etapas finales existen pero no se usan.

**5. ¿Contado?** Corre en los **mismos embudos de crédito**, distinguido por `Tipo de Crédito` =
`Contado` (73 + 13 filas entre los dos campos). **No existe** una etapa "Autorización de ventas al
contado" en Pipedrive.

## Sección 6 (BONUS — cumplimiento): NO EXISTE

Se revisaron los **27 campos custom de personas** y los **112 de tratos**. **No hay ningún campo
PEP / CPE / cumplimiento / clasificación de riesgo / debida diligencia.** Los campos de persona son
demográficos y de marketing: Sexo, Edad, Estado Civil, Número de Integrantes en Familia, Tiene Hijos,
Número de Hijos, Nacionalidad, Departamento, Zona/Lugar de Vivienda, Zona de interés, Profesión,
Ingresos, Zona/Lugar de Trabajo, Ingreso Aproximado, Ingreso Real, Desarrollo de Interés,
Mail Marketing, Fuente, Campaign ID/Name, Adset ID/Name, Ad ID/Name, Meta Form ID, Form name, Meta ID.

La data de cumplimiento **no vive en este Pipedrive**. Si existe, está en otro sistema.

## ⚠️ Brecha estructural: las 19 etapas del spec vs. las 11 reales

La lista canónica de 19 etapas asume una granularidad que **Pipedrive no tiene**. Correspondencia:

| Spec | En Pipedrive |
|---|---|
| 1–3 Control de expediente / scanners / promesas | ❌ no existen (lo más cercano: etapa `Promesa`) |
| 4 Armado de expediente (4.1–4.4) | ✅ `Armado de Expediente` — **sin los sub-pasos** |
| 5 Autorización ventas al contado | ❌ no existe (contado = campo, no etapa) |
| 6 Envío a análisis (FHA/Banco) | ✅ `Análisis` — el split FHA/Banco vive en campos, no en etapas |
| 7 Suspendidos | ✅ `Suspendido` |
| 8 Re análisis | ✅ `Re-análisis` |
| 9 Aprobación | ✅ `Aprobación` |
| 10 Expediente técnico | ✅ `Expediente Técnico` (`Ingreso E. Técnico / Avalúo` en BLV5) |
| 11 Aprobación final (resguardo/resolución) | ✅ `Resguardo / Resolución` |
| 12 Escrituración | ⚠️ existe `Escritura` pero **sin tratos** |
| 13–16 Entrega · Firmas · Impuestos · Registro | ❌ no existen |
| 17 Desembolso | ⚠️ existe pero **sin tratos** |
| 18 Liquidación | ⚠️ existe pero **sin tratos** |
| 19 Archivado | ❌ no existe |

Conclusión: **el HUD puede monitorear las etapas 4 y 6–11 con data real.** Las etapas 1–3, 5, 13–16 y 19
no son observables desde Pipedrive, y 12/17/18 están vacías. Si esas fases se gestionan fuera de
Pipedrive (hojas de cálculo, físico), esa es la brecha a cubrir — y "no existe" es la respuesta honesta.
