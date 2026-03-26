"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CotizadorConfigRow } from "@/lib/reservas/types";
import type { CotizadorConfig } from "@/lib/reservas/cotizador";
import { configFromDefaults } from "@/lib/reservas/cotizador";

/**
 * Fetch cotizador configs for a project slug.
 * Returns all active config rows for that project.
 */
export function useCotizadorConfigs(projectSlug: string | undefined) {
  const [data, setData] = useState<CotizadorConfigRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfigs = useCallback(() => {
    if (!projectSlug) {
      setData([]);
      return;
    }
    setLoading(true);
    fetch(`/api/reservas/cotizador-config?project=${encodeURIComponent(projectSlug)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [projectSlug]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return { data, loading };
}

/**
 * Convert a DB config row to the CotizadorConfig interface
 * used by computation functions.
 */
export function rowToConfig(row: CotizadorConfigRow): CotizadorConfig {
  return {
    currency: row.currency,
    enganche_pct: Number(row.enganche_pct),
    reserva_default: Number(row.reserva_default),
    installment_months: row.installment_months,
    round_enganche_q100: row.round_enganche_q100,
    round_cuota_q100: row.round_cuota_q100,
    round_cuota_q1: row.round_cuota_q1,
    round_saldo_q100: row.round_saldo_q100,
    bank_rates: row.bank_rates.map(Number),
    bank_rate_labels: row.bank_rate_labels ?? row.bank_rates.map((r) => `${(Number(r) * 100).toFixed(2)}%`),
    plazos_years: row.plazos_years.map(Number),
    include_seguro_in_cuota: row.include_seguro_in_cuota,
    include_iusi_in_cuota: row.include_iusi_in_cuota,
    seguro_enabled: row.seguro_enabled,
    seguro_base: row.seguro_base,
    iusi_frequency: row.iusi_frequency,
    income_multiplier: Number(row.income_multiplier),
    income_base: row.income_base,
    inmueble_pct: Number(row.inmueble_pct),
    timbres_rate: Number(row.timbres_rate),
    use_pretax_extraction: row.use_pretax_extraction,
    mantenimiento_per_m2: row.mantenimiento_per_m2 != null ? Number(row.mantenimiento_per_m2) : null,
    mantenimiento_label: row.mantenimiento_label,
    disclaimers: row.disclaimers ?? [],
    validity_days: row.validity_days,
  };
}

/**
 * Resolve the best matching config for a given unit.
 * Resolution order (most specific first):
 * 1. (tower_id, unit_type, bedrooms)
 * 2. (tower_id, unit_type, NULL)
 * 3. (tower_id, NULL, bedrooms)
 * 4. (tower_id, NULL, NULL)
 * 5. (NULL, unit_type, bedrooms)
 * 6. (NULL, unit_type, NULL)
 * 7. (NULL, NULL, bedrooms)
 * 8. (NULL, NULL, NULL)
 * 9. Hardcoded COTIZADOR_DEFAULTS (fallback)
 */
export function resolveConfig(
  configs: CotizadorConfigRow[],
  towerId: string | null,
  unitType: string | null,
  bedrooms: number | null = null,
): CotizadorConfig {
  // Helper: find config matching given criteria
  const find = (
    tw: string | null,
    ut: string | null,
    bd: number | null,
  ) =>
    configs.find(
      (c) =>
        c.tower_id === tw &&
        c.unit_type === ut &&
        c.bedrooms === bd,
    );

  // Try with tower
  if (towerId) {
    // (tower, type, bedrooms)
    if (unitType && bedrooms != null) {
      const m = find(towerId, unitType, bedrooms);
      if (m) return rowToConfig(m);
    }
    // (tower, type, NULL)
    if (unitType) {
      const m = find(towerId, unitType, null);
      if (m) return rowToConfig(m);
    }
    // (tower, NULL, bedrooms)
    if (bedrooms != null) {
      const m = find(towerId, null, bedrooms);
      if (m) return rowToConfig(m);
    }
    // (tower, NULL, NULL)
    const m = find(towerId, null, null);
    if (m) return rowToConfig(m);
  }

  // Try without tower
  // (NULL, type, bedrooms)
  if (unitType && bedrooms != null) {
    const m = find(null, unitType, bedrooms);
    if (m) return rowToConfig(m);
  }
  // (NULL, type, NULL)
  if (unitType) {
    const m = find(null, unitType, null);
    if (m) return rowToConfig(m);
  }
  // (NULL, NULL, bedrooms)
  if (bedrooms != null) {
    const m = find(null, null, bedrooms);
    if (m) return rowToConfig(m);
  }
  // (NULL, NULL, NULL)
  const projectDefault = find(null, null, null);
  if (projectDefault) return rowToConfig(projectDefault);

  // Fallback to hardcoded defaults
  return configFromDefaults();
}

/**
 * Convenience hook: resolve a CotizadorConfig for a specific unit.
 */
export function useResolvedConfig(
  configs: CotizadorConfigRow[],
  towerId: string | null,
  unitType: string | null,
  bedrooms: number | null = null,
): CotizadorConfig {
  return useMemo(
    () => resolveConfig(configs, towerId, unitType, bedrooms),
    [configs, towerId, unitType, bedrooms],
  );
}
