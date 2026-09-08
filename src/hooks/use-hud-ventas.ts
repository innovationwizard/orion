"use client";

import { useEffect, useState } from "react";
import type { HudVentasPayload } from "@/app/api/hud/ventas/route";

export type HudVentasState = {
  data: HudVentasPayload | null;
  error: string | null;
  /** Role has no access to sales analytics — the section hides instead of erroring. */
  forbidden: boolean;
  loading: boolean;
};

/**
 * Single fetch of /api/hud/ventas, shared by every section that reads it
 * (objetivos, canales, modelos, promociones). Previously each of those lived
 * on its own page and fetched the endpoint separately; consolidated onto one
 * page they must not fire four identical requests.
 */
export function useHudVentas(): HudVentasState {
  const [data, setData] = useState<HudVentasPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/hud/ventas")
      .then(async (r) => {
        if (r.ok) return r.json() as Promise<HudVentasPayload>;
        // Rol sin acceso a analítica (ej. ventas): la sección se oculta, no es un error
        if (r.status === 401 || r.status === 403) return null;
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      })
      .then((d) => {
        if (cancelled) return;
        if (d === null) setForbidden(true);
        else setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, forbidden, loading };
}
