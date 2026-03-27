/**
 * Cron entry point for OneDrive → Orion sync.
 *
 * Triggered hourly by Vercel Crons (via vercel.json).
 * Also supports manual trigger by admin users via POST.
 *
 * Auth:
 *   - Cron: validates CRON_SECRET header
 *   - Manual: validates admin role via requireRole()
 */

import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditSystem } from "@/lib/audit";
import { runSync } from "@/lib/sync/sync-engine";
import { CONCURRENCY_GUARD_MS } from "@/lib/sync/constants";
import type { SyncRunResult } from "@/lib/sync/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

async function executeSyncRun(triggerSource: "cron" | "manual"): Promise<SyncRunResult> {
  const supabase = createAdminClient();

  // Concurrency guard: skip if another sync is still running
  const { data: running } = await supabase
    .from("sync_runs")
    .select("id")
    .eq("status", "RUNNING")
    .gte("started_at", new Date(Date.now() - CONCURRENCY_GUARD_MS).toISOString())
    .maybeSingle();

  if (running) {
    return {
      runId: "",
      status: "PARTIAL",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      filesChecked: 0,
      filesProcessed: 0,
      fileResults: [],
      unitsUpdated: 0,
      reservationsCreated: 0,
      clientsCreated: 0,
      errors: ["Skipped: another sync run is still in progress"],
      fileChecksums: {},
    };
  }

  // Create sync run record
  const { data: run, error: insertErr } = await supabase
    .from("sync_runs")
    .insert({ trigger_source: triggerSource })
    .select("id")
    .single();

  if (insertErr || !run) {
    throw new Error(`Failed to create sync_run: ${insertErr?.message}`);
  }

  const runId = run.id;

  try {
    // Execute sync
    const result = await runSync(supabase, runId);

    // Update sync run record with results
    await supabase.from("sync_runs").update({
      finished_at: result.finishedAt,
      status: result.status,
      files_checked: result.filesChecked,
      files_processed: result.filesProcessed,
      file_results: result.fileResults,
      units_updated: result.unitsUpdated,
      reservations_created: result.reservationsCreated,
      clients_created: result.clientsCreated,
      errors: result.errors,
      file_checksums: result.fileChecksums,
    }).eq("id", runId);

    // Audit log
    await logAuditSystem({
      eventType: "sync.completed",
      resourceType: "sync_run",
      resourceId: runId,
      resourceLabel: `${result.status} — ${result.filesProcessed} files`,
      details: {
        status: result.status,
        filesProcessed: result.filesProcessed,
        unitsUpdated: result.unitsUpdated,
        reservationsCreated: result.reservationsCreated,
        clientsCreated: result.clientsCreated,
        errorCount: result.errors.length,
      },
    });

    return result;
  } catch (err) {
    // Mark run as FAILED
    const errMsg = err instanceof Error ? err.message : String(err);
    await supabase.from("sync_runs").update({
      finished_at: new Date().toISOString(),
      status: "FAILED",
      errors: [errMsg],
    }).eq("id", runId);

    await logAuditSystem({
      eventType: "sync.failed",
      resourceType: "sync_run",
      resourceId: runId,
      details: { error: errMsg },
    });

    throw err;
  }
}

/** GET — triggered by Vercel Cron scheduler. */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return jsonError(401, "Invalid cron secret");
  }

  try {
    const result = await executeSyncRun("cron");
    return jsonOk({
      status: result.status,
      filesProcessed: result.filesProcessed,
      unitsUpdated: result.unitsUpdated,
      reservationsCreated: result.reservationsCreated,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[cron/onedrive-sync] Fatal error:", err);
    return jsonError(500, err instanceof Error ? err.message : "Sync failed");
  }
}

/** POST — manual trigger from admin UI. */
export async function POST(request: Request) {
  // Lazy import to avoid pulling cookies() into cron path
  const { requireRole } = await import("@/lib/auth");
  const { ADMIN_ROLES } = await import("@/lib/auth");
  const auth = await requireRole(ADMIN_ROLES);
  if ("response" in auth && auth.response) return auth.response;

  try {
    const result = await executeSyncRun("manual");
    return jsonOk(result);
  } catch (err) {
    console.error("[cron/onedrive-sync] Manual sync error:", err);
    return jsonError(500, err instanceof Error ? err.message : "Sync failed");
  }
}
