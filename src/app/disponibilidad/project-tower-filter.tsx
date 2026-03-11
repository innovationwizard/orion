"use client";

import type { ProjectWithTowers } from "@/lib/reservas/types";

type Props = {
  projects: ProjectWithTowers[];
  selectedProject: string;
  selectedTower: string;
  onProjectChange: (projectSlug: string) => void;
  onTowerChange: (towerId: string) => void;
};

export default function ProjectTowerFilter({
  projects,
  selectedProject,
  selectedTower,
  onProjectChange,
  onTowerChange,
}: Props) {
  const currentProject = projects.find((p) => p.project_slug === selectedProject);
  const towers = currentProject?.towers ?? [];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={selectedProject}
        onChange={(e) => {
          onProjectChange(e.target.value);
          onTowerChange("");
        }}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((p) => (
          <option key={p.project_slug} value={p.project_slug}>
            {p.project_name}
          </option>
        ))}
      </select>

      {towers.length > 1 && (
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={selectedTower}
          onChange={(e) => onTowerChange(e.target.value)}
        >
          <option value="">Todas las torres</option>
          {towers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
