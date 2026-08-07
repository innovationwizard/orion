# Spec de datos: CRÉDITOS desde Pipedrive

**Para:** una conversación de Claude Code con acceso al download/export de Pipedrive de Puerta Abierta Inmobiliaria.
**Objetivo:** extraer la data necesaria para el monitoreo agregado del pipeline de créditos (expedientes) en el HUD de la app Orion. Este documento es autocontenido — no se necesita contexto del otro proyecto.

---

## 1. Contexto de negocio

Puerta Abierta vende apartamentos/casas en 5 proyectos: **Benestare, Bosque Las Tapias, Boulevard 5, Casa Elisa, Santa Elena**. Cada venta financiada genera un **expediente de crédito** que avanza por un pipeline de 19 etapas (abajo). El financiamiento tiene 3 tracks: **FHA**, **Banco**, y **Contado** (contado corre el mismo pipeline saltando las etapas bancarias).

Queremos **monitoreo agregado** (conteos por etapa, tiempos, cuellos de botella) — NO un tracker por expediente individual. Pero la data cruda por trato es bienvenida: nosotros agregamos.

## 2. Las 19 etapas del expediente (lista canónica)

Mapear las etapas reales de Pipedrive contra esta lista. Los sub-números `.1/.2` en etapas 6–11 son el split FHA/Banco (una dimensión, no etapas aparte).

1. Control de expediente inicial — check list de papelería
2. Control de scanners de expediente inicial
3. Control de Promesas de compraventa — físicos, digital, scanner
4. Armado de expediente (4.1 solicitud de papelería, 4.2 recolección, 4.3 llenado de formularios, 4.4 firma de documentos)
5. Autorización de ventas al contado
6. Envío a análisis (6.1 FHA, 6.2 Banco)
7. Suspendidos (7.1 FHA, 7.2 Banco) — estado de excepción
8. Re análisis (8.1 FHA, 8.2 Banco) — retorno tras suspensión
9. Aprobación (9.1 FHA, 9.2 Banco)
10. Expediente técnico (10.1 FHA, 10.2 Avalúo Banco)
11. Aprobación final (11.1 resguardo, 11.2 resolución bancaria)
12. Escrituración (12.1 facturación)
13. Entrega
14. Recaudación de firmas
15. Pago de impuestos
16. Ingreso al registro
17. Desembolso
18. Liquidación (18.1 entrega de testimonio al cliente)
19. Archivado

## 3. Lo que ya sabemos de este Pipedrive (para orientarte)

- Existe al menos un embudo llamado **"Créditos BLV5"** (créditos de Boulevard 5) y otro **"Boulevard5"** (comercial). Sospechamos que hay embudos "Créditos X" por proyecto — **confirmar y listar todos los embudos y sus etapas verbatim**.
- Un export de deals que ya recibimos trae estas columnas: `Trato - Título` (nombre del cliente), `Valor del trato`, `# Apartamento`, `Valor Promoción`, `Embudo`, `Propietario`, `Estado`, `Trato creado el`, `Fecha de cierre prevista`, `Valor Vale`.
- Un export de actividades ("insights list") trae: `Asunto`, `Tipo`, `Asignado al usuario`, `Estado`, `Fecha de añadición`, `Fecha de vencimiento`, `Trato`, `Proyecto`, `Fuente - Trato`, `Fuente - Persona`, `[Meta] Campaign Name`, `[Meta] Ad Name`, `Etapa`.
- Ojo con el encoding: los CSV que hemos recibido vienen en mojibake (UTF-8 leído como Latin-1: "TÃ­tulo"). Exportar como UTF-8 limpio si es posible.

## 4. Entregables, en orden de valor

### A. Historial de cambios de etapa (el premio gordo)
Por cada trato de los embudos de créditos: `deal_id, titulo, embudo, etapa_origen, etapa_destino, timestamp_del_cambio`.
Con esto calculamos tiempos de ciclo, antigüedad en etapa y cuellos de botella reales. En Pipedrive esto vive en el flow/updates de cada deal ("Deal stage changed"). Si solo es accesible deal por deal, un muestreo amplio también sirve — decirnos el alcance.

### B. Snapshot de estado actual por trato (mínimo indispensable)
Un CSV/JSON con una fila por trato de TODOS los embudos de créditos (todos los proyectos):

| Campo | Notas |
|---|---|
| `deal_id` | id de Pipedrive |
| `titulo` | nombre del cliente |
| `embudo` | nombre exacto del pipeline |
| `etapa` | nombre exacto de la etapa actual |
| `estado` | abierto / ganado / perdido |
| `apartamento` | # de unidad |
| `proyecto` | si existe como campo aparte del embudo |
| `propietario` | responsable del trato |
| `valor` | valor del trato |
| `creado_el` | fecha de creación |
| `fecha_entrada_etapa` | cuándo entró a la etapa actual (si existe — crítico para antigüedad) |
| `fecha_cierre_prevista` | |
| `tipo_financiamiento` | FHA / Banco / Contado — probablemente un campo custom; si no existe, decirnos cómo se distingue |
| `fecha_ganado_perdido` | si aplica |
| `motivo_perdido` | si aplica |

### C. Si A y B no son viables: agregado por etapa
Conteo de tratos por `embudo × etapa × estado`, con fecha del corte. Es lo mínimo para encender el HUD.

## 5. Preguntas que necesitamos respondidas (aunque no haya export)

1. Lista completa de embudos y, por cada uno, sus etapas **verbatim y en orden**.
2. ¿Qué campos custom existen en los deals de créditos? (buscamos: tipo de financiamiento, banco, FHA, clasificación del cliente, checklist de papelería)
3. ¿El historial de cambios de etapa es exportable en bloque, o solo por deal?
4. ¿Los tratos "ganados" de créditos equivalen a desembolso/liquidación, o a otra cosa?
5. ¿Cómo se registran los expedientes de **contado** (etapa 5)? ¿Mismo embudo u otro?

## 6. BONUS (opcional, mismo origen): data de CUMPLIMIENTO

Si el mismo Pipedrive lo tiene, en el mismo viaje:
- Clasificación de clientes **Normal / PEP / CPE** (¿campo custom? ¿en qué entidad — persona o trato?)
- Status de **expedientes de cumplimiento** por proyecto, y archivados (aprobado vs desistido)
- Cualquier campo/etiqueta de "caso específico" o debida diligencia

## 7. Formato de entrega

- CSV UTF-8 (o JSON) — un archivo por embudo está bien.
- Incluir **fecha del export** en el nombre del archivo o en una columna.
- No filtrar ni limpiar: preferimos la data cruda con todo y suciedad — nosotros la inspeccionamos y normalizamos (y las inconsistencias nos interesan tanto como los datos).
- Si algo de lo pedido no existe o no es accesible, decirlo explícitamente en un README corto — "no existe" es una respuesta valiosa.
