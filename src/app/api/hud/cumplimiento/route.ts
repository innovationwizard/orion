import { jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import aggregates from "@/lib/cumplimiento/expedientes-snapshot.json";
import rowsSnapshot from "@/lib/cumplimiento/expedientes-rows.json";

export type ExpedienteCliente = {
  nombre: string;
  dpiStatus: "VIGENTE" | "VENCIDO" | "FECHA_ABSURDA" | "SIN_FECHA";
  rtu: string | null;
};

export type ExpedienteRow = {
  proyecto: string;
  apto: string;
  modelo: string | null;
  nivel: string | null;
  vendedor: string | null;
  clientes: ExpedienteCliente[];
  promesaFecha: string | null;
  fuenteIngresos: string[];
  bancoPrecalificacion: string | null;
  fha: boolean;
  contado: boolean;
  observaciones: string[];
};

export type HudCumplimientoPayload = {
  proyectos: string[];
  totalExpedientes: number;
  totalCompradores: number;
  dpi: Record<string, number>;
  rtuPoblado: number;
  conPromesa: number;
  conFuenteIngresos: number;
  conBancoPrecalificacion: number;
  conObservaciones: number;
  notas: string[];
  expedientes: ExpedienteRow[];
};

export async function GET() {
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  const payload: HudCumplimientoPayload = {
    proyectos: aggregates.proyectos,
    totalExpedientes: aggregates.totalExpedientes,
    totalCompradores: aggregates.totalCompradores,
    dpi: aggregates.dpi,
    rtuPoblado: aggregates.rtuPoblado,
    conPromesa: aggregates.conPromesa,
    conFuenteIngresos: aggregates.conFuenteIngresos,
    conBancoPrecalificacion: aggregates.conBancoPrecalificacion,
    conObservaciones: aggregates.conObservaciones,
    notas: aggregates.notas,
    expedientes: rowsSnapshot.expedientes as ExpedienteRow[],
  };
  return jsonOk(payload);
}
