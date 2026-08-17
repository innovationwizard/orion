/**
 * Entregas domain constants — labels, colors and agenda shape.
 *
 * Labels are es-GT, matching the vocabulary the commercial team already uses
 * in the retired "Cronograma de Entregas" sheet.
 */

import type { EntregaEstado, EntregaMilestone, EntregaTipoPago } from "./types";

export const MILESTONE_LABELS: Record<EntregaMilestone, string> = {
  ESCRITURA: "Escrituración",
  LLAVES: "Entrega de llaves",
};

export const MILESTONE_SHORT: Record<EntregaMilestone, string> = {
  ESCRITURA: "Escritura",
  LLAVES: "Llaves",
};

export const MILESTONES: EntregaMilestone[] = ["ESCRITURA", "LLAVES"];

export const ESTADO_LABELS: Record<EntregaEstado, string> = {
  PROGRAMADA: "Programada",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export const ESTADOS: EntregaEstado[] = [
  "PROGRAMADA",
  "CONFIRMADA",
  "COMPLETADA",
  "CANCELADA",
];

/** Chip colors, aligned with the Boulevard 5 dark palette. */
export const ESTADO_COLORS: Record<EntregaEstado, { fg: string; bg: string; border: string }> = {
  PROGRAMADA: { fg: "#9fb6c8", bg: "rgba(159,182,200,0.12)", border: "rgba(159,182,200,0.30)" },
  CONFIRMADA: { fg: "#04b0d6", bg: "rgba(4,176,214,0.14)", border: "rgba(4,176,214,0.38)" },
  COMPLETADA: { fg: "#4ee9ab", bg: "rgba(78,233,171,0.13)", border: "rgba(78,233,171,0.34)" },
  CANCELADA: { fg: "#ff8095", bg: "rgba(255,128,149,0.13)", border: "rgba(255,128,149,0.34)" },
};

export const TIPO_PAGO_LABELS: Record<EntregaTipoPago, string> = {
  FHA: "FHA",
  CREDITO_DIRECTO: "Crédito Directo",
  CONTADO: "Contado",
};

export const TIPOS_PAGO: EntregaTipoPago[] = ["FHA", "CREDITO_DIRECTO", "CONTADO"];

/**
 * Agenda shape from the retired sheet: 4 citas per weekday, 09:00–18:00,
 * Monday to Friday. Used for capacity display and slot suggestions — it is
 * NOT enforced in the DB, so an exceptional sixth cita is always possible.
 */
export const CITAS_POR_DIA = 4;
export const HORAS_SUGERIDAS = ["09:00", "11:00", "13:30", "16:00"] as const;
export const DIAS_HABILES = [1, 2, 3, 4, 5] as const; // 1 = Monday … 5 = Friday

export const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

/** The only project with entregas today. Schema is multi-project; the board is not. */
export const ENTREGAS_PROJECT_SLUG = "boulevard-5";
