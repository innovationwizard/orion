import { createAdminClient } from "@/lib/supabase/admin";
import { requireSalesperson, isSalespersonFailure } from "@/lib/reservas/require-salesperson";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/reservas/ventas/clients
 *
 * Returns all clients linked to the authenticated salesperson's reservations,
 * with profile completeness information.
 */
export async function GET() {
  const auth = await requireSalesperson();
  if (isSalespersonFailure(auth)) return auth.response;
  const { salesperson } = auth;

  const supabase = createAdminClient();

  // Scope to salesperson's currently assigned projects
  const { data: assignments, error: aErr } = await supabase
    .from("salesperson_project_assignments")
    .select("projects:project_id (slug)")
    .eq("salesperson_id", salesperson.id)
    .is("end_date", null);

  if (aErr) {
    console.error("[GET /api/reservas/ventas/clients] assignments", aErr);
    return jsonError(500, aErr.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedSlugs = (assignments ?? []).map((a: any) => a.projects?.slug).filter(Boolean) as string[];
  if (assignedSlugs.length === 0) return jsonOk([]);

  // Get unit IDs belonging to assigned projects
  const { data: projectUnits, error: puErr } = await supabase
    .from("v_rv_units_full")
    .select("id")
    .in("project_slug", assignedSlugs);

  if (puErr) {
    console.error("[GET /api/reservas/ventas/clients] projectUnits", puErr);
    return jsonError(500, puErr.message);
  }

  const assignedUnitIds = (projectUnits ?? []).map((u) => u.id);
  if (assignedUnitIds.length === 0) return jsonOk([]);

  // Get all reservation_clients linked to this salesperson's reservations
  // scoped to assigned projects
  const { data, error } = await supabase
    .from("reservation_clients")
    .select(`
      id,
      client_id,
      is_primary,
      role,
      document_order,
      rv_clients (id, full_name, phone, email, dpi),
      reservations!inner (
        id,
        status,
        unit_id,
        salesperson_id
      )
    `)
    .eq("reservations.salesperson_id", salesperson.id)
    .in("reservations.unit_id", assignedUnitIds)
    .order("document_order", { ascending: true });

  if (error) {
    console.error("[GET /api/reservas/ventas/clients]", error);
    return jsonError(500, error.message);
  }

  // Get unit info for each reservation
  const reservationIds = [
    ...new Set(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (data ?? []).map((d: any) => d.reservations?.id).filter(Boolean),
    ),
  ];

  // Get unit numbers for context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unitIds = [...new Set((data ?? []).map((d: any) => d.reservations?.unit_id).filter(Boolean))];
  const { data: units } = await supabase
    .from("v_rv_units_full")
    .select("id, unit_number, project_name")
    .in("id", unitIds.length > 0 ? unitIds : ["_none_"]);

  const unitMap = new Map(
    (units ?? []).map((u) => [u.id, { unit_number: u.unit_number, project_name: u.project_name }]),
  );

  // Get profile completeness
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientIds = [...new Set((data ?? []).map((d: any) => d.client_id).filter(Boolean))];
  const { data: profiles } = await supabase
    .from("rv_client_profiles")
    .select("client_id, gender, birth_date, education_level, purchase_type, marital_status, occupation_type, department, acquisition_channel")
    .in("client_id", clientIds.length > 0 ? clientIds : ["_none_"]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => {
      const fields = [
        p.gender,
        p.birth_date,
        p.education_level,
        p.purchase_type,
        p.marital_status,
        p.occupation_type,
        p.department,
        p.acquisition_channel,
      ];
      const filled = fields.filter(Boolean).length;
      const completeness = Math.round((filled / fields.length) * 100);
      return [p.client_id, { has_profile: true, completeness }];
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (data ?? []).map((d: any) => {
    const client = d.rv_clients;
    const reservation = d.reservations;
    const unitInfo = unitMap.get(reservation?.unit_id);
    const profileInfo = profileMap.get(d.client_id);

    return {
      link_id: d.id,
      client_id: d.client_id,
      full_name: client?.full_name ?? "—",
      phone: client?.phone ?? null,
      email: client?.email ?? null,
      dpi: client?.dpi ?? null,
      role: d.role,
      is_primary: d.is_primary,
      reservation_id: reservation?.id ?? null,
      reservation_status: reservation?.status ?? null,
      unit_number: unitInfo?.unit_number ?? "—",
      project_name: unitInfo?.project_name ?? "—",
      has_profile: profileInfo?.has_profile ?? false,
      profile_completeness: profileInfo?.completeness ?? 0,
    };
  });

  return jsonOk(result);
}
