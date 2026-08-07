import { jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import aggregates from "@/lib/creditos/pipedrive-snapshot.json";
import dealsSnapshot from "@/lib/creditos/deals-snapshot.json";

export type PipelineDeal = {
  titulo: string;
  embudo: string;
  etapa: string;
  etapaOrden: number;
  estado: string;
  apartamento: string | null;
  tipoCredito: string;
  banco: string | null;
  propietario: string | null;
  valor: number | null;
  moneda: string | null;
  creado: string | null;
  diasEnEtapa: number | null;
  motivoPerdido: string | null;
};

export type CreditosPipelinePayload = {
  boundary: string;
  totalTratos: number;
  estados: Record<string, number>;
  tipoCredito: Record<string, number>;
  bancos: Record<string, number>;
  propietariosAbiertos: Record<string, number>;
  etapasGlobal: Array<{ etapa: string; orden: number; open: number; lost: number; won: number }>;
  etapasPorEmbudo: Array<{
    embudo: string;
    orden: number;
    etapa: string;
    open: number;
    lost: number;
    won: number;
    medianaDiasEnEtapa: number | null;
    conFechaEtapa: number;
  }>;
  notas: string[];
  deals: PipelineDeal[];
};

export async function GET() {
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  const payload: CreditosPipelinePayload = {
    boundary: aggregates.boundary,
    totalTratos: aggregates.totalTratos,
    estados: aggregates.estados,
    tipoCredito: aggregates.tipoCredito,
    bancos: aggregates.bancos,
    propietariosAbiertos: aggregates.propietariosAbiertos,
    etapasGlobal: aggregates.etapasGlobal,
    etapasPorEmbudo: aggregates.etapasPorEmbudo,
    notas: aggregates.notas,
    deals: dealsSnapshot.deals as PipelineDeal[],
  };
  return jsonOk(payload);
}
