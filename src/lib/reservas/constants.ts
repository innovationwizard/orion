/**
 * Domain constants for the Reservas MVP.
 *
 * Single source of truth for all enums, labels, and configuration values
 * used across the reservation system. Every dropdown, badge color, and
 * validation list draws from here — nothing is hardcoded in components.
 */

import type {
  RvUnitStatus,
  ReservationStatus,
  RvReceiptType,
  ExtractionConfidence,
  RvBuyerRole,
} from "./types";

// ---------------------------------------------------------------------------
// Unit statuses
// ---------------------------------------------------------------------------

export const UNIT_STATUSES: readonly RvUnitStatus[] = [
  "AVAILABLE",
  "SOFT_HOLD",
  "RESERVED",
  "FROZEN",
  "SOLD",
] as const;

export const UNIT_STATUS_LABELS: Record<RvUnitStatus, string> = {
  AVAILABLE: "Disponible",
  SOFT_HOLD: "En revisión",
  RESERVED: "Reservado",
  FROZEN: "Congelado",
  SOLD: "Vendido",
};

export const UNIT_STATUS_COLORS: Record<RvUnitStatus, string> = {
  AVAILABLE: "#22c55e",
  SOFT_HOLD: "#f59e0b",
  RESERVED: "#3b82f6",
  FROZEN: "#a855f7",
  SOLD: "#6b7280",
};

/** Statuses where the unit can accept a new reservation */
export const RESERVABLE_STATUSES: readonly RvUnitStatus[] = ["AVAILABLE", "FROZEN"] as const;

// ---------------------------------------------------------------------------
// Reservation statuses
// ---------------------------------------------------------------------------

export const RESERVATION_STATUSES: readonly ReservationStatus[] = [
  "PENDING_REVIEW",
  "CONFIRMED",
  "REJECTED",
  "DESISTED",
] as const;

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING_REVIEW: "Pendiente de revisión",
  CONFIRMED: "Confirmada",
  REJECTED: "Rechazada",
  DESISTED: "Desistida",
};

// ---------------------------------------------------------------------------
// Receipt types
// ---------------------------------------------------------------------------

export const RECEIPT_TYPES = [
  "TRANSFER",
  "DEPOSIT_SLIP",
  "NEOLINK",
  "MOBILE_SCREENSHOT",
  "CHECK",
  "OTHER",
] as const satisfies readonly RvReceiptType[];

export const RECEIPT_TYPE_LABELS: Record<RvReceiptType, string> = {
  TRANSFER: "Transferencia bancaria",
  DEPOSIT_SLIP: "Boleta de depósito",
  NEOLINK: "NeoLink / Pasarela de pago",
  MOBILE_SCREENSHOT: "Captura de banca móvil",
  CHECK: "Cheque",
  OTHER: "Otro",
};

// ---------------------------------------------------------------------------
// OCR confidence
// ---------------------------------------------------------------------------

export const CONFIDENCE_LABELS: Record<ExtractionConfidence, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

export const CONFIDENCE_COLORS: Record<ExtractionConfidence, string> = {
  HIGH: "#22c55e",
  MEDIUM: "#f59e0b",
  LOW: "#ef4444",
};

// ---------------------------------------------------------------------------
// Buyer roles (030: M:N buyer support)
// ---------------------------------------------------------------------------

export const BUYER_ROLES = [
  "PROMITENTE_COMPRADOR",
  "CO_COMPRADOR",
  "REPRESENTANTE_LEGAL",
  "GARANTE",
] as const satisfies readonly RvBuyerRole[];

export const BUYER_ROLE_LABELS: Record<RvBuyerRole, string> = {
  PROMITENTE_COMPRADOR: "Promitente Comprador(a)",
  CO_COMPRADOR: "Co-Comprador(a)",
  REPRESENTANTE_LEGAL: "Representante Legal",
  GARANTE: "Garante",
};

export const BUYER_ROLE_LABELS_SHORT: Record<RvBuyerRole, string> = {
  PROMITENTE_COMPRADOR: "Principal",
  CO_COMPRADOR: "Co-comprador",
  REPRESENTANTE_LEGAL: "Rep. Legal",
  GARANTE: "Garante",
};

