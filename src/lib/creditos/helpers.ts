/**
 * Aggregation helpers for the Créditos dashboard.
 * Operates on CreditUnit[] arrays — all computation is client-side.
 */

import type { CreditUnit, CreditUnitStatus } from "@/lib/reservas/types";

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface CreditStats {
  total: number;
  vendido: number;
  reservado: number;
  disponible: number;
  valorVendido: number;
  valorReservado: number;
  valorDisponible: number;
  valorTotal: number;
  absorption: number;
}

export function computeStats(units: CreditUnit[]): CreditStats {
  const total = units.length;
  let vendido = 0;
  let reservado = 0;
  let disponible = 0;
  let valorVendido = 0;
  let valorReservado = 0;
  let valorDisponible = 0;

  for (const u of units) {
    const price = u.precio_total ?? u.price_list ?? 0;
    switch (u.credit_status) {
      case "VENDIDO":
        vendido++;
        valorVendido += price;
        break;
      case "RESERVADO":
        reservado++;
        valorReservado += price;
        break;
      default:
        disponible++;
        valorDisponible += price;
    }
  }

  return {
    total,
    vendido,
    reservado,
    disponible,
    valorVendido,
    valorReservado,
    valorDisponible,
    valorTotal: valorVendido + valorReservado + valorDisponible,
    absorption: total > 0 ? (vendido + reservado) / total : 0,
  };
}

// ---------------------------------------------------------------------------
// Vendor / salesperson stats
// ---------------------------------------------------------------------------

export interface VendorStat {
  name: string;
  total: number;
  vendido: number;
  reservado: number;
  disponible: number;
  valorVendido: number;
  valorTotal: number;
  projects: string[];
}

export function getVendorStats(units: CreditUnit[]): VendorStat[] {
  const map = new Map<
    string,
    { name: string; total: number; vendido: number; reservado: number; disponible: number; valorVendido: number; valorTotal: number; projects: Set<string> }
  >();

  for (const u of units) {
    const v = u.salesperson_name;
    if (!v) continue;

    let entry = map.get(v);
    if (!entry) {
      entry = { name: v, total: 0, vendido: 0, reservado: 0, disponible: 0, valorVendido: 0, valorTotal: 0, projects: new Set() };
      map.set(v, entry);
    }

    entry.total++;
    const price = u.precio_total ?? u.price_list ?? 0;
    entry.valorTotal += price;
    entry.projects.add(u.project_name);

    switch (u.credit_status) {
      case "VENDIDO":
        entry.vendido++;
        entry.valorVendido += price;
        break;
      case "RESERVADO":
        entry.reservado++;
        break;
      default:
        entry.disponible++;
    }
  }

  return [...map.values()]
    .map((v) => ({ ...v, projects: [...v.projects] }))
    .sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Status by floor level
// ---------------------------------------------------------------------------

export interface LevelStat {
  level: string;
  levelNum: number;
  Vendido: number;
  Reservado: number;
  Disponible: number;
  total: number;
}

export function getStatusByLevel(units: CreditUnit[]): LevelStat[] {
  const map = new Map<number, { Vendido: number; Reservado: number; Disponible: number; total: number }>();

  for (const u of units) {
    const lv = u.floor_number;
    let entry = map.get(lv);
    if (!entry) {
      entry = { Vendido: 0, Reservado: 0, Disponible: 0, total: 0 };
      map.set(lv, entry);
    }
    entry.total++;
    switch (u.credit_status) {
      case "VENDIDO": entry.Vendido++; break;
      case "RESERVADO": entry.Reservado++; break;
      default: entry.Disponible++;
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([lv, data]) => ({ level: `N${lv}`, levelNum: lv, ...data }));
}

// ---------------------------------------------------------------------------
// Model distribution
// ---------------------------------------------------------------------------

export interface ModelStat {
  model: string;
  total: number;
  vendido: number;
  reservado: number;
  disponible: number;
  area: number | null;
}

export function getModelStats(units: CreditUnit[]): ModelStat[] {
  const map = new Map<string, ModelStat>();

  for (const u of units) {
    const m = u.unit_type || "N/A";
    let entry = map.get(m);
    if (!entry) {
      entry = { model: m, total: 0, vendido: 0, reservado: 0, disponible: 0, area: null };
      map.set(m, entry);
    }
    entry.total++;
    if (u.area_total) entry.area = u.area_total;

    switch (u.credit_status) {
      case "VENDIDO": entry.vendido++; break;
      case "RESERVADO": entry.reservado++; break;
      default: entry.disponible++;
    }
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
}

// ---------------------------------------------------------------------------
// Financing mix
// ---------------------------------------------------------------------------

export interface FinancingMix {
  fha: number;
  contado: number;
  credito: number;
  sinInfo: number;
}

export function getFinancingMix(units: CreditUnit[]): FinancingMix {
  const mix: FinancingMix = { fha: 0, contado: 0, credito: 0, sinInfo: 0 };

  for (const u of units) {
    if (u.credit_status === "DISPONIBLE") continue;
    if (u.is_fha) mix.fha++;
    else if (u.is_cash_purchase) mix.contado++;
    else if (u.financiamiento != null && u.financiamiento > 0) mix.credito++;
    else mix.sinInfo++;
  }

  return mix;
}

// ---------------------------------------------------------------------------
// Income source distribution
// ---------------------------------------------------------------------------

export interface IncomeSourceItem {
  name: string;
  count: number;
}

export function getIncomeSourceMix(units: CreditUnit[]): IncomeSourceItem[] {
  const map = new Map<string, number>();

  for (const u of units) {
    if (u.credit_status === "DISPONIBLE") continue;
    const src = u.income_source || "Sin información";
    // income_source can be comma-separated — split and count each
    const sources = src.split(",").map((s) => s.trim()).filter(Boolean);
    for (const s of sources) {
      map.set(s, (map.get(s) ?? 0) + 1);
    }
  }

  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Group by project
// ---------------------------------------------------------------------------

export function groupByProject(units: CreditUnit[]): Map<string, CreditUnit[]> {
  const map = new Map<string, CreditUnit[]>();
  for (const u of units) {
    let arr = map.get(u.project_slug);
    if (!arr) {
      arr = [];
      map.set(u.project_slug, arr);
    }
    arr.push(u);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Format helpers (re-exported from constants for convenience)
// ---------------------------------------------------------------------------

export function fmtPct(n: number): string {
  if (isNaN(n)) return "0%";
  return Math.round(n * 100) + "%";
}

export function fmtNum(n: number): string {
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("es-GT").format(n);
}

/** Status display colors */
export const STATUS_COLORS: Record<CreditUnitStatus, string> = {
  VENDIDO: "#3AB893",
  RESERVADO: "#D4A84A",
  DISPONIBLE: "#4A9FD4",
};
