/**
 * The Supabase implementation of the repository (SDD v5 §6.5).
 *
 * Two things make it a faithful half of the pair:
 *
 *   - **Every write goes through a database function**, never a bare insert or update,
 *     so the change and its history event land in one transaction. If the event fails,
 *     the change is not committed. The Odoo side does the same with two addon methods,
 *     because there each API call is its own transaction.
 *   - **It is given the caller's client**, not a service-role one, so the row-level
 *     policies still apply underneath. The functions are SECURITY INVOKER for the same
 *     reason. The single exception is Entregas completing the keys appointment: that
 *     runs as the Entregas team, who have no permission of their own here, and needs
 *     the admin client.
 *
 * A note learned in the local rehearsal: when a policy forbids a write, PostgreSQL
 * does not raise — the statement simply matches no rows. The functions turn that
 * silence into an error, which is why nothing here writes to a table directly.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChecklistItem,
  CreditoRepo,
  EventInput,
  Expediente,
  ExpedienteChange,
  ExpedienteSummary,
  HistoryEntry,
  Id,
  ListFilter,
  NewChecklistItem,
  NewExpediente,
  Reservation,
  TemplateRow,
} from "./repo";
import { RepoError, ReservationConflictError } from "./repo";
import type { ChecklistItemState, CreditSubtype } from "./model.generated";

/** One row of `v_pai_credito_reserva`. */
interface ReservaRow {
  reservation_id: string;
  confirmada: boolean;
  tiene_expediente: boolean;
  project_id: string;
  project_name: string;
  unit_id: string;
  unit_number: string;
  tower_name: string | null;
  cliente: string | null;
}

/** One row of `v_pai_credito_expediente_full`. */
interface ExpedienteFullRow {
  id: string;
  reservation_id: string;
  unit_id: string;
  company_id: string;
  credit_type: Expediente["creditType"];
  credit_subtype: Expediente["creditSubtype"];
  state: Expediente["state"];
  cumplimiento_categoria: Expediente["cumplimientoCategoria"];
  desistido_reason: Expediente["desistidoReason"];
  active: boolean;
  create_date: string;
  project_name: string;
  unit_number: string;
  tower_name: string | null;
  cliente: string | null;
}

export class SupabaseCreditoRepo implements CreditoRepo {
  constructor(private readonly db: SupabaseClient) {}

  // -------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------

