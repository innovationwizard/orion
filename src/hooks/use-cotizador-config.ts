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
 * 1. (project_id, tower_id, unit_type)
 * 2. (project_id, tower_id, NULL)
 * 3. (project_id, NULL, unit_type)
 * 4. (project_id, NULL, NULL)
 * 5. Hardcoded COTIZADOR_DEFAULTS (fallback)
 */
export function resolveConfig(
  configs: CotizadorConfigRow[],
  towerId: string | null,
  unitType: string | null,
): CotizadorConfig {
  // Try exact match
  const exact = configs.find(
    (c) => c.tower_id === towerId && c.unit_type === unitType,
  );
  if (exact) return rowToConfig(exact);

  // Try tower-only match
  if (towerId) {
    const towerMatch = configs.find(
      (c) => c.tower_id === towerId && c.unit_type == null,
    );
    if (towerMatch) return rowToConfig(towerMatch);
  }

  // Try unit-type-only match
  if (unitType) {
    const typeMatch = configs.find(
      (c) => c.tower_id == null && c.unit_type === unitType,
    );
    if (typeMatch) return rowToConfig(typeMatch);
  }

  // Try project default
  const projectDefault = configs.find(
    (c) => c.tower_id == null && c.unit_type == null,
  );
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
): CotizadorConfig {
  return useMemo(
    () => resolveConfig(configs, towerId, unitType),
    [configs, towerId, unitType],
  );
}
