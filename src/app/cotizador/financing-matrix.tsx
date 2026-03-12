"use client";

import type { FinancingScenario } from "@/lib/reservas/cotizador";
import { COTIZADOR_DEFAULTS } from "@/lib/reservas/cotizador";
import { formatCurrency } from "@/lib/reservas/constants";

type Props = {
  scenarios: FinancingScenario[];
};

export default function FinancingMatrix({ scenarios }: Props) {
  if (scenarios.length === 0) return null;

  const rates = COTIZADOR_DEFAULTS.BANK_RATES;
  const plazos = COTIZADOR_DEFAULTS.PLAZOS_YEARS;

  // Build lookup: rate -> plazo -> scenario
  const lookup = new Map<string, FinancingScenario>();
  for (const s of scenarios) {
    lookup.set(`${s.rate}-${s.plazo_years}`, s);
  }

  const monto = scenarios[0]?.monto_financiar ?? 0;

  return (
    <section className="bg-card rounded-2xl shadow-card border border-border p-5 grid gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Financiamiento bancario</h2>
        <p className="text-xs text-muted mt-1">Monto a financiar: {formatCurrency(monto)}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">Tasa</th>
              {plazos.map((p) => (
                <th key={p} className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {p} anos
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate} className="border-b border-border/50">
                <td className="py-2 px-2 font-medium">{(rate * 100).toFixed(1)}%</td>
                {plazos.map((plazo) => {
                  const s = lookup.get(`${rate}-${plazo}`);
                  return (
                    <td key={plazo} className="py-2 px-2 text-center">
                      {s ? (
                        <div className="grid gap-0.5">
                          <span className="font-semibold text-text-primary">{formatCurrency(s.total_monthly)}</span>
                          <span className="text-[10px] text-muted">
                            Cuota {formatCurrency(s.cuota_banco)}
                          </span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail for first scenario */}
      {scenarios[0] && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm pt-2 border-t border-border">
          <Detail label="IUSI mensual" value={formatCurrency(scenarios[0].iusi_monthly)} />
          <Detail label="Seguro mensual" value={formatCurrency(scenarios[0].seguro_monthly)} />
          <Detail
            label="Ingreso requerido (min)"
            value={formatCurrency(scenarios[0].ingreso_requerido)}
          />
          <Detail label="Multiplicador" value={`${COTIZADOR_DEFAULTS.INCOME_MULTIPLIER}x mensualidad`} />
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted text-xs">{label}</div>
      <div className="text-text-primary font-medium truncate">{value}</div>
    </div>
  );
}
