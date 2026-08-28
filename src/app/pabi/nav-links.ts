import { ADMIN_ROLES, DATA_VIEWER_ROLES } from "@/lib/permissions";


export type PanelLink = { href: string; label: string; roles?: string[] };
export type PanelCategory = { name: string; links: PanelLink[] };

export const NON_VENTAS_CATEGORIES: PanelCategory[] = [
  {
    name: "Comercial",
    links: [
      { href: "/", label: "Dashboard" },
      { href: "/projects", label: "Projects" },
      { href: "/disponibilidad", label: "Disponibilidad" },
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
      { href: "/promociones", label: "Promociones", roles: DATA_VIEWER_ROLES },
      { href: "/descuentos", label: "Descuentos", roles: DATA_VIEWER_ROLES },
    ],
  },
  {
    name: "Finanzas",
    links: [
      { href: "/creditos", label: "Créditos", roles: DATA_VIEWER_ROLES },
      { href: "/creditos/pipeline", label: "Expedientes", roles: DATA_VIEWER_ROLES },
      { href: "/cumplimiento", label: "Cumplimiento", roles: DATA_VIEWER_ROLES },
      { href: "/valorizacion", label: "Valorizacion", roles: ADMIN_ROLES },
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
