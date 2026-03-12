"use client";

import { useState, useEffect, useCallback } from "react";
import type { PriceHistoryEntry } from "@/lib/reservas/types";

interface PriceHistoryFilters {
  project?: string;
}

export function usePriceHistory(filters: PriceHistoryFilters = {}) {
  const [data, setData] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);

    const qs = params.toString();
    const url = `/api/reservas/valorizacion${qs ? `?${qs}` : ""}`;

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
