import { ADMIN_ROLES, DATA_VIEWER_ROLES } from "@/lib/permissions";


export type PanelLink = { href: string; label: string; roles?: string[] };
export type PanelCategory = { name: string; links: PanelLink[] };

export const NON_VENTAS_CATEGORIES: PanelCategory[] = [
  {
    name: "Comercial",
    links: [
      // Dashboard salió de aquí: ahora es "Dashboard de Cobros" en Finanzas.
      { href: "/projects", label: "Projects" },
      { href: "/admin/reservas", label: "Reservas", roles: ADMIN_ROLES },
      { href: "/admin/operaciones", label: "Operaciones", roles: ADMIN_ROLES },
      { href: "/cotizador", label: "Cotizador" },
      { href: "/integracion", label: "Integracion", roles: ADMIN_ROLES },
      { href: "/ventas", label: "Ventas" },
      { href: "/entregas", label: "Entregas", roles: [...DATA_VIEWER_ROLES, "entregas_viewer", "entregas_editor"] },
    ],
  },
  {
    name: "Marketing",
    links: [
      { href: "/referidos", label: "Referidos", roles: ADMIN_ROLES },
      { href: "/buyer-persona", label: "Buyer Persona", roles: ADMIN_ROLES },
      { href: "/mercadeo", label: "Mercadeo", roles: DATA_VIEWER_ROLES },
    ],
  },
  {
    name: "Finanzas",
    links: [
      { href: "/", label: "Dashboard de Cobros", roles: DATA_VIEWER_ROLES },
      { href: "/creditos", label: "Créditos", roles: DATA_VIEWER_ROLES },
      { href: "/creditos/pipeline", label: "Expedientes", roles: DATA_VIEWER_ROLES },
      { href: "/cumplimiento", label: "Cumplimiento", roles: DATA_VIEWER_ROLES },
      { href: "/contable", label: "Contable", roles: DATA_VIEWER_ROLES },
    ],
  },
  {
    name: "Administración",
    links: [
      { href: "/cesion", label: "Cesion", roles: ADMIN_ROLES },
      { href: "/admin/asesores", label: "Asesores", roles: ADMIN_ROLES },
      { href: "/admin/roles", label: "Roles", roles: ["master"] },
      { href: "/admin/audit", label: "Auditoría", roles: ADMIN_ROLES },
      { href: "/admin/lead-sources", label: "Fuentes", roles: ["master", "torredecontrol", "marketing"] },
      { href: "/admin/cotizador-config", label: "Config Cotizador", roles: ADMIN_ROLES },
      { href: "/admin/sync", label: "Sync", roles: ["master"] },
    ],
  },
];

export const VENTAS_CATEGORIES: PanelCategory[] = [
  {
    name: "Mi Portal",
    links: [
      { href: "/ventas/portal/reservas", label: "Mis Reservas" },
      { href: "/ventas/portal/inventario", label: "Inventario" },
      { href: "/ventas/portal/clientes", label: "Clientes" },
      { href: "/ventas/portal/rendimiento", label: "Rendimiento" },
    ],
  },
  {
    name: "Herramientas",
    links: [
      { href: "/disponibilidad", label: "Disponibilidad" },
      { href: "/cotizador", label: "Cotizador" },
    ],
  },
];

/**
 * Sections of the consolidated `/ventas` page, in the order of the "Ventas por
 * Proyecto" block of the commercial reporting sheet. Disponibilidad,
 * Valorización, Descuentos and Promociones used to be their own Panel entries;
 * they now live inside `/ventas` and are reached through its in-page SectionNav.
 *
 * `roles` here only decides what the UI offers — each underlying API route
 * still enforces its own `requireRole(...)`.
 */
export type VentasSection = {
  id: string;
  label: string;
  roles?: string[];
  /**
   * When set, the entry navigates to this page instead of expanding a card in
   * place. Used for destinations that are too large to embed and keep their own
   * page.
   */
  href?: string;
};

export const VENTAS_SECTIONS: VentasSection[] = [
  { id: "avance", label: "Avance", roles: DATA_VIEWER_ROLES },
  { id: "ritmo", label: "Ritmo" },
  { id: "objetivos", label: "Objetivos", roles: DATA_VIEWER_ROLES },
  { id: "canales", label: "Canales", roles: DATA_VIEWER_ROLES },
  { id: "modelos", label: "Modelos", roles: DATA_VIEWER_ROLES },
  { id: "disponibilidad", label: "Disponibilidad" },
  { id: "valorizacion", label: "Valorización", roles: ADMIN_ROLES },
  { id: "descuentos", label: "Descuentos", roles: DATA_VIEWER_ROLES },
  { id: "promociones", label: "Promociones", roles: DATA_VIEWER_ROLES },
];

/**
 * Sections of `/mercadeo`. The sheet's Mercadeo block is a single row 1
 * ("Reporte maestro") with sub-rows 1.1–1.6 plus rows 2–5; all of them are
 * views of the same master report, so the page presents them as one report
 * rather than eleven separate cards. The three sections below mirror the pages
 * of the report mercadeo actually uses (Resumen, Performance Ads, Presupuesto),
 * so the nav reads the way the marketing manager already navigates it.
 *
 * The report's remaining pages (Inversión/Reservas, Reporte Reservas,
 * Inventarios) need reservation and inventory data this page does not load —
 * they stay in the full report, linked from the bottom of the page.
 */
export const MERCADEO_SECTIONS: VentasSection[] = [
  { id: "resumen", label: "Resumen" },
  { id: "performance-ads", label: "Performance Ads" },
  { id: "presupuesto", label: "Presupuesto" },
];

export const ENTREGAS_ONLY_CATEGORIES: PanelCategory[] = [
  {
    name: "Entregas",
    links: [{ href: "/entregas", label: "Entregas" }],
  },
];

export const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  torredecontrol: "Torre de Control",
  gerencia: "Gerencia",
  financiero: "Financiero",
  contabilidad: "Contabilidad",
  inventario: "Inventario",
  marketing: "Marketing",
  ventas: "Ventas",
  entregas_viewer: "Entregas",
  entregas_editor: "Entregas (edición)",
};

export const ROLE_COLORS: Record<string, string> = {
  master: "#7c3aed",
  torredecontrol: "#2563eb",
  gerencia: "#0891b2",
  financiero: "#16a34a",
  contabilidad: "#64748b",
  inventario: "#f59e0b",
  marketing: "#ec4899",
  ventas: "#2563eb",
  entregas_viewer: "#0573b0",
  entregas_editor: "#0573b0",
};
