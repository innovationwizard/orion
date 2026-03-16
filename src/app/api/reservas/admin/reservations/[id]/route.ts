import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
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
  const auth = await requireRole(["master", "torredecontrol"]);
  if ("response" in auth) return auth.response;

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
    salesperson: salespersonResult.data,
    audit_log: auditResult.data ?? [],
  });
}
