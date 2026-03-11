"use client";

import { RESERVATION_STATUS_LABELS } from "@/lib/reservas/constants";
import type { ReservationStatus } from "@/lib/reservas/types";

type Props = {
  status: string;
  project: string;
  projects: string[];
  onStatusChange: (status: string) => void;
  onProjectChange: (project: string) => void;
};

export default function ReservationFilters({
  status,
  project,
  projects,
  onStatusChange,
  onProjectChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        <TabButton
          label="Todos"
          active={status === ""}
          onClick={() => onStatusChange("")}
        />
        {(Object.entries(RESERVATION_STATUS_LABELS) as [ReservationStatus, string][]).map(
          ([val, label]) => (
            <TabButton
              key={val}
              label={label}
              active={status === val}
              onClick={() => onStatusChange(val)}
            />
          ),
        )}
      </div>

      {/* Project filter */}
      {projects.length > 1 && (
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={project}
          onChange={(e) => onProjectChange(e.target.value)}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "text-primary border-primary"
          : "text-muted border-transparent hover:text-text-primary"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
