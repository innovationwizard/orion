import { jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import snapshot from "@/lib/descuentos/descuentos-snapshot.json";

export type DescuentoEvidencia = {
  pdf: string;
  page: number;
  label: string;
  conf: number | null;
  amountGtq: number | null;
  tipo: string;
  flags: string;
};

export type DescuentoFolder = {
  partnerId: string;
  unidad: string;
  cliente: string;
  folder: string;
  types: string[];
  instances: number;
  maxAmountGtq: number;
  percents: string;
  reviewFlags: string;
  evidencia: DescuentoEvidencia[];
};

export type DescuentosPayload = {
  scope: string;
  extractedAt: string;
  sources: string[];
  totals: {
    expedientes: number;
    exposicionMaxGtq: number;
    expedientesDescartados: number;
    hitsTotales: number;
    hitsDescartados: number;
  };
  tipos: Record<string, number>;
  flagCounts: Record<string, number>;
  folders: DescuentoFolder[];
};

export async function GET() {
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  // Snapshot contains client PII — served only behind auth, never bundled client-side.
  return jsonOk(snapshot as DescuentosPayload);
}
