import type { HudArea } from "../hud/areas";

/**
 * ODOO HUD — migration-readiness tracker for the Odoo v19 migration.
 * Same structure as the PAI HUD, different semantics per status:
 *   COMPLETA      — source secured: the data exists in at least one system
 *                   (Orion DB / Pipedrive extraction / Odoo v15 extraction /
 *                   linked snapshots) with known join keys, ready to ETL.
 *   SIN_VISTA     — partial: data exists but incomplete (single project,
 *                   documents-not-fields, needs OCR/heuristics/backup).
 *   NO_VINCULADA  — no source: no system holds it; new-data-capture problem.
 * Source tags in notes: [APP] app DB + linked snapshots · [PIPEDRIVE]
 * extraction at 2026-08-09 · [ODOO15] extraction at 2026-06-25/2026-08-10.
 */
export const ODOO_HUD_AREAS: HudArea[] = [
  {
    key: "mercadeo",
    label: "MERCADEO",
    sections: [
      {
        key: "resumen",
        label: "Resumen",
        requirements: [
          {
            id: "k1",
            label: "Reporte maestro",
            status: "COMPLETA",
            note: "[APP] tiene el Excel FUENTE de Meta Ads (9,329 filas, 2024-07→2026-08, con columna Divisa) + el dashboard Power BI reconstruido + pipeline de regeneración. Esto responde la recomendación #2 del agente Pipedrive ('a Meta Ads export would unlock AREA 2') — ya lo tenemos. Join a [PIPEDRIVE] por nombre de campaña (los IDs de Meta viven en PD; el Excel trae nombres — join por nombre, no por ID).",
          },
        ],
      },
      {
        key: "leads-metas",
        label: "Leads y Metas",
        requirements: [
          {
            id: "k2",
            label: "Meta mensual de lead",
            status: "COMPLETA",
            note: "[APP] rangos mensuales en DB (migración 069) + actuals del snapshot Meta. [PIPEDRIVE] sin targets (Goals vacío) pero actuals FULL (81,441 deals con add_time a precisión de segundo, 2022→2026 — serie más larga que la de Meta).",
          },
          {
            id: "k3",
            label: "Meta diaria de lead",
            status: "COMPLETA",
            note: "Derivado del mensual [APP] + granularidad diaria disponible en ambas fuentes de actuals.",
          },
        ],
      },
      {
        key: "presupuesto",
        label: "Presupuesto de Pauta",
        requirements: [
          {
            id: "k4",
            label: "Uso de presupuesto diario de pauta",
            status: "COMPLETA",
            note: "[APP] gasto diario por cuenta con divisa REAL (hallazgo: columna 'USD' mezclaba GTQ/USD; 4 cuentas GTQ Q150K + 2 USD $110K). [PIPEDRIVE]/[ODOO15] cero data de gasto (v15: solo proxy débil de facturas a proveedores). Solo Meta — TikTok corre (330 leads en PD) sin data de gasto en ningún sistema; Google Ads no aparece en NINGUNA fuente (¿corre sin taggear o no corre? — confirmar).",
          },
          {
            id: "k5",
            label: "Uso de presupuesto mensual de pauta",
            status: "COMPLETA",
            note: "[APP] tabla Presupuesto (29 filas: mes/proyecto/concepto/proveedor/inversión) + gasto mensual del snapshot Meta.",
          },
          {
            id: "k10",
            label: "Evolución de inversiones acumulada mensual",
            status: "COMPLETA",
            note: "[APP] serie 2024-07→2026-08 suficiente para curvas acumuladas, por cuenta y divisa.",
          },
        ],
      },
      {
        key: "costos-retorno",
        label: "Costos y Retorno",
        requirements: [
          {
            id: "k6",
            label: "ROAS / ROI",
            status: "COMPLETA",
            note: "[APP] ya computado y desplegado: gasto (divisa real) vs ventas no canceladas, FX fijo Q7.75/USD, amplio 361x / atribuido 95x. Metodología y fuentes migran tal cual.",
          },
          {
            id: "k7",
            label: "Costo por cierre / medio de venta",
            status: "COMPLETA",
            note: "[APP] cierres por fuente (reservations.lead_source) + gasto por canal. [PIPEDRIVE] corrobora el lado lead con su catálogo Fuente.",
          },
          {
            id: "k9",
            label: "Evolución de costos por lead mensual",
            status: "COMPLETA",
            note: "[APP] CPL mensual del snapshot (leads netos de la campaña con columna mal mapeada — 104,290 'leads' falsos excluidos, hallazgo de la propia auditoría del artifact).",
          },
        ],
      },
      {
        key: "campanas",
        label: "Campañas",
        requirements: [
          {
            id: "k8",
            label: "Efectividad de campañas",
            status: "COMPLETA",
            note: "[APP] grano campaña×mes (458 filas: leads/gasto/clics/impresiones). [PIPEDRIVE] IDs de Meta (campaign/adset/ad/form/lead) en 29,205 deals — el join directo a plataforma que permite atribuir hasta la reserva. TikTok: 330 deals con IDs, sin gasto.",
          },
        ],
      },
      {
        key: "canales-digitales",
        label: "Canales Digitales",
        requirements: [
          {
            id: "k11",
            label: "Operatividad de canales digitales",
            status: "COMPLETA",
            note: "[PIPEDRIVE] catálogo + flujos observados: Meta dominante (~30K), Wati WhatsApp (12K en combinación), web (6.9K), TikTok marginal (330). Google Ads AUSENTE en toda fuente — pregunta abierta. La visibilidad operativa en vivo sigue en la herramienta de mercadeo (decisión previa de Jorge).",
          },
        ],
      },
    ],
  },
  {
    key: "ventas",
    label: "VENTAS",
    sections: [
      {
        key: "resumen",
        label: "Resumen",
        requirements: [
          {
            id: "v1",
            label: "Ventas totales",
            status: "COMPLETA",
            note: "[APP] RESUELVE la alerta #1 de ambos agentes ('no reserva object exists'): Orion ES el sistema de registro de reservas — DB master desde 2026-03-01, 646 CONFIRMED + 74 DESISTED, más tabla sales (2021→2026) con fechas de promesa. [PIPEDRIVE] 140 deals en etapa Reserva y 55 won NO son el ledger (94.4% de 81,441 deals son leads muertos). [ODOO15] facturas ≠ ventas (cuotas, ~19× overcount). ETL de ventas parte de Orion.",
          },
        ],
      },
      {
        key: "objetivos",
        label: "Objetivos",
        requirements: [
          {
            id: "v2",
            label: "Ventas versus objetivos — totales y por asesor",
            status: "COMPLETA",
            note: "[APP] Metas vigentes en projects.meta_mensual_por_asesor (migración 068) + asesores unificados (33, salespeople) + atribución por reserva. [PIPEDRIVE] Goals endpoint vacío; owner_id completo (18 owners) como corroboración. [ODOO15] nada (0.05% de partners con vendedor). Caveat: solo metas ACTUALES — no existe serie histórica de metas en ningún sistema.",
          },
          {
            id: "v3",
            label: "Status de ventas — déficit/excedente vs fecha de cierre",
            status: "COMPLETA",
            note: "[APP] Computable hoy: metas + towers.delivery_date + producción mensual. [PIPEDRIVE]/[ODOO15] sin fechas de entrega por proyecto/torre — Orion es la única fuente.",
          },
        ],
      },
      {
        key: "canales",
        label: "Canales y Conversión",
        requirements: [
          {
            id: "v4",
            label: "Ventas por canales",
            status: "COMPLETA",
            note: "[APP] reservations.lead_source + catálogo lead_sources (free-text sucio: 29 variantes, 343 nulls históricos). [PIPEDRIVE] catálogo Fuente limpio de 16 opciones en 60.2% de deals — PERO es multi-valor (set): 'Meta Ads|Formulario Meta' — el conteo ingenuo duplica. Migración: normalizar ambos catálogos a uno solo en v19.",
          },
          {
            id: "v8",
            label: "Funnel Leads → Reserva → PCV firmada",
            status: "SIN_VISTA",
            note: "Cada etapa tiene fuente asegurada: leads [PIPEDRIVE] 81,441 deals con add_time + [APP] snapshot Meta 59,504; reservas [APP]; PCV [APP] sales.promise_signed_date + escaneadas [ODOO15]. LO NO RESUELTO: el vínculo lead→reserva entre sistemas (deal↔reserva no comparten llave; el match por persona es fuzzy nombre/teléfono). El funnel agregado es computable; la trazabilidad individual no.",
          },
        ],
      },
      {
        key: "inventario",
        label: "Inventario",
        requirements: [
          {
            id: "v6",
            label: "Inventario general: vendido, congelado, disponible",
            status: "COMPLETA",
            note: "[APP] es el unit master canónico para v19: 901 unidades × 5 proyectos con FK reales + unit_status_log (585 cambios de status desde mar-2026). [PIPEDRIVE] 931 unidades pero solo 3/6 proyectos, sin historia, y su Estatus (475 PCV/Reservado) discrepa de sus 140 reservas — conciliar contra Orion. [ODOO15] su 'inventario' son AUTOPARTES (no mapear). Torre Cobán: en NINGÚN sistema hay unidades.",
          },
          {
            id: "v5",
            label: "Split de ventas por modelo",
            status: "COMPLETA",
            note: "[APP] rv_units.unit_type poblado al 100%. [PIPEDRIVE] Modelo 0/931 (campo vacío). [ODOO15] modelo embebido en el NOMBRE del partner (parseable, frágil). Orion manda.",
          },
        ],
      },
      {
        key: "desistimientos",
        label: "Desistimientos y Valor",
        requirements: [
          {
            id: "v9",
            label: "Desistimientos — reembolsos, retención y valorización",
            status: "COMPLETA",
            note: "[APP] 74 DESISTED con fecha+motivo obligatorios (constraint) + payments type='reimbursement' + retención computable (Q2.17M verificado). [PIPEDRIVE] complemento: ~150 casos con Monto de Penalización/Devolución (inferidos por heurística, no flag). [ODOO15] pagos anulados ≠ desistimientos (no conflar).",
          },
          {
            id: "v7",
            label: "Valor de proyecto — trazabilidad por desistimientos",
            status: "COMPLETA",
            note: "[APP] rv_price_history + unit_status_log + vínculo unidad desistida→estado actual. [PIPEDRIVE] precio único sin historia. [ODOO15] snapshot único B5. La historia de precios pre-Orion no existe en ningún sistema — la serie empieza donde empieza Orion.",
          },
        ],
      },
      {
        key: "descuentos",
        label: "Descuentos y Promociones",
        requirements: [
          {
            id: "v10",
            label: "Control de descuentos",
            status: "NO_VINCULADA",
            note: "Sin fuente estructurada en NINGÚN sistema. [PIPEDRIVE] ~1,037 PDFs de cotización/plan de pago (pixeles). [ODOO15] cotizaciones escaneadas B5. Ruta: OCR (la app ya tiene infra Claude Vision) — produce data no verificada que requiere revisión humana.",
          },
          {
            id: "v11",
            label: "Control de promociones (vales)",
            status: "COMPLETA",
            note: "[PIPEDRIVE] es la fuente completa y project-agnostic: 168 deals con promoción, Valor Vale (monetary, 98) — MÁS que el CSV B5 de Orion (27). TRAMPA: 'Valor Promoción' es un enum de strings de moneda — migrar Valor Vale, tratar el enum como etiqueta, jamás parsear moneda de labels.",
          },
        ],
      },
    ],
  },
  {
    key: "cobros",
    label: "COBROS",
    sections: [
      {
        key: "resumen",
        label: "Resumen",
        requirements: [],
      },
      {
        key: "cobros",
        label: "Cobros",
        requirements: [
          {
            id: "b1",
            label: "Cobros por proyecto",
            status: "COMPLETA",
            note: "DOS ledgers a conciliar en la migración: [APP] payments por unidad/proyecto (motor payment_compliance, 691 cuentas) y [ODOO15] account.payment 11,029 pagos Q300.8M (2021→2026-06). TRAMPA v15: el pago NO tiene fecha propia — hereda de account.move (join 100% vía move_id); leerlo standalone = ledger sin fechas. x_no_recibo (72.8%) es campo Studio: recrearlo en v19 o se pierden los números de recibo físico.",
          },
          {
            id: "b2",
            label: "Cobros acumulados: monto y porcentaje",
            status: "COMPLETA",
            note: "[APP] RESUELVE el 'cheapest large win' del agente v15 (OCR del PLAN DE CUOTAS): el plan contractual ya existe ESTRUCTURADO en Orion — expected_to_date por cuenta en payment_compliance + enganche_schedule JSONB. No hace falta OCR para el denominador.",
          },
          {
            id: "b3",
            label: "Cobros del mes: monto y porcentaje",
            status: "COMPLETA",
            note: "[APP] serie mensual esperado vs cobrado ya computada y desplegada en el dashboard.",
          },
        ],
      },
      {
        key: "deficit-superavit",
        label: "Déficit / Superávit",
        requirements: [
          {
            id: "b4",
            label: "Déficit",
            status: "COMPLETA",
            note: "[APP] varianza vs plan contractual, por unidad. [ODOO15]/[PIPEDRIVE] no tienen plan de cuotas como data.",
          },
          {
            id: "b5",
            label: "Superávit",
            status: "COMPLETA",
            note: "[APP] misma medida, polo positivo.",
          },
          {
            id: "b6",
            label: "Reporte de déficit / superávit",
            status: "COMPLETA",
            note: "[APP] por unidad + tendencia mensual, ya en producción.",
          },
        ],
      },
      {
        key: "alertas",
        label: "Alertas",
        requirements: [
          {
            id: "b7",
            label: "Reporte de alertas",
            status: "COMPLETA",
            note: "[APP] days_delinquent + aging + compliance_status por cuenta (382 en mora al corte). Inexistente en las otras fuentes.",
          },
        ],
      },
      {
        key: "desistimientos-decisiones",
        label: "Decisiones de Desistimiento",
        requirements: [
          {
            id: "b8",
            label: "Analítica de decisiones de desistimientos",
            status: "COMPLETA",
            note: "[APP] pagado vs adeudado por cuenta morosa, rankeado. [PIPEDRIVE] complementa ~150 casos con montos de penalización/devolución.",
          },
        ],
      },
      {
        key: "casos-ff",
        label: "Casos Especiales — F&F",
        requirements: [
          {
            id: "b9",
            label: "Casos especiales",
            status: "COMPLETA",
            note: "[APP] sales.caso_especial (52 activos). Único sistema que lo registra — [PIPEDRIVE] Referido (37) es otra cosa; [ODOO15] nada. Migrar el flag explícitamente.",
          },
        ],
      },
    ],
  },
  {
    key: "creditos",
    label: "CRÉDITOS",
    sections: [
      {
        key: "resumen",
        label: "Resumen",
        requirements: [],
      },
      {
        key: "expediente-inicial",
        label: "Expediente Inicial",
        requirements: [
          {
            id: "c1",
            label: "Control de expediente inicial — check list de papelería",
            status: "SIN_VISTA",
            note: "Sin objeto checklist en ningún sistema. [ODOO15] los formularios de control existen como PAPEL ESCANEADO dentro de 360 PDFs B5 (17,756 páginas, OCR listo al 97.4%). [PIPEDRIVE] 212K blobs descargados post-2025-08-29. Ruta: clasificación OCR — documentos asegurados, proceso no.",
          },
          {
            id: "c2",
            label: "Control de scanners de expediente inicial",
            status: "SIN_VISTA",
            note: "Los scans MISMOS están asegurados ([ODOO15] B5 completo, [PIPEDRIVE] post-horizonte). El 'control' (qué documento falta por unidad) no es queryable sin clasificar páginas.",
          },
          {
            id: "c3",
            label: "Control de PCVs — físicos, digital, scanner",
            status: "SIN_VISTA",
            note: "[ODOO15] promesas escaneadas B5 (839 filas de minuta/promesa en [PIPEDRIVE], 550 distintas). OJO hallazgo v15: una carpeta de partner puede contener la promesa de OTRO comprador (verificado: folder 23539 contiene promesa de Diego Ortíz). Nombre de carpeta ≠ contenido.",
          },
          {
            id: "c4",
            label: "Armado de expediente",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapa + Armado de Expediente (220, siempre 'Si') + Fecha (214). Sub-pasos 4.1–4.4 no existen en ningún sistema. OJO: 46/47 deals 'won' se marcan AQUÍ — won ≠ crédito completado.",
          },
        ],
      },
      {
        key: "analisis-aprobacion",
        label: "Análisis y Aprobación",
        requirements: [
          {
            id: "c5",
            label: "Autorización de ventas al contado",
            status: "SIN_VISTA",
            note: "El acto de autorización no se registra en ningún sistema. Identificación de contado: [PIPEDRIVE] Tipo de Crédito ×2 campos duplicados con erratas cruzadas ('Condado Banco'/'Contado banco'), ~55% sin dato; [APP] is_cash_purchase en rv_client_profiles. Consolidar en migración SIN merge silencioso.",
          },
          {
            id: "c6",
            label: "Envío a análisis (FHA/Banco)",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapa Análisis + Ingreso a Análisis (192) + Fecha (188) + Banco Seleccionado (214: G&T 136, Industrial 43…). Historial de cambios de etapa: NO extraído aún — recuperable con ~1,052 llamadas API, MUERE en el cutover. Pendiente del go de Jorge.",
          },
          {
            id: "c7",
            label: "Suspendidos (FHA/Banco)",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapa (27 abiertos) + Suspendido FHA (67) / Banco (10) + Fecha levantado suspensión (60).",
          },
          {
            id: "c8",
            label: "Re análisis",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapa con 13 abiertos + antigüedad vía stage_change_time (97% poblado).",
          },
          {
            id: "c9",
            label: "Aprobación (FHA/Banco)",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapa (121 abiertos) + Aprobación Banco 146/Fecha 151 + Aprobación FHA 91/Fecha 91 + # Caso FHA 121.",
          },
        ],
      },
      {
        key: "tramite-tecnico",
        label: "Trámite Técnico y Resolución",
        requirements: [
          {
            id: "c10",
            label: "Expediente técnico / Avalúo",
            status: "COMPLETA",
            note: "[PIPEDRIVE] etapas (19 abiertos) + 11 PDFs de avalúo. BLV5 se reestructuró el 2026-08-10 (12→16 etapas, nuevas: Resolución Bancaria, Tercera Inspección, Certificación Avalúo, Programación de firmas) — solo B5, sin profundidad histórica. Mapear etapas por stage_id, NUNCA por nombre (nombres con espacios finales load-bearing).",
          },
          {
            id: "c11",
            label: "Aprobación final — resguardo / resolución bancaria",
            status: "COMPLETA",
            note: "[PIPEDRIVE] Resguardo/Resolución (67 abiertos — donde el registro se detiene) + nueva etapa Resolución Bancaria (B5, hacia adelante).",
          },
        ],
      },
      {
        key: "escrituracion-entrega",
        label: "Escrituración y Entrega",
        requirements: [
          {
            id: "c12",
            label: "Escrituración (facturación)",
            status: "SIN_VISTA",
            note: "[ODOO15] LA respuesta a la sospecha: facturación FEL sólida (3,292 facturas con numero_fel) + dataset de escrituración B5 (291 formas: compradores, finca/folio/libro, montos; 25 unidades con cotizaciones CONTRADICTORIAS sin resolver, 13 folders requieren decisión humana). LO QUE FALTA: los 160,247 archivos FEL (el registro legal tributario) están en compañías inaccesibles — se destraban con el BACKUP de Odoo.sh (un email a soporte). Solo B5 tiene dataset de escrituración.",
          },
          {
            id: "c13",
            label: "Entrega",
            status: "NO_VINCULADA",
            note: "Nada en ningún sistema: [PIPEDRIVE] 'Fecha de entrega de compraventa' construido y 0/81,441; [ODOO15] sin acta de entrega.",
          },
          {
            id: "c14",
            label: "Recaudación de firmas",
            status: "NO_VINCULADA",
            note: "Sin registro queryable (firmas = imágenes dentro de promesas). [PIPEDRIVE] nueva etapa 'Programación de firmas' (B5, 2026-08-10) captura hacia adelante, cero historia.",
          },
        ],
      },
      {
        key: "cierre-archivo",
        label: "Cierre y Archivo",
        requirements: [
          {
            id: "c15",
            label: "Pago de impuestos",
            status: "SIN_VISTA",
            note: "[ODOO15] contabilización de impuestos existe (retenciones ISR/IVA en account.move.line, Timbres/IVA como montos en [PIPEDRIVE] 194/196) — pero NO como paso del expediente. Parcial: evidencia contable sí, registro del trámite no.",
          },
          {
            id: "c16",
            label: "Ingreso al registro",
            status: "SIN_VISTA",
            note: "Identificadores registrales (finca/folio/libro) capturados para B5 vía [ODOO15] FINCAS-B5-ACTUALIZADO.xlsx (externo; unidad 1001 ausente deliberadamente). La FECHA/acto de ingreso al registro: en ningún sistema. [PIPEDRIVE] Número de Registro 0/81,441.",
          },
          {
            id: "c17",
            label: "Desembolso",
            status: "SIN_VISTA",
            note: "[ODOO15] los desembolsos bancarios EXISTEN dentro de los 8,032 pagos entrantes pero NADA los etiqueta — distinguir desembolso de cuota requiere heurísticas monto+journal+fecha. [PIPEDRIVE] etapa con 0 deals.",
          },
          {
            id: "c18",
            label: "Liquidación (entrega de testimonio)",
            status: "NO_VINCULADA",
            note: "Nada en ningún sistema. [PIPEDRIVE] etapa 0 deals; [ODOO15] sin registro de liquidación ni testimonio.",
          },
          {
            id: "c19",
            label: "Archivado",
            status: "NO_VINCULADA",
            note: "Concepto inexistente en toda fuente.",
          },
        ],
      },
    ],
  },
  {
    key: "cumplimiento",
    label: "CUMPLIMIENTO",
    sections: [
      {
        key: "resumen",
        label: "Resumen",
        requirements: [],
      },
      {
        key: "manuales",
        label: "Manuales",
        requirements: [
          {
            id: "m1",
            label: "Manuales de cumplimiento — status general",
            status: "NO_VINCULADA",
            note: "Sin registro en ningún sistema ([PIPEDRIVE] tiene manuales COMERCIALES en un archivo de correo — no es un registro de cumplimiento). Problema de captura nueva en v19, no de migración.",
          },
        ],
      },
      {
        key: "clientes",
        label: "Clientes",
        requirements: [
          {
            id: "m2",
            label: "Desglose de clientes — Normal, PEP, CPE",
            status: "NO_VINCULADA",
            note: "CERO CONFIRMADO EN LAS CUATRO FUENTES: [PIPEDRIVE] 27 campos de persona + 112 de deal revisados exhaustivamente — nada; [ODOO15] res.partner sin UN SOLO campo custom; [APP] solo demografía; xlsx del oficial: cero menciones. La clasificación de riesgo debe NACER en v19 — no hay nada que migrar. (Definición de CPE sigue pendiente.)",
          },
          {
            id: "m3",
            label: "Casos específicos",
            status: "NO_VINCULADA",
            note: "Definición pendiente del equipo de cumplimiento (Jorge confirmó que NO son las observaciones del oficial). Sin fuente hasta que se defina.",
          },
        ],
      },
      {
        key: "expedientes",
        label: "Expedientes",
        requirements: [
          {
            id: "m4",
            label: "Expedientes — status por proyecto (KYC)",
            status: "SIN_VISTA",
            note: "B5 estructurado: [APP] snapshot del xlsx del oficial (265 expedientes, 327 compradores, status DPI/RTU — con 159 fechas de vencimiento absurdas en el origen). Documentos masivos sin estructurar: [PIPEDRIVE] 578 DPI + 450 RTU + 301 estados de cuenta distintos (clasificación por filename, post-2025-08-29 solamente); [ODOO15] DPI/RTU escaneados en bundles B5. Faltan: xlsx de los otros 4 proyectos + OCR si se quiere estructurar. Números de DPI: solo en pixeles y en el xlsx del oficial.",
          },
          {
            id: "m5",
            label: "Archivado de expedientes (aprobado / desistido)",
            status: "NO_VINCULADA",
            note: "Sin campo de desenlace en ninguna fuente ([PIPEDRIVE] status=lost no distingue desistido de lead muerto).",
          },
        ],
      },
    ],
  },
];
