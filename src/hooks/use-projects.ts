"use client";

import { useState, useEffect } from "react";
import type { ProjectWithTowers } from "@/lib/reservas/types";

export function useProjects() {
  const [data, setData] = useState<ProjectWithTowers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reservas/projects")
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
