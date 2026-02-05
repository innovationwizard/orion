type FiltersProps = {
  projects: { id: string; name: string }[];
  projectId: string;
  startDate: string;
  endDate: string;
  onChange: (next: { project_id?: string; start_date?: string; end_date?: string }) => void;
};

export default function Filters({
  projects,
  projectId,
  startDate,
  endDate,
  onChange
}: FiltersProps) {
  return (
    <div className="filters">
      <select
        className="select"
        value={projectId}
        onChange={(event) => onChange({ project_id: event.target.value })}
      >
        <option value="">Todos los proyectos</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <input
        className="date-input"
        type="date"
        value={startDate}
        onChange={(event) => onChange({ start_date: event.target.value })}
      />
      <input
        className="date-input"
        type="date"
        value={endDate}
        onChange={(event) => onChange({ end_date: event.target.value })}
      />
    </div>
  );
}
