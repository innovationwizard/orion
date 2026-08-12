export type HudAreaKey =
  | "ventas"
  | "mercadeo"
  | "cobros"
  | "creditos"
  | "cumplimiento";

/**
 * COMPLETA      — data linked in the app AND displayed on a route/page.
 * SIN_VISTA     — data exists in the DB but no page displays it yet ("VISTA TODAVÍA NO CREADA").
 * NO_VINCULADA  — the necessary data is not in the app ("DATA TODAVÍA NO VINCULADA").
 * Only COMPLETA counts toward completion.
 */
export type RequirementStatus = "COMPLETA" | "SIN_VISTA" | "NO_VINCULADA";

export interface HudProofLink {
  /** App route (always outside the HUD) that displays the data. */
  href: string;
  /** Where to look on the target page. */
  label: string;
}

export interface HudRequirement {
  id: string;
  label: string;
  status: RequirementStatus;
  /** Provenance for COMPLETA (which routes display it) or why it's not complete. */
  note?: string;
  /**
   * "Ver →" targets. Every COMPLETA claim must be provable on a page outside the HUD —
   * the HUD itself displays no data, only gap status. Absent only for decision-based items.
   */
  proof?: HudProofLink[];
}

export interface HudSection {
  key: string;
  label: string;
  requirements: HudRequirement[];
}

export interface HudArea {
  key: HudAreaKey;
  label: string;
  /** Empty until the area's requirement list is defined. Completion stays 0. */
  sections: HudSection[];
}

