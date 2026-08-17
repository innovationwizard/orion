import { z } from "zod";
import { ESTADOS, MILESTONES, TIPOS_PAGO } from "./constants";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD");

/** Accepts HH:MM or HH:MM:SS (Postgres returns the latter). */
const isoTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Formato de hora: HH:MM");

const optionalText = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .nullable()
  .default(null);

// ---------------------------------------------------------------------------
// Agendar una cita — creates the expediente on first use, then adds the cita
// ---------------------------------------------------------------------------

export const agendarCitaSchema = z.object({
  unit_id: z.string().uuid("ID de unidad inválido"),
  milestone: z.enum(MILESTONES as [string, ...string[]]),
  fecha: isoDate,
  hora: isoTime,
  tipo_pago: z.enum(TIPOS_PAGO as [string, ...string[]]).nullable().default(null),
  banco: z.string().trim().min(1).max(120).nullable().default(null),
  notas: optionalText,
});

export type AgendarCitaInput = z.infer<typeof agendarCitaSchema>;

// ---------------------------------------------------------------------------
// Actualizar una cita — reschedule, change state, edit notes
// ---------------------------------------------------------------------------

export const actualizarCitaSchema = z
  .object({
    fecha: isoDate.optional(),
    hora: isoTime.optional(),
    estado: z.enum(ESTADOS as [string, ...string[]]).optional(),
    cancelada_motivo: z.string().trim().min(1).max(2000).nullable().optional(),
    notas: z.string().trim().max(2000).nullable().optional(),
    tipo_pago: z.enum(TIPOS_PAGO as [string, ...string[]]).nullable().optional(),
    banco: z.string().trim().max(120).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "No hay cambios que aplicar",
  })
  .refine((v) => v.estado !== "CANCELADA" || (v.cancelada_motivo ?? "").length > 0, {
    message: "Cancelar una cita requiere un motivo",
    path: ["cancelada_motivo"],
  });

export type ActualizarCitaInput = z.infer<typeof actualizarCitaSchema>;

// ---------------------------------------------------------------------------
// Board query
// ---------------------------------------------------------------------------

export const entregasQuerySchema = z.object({
  /** Inclusive ISO date bounds. Omitted → the API returns every cita. */
  desde: isoDate.optional(),
  hasta: isoDate.optional(),
});

export type EntregasQuery = z.infer<typeof entregasQuerySchema>;
