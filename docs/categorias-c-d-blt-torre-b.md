# Categorías C y D — BLT Torre B: Inventario Completo por Unidad

> **SUPERSEDED (2026-03-20):** Per authoritative correction from the project owner, only **3 confirmed sales** exist in BLT Torre B as of 2026-03-20 (point-in-time figure — this count will grow as new sales are recorded). The 58 rows in "INFO PARA REPORTES" and the 13 orphan income markers below do NOT represent real sales. All BLT Torre B transactional data will be purged from the production database and only the 3 confirmed sales will be loaded manually. This document is preserved as historical reference only. See `docs/creditos-33-units-investigation.md` for the authoritative correction.

**Fecha:** 2026-03-20
**Proyecto:** Bosque Las Tapias — Torre B
**Contexto:** Consolidación de toda la información disponible para las 24 unidades clasificadas en Categoría C (Reservaciones Ocultas) y Categoría D (Marcadores de Ingreso Huérfanos), extraída del documento de investigación de las 33 unidades con datos de crédito.

**Fuentes consultadas:**
- `docs/creditos-33-units-investigation.md` (documento de investigación)
- `pacreditos/scripts/data.json` (salida del script de extracción — hoja principal "BASE DE DATOS TORRE B")
- `scripts/seed_prod.sql` (datos físicos cargados a `rv_units`)
- Base de datos de producción (Supabase)
- Excel fuente: hoja "INFO PARA REPORTES" (según lo reportado en la investigación)

---

# Categoría C: Reservaciones Ocultas (11 unidades)

**Explicación:** Estas 11 unidades tienen compradores reales con nombres completos, DPIs y co-compradores en la hoja "INFO PARA REPORTES" del Excel de BLT. Sin embargo, la hoja principal "BASE DE DATOS TORRE B" tiene las columnas de vendedor y cliente completamente vacías. El script de extracción (`extract_data.py`) solo lee la hoja principal, y el script de backfill de reservaciones nunca cargó datos de BLT Torre B. **Resultado: estos 11 clientes NO existen en la base de datos de producción.** Las unidades aparecen como DISPONIBLE cuando en realidad tienen comprador.

---

## Unidad 102

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Cristina Estefania Villagran Marroquin |
| Excel "INFO PARA REPORTES" | Cliente 2 (co-comprador) | Jose Manuel Villagran Barrios |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | C |
| data.json | Nivel | 1 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client (hoja principal) | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 (ninguna) |
| DB prod | Clientes | No existen en rv_clients |

---

## Unidad 103

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Juan Luis Pinto Gomez de Liano |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | X (sí) |
| data.json (hoja principal) | Modelo | C |
| data.json | Nivel | 1 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia, Negocio Propio |
| data.json | Banco | null |
| data.json | FHA | true |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 105

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Laura Annabella Castro Guerra |
| Excel "INFO PARA REPORTES" | Cliente 2 (co-comprador) | Juan Pablo Matheu Morales |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | A |
| data.json | Nivel | 1 |
| data.json | Area | 43.13 m² |
| data.json | Habitaciones | 2 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q581,100 |
| data.json | Enganche | Q40,700 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q540,400 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 202

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Angel Roberto Sic Garcia |
| Excel "INFO PARA REPORTES" | Cliente 2 (co-comprador) | Angel Eduardo Sic Morales |
| Excel "INFO PARA REPORTES" | FHA | X (sí) |
| data.json (hoja principal) | Modelo | C |
| data.json | Nivel | 2 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | true |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 203

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Ana Cristina Velasquez Aguilar de Gomez |
| Excel "INFO PARA REPORTES" | Cliente 2 (co-comprador) | Rene Ubaldo Gomez Aguilar |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | C |
| data.json | Nivel | 2 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Negocio Propio |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 204

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Alfonso Javier Miranda Roman |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | X (sí) |
| data.json (hoja principal) | Modelo | B |
| data.json | Nivel | 2 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Negocio Propio |
| data.json | Banco | null |
| data.json | FHA | true |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 205

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Elfego Adonias Apen Son |
| Excel "INFO PARA REPORTES" | Cliente 2 (co-comprador) | Dany Alexis Gomez Ajuchan |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | A |
| data.json | Nivel | 2 |
| data.json | Area | 43.13 m² |
| data.json | Habitaciones | 2 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q581,100 |
| data.json | Enganche | Q40,700 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q540,400 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 301

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Hector Enrique Zacarias Illescas |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | X (sí) |
| data.json (hoja principal) | Modelo | B |
| data.json | Nivel | 3 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | true |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 304

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Luis Alfonso Ramirez Rivas |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | B |
| data.json | Nivel | 3 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 305

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Carol Anali Ovalle Valladares |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | A |
| data.json | Nivel | 3 |
| data.json | Area | 43.13 m² |
| data.json | Habitaciones | 2 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q581,100 |
| data.json | Enganche | Q40,700 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q540,400 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

