/**
 * The 9 sections and entregables of the "Contabilidad" requirements sheet
 * (Cobros, Comisiones, Presupuestos de Mercadeo, Presupuestos Contables Odoo,
 * Desistimientos, Cesión de Derechos, PCV & Expedientes, Contabilidad General,
 * Legal), for the directive audience — distinct from the operational team
 * pages (Mercadeo, Ventas, Créditos y Entregas, Cumplimiento).
 *
 * `ownerNote` keeps the review state written on the Calendario Contable itself.
 * It is no longer surfaced as a per-section badge: that badge said "Pendiente"
 * on sections full of verified data because it mirrored the sheet's review
 * status, not whether the data existed — which read as "this section is
 * missing" to anyone looking at the page.
 */

export type Entregable = {
  /** Matches the key under `rows` in ./data/<section>.json. */
  num: string;
  item: string;
  owner: string;
};

export type ContableSection = {
  /** Matches the JSON filename under ./data/<id>.json and the section-nav id. */
  id: string;
  label: string;
  ownerNote: string;
  rows: Entregable[];
};

export const CONTABLE_SECTIONS: ContableSection[] = [
  {
    id: "cobros",
    label: "Cobros",
    ownerNote: "Información entregada a Jorge Luis",
    rows: [
      { num: "1", item: "Reporte recurrente en tiempo real", owner: "Jorge Luis" },
      { num: "2", item: "Revisión de alertas para posible desistimiento", owner: "Isaac" },
    ],
  },
  {
    id: "comisiones",
    label: "Comisiones",
    ownerNote: "Información entregada a Jorge Luis",
    rows: [
      { num: "1", item: "Cierre mensual de ventas", owner: "Job Jim..." },
      { num: "2", item: "Cierre mensual de cobros", owner: "Jorge Re..." },
      { num: "3", item: "Realización de cálculos", owner: "Jorge Re..." },
      // Entregables 4 y 5 del Calendario ("Revisión Dirección General" y
      // "Revisión Ejecutivos") traen la misma cifra sobre la misma planilla, así
      // que se muestran juntos. Los dos nombres se conservan dentro de la fila.
      { num: "4-5", item: "Revisión Dirección General y Revisión Ejecutivos", owner: "Jorge & ej..." },
      { num: "6", item: "Entrega y ejecución de pago", owner: "Jorge y..." },
    ],
  },
  {
    id: "presupuestos-mercadeo",
    label: "Presupuestos de Mercadeo",
    ownerNote: "Pendiente revisión con Jorge Revolorio",
    rows: [
      { num: "1", item: "Reporte general de gastos de mercadeo — inversiones gerencia mercadeo", owner: "Jorge Re..." },
      { num: "2", item: "Status de fondeos de mercadeo proyectos", owner: "Jorge Re..." },
      {
        num: "3",
        item: "Presupuesto por centros de costos: mercadeo, comercial, asistencia comercial, créditos, entregas, administrativo operativo",
        owner: "Jorge Re...",
      },
    ],
  },
  {
    id: "presupuestos-odoo",
    label: "Presupuestos Contables Odoo",
    ownerNote: "Pendiente revisión con Jorge Revolorio",
    rows: [
      { num: "1", item: "Presupuestos generales contables", owner: "Jorge Re..." },
      { num: "2", item: "Status de comisiones: status de pago por proyecto, desglose 5%", owner: "Jorge Re..." },
      { num: "3", item: "Status repartido por proyecto — Puerta Abierta", owner: "Jorge Re..." },
    ],
  },
  {
    id: "desistimientos",
    label: "Desistimientos",
    ownerNote: "Pendiente revisión con Antonio Rada",
    rows: [
      { num: "1", item: "Reporte general de desistimientos", owner: "Antonio" },
      { num: "2", item: "Reporte: retención, reembolso, neto compensado", owner: "Antonio" },
      { num: "3", item: "Gastos administrativos retenidos", owner: "Antonio" },
      { num: "4", item: "Reporte general de clientes a desistir", owner: "Isaac &..." },
    ],
  },
  {
    id: "cesion-derechos",
    label: "Cesión de Derechos",
    ownerNote: "Pendiente revisión con Antonio Rada",
    rows: [
      { num: "1", item: "Reporte general de clientes para cesión de derechos", owner: "Com. Leg..." },
      { num: "2", item: "Reporte directivo: cesión de derechos, desistimientos por bloque, monetario", owner: "Com. Leg..." },
    ],
  },
  {
    id: "pcv-expedientes",
    label: "PCV & Expedientes",
    ownerNote: "Pendiente revisión con Antonio Rada",
    rows: [{ num: "1", item: "Reporte general de expedientes por fase & PCV", owner: "Isaac &..." }],
  },
  {
    id: "contabilidad-general",
    label: "Contabilidad General",
    ownerNote: "Pendiente revisión con Antonio Rada & Jorge Revolorio",
    rows: [
      { num: "1", item: "Inventarios", owner: "Antonio &..." },
      { num: "2", item: "Valor de proyectos", owner: "Antonio &..." },
      { num: "3", item: "Reporte de trazabilidad & valoración de proyectos", owner: "Antonio &..." },
    ],
  },
  {
    id: "legal",
    label: "Legal",
    ownerNote: "Pendiente revisión con Antonio Rada & Jorge Revolorio",
    rows: [
      { num: "1", item: "Cotizador de legal", owner: "Antonio &..." },
      { num: "2", item: "Inventarios — todos los proyectos", owner: "Antonio &..." },
      { num: "3", item: "Reporte general de PCV", owner: "Isaac &..." },
    ],
  },
];
