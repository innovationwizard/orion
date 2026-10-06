/**
 * Constants for the OneDrive → Orion sync system.
 *
 * OneDrive paths, status mapping, and project resolution.
 */

import type { RvUnitStatus } from "@/lib/reservas/types";

// ---------------------------------------------------------------------------
// OneDrive configuration
// ---------------------------------------------------------------------------

/** The OneDrive for Business user whose drive contains the SSOT files. */
export const ONEDRIVE_USER = "antonio.rada@puertaabierta.com.gt";

/** Base path within the user's OneDrive. */
export const ONEDRIVE_BASE = "ESTATUS DE PROYECTOS";

/** File key → relative path (under ONEDRIVE_BASE). */
export const ONEDRIVE_FILES: Record<string, string> = {
  blt_ventas: "Reservas_y_Ventas/Bosque_Las_Tapias/BOSQUE_LAS_TAPIAS_1_Reporte_de_Ventas.xlsx",
  blt_disp: "Reservas_y_Ventas/Bosque_Las_Tapias/BOSQUE_LAS_TAPIAS_2_Precios_y_Disponibilidad.xlsx",
  b5_ventas: "Reservas_y_Ventas/Boulevard_5/BOULEVARD_5_1_Reporte_de_Ventas.xlsx",
  b5_disp: "Reservas_y_Ventas/Boulevard_5/BOULEVARD_5_2_Precios_y_Disponibilidad.xlsx",
  ce_ventas: "Reservas_y_Ventas/Casa_Elisa/CASA_ELISA_1_Reporte_de_Ventas.xlsx",
  ce_disp: "Reservas_y_Ventas/Casa_Elisa/CASA_ELISA_2_Precios_y_Disponibilidad.xlsx",
  ben_ventas: "Reservas_y_Ventas/Benestare/BENESTARE_1_Reporte_de_Ventas.xlsx",
  ben_disp: "Reservas_y_Ventas/Benestare/BENESTARE_2_Precios_y_Disponibilidad.xlsx",
  se_ventas: "Reservas_y_Ventas/Santa_Elena/SANTA_ELENA_1_Reporte_de_Ventas.xlsx",
  se_disp: "Reservas_y_Ventas/Santa_Elena/SANTA_ELENA_2_Precios_y_Disponibilidad.xlsx",
  b5_cesion: "Cesion_de_Derechos/APTOS_CESION_DE_DERECHOS_ACTUALIZADO.xlsx",
};

// ---------------------------------------------------------------------------
// File key → project slug resolution
// ---------------------------------------------------------------------------

/** Maps file key prefix to project slug used in the DB. */
export const FILE_KEY_TO_PROJECT_SLUG: Record<string, string> = {
  blt: "bosque-las-tapias",
  b5: "boulevard-5",
  ce: "casa-elisa",
  ben: "benestare",
  se: "santa-elena",
};

/** Extract project key from a file key (e.g., "blt_ventas" → "blt"). */
export function projectKeyFromFileKey(fileKey: string): string {
  return fileKey.split("_")[0];
}

/** Single-tower projects where torre is always "Principal". */
export const SINGLE_TOWER_PROJECTS = new Set(["boulevard-5", "casa-elisa", "santa-elena"]);

/** Default tower name for single-tower projects. */
export const DEFAULT_TOWER_NAME = "Principal";

// ---------------------------------------------------------------------------
// Status mapping — Spanish strings → RvUnitStatus enum
// ---------------------------------------------------------------------------

export const STATUS_MAP: Record<string, RvUnitStatus> = {
  disponible: "AVAILABLE",
  reservado: "RESERVED",
  reservada: "RESERVED", // Santa Elena writes the feminine form
  pcv: "SOLD",
  promesa: "SOLD",
  vendido: "SOLD",
  congelado: "FROZEN",
  "congelado junta directiva": "FROZEN",
  liberado: "AVAILABLE",
};

// ---------------------------------------------------------------------------
// Ventas header patterns — normalized header text → semantic field name
// ---------------------------------------------------------------------------

