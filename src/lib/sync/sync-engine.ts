/**
 * Sync engine — orchestrates OneDrive → Orion data synchronization.
 *
 * Processes files in priority order:
 *   1. Disponibilidad (unit status + price) — highest value
 *   2. Ventas (new reservations)
 *   3. Cesion de Derechos
 *
 * Change detection: compares file lastModifiedDateTime against previous run.
 * Only downloads and parses changed files.
 *
 * Conflict rule: Excel wins (overwrite), except SOFT_HOLD units are never touched.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RvUnitStatus } from "@/lib/reservas/types";
import type { SyncRunResult, SyncFileResult, ParsedUnitStatus, ParsedSaleRecord } from "./types";
import {
  ONEDRIVE_FILES,
  FILE_KEY_TO_PROJECT_SLUG,
  SYNC_CHANGED_BY,
  SYNC_TIMEOUT_MS,
  projectKeyFromFileKey,
} from "./constants";
import { getFileMetadata, downloadFile } from "./graph-client";
import { parseDisponibilidad, parseVentasSheets, parseCesion } from "./excel-parser";

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runSync(
  supabase: SupabaseClient,
  runId: string,
): Promise<SyncRunResult> {
  const startTime = Date.now();
  const startedAt = new Date(startTime).toISOString();

  const result: SyncRunResult = {
    runId,
    status: "SUCCESS",
    startedAt,
    finishedAt: "",
    filesChecked: 0,
    filesProcessed: 0,
    fileResults: [],
    unitsUpdated: 0,
    reservationsCreated: 0,
    clientsCreated: 0,
    errors: [],
    fileChecksums: {},
  };

  // Load previous checksums for change detection
  const previousChecksums = await loadPreviousChecksums(supabase);

  // Sort files: disponibilidad first, then ventas, then cesion
  const fileKeys = Object.keys(ONEDRIVE_FILES).sort((a, b) => {
    const priority = (k: string) => {
      if (k.endsWith("_disp")) return 0;
      if (k.endsWith("_ventas")) return 1;
      if (k.endsWith("_cesion")) return 2;
      return 3;
    };
    return priority(a) - priority(b);
  });

  for (const fileKey of fileKeys) {
    // Timeout guard
    if (Date.now() - startTime > SYNC_TIMEOUT_MS) {
      result.status = "PARTIAL";
      result.errors.push(`Timeout: stopped after ${Math.round((Date.now() - startTime) / 1000)}s`);
      break;
    }

    const fileStart = Date.now();
    const filePath = ONEDRIVE_FILES[fileKey];
    const fileResult: SyncFileResult = {
      fileKey,
      fileName: filePath.split("/").pop() ?? fileKey,
      lastModified: null,
      skipped: false,
      unitsUpdated: 0,
      reservationsCreated: 0,
      clientsCreated: 0,
      errors: [],
      durationMs: 0,
    };

    try {
      result.filesChecked++;

      // Get file metadata for change detection
      const meta = await getFileMetadata(filePath);
      if (!meta) {
        fileResult.skipped = true;
        fileResult.skipReason = "File not found on OneDrive";
        fileResult.errors.push(`File not found: ${filePath}`);
        fileResult.durationMs = Date.now() - fileStart;
        result.fileResults.push(fileResult);
        result.errors.push(`[${fileKey}] File not found: ${filePath}`);
        continue;
      }

      fileResult.lastModified = meta.lastModifiedDateTime;
      result.fileChecksums[fileKey] = meta.lastModifiedDateTime;

      // Skip unchanged files
      if (previousChecksums[fileKey] === meta.lastModifiedDateTime) {
        fileResult.skipped = true;
        fileResult.skipReason = "Unchanged since last sync";
        result.fileResults.push(fileResult);
        continue;
      }

      // Download and parse
      const buffer = await downloadFile(filePath);
      if (!buffer) {
        fileResult.errors.push("Download returned null");
        result.fileResults.push(fileResult);
        continue;
      }

      result.filesProcessed++;

      // Route to appropriate sync handler
      if (fileKey.endsWith("_disp")) {
        const parsed = parseDisponibilidad(buffer, fileKey);
        const projectKey = projectKeyFromFileKey(fileKey);
        const projectSlug = FILE_KEY_TO_PROJECT_SLUG[projectKey];
        if (projectSlug) {
          const counts = await syncUnitStatuses(supabase, parsed, projectSlug, fileResult.errors);
          fileResult.unitsUpdated = counts.updated;
        }
      } else if (fileKey.endsWith("_ventas")) {
        const projectKey = projectKeyFromFileKey(fileKey);
        const projectSlug = FILE_KEY_TO_PROJECT_SLUG[projectKey];
        if (projectSlug) {
          const parsed = parseVentasSheets(buffer, projectSlug);
          const counts = await syncNewReservations(supabase, parsed, projectSlug, fileResult.errors);
          fileResult.reservationsCreated = counts.created;
          fileResult.clientsCreated = counts.clientsCreated;
        }
      } else if (fileKey.endsWith("_cesion")) {
        const parsed = parseCesion(buffer);
        const counts = await syncCesionData(supabase, parsed, fileResult.errors);
        fileResult.unitsUpdated = counts.updated;
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      fileResult.errors.push(errMsg);
      console.error(`[sync] Error processing ${fileKey}:`, errMsg);
    }

    fileResult.durationMs = Date.now() - fileStart;
    result.fileResults.push(fileResult);

    // Accumulate totals
    result.unitsUpdated += fileResult.unitsUpdated;
    result.reservationsCreated += fileResult.reservationsCreated;
    result.clientsCreated += fileResult.clientsCreated;
    if (fileResult.errors.length > 0) {
      result.errors.push(...fileResult.errors.map((e) => `[${fileKey}] ${e}`));
    }
  }

  // Determine final status
  if (result.errors.length > 0 && result.status !== "PARTIAL") {
    result.status = result.filesProcessed > 0 ? "PARTIAL" : "FAILED";
  }

  result.finishedAt = new Date().toISOString();
  return result;
}

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

async function loadPreviousChecksums(
  supabase: SupabaseClient,
): Promise<Record<string, string>> {
  // Only trust checksums from runs that actually processed files.
  // A run with files_processed=0 means files were skipped (no real work done),
  // so its checksums should not be used as a baseline.
  const { data } = await supabase
    .from("sync_runs")
    .select("file_checksums")
    .in("status", ["SUCCESS", "PARTIAL"])
    .gt("files_processed", 0)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.file_checksums && typeof data.file_checksums === "object") {
    return data.file_checksums as Record<string, string>;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Unit status sync (Disponibilidad files)
// ---------------------------------------------------------------------------

async function syncUnitStatuses(
  supabase: SupabaseClient,
  parsed: ParsedUnitStatus[],
  projectSlug: string,
  errors: string[],
): Promise<{ updated: number }> {
  if (parsed.length === 0) return { updated: 0 };

  // Load current DB state for this project
  const { data: dbUnits, error: fetchErr } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, tower_name, status, price_list")
    .eq("project_slug", projectSlug);

  if (fetchErr) {
    errors.push(`DB fetch failed for ${projectSlug}: ${fetchErr.message}`);
    return { updated: 0 };
  }

  // Build lookup: "tower:unit" → DB row
  const dbMap = new Map<string, { id: string; status: RvUnitStatus; price_list: number | null }>();
  for (const u of dbUnits ?? []) {
    const key = `${u.tower_name}:${u.unit_number}`;
    dbMap.set(key, { id: u.id, status: u.status, price_list: u.price_list });
  }

  let updated = 0;

  for (const parsed_unit of parsed) {
    const key = `${parsed_unit.towerName}:${parsed_unit.unitNumber}`;
    const db = dbMap.get(key);
    if (!db) continue; // Unit not in DB — skip (don't create units from Disponibilidad)

    // NEVER overwrite SOFT_HOLD — active reservation in progress
    if (db.status === "SOFT_HOLD") continue;

    const changes: Record<string, unknown> = {};

    if (parsed_unit.status !== db.status) {
      changes.status = parsed_unit.status;
      changes.status_changed_at = new Date().toISOString();
      changes.status_detail = "Sync desde Excel OneDrive";
    }

    if (parsed_unit.priceList != null && parsed_unit.priceList !== db.price_list) {
      changes.price_list = parsed_unit.priceList;
    }

    if (Object.keys(changes).length === 0) continue;

    const { error: updateErr } = await supabase
      .from("rv_units")
      .update(changes)
      .eq("id", db.id);

    if (updateErr) {
      errors.push(`Unit ${parsed_unit.unitNumber}: ${updateErr.message}`);
      continue;
    }

    // Log status change to unit_status_log
    if (changes.status) {
      await supabase.from("unit_status_log").insert({
        unit_id: db.id,
        old_status: db.status,
        new_status: changes.status,
        changed_by: SYNC_CHANGED_BY,
        reason: `Sync automático — Excel: ${parsed_unit.status}`,
      });
    }

    updated++;
  }

  return { updated };
}

// ---------------------------------------------------------------------------
// Reservation sync (Ventas files)
// ---------------------------------------------------------------------------

async function syncNewReservations(
  supabase: SupabaseClient,
  parsed: ParsedSaleRecord[],
  projectSlug: string,
  errors: string[],
): Promise<{ created: number; clientsCreated: number }> {
  if (parsed.length === 0) return { created: 0, clientsCreated: 0 };

  // Load units for this project
  const { data: dbUnits } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, tower_name, status")
    .eq("project_slug", projectSlug);

  const unitMap = new Map<string, { id: string; status: RvUnitStatus }>();
  for (const u of dbUnits ?? []) {
    const key = `${u.tower_name}:${u.unit_number}`;
    unitMap.set(key, { id: u.id, status: u.status });
  }

  // Load existing active reservations
  const { data: activeRes } = await supabase
    .from("reservations")
    .select("unit_id")
    .in("status", ["PENDING_REVIEW", "CONFIRMED"]);

  const activeUnitIds = new Set((activeRes ?? []).map((r) => r.unit_id));

  // Load salespeople lookup
  const { data: salespeople } = await supabase
    .from("salespeople")
    .select("id, full_name")
    .eq("is_active", true);

  const spMap = new Map<string, string>();
  for (const sp of salespeople ?? []) {
    spMap.set(sp.full_name, sp.id);
  }

  // Deduplicate: keep latest record per unit (by fecha, then last-seen)
  const latestByUnit = new Map<string, ParsedSaleRecord>();
  for (const sale of parsed) {
    const tower = sale.towerName ?? "Principal";
    const key = `${tower}:${sale.unitNumber}`;
    const existing = latestByUnit.get(key);
    if (!existing) {
      latestByUnit.set(key, sale);
    } else if (sale.fecha && (!existing.fecha || sale.fecha > existing.fecha)) {
      latestByUnit.set(key, sale);
    }
  }

  let created = 0;
  let clientsCreated = 0;

  for (const [unitKey, sale] of latestByUnit) {
    const unit = unitMap.get(unitKey);
    if (!unit) continue; // Unit not in DB

    // Skip if there's already an active reservation for this unit
    if (activeUnitIds.has(unit.id)) continue;

    // Skip if no salesperson can be resolved
    if (!sale.salespersonName) continue;
    const spId = spMap.get(sale.salespersonName);
    if (!spId) {
      errors.push(`Salesperson not found: "${sale.salespersonName}" for unit ${sale.unitNumber}`);
      continue;
    }

    // Find or create clients
    const clientIds: string[] = [];
    for (const clientName of sale.clientNames) {
      const clientId = await findOrCreateClient(supabase, clientName, errors);
      if (clientId) {
        clientIds.push(clientId);
      } else {
        clientsCreated++; // Count even if creation fails (tracked in errors)
      }
    }
    if (clientIds.length === 0) continue;

    // Create reservation as CONFIRMED (Excel is the SSOT)
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .insert({
        unit_id: unit.id,
        salesperson_id: spId,
        status: "CONFIRMED",
        deposit_amount: sale.enganche,
        deposit_date: sale.fecha,
        lead_source: sale.medio,
        is_resale: false,
        reviewed_at: new Date().toISOString(),
        notes: `Auto-sync desde Excel OneDrive (${sale.monthLabel})`,
      })
      .select("id")
      .single();

    if (resErr) {
      // Likely unique constraint violation (active reservation already exists)
      if (resErr.code === "23505") continue; // Silently skip duplicates
      errors.push(`Reservation insert for unit ${sale.unitNumber}: ${resErr.message}`);
      continue;
    }

    // Create reservation_clients junction records
    for (let i = 0; i < clientIds.length; i++) {
      await supabase.from("reservation_clients").insert({
        reservation_id: reservation.id,
        client_id: clientIds[i],
        is_primary: i === 0,
      });
    }

    // Update unit status if needed
    if (unit.status === "AVAILABLE") {
      await supabase.from("rv_units").update({
        status: "RESERVED",
        status_changed_at: new Date().toISOString(),
        status_detail: "Sync desde Excel OneDrive",
      }).eq("id", unit.id);

      await supabase.from("unit_status_log").insert({
        unit_id: unit.id,
        old_status: unit.status,
        new_status: "RESERVED",
        changed_by: SYNC_CHANGED_BY,
        reservation_id: reservation.id,
        reason: `Reserva creada por sync — ${sale.clientNames.join(", ")}`,
      });
    }

    activeUnitIds.add(unit.id); // Prevent double-creating within same sync
    created++;
  }

  return { created, clientsCreated };
}

/** Find a client by exact name match, or create a new one. */
async function findOrCreateClient(
  supabase: SupabaseClient,
  fullName: string,
  errors: string[],
): Promise<string | null> {
  // Exact match first
  const { data: existing } = await supabase
    .from("rv_clients")
    .select("id")
    .eq("full_name", fullName)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Create new client
  const { data: created, error: createErr } = await supabase
    .from("rv_clients")
    .insert({ full_name: fullName })
    .select("id")
    .single();

  if (createErr) {
    errors.push(`Client create "${fullName}": ${createErr.message}`);
    return null;
  }

  return created.id;
}

