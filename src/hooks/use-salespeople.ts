"use client";

import { useState, useEffect } from "react";
import type { Salesperson } from "@/lib/reservas/types";

type SalespersonOption = Pick<Salesperson, "id" | "full_name" | "display_name">;

export function useSalespeople() {
  const [data, setData] = useState<SalespersonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reservas/salespeople")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
