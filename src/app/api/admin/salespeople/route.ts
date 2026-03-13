import { requireRole } from "@/lib/auth";
import { supabaseAdmin, getSupabaseConfigError } from "@/lib/supabase";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET() {
  const configError = getSupabaseConfigError();
  if (configError) return jsonError(500, configError);

  const auth = await requireRole(["master", "torredecontrol"]);
  if (auth.response) return auth.response;

  if (!supabaseAdmin) {
    return jsonError(500, "SUPABASE_SERVICE_ROLE_KEY requerido");
  }

  // 1. Get all salespeople (including user_id for auth status)
  const { data: salespeople, error: spErr } = await supabaseAdmin
    .from("salespeople")
    .select("id, full_name, display_name, phone, email, is_active, user_id, created_at")
    .order("display_name");

  if (spErr) {
    console.error("[GET /api/admin/salespeople] salespeople", spErr);
    return jsonError(500, spErr.message);
  }

  // 2. Get active project assignments (end_date IS NULL = currently assigned)
  const { data: assignments, error: aErr } = await supabaseAdmin
    .from("salesperson_project_assignments")
    .select("salesperson_id, project_id")
    .is("end_date", null);

  if (aErr) {
    console.error("[GET /api/admin/salespeople] assignments", aErr);
    return jsonError(500, aErr.message);
  }

  // 3. Get all projects for reference
  const { data: projects, error: pErr } = await supabaseAdmin
    .from("projects")
    .select("id, name, slug")
    .order("name");

  if (pErr) {
    console.error("[GET /api/admin/salespeople] projects", pErr);
    return jsonError(500, pErr.message);
  }

  // 4. Get auth users to check email_confirmed_at
  const userIds = (salespeople ?? [])
    .map((sp: { user_id: string | null }) => sp.user_id)
    .filter(Boolean) as string[];

  let authUsersMap: Record<string, { email_confirmed_at: string | null }> = {};
  if (userIds.length > 0) {
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authData?.users) {
      for (const u of authData.users) {
        if (userIds.includes(u.id)) {
          authUsersMap[u.id] = {
            email_confirmed_at: u.email_confirmed_at ?? null,
          };
        }
      }
    }
  }

  // 5. Build assignment map: salesperson_id → project_id[]
  const assignmentMap: Record<string, string[]> = {};
  for (const a of assignments ?? []) {
    const spId = (a as { salesperson_id: string; project_id: string }).salesperson_id;
    const pId = (a as { salesperson_id: string; project_id: string }).project_id;
    if (!assignmentMap[spId]) assignmentMap[spId] = [];
    assignmentMap[spId].push(pId);
  }

  // 6. Merge
  const result = (salespeople ?? []).map((sp: {
    id: string;
    full_name: string;
    display_name: string;
    phone: string | null;
    email: string | null;
    is_active: boolean;
    user_id: string | null;
    created_at: string;
  }) => {
    const authUser = sp.user_id ? authUsersMap[sp.user_id] : null;
    let status: "active" | "pending" | "none" = "none";
    if (sp.user_id && authUser?.email_confirmed_at) {
      status = "active";
    } else if (sp.user_id) {
      status = "pending";
    }

    return {
      id: sp.id,
      full_name: sp.full_name,
      display_name: sp.display_name,
      phone: sp.phone,
      email: sp.email,
      is_active: sp.is_active,
      user_id: sp.user_id,
      created_at: sp.created_at,
      auth_status: status,
      project_ids: assignmentMap[sp.id] ?? [],
    };
  });

  return jsonOk({ salespeople: result, projects: projects ?? [] });
}