export const VENTAS_HEADER_MAP: Record<string, string> = {
  fecha: "fecha",
  cliente: "cliente",
  "no. apartamento": "unit",
  "no apartamento": "unit",
  "no. de apartamento": "unit",
  casa: "unit", // Santa Elena uses "Casa" instead of "No. Apartamento"
  torre: "torre",
  asesor: "asesor",
  enganche: "enganche",
  "promesa firmada": "promesa",
  "falta firma": "falta_firma",
  medio: "medio",
  "precio de venta": "precio",
  "fecha de promesa": "fecha_promesa",
  "fecha de reserva": "fecha",
};

// ---------------------------------------------------------------------------
// Disponibilidad column maps — project-specific hardcoded positions
// ---------------------------------------------------------------------------

/**
 * List-price header text, matched after trimming, case-folding, and
 * accent-folding. The column is never taken from a fixed index.
 *
 * Bosque Las Tapias' title spans three columns. Santa Elena's amount is
 * US dollars — the only project priced in USD — and is stored as dollars.
 */
export const LIST_PRICE_HEADER = {
  blt: "Aproximacion - FHA",
  b5: "Precio promesa",
  ce: "Precio FINAL",
  ben: "Precio de Venta",
  se: "PRECIO TOTAL",
} as const;

/**
 * Benestare columns, matched by header text.
 * Status is "Estatus" (row 2: PCV, Disponible). "ESTADO" (row 3: Vendido)
 * is a different column and is not the unit status.
 * "Torre." is accepted as "Torre".
 */
export const BEN_COLUMN_HEADER = {
  unit: "NÚMERO",
  status: "Estatus",
  tower: "Torre",
  modelo: "TIPO",
} as const;

/**
 * Bosque Las Tapias columns, on Excel row 2.
 * The tower is not a column — it is the tab name ("Precios Torre C",
 * "Precios Torre B NUEVA"). Cotizador tabs are not inventory.
 */
export const BLT_COLUMN_HEADER = {
  unit: "Número",
  status: "Estatus",
  modelo: "Tipo",
} as const;

/** 0-indexed. Excel row 2. */
export const BLT_HEADER_ROW = 1;

/**
 * Boulevard 5 columns. There is no tower column — the project has one tower.
 * List price remains "Precio promesa".
 */
export const B5_COLUMN_HEADER = {
  unit: "Número",
  status: "Estatus",
  modelo: "Tipo",
} as const;

/**
 * Casa Elisa columns. There is no tower column — the project has one tower.
 * Two columns are headed "Número". They hold the same id now; a row whose
 * two values differ is skipped.
 */
export const CE_COLUMN_HEADER = {
  unit: "Número",
  status: "Estatus",
  modelo: "Tipo",
} as const;

/**
 * Santa Elena columns. There is no tower column — eleven separate houses,
 * stored under the single tower name "Principal". Prices are US dollars.
 */
export const SE_COLUMN_HEADER = {
  unit: "Unidad",
  status: "Estatus",
  modelo: "Modelo",
} as const;

/**
 * Column positions for Disponibilidad files.
 * These are 0-indexed (xlsx library convention).
 * Each project has different column layouts.
 * List price is not here — see LIST_PRICE_HEADER.
 */
export const DISP_COLUMNS = {
  b5: {
    sheet: "Matriz Precios A",
    towerName: "Principal",
    clientCol: 58,   // BG
    asesorCol: 59,   // BH
    headerRow: 2,
  },
  ce: {
    sheet: "Disponibilidad",
    towerName: "Principal",
    clientCol: 47,   // AV
    asesorCol: 50,   // AY
    headerRow: 2,
  },
  ben: {
    sheet: "Precios",
    towerName: null,  // Header "Torre"
    clientCol: 41,    // AP
    asesorCol: 43,    // AR
    headerRow: 2,
  },
  se: {
    sheet: "Disponibilidad",
    towerName: "Principal",
  },
} as const;

// ---------------------------------------------------------------------------
// Sync system constants
// ---------------------------------------------------------------------------

/** System actor for audit trail entries. */
export const SYNC_CHANGED_BY = "system:onedrive-sync";

/** Maximum wall-clock time (ms) before the sync engine stops processing. */
export const SYNC_TIMEOUT_MS = 50_000; // 50s (within Vercel's 60s limit)

/** Concurrency guard: skip if a sync run is still RUNNING within this window. */
export const CONCURRENCY_GUARD_MS = 5 * 60 * 1000; // 5 minutes
