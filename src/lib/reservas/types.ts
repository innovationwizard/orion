/**
 * Database types for the Reservas MVP.
 *
 * These mirror the PostgreSQL schema in 018_reservas_mvp_schema.sql exactly.
 * Column names are preserved as-is — no camelCase conversion at the type level.
 * The Supabase client returns these shapes directly.
 *
 * Table name mapping (to avoid conflicts with existing analytics tables):
 *   PostgreSQL `rv_units`   → TypeScript `RvUnit`
 *   PostgreSQL `rv_clients` → TypeScript `RvClient`
 *   All other tables use scaffolding names directly.
 */

// ---------------------------------------------------------------------------
// Enum types — match PostgreSQL custom types (rv_* prefixed)
// ---------------------------------------------------------------------------

export type RvUnitStatus = "AVAILABLE" | "SOFT_HOLD" | "RESERVED" | "FROZEN" | "SOLD";

export type ReservationStatus = "PENDING_REVIEW" | "CONFIRMED" | "REJECTED" | "DESISTED";

export type RvReceiptType =
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

export interface RvProject {
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

export interface RvUnit {
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
  status: RvUnitStatus;
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

export interface RvClient {
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
  receipt_type: RvReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  dpi_image_url: string | null;
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
  extracted_receipt_type: RvReceiptType | null;
  confidence: ExtractionConfidence | null;
  created_at: string;
}

export interface UnitStatusLog {
  id: string;
  unit_id: string;
  old_status: RvUnitStatus | null;
  new_status: RvUnitStatus;
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
  status: RvUnitStatus;
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
  receipt_type: RvReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  dpi_image_url: string | null;
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
// Integracion — pipeline summary by tower
// ---------------------------------------------------------------------------

export interface IntegrationRow {
  project_name: string;
  project_slug: string;
  tower_name: string;
  tower_id: string;
  available: number;
  soft_hold: number;
  reserved: number;
  frozen: number;
  sold: number;
  total: number;
  desisted_total: number;
  confirmed_current_month: number;
  confirmed_previous: number;
}

// ---------------------------------------------------------------------------
// Ventas — sales velocity time series
// ---------------------------------------------------------------------------

export interface VentasMonthlySeries {
  month: string;
  reservations: number;
  confirmed: number;
  desisted: number;
  net: number;
  cumulative: number;
  target?: number;
}

export interface VentasSummary {
  total_units: number;
  sold_units: number;
  available_units: number;
  absorption_rate: number;
  avg_monthly_velocity: number;
  months_to_sellout: number;
}

// ---------------------------------------------------------------------------
// Referidos — referral tracking
// ---------------------------------------------------------------------------

export interface ReferralFull {
  id: string;
  client_name: string;
  unit_number: string;
  unit_type: string;
  tower_name: string;
  project_name: string;
  project_slug: string;
  precio_lista: number | null;
  precio_referido: number | null;
  referido_por: string;
  fecha_reserva: string | null;
  salesperson_name: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateReferralPayload {
  unit_id: string;
  client_name: string;
  precio_lista: number | null;
  precio_referido: number | null;
  referido_por: string;
  fecha_reserva: string | null;
  salesperson_id: string | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Valorizacion — price history
// ---------------------------------------------------------------------------

export interface PriceHistoryEntry {
  id: string;
  project_name: string;
  project_slug: string;
  tower_name: string | null;
  effective_date: string;
  units_remaining: number;
  increment_amount: number;
  increment_pct: number | null;
  new_price_avg: number | null;
  appreciation_total: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreatePriceHistoryPayload {
  project_id: string;
  tower_id: string | null;
  effective_date: string;
  units_remaining: number;
  increment_amount: number;
  increment_pct: number | null;
  new_price_avg: number | null;
  appreciation_total: number | null;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Buyer Persona — customer demographics
// ---------------------------------------------------------------------------

export interface ClientProfile {
  id: string;
  client_id: string;
  gender: "M" | "F" | "Otro" | null;
  birth_date: string | null;
  education_level: string | null;
  purchase_type: "uso_propio" | "inversion" | null;
  marital_status: string | null;
  children_count: number | null;
  department: string | null;
  zone: string | null;
  occupation_type: "formal" | "informal" | "independiente" | "empresario" | null;
  industry: string | null;
  monthly_income_individual: number | null;
  monthly_income_family: number | null;
  acquisition_channel: string | null;
  created_at: string;
  updated_at: string;
}

export interface DistributionItem {
  label: string;
  count: number;
  pct: number;
}

export interface BuyerPersonaAggregate {
  total_profiles: number;
  by_gender: DistributionItem[];
  by_purchase_type: DistributionItem[];
  by_education: DistributionItem[];
  by_department: DistributionItem[];
  by_occupation: DistributionItem[];
  by_marital_status: DistributionItem[];
  by_channel: DistributionItem[];
}

// ---------------------------------------------------------------------------
// Cesion de Derechos — cross-domain view row (v_cesion_derechos)
// ---------------------------------------------------------------------------

export interface CesionUnit {
  unit_id: string;
  unit_number: string;
  unit_type: string;
  unit_status: RvUnitStatus;
  area_interior: number | null;
  area_terrace: number | null;
  area_total: number | null;
  parking_car: number;
  parking_tandem: number;
  parking_car_area: number | null;
  parking_tandem_area: number | null;
  bodega_area: number | null;
  price_list: number | null;
  price_suggested: number | null;
  plusvalia: number | null;
  precio_m2: number | null;
  pcv_block: number | null;
  precalificacion_status: string | null;
  precalificacion_notes: string | null;
  razon_compra: string | null;
  tipo_cliente: string | null;
  project_id: string;
  project_name: string;
  project_slug: string;
  client_name: string | null;
  enganche_total: number | null;
  enganche_pactado: number | null;
  enganche_pagado: number | null;
  diferencia: number | null;
  compliance_pct: number | null;
  compliance_status: string | null;
  days_delinquent: number | null;
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
  receipt_type: RvReceiptType | null;
  depositor_name: string | null;
  receipt_image_url: string | null;
  dpi_image_url: string | null;
  lead_source: string | null;
  notes: string | null;
}

/** Receipt data collected from the camera + OCR step */
export interface ReceiptData {
  imageUrl: string | null;
  receiptFile: File | null;
  extraction: OcrExtractionResult | null;
  depositAmount: string;
  depositDate: string;
  depositBank: string;
  receiptType: string;
  depositorName: string;
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
  receipt_type: RvReceiptType;
  confidence: ExtractionConfidence;
}
