"use client";

import { useEffect } from "react";

/**
 * Scrolls to the element matching the URL hash once async content has rendered it.
 * Browsers only auto-scroll to anchors present at load — data-driven sections appear later.
 */
export function useScrollToHash(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ready]);
}
