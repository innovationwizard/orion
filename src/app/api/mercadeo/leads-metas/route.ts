import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk } from "@/lib/api";
import { requireRole, DATA_VIEWER_ROLES } from "@/lib/auth";
import leadsSnapshot from "@/lib/mercadeo/leads-snapshot.json";

/** Artifact ad-account name per project slug. "Puerta Abierta" is institutional — no project, no meta. */
const ACCOUNT_BY_SLUG: Record<string, string> = {
  benestare: "Benestare",
  "bosque-las-tapias": "Bosque Las Tapias",
  "boulevard-5": "Boulevard5",
  "casa-elisa": "Casa Elisa",
  "santa-elena": "Santa Elena",
};

export type LeadsMetasPayload = {
  /** Last full month covered by the snapshot */
  month: string;
  proyectos: Array<{
    project: string;
    leads: number;
    leadsPorDia: number;
    min: number | null;
    max: number | null;
    minPorDia: number | null;
    maxPorDia: number | null;
    status: "debajo" | "dentro" | "encima" | "sin_meta";
  }>;
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
    .select("name, slug, meta_leads_mensual_min, meta_leads_mensual_max");
  if (projectsError) {
    return jsonError(500, "Error consultando metas de leads", projectsError.message);
  }

  // Last full month = the month before the snapshot's refresh date (that month is partial)
  const refreshed = new Date(`${leadsSnapshot.refreshed}T00:00:00Z`);
  const prev = new Date(Date.UTC(refreshed.getUTCFullYear(), refreshed.getUTCMonth() - 1, 1));
  const month = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 0)).getUTCDate();

  const byAccount = leadsSnapshot.leadsByMonthAccount as Record<string, Record<string, number>>;

  const proyectos: LeadsMetasPayload["proyectos"] = (projectRows ?? [])
    .filter((p) => ACCOUNT_BY_SLUG[p.slug as string])
    .map((p) => {
      const account = ACCOUNT_BY_SLUG[p.slug as string];
      const leads = byAccount[account]?.[month] ?? 0;
      const min = (p.meta_leads_mensual_min as number | null) ?? null;
      const max = (p.meta_leads_mensual_max as number | null) ?? null;
      let status: "debajo" | "dentro" | "encima" | "sin_meta" = "sin_meta";
      if (min != null && max != null) {
        status = leads < min ? "debajo" : leads > max ? "encima" : "dentro";
      }
      return {
        project: p.name as string,
        leads,
        leadsPorDia: leads / daysInMonth,
        min,
        max,
        minPorDia: min != null ? min / daysInMonth : null,
        maxPorDia: max != null ? max / daysInMonth : null,
        status,
      };
    })
    .sort((a, b) => a.project.localeCompare(b.project));

  const payload: LeadsMetasPayload = { month, proyectos };
  return jsonOk(payload);
}
