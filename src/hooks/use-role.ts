"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Current user's role from Supabase app_metadata.
 *
 * `undefined` while loading, `null` when the session carries no role.
 * Presentation-only: this decides which sections are offered in the UI.
 * The authoritative check stays server-side in each API route's
 * `requireRole(...)` guard.
 */
export function useRole(): string | null | undefined {
  const [role, setRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    supabaseBrowser.auth.getUser().then(({ data }) => {
      if (!cancelled) setRole(data.user?.app_metadata?.role ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return role;
}
