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

export interface HudRequirement {
  id: string;
  label: string;
  status: RequirementStatus;
  /** Provenance for COMPLETA (which routes display it) or why it's not complete. */
  note?: string;
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
            status: "NO_VINCULADA",
            note: "El Excel de objetivos existe pero aún no ha sido entregado ni importado.",
          },
          {
            id: "v3",
            label: "Status de ventas — déficit o excedente versus fecha de cierre, por proyecto y por asesor",
            status: "NO_VINCULADA",
            note: "Requiere los objetivos (Excel pendiente). Las fechas de entrega por torre sí existen (towers.delivery_date).",
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
            note: "Desplegado aquí en el HUD: ventas por canal (reservas confirmadas por lead_source), abajo en esta sección.",
          },
          {
            id: "v8",
            label: "Tasa de conversión — funnel completo: Leads → Reserva → PCV firmada",
            status: "NO_VINCULADA",
            note: "El conteo de leads no existe en la app — vendrá del área de Mercadeo. El tramo Reserva → PCV sí es medible hoy.",
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
          },
          {
            id: "v5",
            label: "Análisis de inventario: split de ventas por modelo",
            status: "COMPLETA",
            note: "Desplegado aquí en el HUD: unidades reservadas y vendidas por proyecto y modelo, abajo en esta sección.",
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
            note: "Desplegado aquí en el HUD: pagado antes de desistir, reembolsado y retención por moneda, abajo en esta sección.",
          },
          {
            id: "v7",
            label: "Valor de proyecto — trazabilidad y valorización por desistimientos",
            status: "COMPLETA",
            note: "Desplegado aquí en el HUD: trazabilidad de unidades desistidas (estado actual + precio lista). La evolución de precios vive en /valorizacion.",
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
            note: "No existen estructuras de descuento en la base de datos.",
          },
          {
            id: "v11",
            label: "Control de promociones",
            status: "NO_VINCULADA",
            note: "No existe tabla de promociones en la base de datos.",
          },
        ],
      },
    ],
  },
  { key: "mercadeo", label: "MERCADEO", sections: [] },
  { key: "cobros", label: "COBROS", sections: [] },
  { key: "creditos", label: "CRÉDITOS", sections: [] },
  { key: "cumplimiento", label: "CUMPLIMIENTO", sections: [] },
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