  async reservationsAvailable(search?: string): Promise<Reservation[]> {
    let query = this.db
      .from("v_pai_credito_reserva")
      .select("*")
      .eq("confirmada", true)
      .eq("tiene_expediente", false)
      .order("created_at", { ascending: false })
      .limit(50);

    const term = sanitize(search);
    if (term) {
      query = query.or(
        `unit_number.ilike.%${term}%,cliente.ilike.%${term}%,project_name.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw new RepoError("No se pudieron leer las reservas", error);
    return (data as ReservaRow[]).map(toReservation);
  }

  async getReservation(id: Id): Promise<Reservation | null> {
    const { data, error } = await this.db
      .from("v_pai_credito_reserva")
      .select("*")
      .eq("reservation_id", id)
      .maybeSingle();
    if (error) throw new RepoError("No se pudo leer la reserva", error);
    return data ? toReservation(data as ReservaRow) : null;
  }

  async templatesFor(subtype: CreditSubtype): Promise<TemplateRow[]> {
    const { data, error } = await this.db
      .from("pai_credito_checklist_template")
      .select("document_key, name, condition, is_conditional, sequence")
      .eq("credit_subtype", subtype)
      .order("sequence");
    if (error) throw new RepoError("No se pudo leer el catálogo de requisitos", error);
    return (data ?? []).map((r) => ({
      documentKey: r.document_key as string,
      name: r.name as string,
      condition: (r.condition as string | null) ?? null,
      isConditional: r.is_conditional as boolean,
      sequence: r.sequence as number,
    }));
  }

  async list(filter: ListFilter): Promise<ExpedienteSummary[]> {
    // PostgREST caps each response. Read every batch so counts and filters use
    // the complete set, with a stable tie-breaker for equal creation timestamps.
    const data: ExpedienteFullRow[] = [];
    const batchSize = 500;
    for (let offset = 0; ; offset += batchSize) {
      let query = this.db.from("v_pai_credito_expediente_full").select("*");
      if (!filter.includeDeleted) query = query.eq("active", true);
      if (filter.companyId) query = query.eq("company_id", filter.companyId);
      if (filter.state) query = query.eq("state", filter.state);
      if (filter.creditType) query = query.eq("credit_type", filter.creditType);
      const result = await query.order("create_date", { ascending: false })
        .order("id", { ascending: false }).range(offset, offset + batchSize - 1);
      if (result.error) throw new RepoError("No se pudo leer el listado de expedientes", result.error);
      const batch = result.data as ExpedienteFullRow[];
      data.push(...batch);
      if (batch.length < batchSize) break;
    }
    return (data as ExpedienteFullRow[]).map((r) => ({
      ...toExpediente(r),
      projectName: r.project_name,
      unitNumber: r.unit_number,
      towerName: r.tower_name,
      cliente: r.cliente,
      createdAt: r.create_date,
    }));
  }

  async getExpediente(id: Id): Promise<ExpedienteSummary | null> {
    // The view, not the table: it resolves the purchase's names in the same read.
    // No `active` filter here — the service decides what a deleted expediente means.
    const { data, error } = await this.db
      .from("v_pai_credito_expediente_full")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new RepoError("No se pudo leer el expediente", error);
    if (!data) return null;
    const row = data as ExpedienteFullRow;
    return {
      ...toExpediente(row),
      projectName: row.project_name,
      unitNumber: row.unit_number,
      towerName: row.tower_name,
      cliente: row.cliente,
      createdAt: row.create_date,
    };
  }

  async getChecklist(expedienteId: Id): Promise<ChecklistItem[]> {
    const { data, error } = await this.db
      .from("pai_credito_checklist_item")
      .select(
        "id, document_key, name, condition, is_conditional, is_required, is_extra, sequence, state, received_date",
      )
      .eq("expediente_id", expedienteId)
      .order("sequence");
    if (error) throw new RepoError("No se pudo leer el checklist", error);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      documentKey: r.document_key as string,
      name: r.name as string,
      condition: (r.condition as string | null) ?? null,
      isConditional: r.is_conditional as boolean,
      isRequired: r.is_required as boolean,
      isExtra: r.is_extra as boolean,
      sequence: r.sequence as number,
      state: r.state as ChecklistItemState,
      receivedDate: (r.received_date as string | null) ?? null,
    }));
  }

  async getHistory(expedienteId: Id): Promise<HistoryEntry[]> {
    const { data, error } = await this.db
      .from("pai_credito_expediente_evento")
      .select(
        "id, action, from_state, to_state, desistido_reason, detail, note, actor_id, create_date",
      )
      .eq("expediente_id", expedienteId)
      .order("create_date");
    if (error) throw new RepoError("No se pudo leer el historial", error);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      action: r.action as HistoryEntry["action"],
      fromState: (r.from_state as HistoryEntry["fromState"]) ?? null,
      toState: (r.to_state as HistoryEntry["toState"]) ?? null,
      desistidoReason: (r.desistido_reason as HistoryEntry["desistidoReason"]) ?? null,
      detail: (r.detail as Record<string, unknown> | null) ?? null,
      note: (r.note as string | null) ?? null,
      actorId: r.actor_id as string,
      createdAt: r.create_date as string,
    }));
  }

  // -------------------------------------------------------------------------
  // Writing — always through a function, always with the event
  // -------------------------------------------------------------------------

  async createExpediente(
    values: NewExpediente,
    items: TemplateRow[],
    event: EventInput,
  ): Promise<Id> {
    const { data, error } = await this.db.rpc("fn_pai_credito_crear_expediente", {
      p_expediente: {
        reservation_id: values.reservationId,
        unit_id: values.unitId,
        company_id: values.companyId,
        credit_type: values.creditType,
        credit_subtype: values.creditSubtype,
        cumplimiento_categoria: values.cumplimientoCategoria ?? null,
      },
      // A catalogue document is required unless the PDF made it conditional; a
      // document added by hand later carries whatever the person chose (§6.2).
      p_items: items.map((t) => ({
        document_key: t.documentKey,
        name: t.name,
        condition: t.condition,
        is_conditional: t.isConditional,
        is_required: !t.isConditional,
        is_extra: false,
        sequence: t.sequence,
      })),
      p_evento: toEvent(event),
    });
    if (error?.code === "23505" && error.message.includes("pai_credito_expediente_reservation_active_uniq")) {
      throw new ReservationConflictError(error);
    }
    if (error) throw new RepoError("No se pudo crear el expediente", error);
    return data as string;
  }

  async applyChange(id: Id, change: ExpedienteChange, event: EventInput): Promise<void> {
    const { error } = await this.db.rpc("fn_pai_credito_aplicar_cambio", {
      p_expediente_id: id,
      p_cambios: toChange(change),
      p_item: null,
      p_evento: toEvent(event),
    });
    if (error) throw new RepoError(message(error, "No se pudo aplicar el cambio"), error);
  }

  async markItem(
    expedienteId: Id,
    itemId: Id,
    state: ChecklistItemState,
    event: EventInput,
  ): Promise<void> {
    const { error } = await this.db.rpc("fn_pai_credito_aplicar_cambio", {
      p_expediente_id: expedienteId,
      p_cambios: {},
      p_item: {
        id: itemId,
        state,
        // Undoing a mark clears the date: the document is pending again.
        received_date: state === "recibido" ? new Date().toISOString() : null,
      },
      p_evento: toEvent(event),
    });
    if (error) throw new RepoError(message(error, "No se pudo marcar el documento"), error);
  }

  async addItem(expedienteId: Id, item: NewChecklistItem, event: EventInput): Promise<Id> {
    const { data, error } = await this.db.rpc("fn_pai_credito_agregar_documento", {
      p_expediente_id: expedienteId,
      p_item: {
        document_key: item.documentKey,
        name: item.name,
        condition: item.condition,
        is_required: item.isRequired,
      },
      p_evento: toEvent(event),
    });
    if (error) throw new RepoError(message(error, "No se pudo agregar el documento"), error);
    return data as string;
  }
}

// ---------------------------------------------------------------------------

function toReservation(r: ReservaRow): Reservation {
  return {
    id: r.reservation_id,
    projectId: r.project_id,
    projectName: r.project_name,
    unitId: r.unit_id,
    unitNumber: r.unit_number,
    towerName: r.tower_name,
    cliente: r.cliente,
    confirmed: r.confirmada,
  };
}

function toExpediente(r: ExpedienteFullRow): Expediente {
  return {
    id: r.id,
    reservationId: r.reservation_id,
    unitId: r.unit_id,
    companyId: r.company_id,
    creditType: r.credit_type,
    creditSubtype: r.credit_subtype,
    state: r.state,
    cumplimientoCategoria: r.cumplimiento_categoria,
    desistidoReason: r.desistido_reason,
    active: r.active,
  };
}

/** Only the keys the caller actually set: the function leaves the rest alone. */
function toChange(change: ExpedienteChange): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (change.state !== undefined) out.state = change.state;
  if (change.desistidoReason !== undefined) out.desistido_reason = change.desistidoReason;
  if (change.cumplimientoCategoria !== undefined) {
    out.cumplimiento_categoria = change.cumplimientoCategoria;
  }
  if (change.active !== undefined) out.active = change.active;
  if (change.deletedDate !== undefined) out.deleted_date = change.deletedDate;
  if (change.deletedById !== undefined) out.deleted_by_id = change.deletedById;
  return out;
}

function toEvent(event: EventInput): Record<string, unknown> {
  return {
    action: event.action,
    actor_id: event.actorId,
    from_state: event.fromState ?? null,
    to_state: event.toState ?? null,
    desistido_reason: event.desistidoReason ?? null,
    detail: event.detail ?? null,
    note: event.note ?? null,
  };
}

/** The database's own Spanish message when it has one — it is written for a person. */
function message(error: { message?: string }, fallback: string): string {
  return error.message?.trim() ? error.message : fallback;
}

/** PostgREST's filter syntax is comma-separated; a raw search term must not break it. */
function sanitize(search?: string): string | null {
  const term = (search ?? "").replace(/[,()%*\\]/g, " ").trim();
  return term.length >= 2 ? term : null;
}
