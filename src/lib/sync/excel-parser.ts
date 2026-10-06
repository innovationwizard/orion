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
  BEN_COLUMN_HEADER,
  BLT_COLUMN_HEADER,
  BLT_HEADER_ROW,
  B5_COLUMN_HEADER,
  CE_COLUMN_HEADER,
  SE_COLUMN_HEADER,
  DISP_COLUMNS,
  LIST_PRICE_HEADER,
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

/**
 * Map Spanish status string to RvUnitStatus.
 *
 * A blank cell means the unit is available — that is how the workbooks
 * represent it. An unrecognized string is a different matter: it means
 * someone typed a status this system does not know, and silently treating
 * it as AVAILABLE could release a sold unit. Those throw.
 */
export function normalizeStatus(
  raw: string | null | undefined,
  context?: string,
): RvUnitStatus {
  if (raw == null) return "AVAILABLE";
  const key = String(raw).trim().toLowerCase();
  if (!key) return "AVAILABLE";

  const mapped = STATUS_MAP[key];
  if (!mapped) {
    const where = context ? ` (${context})` : "";
    throw new UnknownStatusError(
      `Unknown status "${String(raw).trim()}"${where}. ` +
        `Known statuses: ${Object.keys(STATUS_MAP).join(", ")}.`,
    );
  }
  return mapped;
}

/** Raised when a Disponibilidad cell holds a status string we do not recognize. */
export class UnknownStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnknownStatusError";
  }
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

/**
 * Header text comparison: ignore case, accents, and surrounding space.
 * Hyphens with or without spaces compare equal ("Aproximacion-FHA" and
 * "Aproximación - FHA" both match the Bosque title).
 */
function normalizeHeaderLabel(raw: string): string {
  return stripAccents(raw)
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, "");
}

/**
 * Smallest amount treated as a list price when a header covers several
 * columns. Skips year numbers, column indexes, and currency tokens.
 * The derived figure under Bosque's title (about 10% of the price) is
 * larger than this, so column order — not the threshold — keeps it out.
 */
const LIST_PRICE_MIN = 10_000;

interface HeaderSpan {
  row: number;
  startCol: number;
  endCol: number;
}

/** Exact header matches in the first rows of a sheet. A merge is reported as its full span. */
function findHeaderSpans(ws: XLSX.WorkSheet, expectedHeader: string): HeaderSpan[] {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const want = normalizeHeaderLabel(expectedHeader);
  const lastHeaderRow = Math.min(range.e.r, 14);
  const unique = new Map<string, HeaderSpan>();

  for (let r = 0; r <= lastHeaderRow; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const text = cellStr(ws, r, c);
      if (!text || normalizeHeaderLabel(text) !== want) continue;

      const merge = (ws["!merges"] ?? []).find(
        (m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c,
      );
      const hit: HeaderSpan = {
        row: r,
        startCol: merge ? merge.s.c : c,
        endCol: merge ? merge.e.c : c,
      };
      unique.set(`${hit.startCol}:${hit.endCol}`, hit);
    }
  }

  return [...unique.values()];
}

/**
 * Column whose header text is `expectedHeader`.
 * Several matches are returned left to right. Casa Elisa has two "Número"
 * columns; every other caller requires exactly one.
 */
function resolveHeaderColumns(
  ws: XLSX.WorkSheet,
  expectedHeader: string,
  sheetLabel: string,
  errors: string[],
  onlyRow?: number,
): HeaderSpan[] {
  const hits = findHeaderSpans(ws, expectedHeader)
    .filter((hit) => onlyRow == null || hit.row === onlyRow)
    .sort((a, b) => a.startCol - b.startCol);
  if (hits.length === 0) {
    errors.push(
      `${sheetLabel}: header "${expectedHeader}" not found — that column was not read.`,
    );
    return [];
  }
  const cols = hits.map((hit) => XLSX.utils.encode_col(hit.startCol)).join(", ");
  console.info(`[sync:parser] ${sheetLabel}: "${expectedHeader}" → column ${cols}`);
  return hits;
}

