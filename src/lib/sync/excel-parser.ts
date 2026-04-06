/**
 * Excel workbook parsers for the OneDrive → Orion sync.
 *
 * Ported from scripts/backfill_reservations.py (Python ETL).
 * Uses the existing `xlsx` library (v0.18.5) to parse .xlsx files.
 *
 * Each project has a different column layout for Disponibilidad files.
 * Ventas files use dynamic header detection (columns shift between months).
 */

import * as XLSX from "xlsx";
import type { RvUnitStatus } from "@/lib/reservas/types";
import type { ParsedUnitStatus, ParsedSaleRecord, ParsedCesionRecord } from "./types";
import {
  STATUS_MAP,
  SINGLE_TOWER_PROJECTS,
  DEFAULT_TOWER_NAME,
  DISP_COLUMNS,
  VENTAS_HEADER_MAP,
} from "./constants";
import { SALESPERSON_CANONICAL, SALESPERSON_EXCLUDE } from "./salesperson-map";

// ---------------------------------------------------------------------------
// Helper functions (ported from Python ETL)
// ---------------------------------------------------------------------------

/** Strip Unicode accents (á→a, é→e, etc.) */
export function stripAccents(s: string): string {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

/** Resolve a raw salesperson name to the canonical form, or null. */
export function normalizeSalesperson(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let cleaned = String(raw).trim();
  if (!cleaned) return null;

  // Extract first name before separator
  for (const sep of [" / ", "/", ","]) {
    if (cleaned.includes(sep)) {
      cleaned = cleaned.split(sep)[0].trim();
      break;
    }
  }
  if (!cleaned) return null;

  const key = stripAccents(cleaned).toLowerCase();
  if (SALESPERSON_EXCLUDE.has(key)) return null;
  return SALESPERSON_CANONICAL[key] ?? cleaned;
}

/** Clean a single client name. */
export function normalizeClientName(raw: string): string {
  let name = raw.trim();
  name = name.replace(/^[.,;:\-]+|[.,;:\-]+$/g, "");
  name = name.replace(/\s+/g, " ").trim();
  return name;
}

/** Split co-buyers by "/" separator, normalize each. */
export function splitClientNames(raw: string | null | undefined): string[] {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (!text) return [];

  let parts: string[];
  if (text.includes(" / ")) {
    parts = text.split(" / ");
  } else if (text.includes("/") && !/\b\w\.\//g.test(text)) {
    parts = text.split("/");
  } else {
    parts = [text];
  }

  return parts
    .map((p) => normalizeClientName(p))
    .filter((name) => name.length >= 3);
}

/** Safely extract an integer from a cell value. */
export function safeInt(val: unknown): number | null {
  if (val == null) return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return Math.trunc(n);
}

/** Safely extract a float with 2 decimal places. Handles Q-prefixed and locale-formatted values. */
export function safeFloat(val: unknown): number | null {
  if (val == null) return null;

  // If already a number, use directly
  if (typeof val === "number") {
    if (isNaN(val)) return null;
    return Math.round(val * 100) / 100;
  }

  // String: strip currency prefix ("Q", "Q ", "$", "$ ") and whitespace
  let text = String(val).trim();
  if (!text) return null;
  text = text.replace(/^[Q$]\s*/i, "").trim();

  // Handle European/Latin locale: dots as thousands, comma as decimal
  // e.g., "1.382.700,00" → "1382700.00"
  if (text.includes(",") && text.includes(".")) {
    // Dots are thousands separators, comma is decimal
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",") && !text.includes(".")) {
    // Comma might be decimal separator (e.g., "1382700,00")
    text = text.replace(",", ".");
  }

  const n = Number(text);
  if (isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

/** Parse a date from a cell value (Date, number, or string). Returns ISO date string. */
export function safeDate(val: unknown): string | null {
  if (val == null) return null;

  // xlsx library returns dates as JavaScript Date objects when cellDates=true,
  // or as serial numbers when cellDates=false (default)
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }

  // Excel serial date number
  if (typeof val === "number" && val > 25000 && val < 60000) {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      const month = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${month}-${day}`;
    }
  }

  // String formats
  const text = String(val).trim();
  if (!text) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  // DD/MM/YYYY
  const dmMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmMatch) {
    const [, d, m, y] = dmMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // MM/DD/YYYY
  const mdMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdMatch) {
    const [, m, d, y] = mdMatch;
    const month = parseInt(m, 10);
    if (month <= 12) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  return null;
}

/** Normalize unit number to string for matching. */
export function normalizeUnitNumber(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  // Locale IDs: L-1, L-2, etc.
  if (text.toUpperCase().startsWith("L-")) return text.toUpperCase();

  // Santa Elena: "Casa 1" → "Casa 1"
  if (/^casa\s+\d+$/i.test(text)) return text;

  // Integer unit numbers (≥ 100)
  const n = safeInt(text);
  if (n != null && n >= 100) return String(n);

  // Text pattern like "A-101"
  if (/^[A-Z]-\d+$/i.test(text)) return text.toUpperCase();

  return null;
}

/** Normalize tower name for matching against seeded data. */
export function normalizeTower(raw: string | null, projectSlug: string): string | null {
  if (SINGLE_TOWER_PROJECTS.has(projectSlug)) return DEFAULT_TOWER_NAME;
  if (raw == null) return null;
  const text = raw.trim();
  if (!text) return null;

  // Single letter: "C" → "Torre C"
  if (/^[A-E]$/i.test(text)) return `Torre ${text.toUpperCase()}`;

  // "TC" → "Torre C"
  if (/^T[A-E]$/i.test(text)) return `Torre ${text[1].toUpperCase()}`;

  // Already "Torre X"
  if (text.toLowerCase().startsWith("torre")) {
    const parts = text.split(/\s+/);
    const letter = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : text.slice(-1).toUpperCase();
    return `Torre ${letter}`;
  }

  return text;
}

/** Map Spanish status string to RvUnitStatus. */
export function normalizeStatus(raw: string | null | undefined): RvUnitStatus {
  if (raw == null) return "AVAILABLE";
  const key = String(raw).trim().toLowerCase();

  // If the cell contains a number, it's typically a date → unit is SOLD
  if (/^\d+(\.\d+)?$/.test(key)) return "SOLD";

  return STATUS_MAP[key] ?? "AVAILABLE";
}

/** Read a cell value from a worksheet. row/col are 0-indexed. */
function cellVal(ws: XLSX.WorkSheet, row: number, col: number): unknown {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  return cell ? cell.v : undefined;
}

/** Read a cell as string. */
function cellStr(ws: XLSX.WorkSheet, row: number, col: number): string | null {
  const v = cellVal(ws, row, col);
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

// ---------------------------------------------------------------------------
// Disponibilidad parsers — project-specific
// ---------------------------------------------------------------------------

/** Parse BLT Disponibilidad — two sheets (Torre C, Torre B). */
export function parseDispBlt(buffer: ArrayBuffer): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const results: ParsedUnitStatus[] = [];

  const configs = [DISP_COLUMNS.blt_c, DISP_COLUMNS.blt_b] as const;

  for (const cfg of configs) {
    const ws = wb.Sheets[cfg.sheet];
    if (!ws) continue;

    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    for (let r = 2; r <= range.e.r; r++) {
      const rawUnit = cellVal(ws, r, cfg.unitCol);
      const unitNum = safeInt(rawUnit);
      if (unitNum == null || unitNum < 100) continue;

      const status = normalizeStatus(cellStr(ws, r, cfg.statusCol));
      const client = cellStr(ws, r, cfg.clientCol);
      const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
      const price = safeFloat(cellVal(ws, r, cfg.priceCol));

      results.push({
        projectSlug: "bosque-las-tapias",
        towerName: cfg.towerName,
        unitNumber: String(unitNum),
        status,
        priceList: price,
        clientName: client && client.length >= 3 ? client : null,
        salespersonName: asesor,
      });
    }
  }

  return results;
}

/** Parse B5 Disponibilidad — "Matriz Precios A" sheet. */
export function parseDispB5(buffer: ArrayBuffer): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.b5;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  for (let r = 3; r <= range.e.r; r++) {
    const rawUnit = cellVal(ws, r, cfg.unitCol);
    const unitNum = safeInt(rawUnit);
    if (unitNum == null || unitNum < 100) continue;

    const status = normalizeStatus(cellStr(ws, r, cfg.statusCol));
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = safeFloat(cellVal(ws, r, cfg.priceCol));

    results.push({
      projectSlug: "boulevard-5",
      towerName: cfg.towerName,
      unitNumber: String(unitNum),
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
    });
  }

  return results;
}

/** Parse CE Disponibilidad — "Disponibilidad" sheet. */
export function parseDispCe(buffer: ArrayBuffer): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.ce;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  for (let r = 4; r <= range.e.r; r++) {
    const rawUnit = cellVal(ws, r, cfg.unitCol);
    const text = rawUnit != null ? String(rawUnit).trim() : "";

    const isLocale = text.toUpperCase().startsWith("L-");
    const unitNum = safeInt(rawUnit);

    if (!isLocale && (unitNum == null || unitNum < 100)) continue;

    const unitNumber = isLocale ? text.toUpperCase() : String(unitNum);

    const status = normalizeStatus(cellStr(ws, r, cfg.statusCol));
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = safeFloat(cellVal(ws, r, cfg.priceCol));

    results.push({
      projectSlug: "casa-elisa",
      towerName: cfg.towerName,
      unitNumber,
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
    });
  }

  return results;
}

/** Parse BEN Disponibilidad — "Precios" sheet. Tower from column K. */
export function parseDispBen(buffer: ArrayBuffer): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.ben;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  for (let r = 3; r <= range.e.r; r++) {
    const rawUnit = cellVal(ws, r, cfg.unitCol);
    const unitNum = safeInt(rawUnit);
    if (unitNum == null || unitNum < 100) continue;

    // Tower from column K (letter → "Torre X")
    const towerLetter = cellStr(ws, r, cfg.towerCol!);
    if (!towerLetter || towerLetter.length > 2) continue;
    const towerName = `Torre ${towerLetter.toUpperCase()}`;

    const status = normalizeStatus(cellStr(ws, r, cfg.statusCol));
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = safeFloat(cellVal(ws, r, cfg.priceCol));

    results.push({
      projectSlug: "benestare",
      towerName,
      unitNumber: String(unitNum),
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
    });
  }

  return results;
}

/** Parse SE Disponibilidad — "Disponibilidad" sheet. */
export function parseDispSe(buffer: ArrayBuffer): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets["Disponibilidad"];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  // SE has a simpler structure — dynamically detect columns
  // Look for header row with "Casa" or "Número" and "Estatus"
  let headerRow = -1;
  let unitCol = -1;
  let statusCol = -1;
  let clientCol = -1;
  let asesorCol = -1;
  let priceCol = -1;

  for (let r = 0; r <= Math.min(5, range.e.r); r++) {
    for (let c = 0; c <= Math.min(30, range.e.c); c++) {
      const val = cellStr(ws, r, c);
      if (!val) continue;
      const lower = val.toLowerCase().trim();
      if (lower === "casa" || lower === "numero" || lower === "número") unitCol = c;
      if (lower.includes("estatus") || lower.includes("status")) statusCol = c;
      if (lower === "cliente") clientCol = c;
      if (lower === "asesor" || lower === "vendedor") asesorCol = c;
      if (lower.includes("precio")) priceCol = c;
    }
    if (unitCol >= 0 && statusCol >= 0) {
      headerRow = r;
      break;
    }
  }

  if (headerRow < 0 || unitCol < 0) return results;

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const rawUnit = cellVal(ws, r, unitCol);
    const unitNumber = normalizeUnitNumber(rawUnit);
    if (!unitNumber) continue;

    const status = statusCol >= 0 ? normalizeStatus(cellStr(ws, r, statusCol)) : "AVAILABLE" as RvUnitStatus;
    const client = clientCol >= 0 ? cellStr(ws, r, clientCol) : null;
    const asesor = asesorCol >= 0 ? normalizeSalesperson(cellStr(ws, r, asesorCol)) : null;
    const price = priceCol >= 0 ? safeFloat(cellVal(ws, r, priceCol)) : null;

    results.push({
      projectSlug: "santa-elena",
      towerName: "Principal",
      unitNumber,
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Ventas parser — dynamic header detection (generic across projects)
// ---------------------------------------------------------------------------

/**
 * Detect header row and column mapping for a Ventas sheet.
 * Returns [headerRow (0-indexed), { fieldName: colIndex }].
 */
function detectVentasHeaders(
  ws: XLSX.WorkSheet,
  maxScanRows = 5,
): [number, Record<string, number>] {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  for (let r = 0; r < Math.min(maxScanRows, range.e.r + 1); r++) {
    const cols: Record<string, number> = {};

    for (let c = 0; c <= Math.min(29, range.e.c); c++) {
      const val = cellStr(ws, r, c);
      if (!val) continue;

      const text = stripAccents(val.toLowerCase().replace(/[.\s]+$/, ""));

      for (const [pattern, fieldName] of Object.entries(VENTAS_HEADER_MAP)) {
        if (text === pattern || text.startsWith(pattern)) {
          if (!(fieldName in cols)) {
            cols[fieldName] = c;
          }
          break;
        }
      }
    }

    // Valid header row needs at least "cliente" and ("unit" or "asesor")
    if ("cliente" in cols && ("unit" in cols || "asesor" in cols)) {
      return [r, cols];
    }
  }

  return [-1, {}];
}

/** Parse all "Ventas*" sheets from a Reporte de Ventas workbook. */
export function parseVentasSheets(
  buffer: ArrayBuffer,
  projectSlug: string,
): ParsedSaleRecord[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const results: ParsedSaleRecord[] = [];

  for (const sheetName of wb.SheetNames) {
    if (!sheetName.toLowerCase().startsWith("ventas")) continue;

    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const [headerRow, cols] = detectVentasHeaders(ws);
    if (headerRow < 0 || !("cliente" in cols)) continue;

    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

    for (let r = headerRow + 1; r <= range.e.r; r++) {
      // Client is required
      const clientRaw = cellStr(ws, r, cols.cliente);
      if (!clientRaw) continue;

      // Unit number
      const unitRaw = "unit" in cols ? cellVal(ws, r, cols.unit) : null;
      const unitNum = normalizeUnitNumber(unitRaw);
      if (!unitNum) continue;

      // Tower
      const torreRaw = "torre" in cols ? cellStr(ws, r, cols.torre) : null;
      const torre = normalizeTower(torreRaw, projectSlug);

      // Salesperson
      const spRaw = "asesor" in cols ? cellStr(ws, r, cols.asesor) : null;
      const sp = normalizeSalesperson(spRaw);

      // Date
      const fechaRaw = "fecha" in cols ? cellVal(ws, r, cols.fecha) : null;
      const fecha = safeDate(fechaRaw);

      // Enganche
      const engRaw = "enganche" in cols ? cellVal(ws, r, cols.enganche) : null;
      const enganche = safeFloat(engRaw);

      // Medio (lead source)
      const medioRaw = "medio" in cols ? cellStr(ws, r, cols.medio) : null;

      // Promesa firmada
      const promesaRaw = "promesa" in cols ? cellStr(ws, r, cols.promesa) : null;
      const promesa =
        promesaRaw != null &&
        !["", "0", "no", "false"].includes(promesaRaw.toLowerCase());

      // Split client names
      const clients = splitClientNames(clientRaw);
      if (clients.length === 0) continue;

      results.push({
        projectSlug,
        towerName: torre,
        unitNumber: unitNum,
        clientNames: clients,
        salespersonName: sp,
        fecha,
        enganche,
        medio: medioRaw,
        promesaFirmada: promesa,
        monthLabel: sheetName,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Cesion de Derechos parser (B5 only)
// ---------------------------------------------------------------------------

/** Parse the Cesion de Derechos workbook — "Cesión de derechos" sheet. */
export function parseCesion(buffer: ArrayBuffer): ParsedCesionRecord[] {
  const wb = XLSX.read(buffer, { type: "array" });

  // Find the sheet (name may have accent variations)
  const sheetName = wb.SheetNames.find((n) =>
    stripAccents(n.toLowerCase()).includes("cesion de derechos"),
  );
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const results: ParsedCesionRecord[] = [];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");

  // Fixed columns (from Excel analysis): row 0 = headers, data starts row 1
  // A=Cliente, B=No.Apartamento, C=Modelo, D=PrecioVenta, ...
  // N=PrecioSugerido, O=GAP, R=EnganchePagado, Q=EnganchePactado,
  // U=EstatusCobros, V=BloquePCV, W=EstatusPrecal, X=ComentariosPrecal,
  // Y=RazónCompra, Z=TipoCliente
  for (let r = 1; r <= range.e.r; r++) {
    const clientName = cellStr(ws, r, 0); // A
    const rawUnit = cellVal(ws, r, 1); // B
    const unitNum = safeInt(rawUnit);
    if (unitNum == null || unitNum < 100) continue;

    results.push({
      unitNumber: String(unitNum),
      clientName,
      modelo: cellStr(ws, r, 2), // C
      precioVenta: safeFloat(cellVal(ws, r, 3)), // D
      precioSugerido: safeFloat(cellVal(ws, r, 13)), // N
      gapPlusvalia: safeFloat(cellVal(ws, r, 14)), // O
      enganchePactado: safeFloat(cellVal(ws, r, 16)), // Q
      enganchePagado: safeFloat(cellVal(ws, r, 17)), // R
      estatusCobros: cellStr(ws, r, 20), // U
      pcvBlock: safeInt(cellVal(ws, r, 21)), // V
      precalificacionStatus: cellStr(ws, r, 22), // W
      precalificacionNotes: cellStr(ws, r, 23), // X
      razonCompra: cellStr(ws, r, 24), // Y
      tipoCliente: cellStr(ws, r, 25), // Z
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Dispatcher — route a file key to the correct parser
// ---------------------------------------------------------------------------

/** Parse a Disponibilidad file based on its project key prefix. */
export function parseDisponibilidad(
  buffer: ArrayBuffer,
  fileKey: string,
): ParsedUnitStatus[] {
  if (fileKey.startsWith("blt")) return parseDispBlt(buffer);
  if (fileKey.startsWith("b5")) return parseDispB5(buffer);
  if (fileKey.startsWith("ce")) return parseDispCe(buffer);
  if (fileKey.startsWith("ben")) return parseDispBen(buffer);
  if (fileKey.startsWith("se")) return parseDispSe(buffer);
  return [];
}
