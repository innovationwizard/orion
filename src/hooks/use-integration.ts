"use client";

import { useState, useEffect, useCallback } from "react";
import type { IntegrationRow } from "@/lib/reservas/types";

interface IntegrationFilters {
  project?: string;
}

export function useIntegration(filters: IntegrationFilters = {}) {
  const [data, setData] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);

    const qs = params.toString();
    const url = `/api/reservas/integracion${qs ? `?${qs}` : ""}`;

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
