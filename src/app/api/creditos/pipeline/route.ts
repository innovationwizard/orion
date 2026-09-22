import { jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import aggregates from "@/lib/creditos/pipedrive-snapshot.json";
import dealsSnapshot from "@/lib/creditos/deals-snapshot.json";

export type PipelineDeal = {
  dealId: string;
  titulo: string;
  embudo: string;
  /** Project name as the rest of the app spells it, mapped from the funnel. */
  proyecto: string;
  etapa: string;
  etapaOrden: number;
  estado: string;
  apartamento: string | null;
  torre: string | null;
  tipoCredito: string;
  banco: string | null;
  propietario: string | null;
  valor: number | null;
  moneda: string | null;
  /** Loan the bank grants — the money the company receives at desembolso. GTQ. */
  montoPrestamo: number | null;
  valorBien: number | null;
  enganchePactado: number | null;
  participantes: number | null;
  casoFHA: string | null;
  armadoExpediente: boolean | null;
  fechaArmado: string | null;
  aprobacionFHA: boolean | null;
  fechaAprobacionFHA: string | null;
  aprobacionBanco: boolean | null;
  fechaAprobacionBanco: string | null;
  suspendidoFHA: string | null;
  suspendidoBanco: string | null;
  revisionPCVLegal: string | null;
  fechaPCVDocumento: string | null;
  papeleriaVencida: boolean | null;
  creado: string | null;
  actualizado: string | null;
  cierrePrevista: string | null;
  diasEnEtapa: number | null;
  motivoPerdido: string | null;
};

export type EtapaCatalogo = {
  embudo: string;
  proyecto: string;
  stageId: number;
  orden: number;
  posicion: number;
  etapa: string;
};

export type CreditosPipelinePayload = {
  /** Extraction cut-off of the data itself — NOT the date the file was produced. */
  boundary: string;
  fechaExport: string | null;
  totalTratos: number;
  proyectos: string[];
  embudoAProyecto: Record<string, string>;
  estados: Record<string, number>;
  tipoCredito: Record<string, number>;
  bancos: Record<string, number>;
  propietariosAbiertos: Record<string, number>;
  etapasGlobal: Array<{ etapa: string; orden: number; open: number; lost: number; won: number }>;
  etapasPorEmbudo: Array<{
    embudo: string;
    proyecto: string;
    orden: number;
    etapa: string;
    open: number;
    lost: number;
    won: number;
    medianaDiasEnEtapa: number | null;
    conFechaEtapa: number;
  }>;
  /** Every credit stage Pipedrive defines, including those with zero deals. */
  etapasCatalogo: EtapaCatalogo[];
  /** Those stage names merged into one sequence across funnels. */
  etapasCatalogoGlobal: string[];
  notas: string[];
  deals: PipelineDeal[];
};

export async function GET() {
  const auth = await requireRole([...DATA_VIEWER_ROLES, "creditos"]);
  if (auth.response) {
    return auth.response;
  }
  const payload: CreditosPipelinePayload = {
    boundary: aggregates.boundary,
    fechaExport: aggregates.fechaExport,
    totalTratos: aggregates.totalTratos,
    proyectos: aggregates.proyectos,
    embudoAProyecto: aggregates.embudoAProyecto,
    estados: aggregates.estados,
    tipoCredito: aggregates.tipoCredito,
    bancos: aggregates.bancos,
    propietariosAbiertos: aggregates.propietariosAbiertos,
    etapasGlobal: aggregates.etapasGlobal,
    etapasPorEmbudo: aggregates.etapasPorEmbudo,
    etapasCatalogo: aggregates.etapasCatalogo,
    etapasCatalogoGlobal: aggregates.etapasCatalogoGlobal,
    notas: aggregates.notas,
    deals: dealsSnapshot.deals as PipelineDeal[],
  };
  return jsonOk(payload);
}