// ---------------------------------------------------------------------------
// Cesion sync
// ---------------------------------------------------------------------------

async function syncCesionData(
  supabase: SupabaseClient,
  parsed: ReturnType<typeof parseCesion>,
  errors: string[],
): Promise<{ updated: number }> {
  if (parsed.length === 0) return { updated: 0 };

  // Cesion is B5 only
  const { data: dbUnits } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, price_suggested, pcv_block, precalificacion_status, precalificacion_notes, razon_compra, tipo_cliente")
    .eq("project_slug", "boulevard-5");

  const unitMap = new Map<string, {
    id: string;
    price_suggested: number | null;
    pcv_block: number | null;
    precalificacion_status: string | null;
    precalificacion_notes: string | null;
    razon_compra: string | null;
    tipo_cliente: string | null;
  }>();
  for (const u of dbUnits ?? []) {
    unitMap.set(u.unit_number, u);
  }

  let updated = 0;

  for (const row of parsed) {
    const db = unitMap.get(row.unitNumber);
    if (!db) continue;

    const changes: Record<string, unknown> = {};

    if (row.precioSugerido != null && row.precioSugerido !== db.price_suggested) {
      changes.price_suggested = row.precioSugerido;
    }
    if (row.pcvBlock != null && row.pcvBlock !== db.pcv_block) {
      changes.pcv_block = row.pcvBlock;
    }
    if (row.precalificacionStatus && row.precalificacionStatus !== db.precalificacion_status) {
      changes.precalificacion_status = row.precalificacionStatus;
    }
    if (row.precalificacionNotes && row.precalificacionNotes !== db.precalificacion_notes) {
      changes.precalificacion_notes = row.precalificacionNotes;
    }
    if (row.razonCompra && row.razonCompra !== db.razon_compra) {
      changes.razon_compra = row.razonCompra;
    }
    if (row.tipoCliente && row.tipoCliente !== db.tipo_cliente) {
      changes.tipo_cliente = row.tipoCliente;
    }

    if (Object.keys(changes).length === 0) continue;

    const { error: updateErr } = await supabase
      .from("rv_units")
      .update(changes)
      .eq("id", db.id);

    if (updateErr) {
      errors.push(`Cesion unit ${row.unitNumber}: ${updateErr.message}`);
      continue;
    }

    updated++;
  }

  return { updated };
}
