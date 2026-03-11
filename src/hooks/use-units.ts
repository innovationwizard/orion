"use client";

import { useState, useEffect, useCallback } from "react";
import type { UnitFull } from "@/lib/reservas/types";

interface UnitsFilters {
  project?: string;
  tower?: string;
  status?: string;
}

export function useUnits(filters: UnitsFilters = {}) {
  const [data, setData] = useState<UnitFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);
    if (filters.tower) params.set("tower", filters.tower);
    if (filters.status) params.set("status", filters.status);

    const qs = params.toString();
    const url = `/api/reservas/units${qs ? `?${qs}` : ""}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.project, filters.tower, filters.status]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  return { data, setData, loading, error, refetch: fetchUnits };
}
