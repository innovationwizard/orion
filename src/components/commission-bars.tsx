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
  isrExempt?: boolean;
  disbursable?: boolean;
  facturar?: number;
  isrRetenido?: number;
  pagar?: number;
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
    return <div className="text-center text-muted py-6">No hay datos de comisiones.</div>;
  }

  return (
    <div className="grid gap-3">
      {sorted.map((item) => {
        const paidPct = (item.paidAmount / maxTotal) * 100;
        const unpaidPct = (item.unpaidAmount / maxTotal) * 100;
        const showNeto = !item.isrExempt && item.pagar != null && item.pagar !== item.totalAmount;

        return (
          <div key={item.recipientId} className="grid grid-cols-[160px_1fr_100px] items-center gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[13px] font-semibold text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{item.recipientName}</span>
              <span className="text-[11px] text-muted">{typeLabel(item.recipientType)}{item.disbursable === false ? " · Acumulado" : ""}</span>
            </div>
            <div className="flex h-5 rounded overflow-hidden bg-slate-100" title={`${item.percentPaid}% pagado`}>
              <div
                className="h-full rounded-l bg-green-500 transition-[width] duration-400 ease-in-out"
                style={{ width: `${paidPct}%` }}
              />
              <div
                className="h-full bg-slate-300 transition-[width] duration-400 ease-in-out"
                style={{ width: `${unpaidPct}%` }}
              />
            </div>
            <div className="flex flex-col items-end gap-0">
              <span className="text-[13px] font-semibold text-text-primary tabular-nums">{currency.format(item.totalAmount)}</span>
              {showNeto && (
                <span className="text-[10px] text-muted tabular-nums">Neto {currency.format(item.pagar!)}</span>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 text-xs text-muted pt-1">
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          Pagado
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />
          Pendiente
        </div>
      </div>
    </div>
  );
}
