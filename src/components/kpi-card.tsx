type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  negative?: boolean;
};

export default function KpiCard({ label, value, hint, positive, negative }: KpiCardProps) {
  const hintClass = positive ? "positive" : negative ? "negative" : "";
  return (
    <div className="card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      {hint ? <span className={hintClass}>{hint}</span> : null}
    </div>
  );
}
