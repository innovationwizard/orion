"use client";

import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  installments: { number: number; amount: number }[];
};

export default function InstallmentTable({ installments }: Props) {
  if (installments.length === 0) return null;

  const total = installments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Cuota</th>
            <th className="text-right py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Monto</th>
          </tr>
        </thead>
        <tbody>
          {installments.map((inst) => (
            <tr key={inst.number} className="border-b border-border/50">
              <td className="py-1.5 px-2">
                {inst.number === 0 ? "Reserva" : `Cuota ${inst.number}`}
              </td>
              <td className="py-1.5 px-2 text-right font-medium">{formatCurrency(inst.amount)}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td className="py-2 px-2">Total enganche</td>
            <td className="py-2 px-2 text-right">{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