/**
 * Column whose header text is `expectedHeader`.
 * Missing or repeated headers return null and record an error — callers
 * must not fall back to a column index.
 */
function resolveHeaderColumn(
  ws: XLSX.WorkSheet,
  expectedHeader: string,
  sheetLabel: string,
  errors: string[],
  onlyRow?: number,
): HeaderSpan | null {
  const hits = resolveHeaderColumns(ws, expectedHeader, sheetLabel, errors, onlyRow);
  if (hits.length === 0) return null;
  if (hits.length > 1) {
    const where = hits.map((hit) => XLSX.utils.encode_col(hit.startCol)).join(", ");
    errors.push(
      `${sheetLabel}: header "${expectedHeader}" matched columns ${where} — refusing to guess.`,
    );
    return null;
  }
  return hits[0];
}

/**
 * Find the list-price column by header text.
 *
 * Returns null, and records an error, when the header is missing or appears
 * in more than one place. Callers then leave price_list unchanged.
 *
 * A merged header stores its label in the leftmost cell. Bosque's
 * "Aproximacion - FHA" covers three columns: the rounded list price, a
 * currency mark, and a smaller derived amount. The list price is the
 * leftmost column of that span that holds an amount.
 */
function resolveListPriceColumn(
  ws: XLSX.WorkSheet,
  expectedHeader: string,
  sheetLabel: string,
  errors: string[],
): number | null {
  const hits = findHeaderSpans(ws, expectedHeader);
  if (hits.length === 0) {
    errors.push(
      `${sheetLabel}: list-price header "${expectedHeader}" not found — prices left unchanged.`,
    );
    return null;
  }
  if (hits.length > 1) {
    const where = hits.map((hit) => XLSX.utils.encode_col(hit.startCol)).join(", ");
    errors.push(
      `${sheetLabel}: list-price header "${expectedHeader}" matched columns ${where} — refusing to guess, prices left unchanged.`,
    );
    return null;
  }

  const hit = hits[0];
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  let priceCol = hit.startCol;

  if (hit.endCol > hit.startCol) {
    let found: number | null = null;
    for (let c = hit.startCol; c <= hit.endCol && found == null; c++) {
      for (let r = hit.row + 1; r <= range.e.r; r++) {
        const amount = safeFloat(cellVal(ws, r, c));
        if (amount != null && amount >= LIST_PRICE_MIN) {
          found = c;
          break;
        }
      }
    }
    if (found == null) {
      errors.push(
        `${sheetLabel}: header "${expectedHeader}" spans ` +
          `${XLSX.utils.encode_col(hit.startCol)}:${XLSX.utils.encode_col(hit.endCol)} ` +
          `but none of those columns hold a list price — prices left unchanged.`,
      );
      return null;
    }
    priceCol = found;
  }

  console.info(
    `[sync:parser] ${sheetLabel}: list price "${expectedHeader}" → ` +
      `column ${XLSX.utils.encode_col(priceCol)}`,
  );
  return priceCol;
}

// ---------------------------------------------------------------------------
// Disponibilidad parsers — project-specific
// ---------------------------------------------------------------------------

/**
 * Resolve a unit's status, recording unknown values instead of guessing.
 *
 * Returns null when the status cannot be trusted, so the caller skips the row
 * and leaves the DB value alone — the previous status survives rather than
 * being overwritten with a guess.
 */
function resolveStatus(
  raw: string | null,
  context: string,
  errors: string[],
): RvUnitStatus | null {
  try {
    return normalizeStatus(raw, context);
  } catch (err) {
    if (err instanceof UnknownStatusError) {
      errors.push(err.message);
      console.error(`[sync:parser] ${err.message}`);
      return null;
    }
    throw err;
  }
}

/**
 * Tower from a Bosque inventory tab. "Precios Torre B NUEVA" → "Torre B".
 * Cotizador tabs are not inventory.
 */
function bltTowerFromSheet(sheetName: string): string | null {
  const name = stripAccents(sheetName).toLowerCase().replace(/\s+/g, " ").trim();
  if (!name.startsWith("precios")) return null;
  const match = name.match(/\btorre\s+([a-e])\b/);
  if (!match) return null;
  return `Torre ${match[1].toUpperCase()}`;
}

