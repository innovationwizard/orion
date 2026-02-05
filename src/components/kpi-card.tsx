type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
};

export default function KpiCard({ label, value, hint, positive }: KpiCardProps) {
  return (
    <div className="card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      {hint ? <span className={positive ? "positive" : ""}>{hint}</span> : null}
    </div>
  );
}
