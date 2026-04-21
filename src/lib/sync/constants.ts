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
export const ONEDRIVE_USER = "alek.hernandez@puertaabierta.com.gt";

/** Base path within the user's OneDrive. */
export const ONEDRIVE_BASE = "Documentos/0. Estatus Proyectos";

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
 * Column positions for Disponibilidad files.
 * These are 0-indexed (xlsx library convention).
 * Each project has different column layouts.
 */
export const DISP_COLUMNS = {
  blt_c: {
    sheet: "Precios Torre C",
    towerName: "Torre C",
    unitCol: 1,      // B
    statusCol: 26,   // AA
    clientCol: 27,   // AB
    asesorCol: 28,   // AC
    priceCol: 17,    // R (Aproximación FHA)
    headerRow: 1,    // 0-indexed row for header validation
  },
  blt_b: {
    sheet: "Precios Torre B",
    towerName: "Torre B",
    unitCol: 1,      // B
    statusCol: 25,   // Z  — "Estatus" (was 23/X before column insertion)
    clientCol: 26,   // AA — "Cliente"
    asesorCol: 27,   // AB — "Asesor"
    priceCol: 16,    // Q  — "Aproximación FHA" (was 15/P before column insertion)
    headerRow: 1,
  },
  b5: {
    sheet: "Matriz Precios A",
    towerName: "Principal",
    unitCol: 1,      // B
    statusCol: 57,   // BF
    clientCol: 58,   // BG
    asesorCol: 59,   // BH
    priceCol: 40,    // AO (Precio Final REDONDEADO)
    headerRow: 2,
  },
  ce: {
    sheet: "Disponibilidad",
    towerName: "Principal",
    unitCol: 1,      // B
    statusCol: 48,   // AW
    clientCol: 47,   // AV
    asesorCol: 50,   // AY
    priceCol: 38,    // AM (Precio FINAL)
    headerRow: 2,
  },
  ben: {
    sheet: "Precios",
    towerName: null,  // Read from column K
    unitCol: 3,       // D (NUMERO)
    statusCol: 40,    // AO
    clientCol: 41,    // AP
    asesorCol: 43,    // AR
    priceCol: 22,     // W (Precio de Venta)
    towerCol: 10,     // K (Torre letter)
    headerRow: 2,
  },
  se: {
    sheet: "Disponibilidad",
    towerName: "Principal",
    unitCol: 1,       // B (or similar — TBD on first observation)
    statusCol: -1,    // TBD
    clientCol: -1,    // TBD
    asesorCol: -1,    // TBD
    priceCol: -1,     // TBD
    headerRow: 1,
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