## Unidad 401

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente 1 | Hector Rene Guzman Moran |
| Excel "INFO PARA REPORTES" | Cliente 2 | Sin co-comprador |
| Excel "INFO PARA REPORTES" | FHA | No |
| data.json (hoja principal) | Modelo | B |
| data.json | Nivel | 4 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status (hoja principal) | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | Relacion Dependencia |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |
| DB prod | Clientes | No existen |

---

**Nota importante sobre Categoría C:** La hoja "INFO PARA REPORTES" también contiene DPIs, lugar de trabajo y salario para estos clientes. Esos datos adicionales existen solo en el Excel fuente y no están reflejados en data.json porque el script de extracción nunca lee esa hoja.

---

# Categoría D: Marcadores de Ingreso Huérfanos (13 unidades)

**Explicación:** Estas 13 unidades tienen marcadores de fuente de ingreso (incomeSource) en la hoja principal "BASE DE DATOS TORRE B", pero no tienen datos de cliente en ninguna hoja — ni en la principal, ni en "INFO PARA REPORTES". No se sabe a quién pertenecen estos datos de ingreso. Las posibilidades son: consultas de pre-calificación que nunca llegaron a reserva, desistimientos anteriores a la creación de la hoja de reportes, o datos de plantilla/proyección. No deben cargarse a la base de datos sin confirmación de Patty.

---

## Unidad 104

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece en esta hoja |
| data.json (hoja principal) | Modelo | B |
| data.json | Nivel | 1 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| data.json | Contado | false |
| data.json | Promesa Firmada | false |
| data.json | Cuotas Enganche | null |
| rv_units (DB prod) | Status | AVAILABLE |
| DB prod | Reservaciones | 0 |

---

## Unidad 106

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 1 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 107

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | C |
| data.json | Nivel | 1 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia, Negocio Propio** |
| data.json | Banco | null |
| data.json | FHA | **true** |
| DB prod | Reservaciones | 0 |

---

## Unidad 108

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | C |
| data.json | Nivel | 1 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | **true** |
| DB prod | Reservaciones | 0 |

---

## Unidad 109

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 1 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia, Negocio Propio** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 201

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 2 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | **true** |
| DB prod | Reservaciones | 0 |

---

## Unidad 206

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 2 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 209

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 2 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 303

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | C |
| data.json | Nivel | 3 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 306

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 3 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 307

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | C |
| data.json | Nivel | 3 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Unidad 308

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | C |
| data.json | Nivel | 3 |
| data.json | Area | 55.14 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Relacion Dependencia, Servicios Profesionales** |
| data.json | Banco | null |
| data.json | FHA | **true** |
| DB prod | Reservaciones | 0 |

---

## Unidad 309

| Fuente | Campo | Valor |
|---|---|---|
| Excel "INFO PARA REPORTES" | Cliente | No aparece |
| data.json | Modelo | B |
| data.json | Nivel | 3 |
| data.json | Area | 54.98 m² |
| data.json | Habitaciones | 3 |
| data.json | Parqueo | 1 |
| data.json | Status | DISPONIBLE |
| data.json | Vendor / Client | null / null |
| data.json | Valor Inmueble | Q668,000 |
| data.json | Enganche | Q46,800 |
| data.json | Reserva | Q3,000 |
| data.json | Financiamiento | Q621,200 |
| data.json | Fuente de Ingreso | **Economia Informal** |
| data.json | Banco | null |
| data.json | FHA | false |
| DB prod | Reservaciones | 0 |

---

## Resumen de fuentes de ingreso — Categoría D

| Unidad | Fuente de Ingreso | FHA |
|---|---|---|
| 104 | Relacion Dependencia | No |
| 106 | Relacion Dependencia | No |
| 107 | Relacion Dependencia, Negocio Propio | Sí |
| 108 | Relacion Dependencia | Sí |
| 109 | Relacion Dependencia, Negocio Propio | No |
| 201 | Relacion Dependencia | Sí |
| 206 | Relacion Dependencia | No |
| 209 | Relacion Dependencia | No |
| 303 | Relacion Dependencia | No |
| 306 | Relacion Dependencia | No |
| 307 | Relacion Dependencia | No |
| 308 | Relacion Dependencia, Servicios Profesionales | Sí |
| 309 | Economia Informal | No |

**Observación:** La unidad 309 es la única con fuente de ingreso "Economía Informal" — un tipo de ingreso distinto que podría indicar un comprador real (no datos de plantilla). La unidad 308 tiene "Servicios Profesionales", también un tipo poco común para ser marcador genérico. Estas dos unidades podrían merecer atención prioritaria en la revisión con Patty.

---

## Incertidumbre declarada

No tengo acceso al contenido completo de la hoja "INFO PARA REPORTES" del Excel fuente — solo a lo que el documento de investigación reporta. Es posible que esa hoja contenga datos adicionales (DPIs, salarios, lugares de trabajo) para las unidades de Categoría C que no están reflejados aquí. Tampoco puedo confirmar si las 13 unidades de Categoría D tienen datos en alguna otra hoja o fuente no documentada.