/** Parse BLT Disponibilidad. One sheet per tower; the tab name is the tower. */
export function parseDispBlt(buffer: ArrayBuffer, errors: string[] = []): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const results: ParsedUnitStatus[] = [];

  const byTower = new Map<string, string[]>();
  for (const sheetName of wb.SheetNames) {
    const tower = bltTowerFromSheet(sheetName);
    if (!tower) continue;
    const names = byTower.get(tower) ?? [];
    names.push(sheetName);
    byTower.set(tower, names);
  }

  if (byTower.size === 0) {
    errors.push(
      'BLT: no "Precios Torre …" sheet found — workbook not parsed.',
    );
    return results;
  }

  for (const [towerName, sheetNames] of byTower) {
    if (sheetNames.length > 1) {
      errors.push(
        `BLT ${towerName}: more than one precios sheet (${sheetNames.join(", ")}) — refusing to guess.`,
      );
      continue;
    }

    const sheetName = sheetNames[0];
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const label = `BLT ${sheetName}`;
    const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
    const unitHit = resolveHeaderColumn(
      ws,
      BLT_COLUMN_HEADER.unit,
      label,
      errors,
      BLT_HEADER_ROW,
    );
    const statusHit = resolveHeaderColumn(
      ws,
      BLT_COLUMN_HEADER.status,
      label,
      errors,
      BLT_HEADER_ROW,
    );
    const modeloHit = resolveHeaderColumn(
      ws,
      BLT_COLUMN_HEADER.modelo,
      label,
      errors,
      BLT_HEADER_ROW,
    );
    const priceCol = resolveListPriceColumn(ws, LIST_PRICE_HEADER.blt, label, errors);

    if (unitHit == null || statusHit == null) continue;

    for (let r = BLT_HEADER_ROW + 1; r <= range.e.r; r++) {
      const unitNum = safeInt(cellVal(ws, r, unitHit.startCol));
      if (unitNum == null || unitNum < 100) continue;

      const status = resolveStatus(
        cellStr(ws, r, statusHit.startCol),
        `BLT ${towerName} unit ${unitNum}, row ${r + 1}`,
        errors,
      );
      if (status == null) continue;

      const price = priceCol == null ? null : safeFloat(cellVal(ws, r, priceCol));
      const unitType = modeloHit ? cellStr(ws, r, modeloHit.startCol) : null;

      results.push({
        projectSlug: "bosque-las-tapias",
        towerName,
        unitNumber: String(unitNum),
        status,
        priceList: price,
        clientName: null,
        salespersonName: null,
        unitType,
      });
    }
  }

  return results;
}

/** Parse B5 Disponibilidad — "Matriz Precios A" sheet. One tower. */
export function parseDispB5(buffer: ArrayBuffer, errors: string[] = []): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.b5;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const label = `B5 ${cfg.sheet}`;
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const unitHit = resolveHeaderColumn(ws, B5_COLUMN_HEADER.unit, label, errors);
  const statusHit = resolveHeaderColumn(ws, B5_COLUMN_HEADER.status, label, errors);
  const modeloHit = resolveHeaderColumn(ws, B5_COLUMN_HEADER.modelo, label, errors);
  const priceCol = resolveListPriceColumn(ws, LIST_PRICE_HEADER.b5, label, errors);

  if (unitHit == null || statusHit == null) return results;

  const headerRows = [unitHit.row, statusHit.row];
  if (modeloHit) headerRows.push(modeloHit.row);
  const dataStart = Math.max(...headerRows) + 1;

  for (let r = dataStart; r <= range.e.r; r++) {
    const unitNum = safeInt(cellVal(ws, r, unitHit.startCol));
    if (unitNum == null || unitNum < 100) continue;

    const status = resolveStatus(
      cellStr(ws, r, statusHit.startCol),
      `B5 unit ${unitNum}, row ${r + 1}`,
      errors,
    );
    if (status == null) continue;
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = priceCol == null ? null : safeFloat(cellVal(ws, r, priceCol));
    const unitType = modeloHit ? cellStr(ws, r, modeloHit.startCol) : null;

    results.push({
      projectSlug: "boulevard-5",
      towerName: cfg.towerName,
      unitNumber: String(unitNum),
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
      unitType,
    });
  }

  return results;
}

