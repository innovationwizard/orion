"use client";

import { useState, useEffect, useCallback } from "react";
import type { VentasMonthlySeries, VentasSummary } from "@/lib/reservas/types";

interface VentasFilters {
  project?: string;
}

interface VentasData {
  monthly: VentasMonthlySeries[];
  summary: VentasSummary;
}

const EMPTY_SUMMARY: VentasSummary = {
  total_units: 0,
  sold_units: 0,
  available_units: 0,
  absorption_rate: 0,
  avg_monthly_velocity: 0,
  months_to_sellout: 0,
};

export function useVentas(filters: VentasFilters = {}) {
  const [data, setData] = useState<VentasData>({ monthly: [], summary: EMPTY_SUMMARY });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);

    const qs = params.toString();
    const url = `/api/reservas/ventas${qs ? `?${qs}` : ""}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.project]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
