"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreditUnit } from "@/lib/reservas/types";

/**
 * Fetches all credit dashboard units from /api/admin/creditos.
 * Returns the full dataset (~890 units) for client-side aggregation.
 */
export function useCreditUnits() {
  const [data, setData] = useState<CreditUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/creditos");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json: CreditUnit[] = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
