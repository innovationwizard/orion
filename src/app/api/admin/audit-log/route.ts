import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/admin/audit-log
 * List audit events with optional filters and pagination.
 * Auth: master + torredecontrol only.
 */
export async function GET(request: Request) {
  const auth = await requireRole(ADMIN_ROLES);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const eventType = url.searchParams.get("event_type") ?? undefined;
  const resourceType = url.searchParams.get("resource_type") ?? undefined;
  const actorId = url.searchParams.get("actor_id") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const offset = Math.max(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);

  const supabase = createAdminClient();

  let query = supabase
    .from("audit_events")
    .select("*", { count: "exact" });

  if (eventType) query = query.eq("event_type", eventType);
  if (resourceType) query = query.eq("resource_type", resourceType);
  if (actorId) query = query.eq("actor_id", actorId);
  if (from) query = query.gte("created_at", `${from}T00:00:00Z`);
  if (to) query = query.lte("created_at", `${to}T23:59:59Z`);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[GET /api/admin/audit-log]", error);
    return jsonError(500, error.message);
  }

  return jsonOk({
    events: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
