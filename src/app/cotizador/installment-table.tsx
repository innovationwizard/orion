"use client";

import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  installments: { number: number; amount: number }[];
  currency?: "GTQ" | "USD";
  editing?: boolean;
  overrides?: Record<number, number>;
  onOverride?: (cuotaNumber: number, amount: number) => void;
  onClearOverride?: (cuotaNumber: number) => void;
  maxOverride?: (cuotaNumber: number) => number;
};

export default function InstallmentTable({
  installments,
  currency,
  editing,
  overrides,
  onOverride,
  onClearOverride,
  maxOverride,
}: Props) {
  if (installments.length === 0) return null;

  const total = installments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Cuota</th>
            <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Monto</th>
            {editing && (
              <th className="cotizador-no-print text-center py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted w-8"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {installments.map((inst) => {
            const isOverridden = overrides && inst.number > 0 && inst.number in overrides;
            const max = maxOverride && inst.number > 0 ? maxOverride(inst.number) : undefined;

            return (
              <tr
                key={inst.number}
                className={`border-b border-border/50 ${isOverridden ? "bg-amber-50/60" : ""}`}
              >
                <td className="py-1.5 px-2">
                  {inst.number === 0 ? "Reserva" : `Cuota ${inst.number}`}
                </td>
                <td className="py-1.5 px-2 text-right font-medium">
                  {editing && inst.number > 0 ? (
                    <input
                      type="number"
                      min={1}
                      max={max}
                      step={100}
                      value={inst.amount}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        onOverride?.(inst.number, val);
                      }}
                      className={`cotizador-no-print w-28 px-2 py-1 rounded border text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                        isOverridden
                          ? "border-amber-400 bg-amber-50 font-bold"
                          : "border-border bg-card"
                      }`}
                    />
                  ) : (
                    <span className={isOverridden ? "font-bold" : ""}>
                      {formatCurrency(inst.amount, currency)}
                    </span>
                  )}
                  {/* Print-only: always show formatted amount, not input */}
                  {editing && inst.number > 0 && (
                    <span className="cotizador-print-only hidden">
                      {formatCurrency(inst.amount, currency)}
                    </span>
                  )}
                </td>
                {editing && (
                  <td className="cotizador-no-print py-1.5 px-1 text-center">
                    {isOverridden && (
                      <button
                        type="button"
                        onClick={() => onClearOverride?.(inst.number)}
                        className="text-xs text-muted hover:text-red-500 transition-colors"
                        title="Restaurar cuota uniforme"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
          <tr className="font-bold">
            <td className="py-2 px-2">Total enganche</td>
            <td className="py-2 px-2 text-right">{formatCurrency(total, currency)}</td>
            {editing && <td></td>}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
