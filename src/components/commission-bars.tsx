const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

export type CommissionBarItem = {
  recipientId: string;
  recipientName: string;
  recipientType: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  percentPaid: number;
};

type CommissionBarsProps = {
  data: CommissionBarItem[];
};

function typeLabel(type: string): string {
  if (type === "management") return "Gerencia";
  if (type === "sales_rep") return "Ventas";
  return "Especial";
}

export default function CommissionBars({ data }: CommissionBarsProps) {
  const sorted = [...data].sort((a, b) => b.totalAmount - a.totalAmount);
  const maxTotal = Math.max(...sorted.map((d) => d.totalAmount), 1);

  if (sorted.length === 0) {
    return <div className="empty-state">No hay datos de comisiones.</div>;
  }

  return (
    <div className="comm-bars">
      {sorted.map((item) => {
        const paidPct = (item.paidAmount / maxTotal) * 100;
        const unpaidPct = (item.unpaidAmount / maxTotal) * 100;

        return (
          <div key={item.recipientId} className="comm-bar-row">
            <div className="comm-bar-info">
              <span className="comm-bar-name">{item.recipientName}</span>
              <span className="comm-bar-type">{typeLabel(item.recipientType)}</span>
            </div>
            <div className="comm-bar-track" title={`${item.percentPaid}% pagado`}>
              <div
                className="comm-bar-fill comm-bar-fill--paid"
                style={{ width: `${paidPct}%` }}
              />
              <div
                className="comm-bar-fill comm-bar-fill--unpaid"
                style={{ width: `${unpaidPct}%` }}
              />
            </div>
            <span className="comm-bar-amount">{currency.format(item.totalAmount)}</span>
          </div>
        );
      })}
      <div className="comm-bars-legend">
        <div className="comm-bars-legend__item">
          <span className="comm-bars-legend__dot comm-bars-legend__dot--paid" />
          Pagado
        </div>
        <div className="comm-bars-legend__item">
          <span className="comm-bars-legend__dot comm-bars-legend__dot--unpaid" />
          Pendiente
        </div>
      </div>
    </div>
  );
}
