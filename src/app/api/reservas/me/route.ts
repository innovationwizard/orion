import {
  requireSalesperson,
  isSalespersonFailure,
} from "@/lib/reservas/require-salesperson";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const result = await requireSalesperson();
  if (isSalespersonFailure(result)) return result.response;

  const { salesperson } = result;
  const admin = createAdminClient();

  // Fetch project assignments with tower info
  const { data: assignments, error } = await admin
    .from("salesperson_projects")
    .select(`
      project_id,
      projects:project_id (
        id,
        name,
        slug
      )
    `)
    .eq("salesperson_id", salesperson.id);

  if (error) {
    console.error("[GET /api/reservas/me]", error);
    return jsonError(500, error.message);
  }

  // Get towers for assigned projects
  const projectIds = (assignments ?? []).map(
    (a: { project_id: string }) => a.project_id,
  );

  const { data: towers, error: tErr } = await admin
    .from("towers")
    .select("id, name, is_default, project_id")
    .in("project_id", projectIds.length > 0 ? projectIds : ["__none__"])
    .order("name");

  if (tErr) {
    console.error("[GET /api/reservas/me] towers", tErr);
    return jsonError(500, tErr.message);
  }

  // Build response: projects with nested towers
  // Supabase returns the joined relation as an object (single FK) or array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (assignments ?? []).map((a: any) => {
    const proj = a.projects;
    return {
      id: proj.id,
      name: proj.name,
      slug: proj.slug,
      towers: (towers ?? []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => t.project_id === a.project_id,
      ),
    };
  });

  return jsonOk({
    salesperson: {
      id: salesperson.id,
      full_name: salesperson.full_name,
      display_name: salesperson.display_name,
    },
    projects,
  });
}
