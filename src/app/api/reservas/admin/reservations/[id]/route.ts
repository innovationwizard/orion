import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { rolesFor } from "@/lib/permissions";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";
import { jsonOk, jsonError } from "@/lib/api";

const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Extract the storage path from a Supabase public URL and create a signed URL.
 * Public URLs look like: .../storage/v1/object/public/{bucket}/{path}
 */
async function signStorageUrl(
  supabase: SupabaseClient,
  publicUrl: string | null,
  bucket: string,
): Promise<string | null> {
  if (!publicUrl) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  const path = publicUrl.slice(idx + marker.length);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function generateSignedUrls(
  supabase: SupabaseClient,
  reservation: {
    receipt_image_url: string | null;
    dpi_image_url: string | null;
    pcv_url: string | null;
  },
) {
  const [receipt, dpi, pcv] = await Promise.all([
    signStorageUrl(supabase, reservation.receipt_image_url, "receipts"),
    signStorageUrl(supabase, reservation.dpi_image_url, "dpi"),
    signStorageUrl(supabase, reservation.pcv_url, "pcv"),
  ]);
  return { receipt, dpi, pcv };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Dual-auth: admin OR salesperson with ownership check
  let isAdmin = true;
  let salespersonId: string | null = null;

  const auth = await requireRole(rolesFor("reservations", "view"));
  if ("response" in auth) {
    // Not admin — try salesperson auth
    isAdmin = false;
    const spAuth = await requireSalesperson();
    if (isSalespersonFailure(spAuth)) return spAuth.response;
    salespersonId = spAuth.salesperson.id;
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rErr) {
    console.error("[GET /api/reservas/admin/reservations/[id]]", rErr);
    return jsonError(500, rErr.message);
  }

  if (!reservation) {
    return jsonError(404, "Reserva no encontrada");
  }

  // If salesperson, verify ownership
  if (!isAdmin && reservation.salesperson_id !== salespersonId) {
    return jsonError(403, "No tienes acceso a esta reserva");
  }

  const [clientsResult, extractionsResult, unitResult, salespersonResult, auditResult] =
    await Promise.all([
      supabase
        .from("reservation_clients")
        .select("id, client_id, is_primary, role, ownership_pct, legal_capacity, document_order, signs_pcv, rv_clients(id, full_name, phone, email, dpi)")
        .eq("reservation_id", id)
        .order("document_order", { ascending: true }),
      supabase
        .from("receipt_extractions")
        .select("*")
        .eq("reservation_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("v_rv_units_full")
        .select("*")
        .eq("id", reservation.unit_id)
        .maybeSingle(),
      supabase
        .from("salespeople")
        .select("id, full_name, display_name, phone, email")
        .eq("id", reservation.salesperson_id)
        .maybeSingle(),
      supabase
        .from("unit_status_log")
        .select("*")
        .eq("unit_id", reservation.unit_id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  // Generate signed URLs for private storage images (buckets are auth-only)
  const signedUrls = await generateSignedUrls(supabase, reservation);

  // 033: Fetch ejecutivo rate data from the analytics sale (rv_units → units → sales)
  let saleRateData: {
    sale_id: string;
    ejecutivo_rate: number | null;
    ejecutivo_rate_confirmed: boolean;
    ejecutivo_rate_confirmed_at: string | null;
    ejecutivo_rate_confirmed_by: string | null;
  } | null = null;

  const rvUnit = unitResult.data;
  if (rvUnit?.project_id && rvUnit?.unit_number) {
    // Find the analytics unit matching this rv_unit by project + unit_number
    const { data: analyticsUnit } = await supabase
      .from("units")
      .select("id")
      .eq("project_id", rvUnit.project_id)
      .eq("unit_number", rvUnit.unit_number)
      .maybeSingle();

    if (analyticsUnit) {
      const { data: sale } = await supabase
        .from("sales")
        .select("id, ejecutivo_rate, ejecutivo_rate_confirmed, ejecutivo_rate_confirmed_at, ejecutivo_rate_confirmed_by")
        .eq("unit_id", analyticsUnit.id)
        .eq("status", "active")
        .maybeSingle();

      if (sale) {
        saleRateData = {
          sale_id: sale.id,
          ejecutivo_rate: sale.ejecutivo_rate,
          ejecutivo_rate_confirmed: sale.ejecutivo_rate_confirmed,
          ejecutivo_rate_confirmed_at: sale.ejecutivo_rate_confirmed_at,
          ejecutivo_rate_confirmed_by: sale.ejecutivo_rate_confirmed_by,
        };
      }
    }
  }

  // Monthly sales context: all sales by this rep in the same month (for CFO rate audit)
  let monthlyContext: Array<{
    reservation_id: string;
    submitted_at: string;
    project_name: string;
    project_slug: string;
    tower_name: string;
    unit_number: string;
    unit_type: string;
    deposit_amount: number | null;
    ejecutivo_rate: number | null;
    ejecutivo_rate_confirmed: boolean;
    is_current: boolean;
  }> | null = null;

  if (isAdmin && reservation.salesperson_id && reservation.submitted_at) {
    const d = new Date(reservation.submitted_at);
    const monthStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
    const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString();

    const { data: monthRes } = await supabase
      .from("reservations")
      .select("id, submitted_at, deposit_amount, unit_id")
      .eq("salesperson_id", reservation.salesperson_id)
      .in("status", ["CONFIRMED", "PENDING_REVIEW"])
      .gte("submitted_at", monthStart)
      .lt("submitted_at", monthEnd)
      .order("submitted_at");

    if (monthRes?.length) {
      const unitIds = [...new Set(monthRes.map((r) => r.unit_id))];

      const { data: viewUnits } = await supabase
        .from("v_rv_units_full")
        .select("id, unit_number, unit_type, tower_name, project_id, project_name, project_slug")
        .in("id", unitIds);

      const unitMap = new Map((viewUnits ?? []).map((u) => [u.id, u]));

      // Batch analytics lookup: get all analytics units for relevant projects
      const projectIds = [...new Set((viewUnits ?? []).map((u) => u.project_id))];
      const { data: allAU } = projectIds.length
        ? await supabase.from("units").select("id, project_id, unit_number").in("project_id", projectIds)
        : { data: [] };
      const auMap = new Map((allAU ?? []).map((u) => [`${u.project_id}:${u.unit_number}`, u.id]));

      // Batch sales lookup
      const matchedAuIds = (viewUnits ?? [])
        .map((vu) => auMap.get(`${vu.project_id}:${vu.unit_number}`))
        .filter((aid): aid is string => aid != null);
      const { data: allSales } = matchedAuIds.length
        ? await supabase
            .from("sales")
            .select("unit_id, ejecutivo_rate, ejecutivo_rate_confirmed")
            .in("unit_id", matchedAuIds)
            .eq("status", "active")
        : { data: [] };
      const saleByAuId = new Map((allSales ?? []).map((s) => [s.unit_id, s]));

      monthlyContext = monthRes.map((r) => {
        const unit = unitMap.get(r.unit_id);
        const auId = unit ? auMap.get(`${unit.project_id}:${unit.unit_number}`) : undefined;
        const sale = auId ? saleByAuId.get(auId) : undefined;
        return {
          reservation_id: r.id,
          submitted_at: r.submitted_at,
          project_name: unit?.project_name ?? "",
          project_slug: unit?.project_slug ?? "",
          tower_name: unit?.tower_name ?? "",
          unit_number: unit?.unit_number ?? "",
          unit_type: unit?.unit_type ?? "",
          deposit_amount: r.deposit_amount,
          ejecutivo_rate: sale?.ejecutivo_rate ?? null,
          ejecutivo_rate_confirmed: sale?.ejecutivo_rate_confirmed ?? false,
          is_current: r.id === id,
        };
      });
    }
  }

  return jsonOk({
    reservation: {
      ...reservation,
      receipt_image_url: signedUrls.receipt ?? reservation.receipt_image_url,
      dpi_image_url: signedUrls.dpi ?? reservation.dpi_image_url,
      pcv_url: signedUrls.pcv ?? reservation.pcv_url,
    },
    clients: clientsResult.data ?? [],
    extractions: extractionsResult.data ?? [],
    unit: unitResult.data,
    salesperson: isAdmin ? salespersonResult.data : null,
    audit_log: auditResult.data ?? [],
    sale_rate: isAdmin ? saleRateData : null,
    monthly_context: isAdmin ? monthlyContext : null,
  });
}
