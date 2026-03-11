/**
 * Database types for the Reservas MVP.
 *
 * These mirror the PostgreSQL schema in 001_initial_schema.sql exactly.
 * Column names are preserved as-is — no camelCase conversion at the type level.
 * The Supabase client returns these shapes directly.
 */

// ---------------------------------------------------------------------------
// Enum types — match PostgreSQL custom types
// ---------------------------------------------------------------------------

export type UnitStatus = "AVAILABLE" | "SOFT_HOLD" | "RESERVED" | "FROZEN" | "SOLD";

export type ReservationStatus = "PENDING_REVIEW" | "CONFIRMED" | "REJECTED" | "DESISTED";

export type ReceiptType =
  | "TRANSFER"
  | "DEPOSIT_SLIP"
  | "NEOLINK"
  | "MOBILE_SCREENSHOT"
  | "CHECK"
  | "OTHER";

export type ExtractionConfidence = "HIGH" | "MEDIUM" | "LOW";

export type FreezeRequestStatus = "ACTIVE" | "RELEASED";

// ---------------------------------------------------------------------------
// Table row types
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Tower {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Floor {
  id: string;
  tower_id: string;
  number: number;
  created_at: string;
}

export interface Unit {
  id: string;
  floor_id: string;
  unit_number: string;
  unit_code: string | null;
  unit_type: string;
  bedrooms: number;
  is_local: boolean;
  area_interior: number | null;
  area_balcony: number | null;
  area_terrace: number | null;
  area_garden: number | null;
  area_total: number | null;
  parking_car: number;
  parking_tandem: number;
  parking_moto: number;
  parking_type: string | null;
  parking_number: string | null;
  parking_level: string | null;
  bodega_number: string | null;
  bodega_area: number | null;
  price_list: number | null;
  status: UnitStatus;
  status_detail: string | null;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Salesperson {
  id: string;
  full_name: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  dpi: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  unit_id: string;
  salesperson_id: string;
  status: ReservationStatus;
  deposit_amount: number | null;
  deposit_date: string | null;
  deposit_bank: string | null;
  receipt_type: ReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  notes: string | null;
  lead_source: string | null;
  is_resale: boolean;
  desistimiento_reason: string | null;
  desistimiento_date: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export interface ReservationClient {
  id: string;
  reservation_id: string;
  client_id: string;
  is_primary: boolean;
  created_at: string;
}

export interface ReceiptExtraction {
  id: string;
  reservation_id: string;
  raw_response: Record<string, unknown>;
  extracted_amount: number | null;
  extracted_date: string | null;
  extracted_bank: string | null;
  extracted_ref: string | null;
  extracted_depositor: string | null;
  extracted_receipt_type: ReceiptType | null;
  confidence: ExtractionConfidence | null;
  created_at: string;
}

export interface UnitStatusLog {
  id: string;
  unit_id: string;
  old_status: UnitStatus | null;
  new_status: UnitStatus;
  changed_by: string;
  reservation_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface FreezeRequest {
  id: string;
  unit_id: string;
  salesperson_id: string;
  reason: string;
  vip_name: string | null;
  status: FreezeRequestStatus;
  released_at: string | null;
  released_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// View types — denormalized shapes returned by database views
// ---------------------------------------------------------------------------

export interface UnitFull {
  id: string;
  unit_number: string;
  unit_code: string | null;
  unit_type: string;
  bedrooms: number;
  is_local: boolean;
  area_interior: number | null;
  area_balcony: number | null;
  area_terrace: number | null;
  area_garden: number | null;
  area_total: number | null;
  parking_car: number;
  parking_tandem: number;
  parking_number: string | null;
  parking_level: string | null;
  bodega_number: string | null;
  price_list: number | null;
  status: UnitStatus;
  status_detail: string | null;
  status_changed_at: string | null;
  floor_number: number;
  floor_id: string;
  tower_id: string;
  tower_name: string;
  tower_is_default: boolean;
  tower_delivery_date: string | null;
  project_id: string;
  project_name: string;
  project_slug: string;
}

export interface ReservationPending {
  reservation_id: string;
  reservation_status: ReservationStatus;
  deposit_amount: number | null;
  deposit_date: string | null;
  deposit_bank: string | null;
  receipt_type: ReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  lead_source: string | null;
  notes: string | null;
  is_resale: boolean;
  submitted_at: string;
  unit_number: string;
  unit_code: string | null;
  unit_type: string;
  bedrooms: number;
  price_list: number | null;
  floor_number: number;
  tower_name: string;
  tower_is_default: boolean;
  project_name: string;
  project_slug: string;
  salesperson_name: string;
  salesperson_id: string;
  extracted_amount: number | null;
  extracted_date: string | null;
  extracted_bank: string | null;
  ocr_confidence: ExtractionConfidence | null;
  client_names: string[];
  client_phone: string | null;
}

export interface ProjectWithTowers {
  project_id: string;
  project_name: string;
  project_slug: string;
  towers: {
    id: string;
    name: string;
    is_default: boolean;
    delivery_date: string | null;
  }[];
}

export interface UnitSaleCount {
  unit_id: string;
  total_sales: number;
  desistimientos: number;
}

// ---------------------------------------------------------------------------
// API payload types — what the client sends to the server
// ---------------------------------------------------------------------------

export interface SubmitReservationPayload {
  unit_id: string;
  salesperson_id: string;
  client_names: string[];
  client_phone: string | null;
  deposit_amount: number | null;
  deposit_date: string | null;
  deposit_bank: string | null;
  receipt_type: ReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  lead_source: string | null;
  notes: string | null;
}

export interface ConfirmReservationPayload {
  admin_user_id: string;
}

export interface RejectReservationPayload {
  admin_user_id: string;
  reason: string;
}

export interface DesistReservationPayload {
  admin_user_id: string;
  reason: string;
  desistimiento_date: string;
}

export interface SubmitFreezePayload {
  unit_id: string;
  salesperson_id: string;
  reason: string;
  vip_name: string | null;
}

export interface ReleaseFreezePayload {
  admin_user_id: string;
}

// ---------------------------------------------------------------------------
// OCR types — Claude Vision extraction
// ---------------------------------------------------------------------------

export interface OcrExtractionResult {
  amount: number | null;
  date: string | null;
  bank: string | null;
  reference_number: string | null;
  account_last_digits: string | null;
  depositor_name: string | null;
  receipt_type: ReceiptType;
  confidence: ExtractionConfidence;
}
