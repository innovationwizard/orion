import { jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import snapshot from "@/lib/creditos/pipedrive-snapshot.json";

export type CreditosEtapaRow = {
  embudo: string;
  orden: number;
  etapa: string;
  open: number;
  lost: number;
  won: number;
  medianaDiasEnEtapa: number | null;
  conFechaEtapa: number;
};

export type HudCreditosPayload = {
  boundary: string;
  totalTratos: number;
  estados: Record<string, number>;
  tipoCredito: Record<string, number>;
  etapasGlobal: Array<{ etapa: string; orden: number; open: number; lost: number; won: number }>;
  etapasPorEmbudo: CreditosEtapaRow[];
  notas: string[];
};

export async function GET() {
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  const payload: HudCreditosPayload = {
    boundary: snapshot.boundary,
    totalTratos: snapshot.totalTratos,
    estados: snapshot.estados,
    tipoCredito: snapshot.tipoCredito,
    etapasGlobal: snapshot.etapasGlobal,
    etapasPorEmbudo: snapshot.etapasPorEmbudo,
    notas: snapshot.notas,
  };
  return jsonOk(payload);
}