export const HUD_AREAS: HudArea[] = [
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
            note:
              "Desplegado en /mercadeo (reporte maestro Power BI reconstruido). Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte maestro (página completa)" }],
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
            note:
              "Desplegado en /mercadeo — rangos mensuales por proyecto (migración 069: BEN 350–400, BLT 250–300, B5 150–200, SE 50–100; CE sin meta) vs leads reales del último mes completo del snapshot. Rangos confirmados como MENSUALES contra la propia data de mercadeo.",
            proof: [{ href: "/mercadeo", label: "Reporte — Resumen, metas de leads" }],
          },
          {
            id: "k3",
            label: "Meta diaria de lead",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — equivalente diario derivado (rango ÷ días del mes) junto al promedio diario real, en la misma tabla de metas (sección Resumen).",
            proof: [{ href: "/mercadeo", label: "Reporte — Resumen, metas ≈/día" }],
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
            note:
              "Desplegado en /mercadeo — gasto diario de pauta (Meta Ads) en Performance Ads. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — sección Performance Ads" }],
          },
          {
            id: "k5",
            label: "Uso de presupuesto mensual de pauta",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — gasto mensual y presupuestos en Performance Ads y Presupuesto. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — Performance Ads y Presupuesto" }],
          },
          {
            id: "k10",
            label: "Evolución de inversiones en pauta acumulada mensual",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — inversión acumulada en Inversión/Reservas. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — Inversión/Reservas" }],
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
            note: "Desplegado en /mercadeo — ROAS amplio y atribuido por proyecto: gasto Meta Ads en su divisa real (columna Divisa del Excel fuente; el Power BI mezclaba GTQ/USD) vs ventas no canceladas de la DB. Conversión fija Q7.75/USD.",
            proof: [{ href: "/mercadeo", label: "Reporte — Resumen, ROAS/ROI por proyecto" }],
          },
          {
            id: "k7",
            label: "Costo por cierre / medio de venta",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — Costo por Cierre por fuente (medida DAX reproducida) en Inversión/Reservas. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — Inversión/Reservas, costo por cierre" }],
          },
          {
            id: "k9",
            label: "Evolución de costos por lead de manera mensual",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — evolución de CPL en Performance Ads. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — Performance Ads, evolución CPL" }],
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
            note:
              "Desplegado en /mercadeo — treemap y tabla de campañas. Snapshot al 2026-08-04 — actualización manual reemplazando public/mercadeo/performance.html.",
            proof: [{ href: "/mercadeo", label: "Reporte — treemap y tabla de campañas" }],
          },
        ],
      },
      {
        key: "canales-digitales",
        label: "Canales Digitales",
        requirements: [
          {
            id: "k11",
            label: "Operatividad de todos los canales digitales en la aplicación",
            status: "COMPLETA",
            note: "Completo en app externa. La app de seguimiento que usa mercadeo se actualiza en vivo con visibilidad total de los canales. Nuestra app no lo extrae en vivo — la visibilidad operativa vive en la herramienta de mercadeo.",
            proof: [{ href: "https://metricool.com/", label: "Metricool" }],
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
            note: "Desplegado en /ventas (gráficas mensual y acumulada) y en el dashboard analítico.",
            proof: [
              { href: "/ventas", label: "Gráficas mensual y acumulada" },
              { href: "/", label: "Dashboard analítico" },
            ],
          },
        ],
      },
      {
        key: "objetivos",
        label: "Objetivos",
        requirements: [
          {
            id: "v2",
            label: "Ventas versus objetivos de proyectos — totales y por asesor",
            status: "COMPLETA",
            note: "Desplegado en /ventas (sección Objetivos): metas del mes por proyecto (meta × asesores activos, migración 068; excluye roles GC/Supervisor, migración 070) y tabla por asesor. Regla de conteo: reservas confirmadas y desistidas por fecha de depósito.",
            proof: [{ href: "/ventas#objetivos", label: "Ventas — metas del mes y tabla por asesor" }],
          },
          {
            id: "v3",
            label: "Status de ventas — déficit o excedente versus fecha de cierre, por proyecto y por asesor",
            status: "COMPLETA",
            note: "Desplegado en /ventas (sección Objetivos): déficit/excedente del mes (ventas − meta) por proyecto y por asesor, con fecha de entrega de torre como contexto.",
            proof: [{ href: "/ventas#objetivos", label: "Ventas — déficit/excedente vs meta" }],
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
            note: "Desplegado en /ventas (sección Canales): ventas por canal (reservas confirmadas por lead_source).",
            proof: [{ href: "/ventas#canales", label: "Ventas — por canal" }],
          },
          {
            id: "v8",
            label: "Tasa de conversión — funnel completo: Leads → Reserva → PCV firmada",
            status: "COMPLETA",
            note:
              "Desplegado en /mercadeo — funnel del período del snapshot: leads de pauta Meta (netos de campaña mal mapeada) → reservas → PCV firmadas, con tasas de conversión. Leads snapshot al 2026-08-04; reservas y PCV en vivo desde la DB.",
            proof: [{ href: "/mercadeo", label: "Reporte — Resumen, funnel Leads → Reserva → PCV" }],
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
            note: "Desplegado en /disponibilidad (grid por estado), /integracion y el inventario del portal de ventas.",
            proof: [
              { href: "/disponibilidad", label: "Grid por estado" },
              { href: "/integracion", label: "Integración de inventario" },
            ],
          },
          {
            id: "v5",
            label: "Análisis de inventario: split de ventas por modelo",
            status: "COMPLETA",
            note: "Desplegado en /ventas (sección Modelos): unidades reservadas y vendidas por proyecto y modelo.",
            proof: [{ href: "/ventas#modelos", label: "Ventas — split por modelo" }],
          },
        ],
      },
      {
        key: "desistimientos",
        label: "Desistimientos y Valor",
        requirements: [
          {
            id: "v9",
            label: "Desistimientos — reembolsos, retención de reembolso y valorización de proyectos",
            status: "COMPLETA",
            note: "Desplegado en /valorizacion (sección Desistimientos): pagado antes de desistir, reembolsado y retención por moneda.",
            proof: [{ href: "/valorizacion#desistimientos", label: "Valorización — reembolsos y retención" }],
          },
          {
            id: "v7",
            label: "Valor de proyecto — trazabilidad y valorización por desistimientos",
            status: "COMPLETA",
            note: "Desplegado en /valorizacion: trazabilidad de unidades desistidas (estado actual + precio lista) y evolución de precios por proyecto.",
            proof: [
              { href: "/valorizacion#trazabilidad", label: "Trazabilidad de unidades desistidas" },
              { href: "/valorizacion", label: "Evolución de precios" },
            ],
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
            note: "Los descuentos son rebajas de precio distintas a los vales (v11). Su data existe únicamente en PDFs escaneados — no se mantiene ningún reporte. Vincularla requiere digitalización (ej. OCR, como el flujo de boletas) o captura manual.",
          },
          {
            id: "v11",
            label: "Control de promociones",
            status: "COMPLETA",
            note: "Desplegado en /promociones: vales activos desde el export de Pipedrive (snapshot 2026-08-07, B5). La data de todos los proyectos está completa en Pipedrive — pendiente de descarga para ampliar el snapshot.",
            proof: [{ href: "/promociones", label: "Promociones — vales activos" }],
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
            note: "Desplegado en el dashboard analítico (/) con filtro por proyecto: KPIs Esperado a la fecha, Cobrado, % Cumplimiento.",
            proof: [{ href: "/", label: "Dashboard — KPIs con filtro por proyecto" }],
          },
          {
            id: "b2",
            label: "Cobros acumulados: monto y porcentaje",
            status: "COMPLETA",
            note: "Desplegado en el dashboard: KPIs Cobrado y % Cumplimiento (acumulado a la fecha).",
            proof: [{ href: "/", label: "Dashboard — KPIs Cobrado y % Cumplimiento" }],
          },
          {
            id: "b3",
            label: "Cobros del mes: monto y porcentaje",
            status: "COMPLETA",
            note: "Desplegado en el dashboard (pestaña Flujo de Caja): tendencia mensual esperado vs cobrado con % de cumplimiento por mes.",
            proof: [{ href: "/?tab=cash-flow", label: "Dashboard — tendencia mensual" }],
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
            note: "Desplegado en el dashboard: KPI Varianza (negativa = déficit) vs plan de pagos contractual.",
            proof: [{ href: "/", label: "Dashboard — KPI Varianza" }],
          },
          {
            id: "b5",
            label: "Superávit",
            status: "COMPLETA",
            note: "Desplegado en el dashboard: KPI Varianza (positiva = superávit) vs plan de pagos contractual.",
            proof: [{ href: "/", label: "Dashboard — KPI Varianza" }],
          },
          {
            id: "b6",
            label: "Reporte de déficit / superávit",
            status: "COMPLETA",
            note: "Desplegado en el dashboard (pestaña Pagos): columna Varianza por unidad en la tabla de cuentas + tendencia de varianza mensual.",
            proof: [{ href: "/?tab=payments", label: "Dashboard — Pagos, varianza por unidad" }],
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
            note: "Desplegado en el dashboard (pestaña Pagos): KPI Unidades en mora + tabla Cuentas en mora con días de atraso y estado de cumplimiento.",
            proof: [{ href: "/?tab=payments", label: "Dashboard — Pagos, cuentas en mora" }],
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
            note: "Desplegado en el dashboard (pestaña Pagos): cuentas en mora rankeadas por días de atraso, con esperado, pagado (retención potencial) y cumplimiento.",
            proof: [{ href: "/?tab=payments#decisiones-desistimiento", label: "Dashboard — candidatos a desistimiento" }],
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
            note: "Desplegado en el dashboard (pestaña Pagos): portafolio F&F (caso_especial) con cumplimiento de pago por cuenta.",
            proof: [{ href: "/?tab=payments#casos-ff", label: "Dashboard — portafolio F&F" }],
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
            status: "NO_VINCULADA",
            note:
              "Verificado contra la extracción de Pipedrive (2026-08-05): no existen etapas de control de expediente inicial. Si este control se lleva fuera (Excel/físico), esa es la fuente a vincular.",
          },
          {
            id: "c2",
            label: "Control de scanners de expediente inicial",
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
          },
          {
            id: "c3",
            label: "Control de Promesas de compraventa — físicos, digital, scanner",
            status: "NO_VINCULADA",
            note:
              "No existe como etapa de control en Pipedrive; lo más cercano es la etapa Promesa (mostrada en esta sección), pero el control físico/digital/scanner de PCVs no se registra.",
          },
          {
            id: "c4",
            label: "Armado de expediente",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: tratos en Armado de Expediente por embudo, con antigüedad. Los sub-pasos 4.1–4.4 no existen en Pipedrive (solo flag armado sí/no + fecha).",
            proof: [
              { href: "/creditos/pipeline?etapa=Armado%20de%20Expediente#tratos", label: "Pipeline — tratos en Armado de Expediente" },
            ],
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
            status: "NO_VINCULADA",
            note:
              "El acto de autorización no se registra en Pipedrive: contado se identifica solo por el campo Tipo de Crédito (75 tratos, visible en el split de esta área). No hay etapa ni campo de autorización.",
          },
          {
            id: "c6",
            label: "Envío a análisis",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: tratos en Análisis por embudo. El split FHA/Banco vive en campos custom duplicados (~52% sin dato) — mostrado como split de tipo de crédito.",
            proof: [{ href: "/creditos/pipeline?etapa=Análisis#tratos", label: "Pipeline — tratos en Análisis" }],
          },
          {
            id: "c7",
            label: "Suspendidos",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: suspendidos por embudo (27 abiertos al corte) con antigüedad en etapa.",
            proof: [{ href: "/creditos/pipeline?etapa=Suspendido#tratos", label: "Pipeline — tratos suspendidos" }],
          },
          {
            id: "c8",
            label: "Re análisis",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: tratos en Re-análisis por embudo con antigüedad.",
            proof: [{ href: "/creditos/pipeline?etapa=Re-análisis#tratos", label: "Pipeline — tratos en Re-análisis" }],
          },
          {
            id: "c9",
            label: "Aprobación",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: tratos en Aprobación por embudo con antigüedad. Ojo: el flag 'ganado' de Pipedrive NO significa aprobación ni desembolso.",
            proof: [{ href: "/creditos/pipeline?etapa=Aprobación#tratos", label: "Pipeline — tratos en Aprobación" }],
          },
        ],
      },
      {
        key: "tramite-tecnico",
        label: "Trámite Técnico y Resolución",
        requirements: [
          {
            id: "c10",
            label: "Expediente técnico",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: Expediente Técnico por embudo. Créditos BLV5 partió la etapa en Ingreso + Aprobación E. Técnico/Avalúo — ambas se muestran.",
            proof: [{ href: "/creditos/pipeline#etapas", label: "Pipeline — etapas por embudo (E. Técnico / Avalúo)" }],
          },
          {
            id: "c11",
            label: "Aprobación final",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline: Resguardo / Resolución por embudo (67 abiertos al corte) — la etapa donde en la práctica se detiene el registro.",
            proof: [
              { href: "/creditos/pipeline?etapa=Resguardo%20/%20Resolución#tratos", label: "Pipeline — tratos en Resguardo / Resolución" },
            ],
          },
        ],
      },
      {
        key: "escrituracion-entrega",
        label: "Escrituración y Entrega",
        requirements: [
          {
            id: "c12",
            label: "Escrituración",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline (Etapas sin uso operativo) con 0 tratos: la etapa Escritura existe en Pipedrive pero no se usa operativamente. Facturación (12.1) no existe.",
            proof: [{ href: "/creditos/pipeline#sin-uso", label: "Pipeline — etapas sin uso operativo" }],
          },
          {
            id: "c13",
            label: "Entrega",
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
          },
          {
            id: "c14",
            label: "Recaudación de firmas",
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
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
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
          },
          {
            id: "c16",
            label: "Ingreso al registro",
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
          },
          {
            id: "c17",
            label: "Desembolso",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline (Etapas sin uso operativo) con 0 tratos: la etapa Desembolso existe pero no se usa — el registro se detiene en Resguardo/Resolución.",
            proof: [{ href: "/creditos/pipeline#sin-uso", label: "Pipeline — etapas sin uso operativo" }],
          },
          {
            id: "c18",
            label: "Liquidación",
            status: "COMPLETA",
            note:
              "Desplegado en /creditos/pipeline (Etapas sin uso operativo) con 0 tratos: la etapa Liquidación existe pero no se usa. Entrega de testimonio (18.1) no existe en Pipedrive.",
            proof: [{ href: "/creditos/pipeline#sin-uso", label: "Pipeline — etapas sin uso operativo" }],
          },
          {
            id: "c19",
            label: "Archivado",
            status: "NO_VINCULADA",
            note:
              "No existe en Pipedrive (verificado 2026-08-05).",
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
            note: "HALLAZGO (extracción Pipedrive 2026-08-05): Pipedrive NO contiene ningún campo de cumplimiento (revisados 27 campos custom de personas + 112 de tratos). La data de cumplimiento vive en otro lado — preguntar al equipo dónde generan sus reportes.",
          },
        ],
      },
      {
        key: "clientes",
        label: "Clientes",
        requirements: [
          {
            id: "m2",
            label: "Desglose de clientes (inventario) — Normal, PEP, CPE",
            status: "NO_VINCULADA",
            note: "Sin clasificación de riesgo en la app NI en Pipedrive (verificado 2026-08-05: cero campos PEP/CPE/riesgo). Definición de CPE pendiente del equipo de cumplimiento, junto con dónde vive esta clasificación.",
          },
          {
            id: "m3",
            label: "Casos específicos",
            status: "NO_VINCULADA",
            note: "Definición pendiente: Jorge confirmó (2026-08-07) que NO son las observaciones del oficial (esas se muestran en Expedientes). Qué son los casos específicos sigue sin definirse.",
          },
        ],
      },
      {
        key: "expedientes",
        label: "Expedientes",
        requirements: [
          {
            id: "m4",
            label: "Expedientes — status por proyecto",
            status: "COMPLETA",
            note: "Desplegado en /cumplimiento: base del oficial de cumplimiento — 265 expedientes B5, 327 compradores, status de DPI (vigente/vencido/fecha absurda/sin fecha), RTU, promesa, fuente de ingresos y precalificación. La data de todos los proyectos está completa en xlsx, pendiente de descarga — B5 primero.",
            proof: [{ href: "/cumplimiento", label: "Expedientes de cumplimiento" }],
          },
          {
            id: "m5",
            label: "Archivado de expedientes",
            status: "NO_VINCULADA",
            note: "Estados terminales del ciclo del expediente: aprobado y desistido — segmento del mismo status, no página aparte.",
          },
        ],
      },
    ],
  },
];

export function areaRequirements(area: HudArea): HudRequirement[] {
  return area.sections.flatMap((s) => s.requirements);
}

/** Completion 0–100 = share of requirements that are COMPLETA (data linked AND displayed). 0 when no requirements defined. */
export function areaCompletion(area: HudArea): number {
  const reqs = areaRequirements(area);
  if (reqs.length === 0) return 0;
  const complete = reqs.filter((r) => r.status === "COMPLETA").length;
  return (complete / reqs.length) * 100;
}

/** Project total = simple average of all areas. */
export function hudTotal(areas: HudArea[]): number {
  if (areas.length === 0) return 0;
  return areas.reduce((sum, a) => sum + areaCompletion(a), 0) / areas.length;
}
