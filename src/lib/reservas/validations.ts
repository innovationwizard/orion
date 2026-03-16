import { z } from "zod";
import { RECEIPT_TYPES, LEAD_SOURCES, BUYER_ROLES } from "./constants";

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
  receipt_image_url: z.string().url("URL de comprobante requerida"),
  dpi_image_url: z.string().url("URL de DPI requerida"),
  client_dpi: z.string().min(1, "CUI requerido"),
  client_birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)").nullable().default(null),
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

export const updateClientSchema = z
  .object({
    full_name: z.string().min(1, "Nombre requerido").optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email("Email inválido").nullable().optional(),
    dpi: z.string().nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Al menos un campo requerido",
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

export const integracionQuerySchema = z.object({
  project: z.string().optional(),
});

export const ventasQuerySchema = z.object({
  project: z.string().optional(),
});

export const createReferralSchema = z.object({
  unit_id: z.string().uuid(),
  client_name: z.string().min(1, "Nombre de cliente requerido"),
  precio_lista: z.number().positive().nullable().default(null),
  precio_referido: z.number().positive().nullable().default(null),
  referido_por: z.string().min(1, "Nombre de referidor requerido"),
  fecha_reserva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  salesperson_id: z.string().uuid().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export const referidosQuerySchema = z.object({
  project: z.string().optional(),
});

export const createPriceHistorySchema = z.object({
  project_id: z.string().uuid(),
  tower_id: z.string().uuid().nullable().default(null),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  units_remaining: z.number().int().min(0),
  increment_amount: z.number(),
  increment_pct: z.number().nullable().default(null),
  new_price_avg: z.number().positive().nullable().default(null),
  appreciation_total: z.number().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export const valorizacionQuerySchema = z.object({
  project: z.string().optional(),
});

// ---------------------------------------------------------------------------
// System settings
// ---------------------------------------------------------------------------

export const updateSettingsSchema = z.object({
  auto_approval_enabled: z.boolean(),
});

export const upsertClientProfileSchema = z.object({
  gender: z.enum(["M", "F", "Otro"]).nullable().default(null),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  education_level: z.string().nullable().default(null),
  purchase_type: z.enum(["uso_propio", "inversion"]).nullable().default(null),
  marital_status: z.string().nullable().default(null),
  children_count: z.number().int().min(0).nullable().default(null),
  department: z.string().nullable().default(null),
  zone: z.string().nullable().default(null),
  occupation_type: z.enum(["formal", "informal", "independiente", "empresario"]).nullable().default(null),
  industry: z.string().nullable().default(null),
  monthly_income_individual: z.number().positive().nullable().default(null),
  monthly_income_family: z.number().positive().nullable().default(null),
  acquisition_channel: z.string().nullable().default(null),
});

// ---------------------------------------------------------------------------
// Junction metadata — admin updates to reservation_clients (030: M:N)
// ---------------------------------------------------------------------------

export const updateReservationClientSchema = z
  .object({
    role: z.enum(BUYER_ROLES).optional(),
    ownership_pct: z.number().positive().max(100).nullable().optional(),
    legal_capacity: z.string().nullable().optional(),
    document_order: z.number().int().positive().optional(),
    signs_pcv: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Al menos un campo requerido",
  });
