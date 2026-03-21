import {
  requireSalesperson,
  isSalespersonFailure,
} from "@/lib/reservas/require-salesperson";
import { requireAuth, isSuperuser, hasRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const result = await requireSalesperson();

  // Salesperson found — normal path
  if (!isSalespersonFailure(result)) {
    return respondWithProjects(result.salesperson);
  }

  // Not a salesperson — check if user is admin (master/torredecontrol)
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const user = auth.user!;
  const isAdmin = isSuperuser(user.email ?? null) || hasRole(user, ADMIN_ROLES);

  if (!isAdmin) {
    // Regular non-salesperson user → return the original 403
    return result.response;
  }

  // Admin user without salesperson record → return all projects
  return respondAdminAllProjects(user);
}

/** Standard salesperson response: their assigned projects + towers */
async function respondWithProjects(salesperson: { id: string; full_name: string; display_name: string }) {
  const admin = createAdminClient();

  const { data: assignments, error } = await admin
    .from("salesperson_project_assignments")
    .select(`
      project_id,
      projects:project_id (
        id,
        name,
        slug
      )
    `)
    .eq("salesperson_id", salesperson.id)
    .is("end_date", null);

  if (error) {
    console.error("[GET /api/reservas/me]", error);
    return jsonError(500, error.message);
  }

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

/** Admin fallback: return all projects + towers (no salesperson record needed) */
async function respondAdminAllProjects(user: { id: string; email?: string }) {
  const admin = createAdminClient();

  const [projResult, towersResult] = await Promise.all([
    admin.from("projects").select("id, name, slug").order("name"),
    admin.from("towers").select("id, name, is_default, project_id").order("name"),
  ]);

  if (projResult.error) {
    console.error("[GET /api/reservas/me] admin projects", projResult.error);
    return jsonError(500, projResult.error.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = (projResult.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    towers: (towersResult.data ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => t.project_id === p.id,
    ),
  }));

  // Return a virtual salesperson identity from the auth user
  const displayName = user.email?.split("@")[0] ?? "Admin";

  return jsonOk({
    salesperson: {
      id: user.id,
      full_name: displayName,
      display_name: displayName,
    },
    projects,
    is_admin: true,
  });
}