/** A Casa Elisa unit id: "101" or "L-1". Anything else is not an id. */
function readCeUnitId(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  if (text.toUpperCase().startsWith("L-")) return text.toUpperCase();
  const n = safeInt(text);
  if (n != null && n >= 100) return String(n);
  return null;
}

/**
 * Text used to compare the two Número columns.
 * Unit ids are normalized ("l-1" and 101 match "L-1" and "101").
 * Any other non-empty text is kept so a different nomenclature still conflicts.
 */
function ceUnitIdentity(raw: unknown): string | null {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;
  return readCeUnitId(raw) ?? text;
}

/** Parse CE Disponibilidad — "Disponibilidad" sheet. One tower. */
export function parseDispCe(buffer: ArrayBuffer, errors: string[] = []): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.ce;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const label = `CE ${cfg.sheet}`;
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const unitHits = resolveHeaderColumns(ws, CE_COLUMN_HEADER.unit, label, errors);
  const statusHit = resolveHeaderColumn(ws, CE_COLUMN_HEADER.status, label, errors);
  const modeloHit = resolveHeaderColumn(ws, CE_COLUMN_HEADER.modelo, label, errors);
  const priceCol = resolveListPriceColumn(ws, LIST_PRICE_HEADER.ce, label, errors);

  if (unitHits.length === 0 || statusHit == null) return results;

  const headerRows = [statusHit.row, ...unitHits.map((hit) => hit.row)];
  if (modeloHit) headerRows.push(modeloHit.row);
  const dataStart = Math.max(...headerRows) + 1;

  for (let r = dataStart; r <= range.e.r; r++) {
    const identities = unitHits.map((hit) => ceUnitIdentity(cellVal(ws, r, hit.startCol)));
    const present = identities.filter((id): id is string => id != null);
    if (present.length === 0) continue;
    if (!present.every((id) => id === present[0])) {
      const shown = unitHits
        .map((hit) => {
          const raw = cellStr(ws, r, hit.startCol);
          return raw == null ? null : `${XLSX.utils.encode_col(hit.startCol)}="${raw}"`;
        })
        .filter((part): part is string => part != null)
        .join(", ");
      errors.push(
        `CE ${cfg.sheet} row ${r + 1}: Número columns disagree (${shown}) — row skipped.`,
      );
      continue;
    }

    const unitNumber = readCeUnitId(present[0]);
    if (unitNumber == null) continue;

    const status = resolveStatus(
      cellStr(ws, r, statusHit.startCol),
      `CE unit ${unitNumber}, row ${r + 1}`,
      errors,
    );
    if (status == null) continue;
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = priceCol == null ? null : safeFloat(cellVal(ws, r, priceCol));
    const unitType = modeloHit ? cellStr(ws, r, modeloHit.startCol) : null;

    results.push({
      projectSlug: "casa-elisa",
      towerName: cfg.towerName,
      unitNumber,
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
      unitType,
    });
  }

  return results;
}

