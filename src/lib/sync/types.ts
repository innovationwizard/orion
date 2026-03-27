/**
 * Types for the OneDrive → Orion sync system.
 *
 * These represent parsed Excel data (before DB operations) and sync run metadata.
 */

import type { RvUnitStatus } from "@/lib/reservas/types";

// ---------------------------------------------------------------------------
// Parsed Excel data — intermediate representations before DB upsert
// ---------------------------------------------------------------------------

/** A unit row parsed from a Disponibilidad workbook. */
export interface ParsedUnitStatus {
  projectSlug: string;
  towerName: string;
  unitNumber: string;
  status: RvUnitStatus;
  priceList: number | null;
  clientName: string | null;
  salespersonName: string | null;
}

/** A sale row parsed from a Reporte de Ventas sheet. */
export interface ParsedSaleRecord {
  projectSlug: string;
  towerName: string | null;
  unitNumber: string;
  clientNames: string[];
  salespersonName: string | null;
  fecha: string | null; // ISO date string
  enganche: number | null;
  medio: string | null;
  promesaFirmada: boolean;
  monthLabel: string; // Sheet name, for debugging
}

/** A row parsed from the Cesion de Derechos workbook. */
export interface ParsedCesionRecord {
  unitNumber: string;
  clientName: string | null;
  modelo: string | null;
  precioVenta: number | null;
  precioSugerido: number | null;
  gapPlusvalia: number | null;
  enganchePagado: number | null;
  enganchePactado: number | null;
  estatusCobros: string | null;
  pcvBlock: number | null;
  precalificacionStatus: string | null;
  precalificacionNotes: string | null;
  razonCompra: string | null;
  tipoCliente: string | null;
}

/** Result of parsing a single Excel file. */
export interface ExcelParseResult {
  units: ParsedUnitStatus[];
  sales: ParsedSaleRecord[];
  cesion: ParsedCesionRecord[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Sync run tracking
// ---------------------------------------------------------------------------

/** Per-file result within a sync run. */
export interface SyncFileResult {
  fileKey: string;
  fileName: string;
  lastModified: string | null;
  skipped: boolean;
  skipReason?: string;
  unitsUpdated: number;
  reservationsCreated: number;
  clientsCreated: number;
  errors: string[];
  durationMs: number;
}

/** Overall sync run result. */
export interface SyncRunResult {
  runId: string;
  status: "SUCCESS" | "PARTIAL" | "FAILED";
  startedAt: string;
  finishedAt: string;
  filesChecked: number;
  filesProcessed: number;
  fileResults: SyncFileResult[];
  unitsUpdated: number;
  reservationsCreated: number;
  clientsCreated: number;
  errors: string[];
  fileChecksums: Record<string, string>;
}

/** DB row shape for the sync_runs table. */
export interface SyncRun {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  trigger_source: string;
  files_checked: number;
  files_processed: number;
  file_results: SyncFileResult[];
  units_updated: number;
  reservations_created: number;
  clients_created: number;
  errors: string[];
  file_checksums: Record<string, string> | null;
  created_at: string;
}
