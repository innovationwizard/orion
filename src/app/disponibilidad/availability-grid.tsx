"use client";

import type { UnitFull } from "@/lib/reservas/types";
import UnitCell from "./unit-cell";

type Props = {
  towerName: string;
  units: UnitFull[];
};

export default function AvailabilityGrid({ towerName, units }: Props) {
  // Group by floor_number descending (top floors first)
  const floorMap = new Map<number, UnitFull[]>();
  for (const u of units) {
    const list = floorMap.get(u.floor_number) ?? [];
    list.push(u);
    floorMap.set(u.floor_number, list);
  }

  // Sort floors descending
  const floors = [...floorMap.entries()].sort((a, b) => b[0] - a[0]);

  // Sort units within each floor by unit_number
  for (const [, floorUnits] of floors) {
    floorUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number, "es", { numeric: true }));
  }

  if (floors.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-4 grid gap-3">
      <h3 className="text-sm font-semibold text-text-primary">{towerName}</h3>
      <div className="overflow-x-auto">
        <div className="grid gap-1.5 min-w-fit">
          {floors.map(([floorNum, floorUnits]) => (
            <div key={floorNum} className="flex items-center gap-1.5">
              <span className="shrink-0 w-10 text-right text-xs text-muted font-medium tabular-nums">
                P{floorNum}
              </span>
              <div className="flex gap-1.5">
                {floorUnits.map((u) => (
                  <UnitCell key={u.id} unit={u} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
