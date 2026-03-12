"use client";

import { useState, useEffect, useCallback } from "react";
import type { BuyerPersonaAggregate } from "@/lib/reservas/types";

interface BuyerPersonaFilters {
  project?: string;
}

const EMPTY: BuyerPersonaAggregate = {
  total_profiles: 0,
  by_gender: [],
  by_purchase_type: [],
  by_education: [],
  by_department: [],
  by_occupation: [],
  by_marital_status: [],
  by_channel: [],
};

export function useBuyerPersona(filters: BuyerPersonaFilters = {}) {
  const [data, setData] = useState<BuyerPersonaAggregate>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.project) params.set("project", filters.project);

    const qs = params.toString();
    const url = `/api/reservas/buyer-persona${qs ? `?${qs}` : ""}`;

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
