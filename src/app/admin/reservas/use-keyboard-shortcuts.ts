"use client";

import { useEffect } from "react";

type Shortcuts = {
  data: { reservation_id: string }[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
};

/**
 * Keyboard shortcuts for the admin reservations table.
 * j/k = navigate rows, Escape = close panel, c = confirm, r = reject
 */
export function useKeyboardShortcuts({ data, selectedId, setSelectedId }: Shortcuts) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }

      if (data.length === 0) return;

      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const currentIdx = selectedId
          ? data.findIndex((r) => r.reservation_id === selectedId)
          : -1;

        const nextIdx =
          e.key === "j"
            ? Math.min(currentIdx + 1, data.length - 1)
            : Math.max(currentIdx - 1, 0);

        setSelectedId(data[nextIdx].reservation_id);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [data, selectedId, setSelectedId]);
}
