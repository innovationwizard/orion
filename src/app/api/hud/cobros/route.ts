import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import { getFFExclusions } from "@/lib/ff-filter";
import { fetchAll } from "@/lib/fetch-all";

type ComplianceRow = {
  project_id: string;
  project_name: string;
  unit_number: string;
  sale_id: string;
  client_name: string;
  expected_to_date: number;
  actual_total: number;
  compliance_pct: number | null;
  variance: number;
  days_delinquent: number;
};

type CandidateRow = {
  project: string;
  unit: string;
  client: string;
  currency: string;
  daysDelinquent: number;
  esperado: number;
  pagado: number;
  variance: number;
  compliancePct: number | null;
  isFF: boolean;
};

export type HudCobrosPayload = {
  /** Delinquent accounts ranked by days delinquent — desist decision support. F&F rows flagged, not hidden. */
  desistCandidates: CandidateRow[];
  /** F&F (caso_especial) portfolio compliance — the "casos especiales" view */
  ffCases: CandidateRow[];
};

export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireRole(DATA_VIEWER_ROLES);
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();

  const { data: projectRows, error: projectsError } = await supabase
    .from("projects")
    .select("id, currency");
  if (projectsError) {
    return jsonError(500, "Error consultando proyectos", projectsError.message);
  }
  const projectCurrency = new Map(
    (projectRows ?? []).map((p) => [p.id as string, (p.currency as string | null) ?? "GTQ"]),
  );

  const { saleIds: ffSaleIds } = await getFFExclusions(supabase);

  const toCandidate = (r: ComplianceRow): CandidateRow => ({
    project: r.project_name,
    unit: r.unit_number,
    client: r.client_name,
    currency: projectCurrency.get(r.project_id) ?? "GTQ",
    daysDelinquent: r.days_delinquent,
    esperado: Number(r.expected_to_date),
    pagado: Number(r.actual_total),
    variance: Number(r.variance),
    compliancePct: r.compliance_pct != null ? Number(r.compliance_pct) : null,
    isFF: ffSaleIds.has(r.sale_id),
  });

  // Desist decision support — every delinquent account, most delinquent first
  const delinquentResult = await fetchAll<ComplianceRow>((from, to) =>
    supabase
      .from("payment_compliance")
      .select(
        "project_id, project_name, unit_number, sale_id, client_name, expected_to_date, actual_total, compliance_pct, variance, days_delinquent",
      )
      .gt("days_delinquent", 0)
      .order("days_delinquent", { ascending: false })
      .range(from, to),
  );
  if (delinquentResult.error) {
    return jsonError(500, "Error consultando cuentas en mora", delinquentResult.error);
  }
  const desistCandidates = delinquentResult.rows.map(toCandidate);

  // F&F portfolio — all caso_especial accounts regardless of delinquency
  const complianceResult = await fetchAll<ComplianceRow>((from, to) =>
    supabase
      .from("payment_compliance")
      .select(
        "project_id, project_name, unit_number, sale_id, client_name, expected_to_date, actual_total, compliance_pct, variance, days_delinquent",
      )
      .range(from, to),
  );
  if (complianceResult.error) {
    return jsonError(500, "Error consultando cumplimiento F&F", complianceResult.error);
  }
  const ffCases = complianceResult.rows
    .filter((r) => ffSaleIds.has(r.sale_id))
    .map(toCandidate)
    .sort((a, b) => (a.compliancePct ?? 0) - (b.compliancePct ?? 0));

  const payload: HudCobrosPayload = { desistCandidates, ffCases };
  return jsonOk(payload);
}
