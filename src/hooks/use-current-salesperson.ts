"use client";

import { useEffect, useState } from "react";

interface SalespersonInfo {
  id: string;
  full_name: string;
  display_name: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  towers: {
    id: string;
    name: string;
    is_default: boolean;
    project_id: string;
  }[];
}

interface CurrentSalespersonData {
  salesperson: SalespersonInfo;
  projects: ProjectInfo[];
}

const CACHE_KEY = "orion:current-salesperson";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: CurrentSalespersonData;
  ts: number;
}

function getCached(): CurrentSalespersonData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function setCache(data: CurrentSalespersonData): void {
  try {
    const entry: CachedData = { data, ts: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function useCurrentSalesperson() {
  const [data, setData] = useState<CurrentSalespersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchMe() {
      try {
        const res = await fetch("/api/reservas/me");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) {
          const result: CurrentSalespersonData = json;
          setData(result);
          setCache(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido");
          setLoading(false);
        }
      }
    }

    fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
