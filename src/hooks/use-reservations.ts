"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReservationPending } from "@/lib/reservas/types";

interface ReservationsFilters {
  status?: string;
  project?: string;
  salesperson?: string;
  from?: string;
  to?: string;
}

export function useReservations(filters: ReservationsFilters = {}) {
  const [data, setData] = useState<ReservationPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReservations = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.project) params.set("project", filters.project);
    if (filters.salesperson) params.set("salesperson", filters.salesperson);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const qs = params.toString();
    const url = `/api/reservas/reservations${qs ? `?${qs}` : ""}`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filters.status, filters.project, filters.salesperson, filters.from, filters.to]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return { data, loading, error, refetch: fetchReservations };
}
