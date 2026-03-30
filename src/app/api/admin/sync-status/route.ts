/**
 * Admin API for sync status and manual trigger.
 *
 * GET  — returns last 20 sync runs
 * POST — trigger manual sync (admin only)
 */

import { requireRole } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

const MASTER_ONLY: ["master"] = ["master"];

export async function GET() {
  const auth = await requireRole(MASTER_ONLY);
  if ("response" in auth && auth.response) return auth.response;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[GET /api/admin/sync-status]", error);
    return jsonError(500, error.message);
  }

  return jsonOk(data);
}

export async function POST(request: Request) {
  const auth = await requireRole(MASTER_ONLY);
  if ("response" in auth && auth.response) return auth.response;

  // Forward to the cron route's POST handler
  const { POST: cronPost } = await import("@/app/api/cron/onedrive-sync/route");
  return cronPost(request);
}