/** Parse BEN Disponibilidad — "Precios" sheet. Columns come from header text. */
export function parseDispBen(buffer: ArrayBuffer, errors: string[] = []): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.ben;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const label = `BEN ${cfg.sheet}`;
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const unitHit = resolveHeaderColumn(ws, BEN_COLUMN_HEADER.unit, label, errors);
  const statusHit = resolveHeaderColumn(ws, BEN_COLUMN_HEADER.status, label, errors);
  const towerHit = resolveHeaderColumn(ws, BEN_COLUMN_HEADER.tower, label, errors);
  const modeloHit = resolveHeaderColumn(ws, BEN_COLUMN_HEADER.modelo, label, errors);
  const priceCol = resolveListPriceColumn(ws, LIST_PRICE_HEADER.ben, label, errors);

  // Without these, a positional guess could sell or release the wrong unit.
  // "ESTADO" is not a stand-in for "Estatus".
  if (unitHit == null || statusHit == null || towerHit == null) return results;

  const headerRows = [unitHit.row, statusHit.row, towerHit.row];
  if (modeloHit) headerRows.push(modeloHit.row);
  const dataStart = Math.max(...headerRows) + 1;

  for (let r = dataStart; r <= range.e.r; r++) {
    const rawUnit = cellVal(ws, r, unitHit.startCol);
    const unitNum = safeInt(rawUnit);
    if (unitNum == null || unitNum < 100) continue;

    const towerLetter = cellStr(ws, r, towerHit.startCol);
    if (!towerLetter || towerLetter.length > 2) continue;
    const towerName = `Torre ${towerLetter.toUpperCase()}`;

    const status = resolveStatus(
      cellStr(ws, r, statusHit.startCol),
      `BEN ${towerName} unit ${unitNum}, row ${r + 1}`,
      errors,
    );
    if (status == null) continue;
    const client = cellStr(ws, r, cfg.clientCol);
    const asesor = normalizeSalesperson(cellStr(ws, r, cfg.asesorCol));
    const price = priceCol == null ? null : safeFloat(cellVal(ws, r, priceCol));
    const unitType = modeloHit ? cellStr(ws, r, modeloHit.startCol) : null;

    results.push({
      projectSlug: "benestare",
      towerName,
      unitNumber: String(unitNum),
      status,
      priceList: price,
      clientName: client && client.length >= 3 ? client : null,
      salespersonName: asesor,
      unitType,
    });
  }

  return results;
}

/** Parse SE Disponibilidad — "Disponibilidad" sheet. Eleven houses, one tower name. */
export function parseDispSe(buffer: ArrayBuffer, errors: string[] = []): ParsedUnitStatus[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const cfg = DISP_COLUMNS.se;
  const ws = wb.Sheets[cfg.sheet];
  if (!ws) return [];

  const results: ParsedUnitStatus[] = [];
  const label = `SE ${cfg.sheet}`;
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  const unitHit = resolveHeaderColumn(ws, SE_COLUMN_HEADER.unit, label, errors);
  const statusHit = resolveHeaderColumn(ws, SE_COLUMN_HEADER.status, label, errors);
  const modeloHit = resolveHeaderColumn(ws, SE_COLUMN_HEADER.modelo, label, errors);
  // "PRECIO TOTAL", not "Precio sin impuestos". The amount is USD.
  const priceCol = resolveListPriceColumn(ws, LIST_PRICE_HEADER.se, label, errors);

  if (unitHit == null || statusHit == null) return results;

  const headerRows = [unitHit.row, statusHit.row];
  if (modeloHit) headerRows.push(modeloHit.row);
  const dataStart = Math.max(...headerRows) + 1;

  for (let r = dataStart; r <= range.e.r; r++) {
    const unitNumber = normalizeUnitNumber(cellVal(ws, r, unitHit.startCol));
    if (!unitNumber) continue;

    const status = resolveStatus(
      cellStr(ws, r, statusHit.startCol),
      `SE unit ${unitNumber}, row ${r + 1}`,
      errors,
    );
    if (status == null) continue;
    const price = priceCol == null ? null : safeFloat(cellVal(ws, r, priceCol));
    const unitType = modeloHit ? cellStr(ws, r, modeloHit.startCol) : null;

    results.push({
      projectSlug: "santa-elena",
      towerName: cfg.towerName,
      unitNumber,
      status,
      priceList: price,
      clientName: null,
      salespersonName: null,
      unitType,
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
  errors: string[] = [],
): ParsedUnitStatus[] {
  if (fileKey.startsWith("blt")) return parseDispBlt(buffer, errors);
  if (fileKey.startsWith("b5")) return parseDispB5(buffer, errors);
  if (fileKey.startsWith("ce")) return parseDispCe(buffer, errors);
  if (fileKey.startsWith("ben")) return parseDispBen(buffer, errors);
  if (fileKey.startsWith("se")) return parseDispSe(buffer, errors);
  return [];
}
