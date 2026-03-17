"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Supabase may redirect invite/magic links to the Site URL (root) instead of
 * /auth/callback when redirectTo is not allowlisted. This component catches
 * auth tokens in the URL hash on any page and redirects to /auth/callback
 * so the callback can properly set the session and enforce set-password.
 */
export function AuthHashRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/auth/callback") return;

    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (!hash) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      // window.location preserves hash; Next.js router may strip it
      window.location.replace(`/auth/callback${hash}`);
    }
  }, [pathname]);

  return null;
}
