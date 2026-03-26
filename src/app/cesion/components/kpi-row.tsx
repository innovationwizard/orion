import KpiCard from "@/components/kpi-card";
import { fmtQCompact } from "@/lib/reservas/constants";

export interface CesionStats {
  totalVenta: number;
  totalPlusvalia: number;
  totalEnganche: number;
  totalPagado: number;
  totalDiferencia: number;
  atrasados: number;
  alDia: number;
  aprobados: number;
  denegados: number;
  na: number;
  disponible: number;
  pctCobro: number;
  count: number;
}

interface KpiRowProps {
  stats: CesionStats;
}

export default function KpiRow({ stats }: KpiRowProps) {
  const pctPlusvalia =
    stats.totalVenta > 0
      ? ((stats.totalPlusvalia / stats.totalVenta) * 100).toFixed(1)
      : "0";
  const pctAtraso =
    stats.count > 0
      ? ((stats.atrasados / stats.count) * 100).toFixed(0)
      : "0";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
      <KpiCard
        label="Valor de Cartera"
        value={fmtQCompact(stats.totalVenta)}
        hint={`${stats.count} unidades`}
      />
      <KpiCard
        label="Plusvalía Total"
        value={fmtQCompact(stats.totalPlusvalia)}
        hint={`${pctPlusvalia}% sobre venta`}
        positive
      />
      <KpiCard
        label="Enganche Pagado"
        value={fmtQCompact(stats.totalPagado)}
        hint={`${stats.pctCobro.toFixed(1)}% de lo pactado`}
      />
      <KpiCard
        label="Brecha de Cobro"
        value={fmtQCompact(stats.totalDiferencia)}
        hint={stats.totalDiferencia < 0 ? "Saldo pendiente" : "Superávit"}
        positive={stats.totalDiferencia >= 0}
        negative={stats.totalDiferencia < 0}
      />
      <KpiCard
        label="Tasa de Atraso"
        value={`${pctAtraso}%`}
        hint={`${stats.atrasados} de ${stats.count}`}
        negative={stats.atrasados > 0}
      />
    </div>
  );
}