// ---------------------------------------------------------------------------
// Lead sources — unified across all 4 projects
// ---------------------------------------------------------------------------

export const LEAD_SOURCES = [
  "Facebook",
  "Meta",
  "Perfilan",
  "Referido",
  "Visita Inédita",
  "Señalética",
  "Vallas",
  "PBX",
  "Leads",
  "Web",
  "Página Web",
  "Pipedrive",
  "Inbox",
  "Expocasa",
  "Mailing",
  "Prospección",
  "F&F",
  "Wati",
  "Cartera Antigua",
  "PD",
  "Activación",
  "Evento",
  "Lead",
  "Otro",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];

// ---------------------------------------------------------------------------
// Guatemalan banks — for OCR validation and receipt display
// ---------------------------------------------------------------------------

export const GUATEMALAN_BANKS = [
  "Banrural",
  "Industrial",
  "G&T Continental",
  "BAM",
  "Bantrab",
  "Inmobiliario",
  "CHN",
  "Agromercantil",
  "BAC",
  "Promerica",
  "Vivibanco",
  "Ficohsa",
] as const;

export type GuatemalaBank = (typeof GUATEMALAN_BANKS)[number];

// ---------------------------------------------------------------------------
// Project slugs — used for URL routing and API filtering
// ---------------------------------------------------------------------------

export const PROJECT_SLUGS = {
  BLT: "bosque-las-tapias",
  CE: "casa-elisa",
  BEN: "benestare",
  B5: "boulevard-5",
} as const;

// ---------------------------------------------------------------------------
// Receipt image upload constraints
// ---------------------------------------------------------------------------

export const RECEIPT_UPLOAD = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ACCEPTED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "application/pdf",
  ],
  ACCEPTED_EXTENSIONS: ".jpg,.jpeg,.png,.webp,.heic,.pdf",
} as const;

// ---------------------------------------------------------------------------
// UI configuration
// ---------------------------------------------------------------------------

export const LOCALE = "es-GT" as const;
export const CURRENCY = "GTQ" as const;
export const CURRENCY_SYMBOL = "Q" as const;

/** Format a number as Guatemalan Quetzales */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `Q${amount.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Compact currency format for KPI cards (Q1.33M, Q133K) */
export function fmtQCompact(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n === 0) return "Q0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e6) return `${sign}Q${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}Q${(abs / 1e3).toFixed(0)}K`;
  return `${sign}Q${abs.toFixed(0)}`;
}

/** Format a date string (ISO) to localized display */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString(LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Buyer Persona — dropdown options for demographic form
// ---------------------------------------------------------------------------

export const BUYER_PERSONA_OPTIONS = {
  gender: ["M", "F", "Otro"] as const,
  purchase_type: [
    { value: "uso_propio", label: "Uso propio" },
    { value: "inversion", label: "Inversión" },
  ] as const,
  marital_status: ["Soltero/a", "Casado/a", "Unido/a", "Divorciado/a", "Viudo/a"] as const,
  education: [
    "Diversificado",
    "Universitario",
    "Licenciatura",
    "Maestría",
    "Doctorado",
    "Otro",
  ] as const,
  occupation: [
    { value: "formal", label: "Empleado formal" },
    { value: "informal", label: "Empleado informal" },
    { value: "independiente", label: "Independiente" },
    { value: "empresario", label: "Empresario" },
  ] as const,
  departments: [
    "Guatemala",
    "Sacatepéquez",
    "Chimaltenango",
    "Escuintla",
    "Quetzaltenango",
    "Alta Verapaz",
    "Petén",
    "Izabal",
    "Jutiapa",
    "Santa Rosa",
    "Sololá",
    "Huehuetenango",
    "San Marcos",
    "Totonicapán",
    "Retalhuleu",
    "Suchitepéquez",
    "Zacapa",
    "Chiquimula",
    "Jalapa",
    "Baja Verapaz",
    "El Progreso",
    "Quiché",
  ] as const,
  channels: [
    "Facebook",
    "Meta",
    "Referido",
    "Visita Inédita",
    "Señalética",
    "Web",
    "Pipedrive",
    "Expocasa",
    "Mailing",
    "Prospección",
    "Evento",
    "Otro",
  ] as const,
} as const;
