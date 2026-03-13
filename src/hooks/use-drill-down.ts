"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { CesionUnit } from "@/lib/reservas/types";

export function useDrillDown() {
  const [drillDown, setDrillDown] = useState<{
    title: string;
    records: CesionUnit[];
  } | null>(null);
  const [drillSearch, setDrillSearch] = useState("");
  const [drillSortCol, setDrillSortCol] = useState("diferencia");
  const [drillSortDir, setDrillSortDir] = useState<"asc" | "desc">("asc");

  const openDrillDown = useCallback(
    (title: string, records: CesionUnit[]) => {
      setDrillDown({ title, records });
      setDrillSearch("");
      setDrillSortCol("diferencia");
      setDrillSortDir("asc");
    },
    [],
  );

  const closeDrillDown = useCallback(() => setDrillDown(null), []);

  const handleDrillSort = useCallback(
    (col: string) => {
      if (col === drillSortCol) {
        setDrillSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setDrillSortCol(col);
        setDrillSortDir("asc");
      }
    },
    [drillSortCol],
  );

  const drillFiltered = useMemo(() => {
    if (!drillDown) return [];
    const q = drillSearch.toLowerCase();
    const filtered = q
      ? drillDown.records.filter(
          (r) =>
            (r.client_name ?? "").toLowerCase().includes(q) ||
            r.unit_number.toLowerCase().includes(q) ||
            r.unit_type.toLowerCase().includes(q),
        )
      : drillDown.records;

    return [...filtered].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[drillSortCol];
      const bVal = (b as unknown as Record<string, unknown>)[drillSortCol];
      const aNum = typeof aVal === "number" ? aVal : 0;
      const bNum = typeof bVal === "number" ? bVal : 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return drillSortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return drillSortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [drillDown, drillSearch, drillSortCol, drillSortDir]);

  // Close on Escape
  useEffect(() => {
    if (!drillDown) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrillDown();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drillDown, closeDrillDown]);

  // Lock body scroll
  useEffect(() => {
    if (drillDown) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drillDown]);

  return {
    drillDown,
    drillFiltered,
    drillSearch,
    setDrillSearch,
    drillSortCol,
    drillSortDir,
    handleDrillSort,
    openDrillDown,
    closeDrillDown,
  };
}
