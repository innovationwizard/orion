import { z } from "zod";
import { RECEIPT_TYPES, LEAD_SOURCES } from "./constants";

// ---------------------------------------------------------------------------
// Reservation submission — from salesperson mobile form
// ---------------------------------------------------------------------------

export const submitReservationSchema = z.object({
  unit_id: z.string().uuid("ID de unidad inválido"),
  salesperson_id: z.string().uuid("ID de asesor inválido"),
  client_names: z
    .array(z.string().min(1, "Nombre de cliente requerido"))
    .min(1, "Al menos un nombre de cliente es requerido"),
  client_phone: z.string().nullable().default(null),
  deposit_amount: z.number().positive("Monto debe ser positivo").nullable().default(null),
  deposit_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD")
    .nullable()
    .default(null),
  deposit_bank: z.string().nullable().default(null),
  receipt_type: z.enum(RECEIPT_TYPES).nullable().default(null),
  depositor_name: z.string().nullable().default(null),
  receipt_image_url: z.string().url("URL de imagen inválida").nullable().default(null),
  lead_source: z.enum(LEAD_SOURCES).nullable().default(null),
  notes: z.string().nullable().default(null),
});

export type SubmitReservationInput = z.infer<typeof submitReservationSchema>;

// ---------------------------------------------------------------------------
// Admin actions on reservations
// ---------------------------------------------------------------------------

export const confirmReservationSchema = z.object({
  admin_user_id: z.string().uuid("ID de administrador inválido"),
});

export const rejectReservationSchema = z.object({
  admin_user_id: z.string().uuid("ID de administrador inválido"),
  reason: z.string().min(1, "Motivo de rechazo requerido"),
});

export const desistReservationSchema = z.object({
  admin_user_id: z.string().uuid("ID de administrador inválido"),
  reason: z.string().min(1, "Motivo de desistimiento requerido"),
  desistimiento_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha: YYYY-MM-DD"),
});

export const updateClientsSchema = z.object({
  client_names: z
    .array(z.string().min(1))
    .min(1, "Al menos un nombre de cliente es requerido"),
  client_phone: z.string().nullable().default(null),
  reason: z.string().min(1, "Motivo de corrección requerido"),
});

// ---------------------------------------------------------------------------
// Freeze requests
// ---------------------------------------------------------------------------

export const submitFreezeSchema = z.object({
  unit_id: z.string().uuid("ID de unidad inválido"),
  salesperson_id: z.string().uuid("ID de asesor inválido"),
  reason: z.string().min(1, "Motivo de congelamiento requerido"),
  vip_name: z.string().nullable().default(null),
});

export const releaseFreezeSchema = z.object({
  admin_user_id: z.string().uuid("ID de administrador inválido"),
});

// ---------------------------------------------------------------------------
// Query parameters
// ---------------------------------------------------------------------------

export const unitsQuerySchema = z.object({
  project: z.string().optional(),
  tower: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const reservationsQuerySchema = z.object({
  status: z.string().optional(),
  salesperson: z.string().uuid().optional(),
  project: z.string().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const auditLogQuerySchema = z.object({
  unit: z.string().uuid("ID de unidad inválido"),
});
