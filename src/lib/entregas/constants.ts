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
 * Agenda shape: 4 citas per operating day, 09:00–18:00, Monday to Saturday.
 * Capacity is a guide for the board — a fifth visit on a day is still stored.
 * Sunday is not an operating day. Migration 077 rejects it in the database.
 */
export const CITAS_POR_DIA = 4;
export const HORAS_SUGERIDAS = ["09:00", "11:00", "13:30", "16:00"] as const;
/** ISO weekday, Monday = 1 … Saturday = 6. Matches Postgres `ISODOW`. */
export const DIAS_HABILES = [1, 2, 3, 4, 5, 6] as const;

export const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

export const DIA_NO_HABIL_MENSAJE =
  "Las entregas se agendan de lunes a sábado. El domingo no está disponible.";

/**
 * ISO weekday of a `YYYY-MM-DD` date. Monday = 1 … Sunday = 7.
 * Built from the date parts in UTC so a Guatemala session does not shift the day.
 * Returns null when the string is not a real calendar date.
 */
export function isoDow(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  const dow = utc.getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** True for Monday–Saturday. An unparseable date is not an operating day. */
export function isDiaHabil(iso: string): boolean {
  const dow = isoDow(iso);
  if (dow === null) return false;
  return (DIAS_HABILES as readonly number[]).includes(dow);
}

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
