/**
 * The Créditos domain service — the one authority for the process rules (SDD v5 §6.5).
 *
 * It never knows which database is underneath: it talks to the repository interface.
 * The database keeps refusing what it can on its own beneath it (the subtype must
 * belong to its type, a reason exists only when desisted, one active expediente per
 * reservation, the history admits only inserts), and in PAI APP mode two triggers
 * mirror the rules that are procedural.
 *
 * Every rule below comes from the SDD. None of them is re-implemented in a route.
 */
import { SUBTYPES_BY_TYPE } from "./model.generated";
import type {
  ChecklistItemState,
  CreditSubtype,
  CreditType,
  CumplimientoCategoria,
  DesistidoReason,
  ExpedienteState,
} from "./model.generated";
import { DERIVED, TERMINAL, isLegalTransition } from "./state-machine";
import type {
  ChecklistItem,
  CreditoRepo,
  ExpedienteSummary,
  HistoryEntry,
  Id,
  ListFilter,
  NewChecklistItem,
  Reservation,
} from "./repo";

/** A business rule said no. Raised before anything reaches a database. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class CreditoService {
  constructor(private readonly repo: CreditoRepo) {}

  // -------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------

  /** The purchases a new expediente may be opened against. */
  reservationsAvailable(search?: string): Promise<Reservation[]> {
    return this.repo.reservationsAvailable(search);
  }

  list(filter: ListFilter = {}): Promise<ExpedienteSummary[]> {
    return this.repo.list(filter);
  }

  async detail(id: Id): Promise<{
    expediente: ExpedienteSummary;
    checklist: ChecklistItem[];
    history: HistoryEntry[];
  }> {
    const expediente = await this.mustExist(id);
    const [checklist, history] = await Promise.all([
      this.repo.getChecklist(id),
      this.repo.getHistory(id),
    ]);
    return { expediente, checklist, history };
  }

  /** What is missing before the expediente can be declared complete. */
  static pendientes(checklist: ChecklistItem[]): ChecklistItem[] {
    return checklist.filter((i) => i.isRequired && i.state === "pendiente");
  }

  // -------------------------------------------------------------------------
  // Creating
  // -------------------------------------------------------------------------

  /**
   * Opens an expediente on a confirmed reservation and copies the catalogue of its
   * subtype. The credit type is chosen here and never again (SDD v5 §8.4).
   */
  async crear(
    reservationId: Id,
    creditType: CreditType,
    creditSubtype: CreditSubtype,
    actorId: Id,
    cumplimientoCategoria: CumplimientoCategoria | null = null,
  ): Promise<Id> {
    if (!SUBTYPES_BY_TYPE[creditType]?.includes(creditSubtype)) {
      throw new DomainError(`El subtipo ${creditSubtype} no pertenece a ${creditType}`);
    }

    const reservation = await this.repo.getReservation(reservationId);
    if (!reservation) throw new DomainError("La reserva no existe");
    if (!reservation.confirmed) {
      throw new DomainError(
        "La reserva no está confirmada: sin PCV firmada y primer pago no hay expediente",
      );
    }

    const templates = await this.repo.templatesFor(creditSubtype);
    if (templates.length === 0) {
      throw new DomainError(`No hay checklist configurado para ${creditSubtype}`);
    }

    return this.repo.createExpediente(
      {
        reservationId: reservation.id,
        unitId: reservation.unitId,
        companyId: reservation.projectId,
        creditType,
        creditSubtype,
        cumplimientoCategoria,
      },
      templates,
      {
        action: "creacion",
        actorId,
        toState: "en_armado",
        detail: { credit_type: creditType, credit_subtype: creditSubtype },
      },
    );
  }

  // -------------------------------------------------------------------------
  // The checklist
  // -------------------------------------------------------------------------

  /**
   * Marks a document, or undoes a mark. Both are ordinary and both are recorded — but
   * only while the expediente is still *en armado*. Once it leaves that state (starting
   * with `expediente_completo`), the checklist is frozen: the records and their history
   * stay exactly as they are, and no further mark is accepted, in either direction
   * (decided 2026-09-21). A wrong mark discovered afterwards follows the same path as a
   * wrong credit type — delete the expediente and create it again (SDD v5 §8.5) — never
   * a correction against a closed checklist.
   */
  async marcar(
    expedienteId: Id,
    itemId: Id,
    state: ChecklistItemState,
    actorId: Id,
  ): Promise<void> {
    await this.mustBeEditable(expedienteId);
    const item = (await this.repo.getChecklist(expedienteId)).find((i) => i.id === itemId);
    if (!item) throw new DomainError("Ese documento no pertenece a este expediente");
    if (item.state === state) return;

    await this.repo.markItem(expedienteId, itemId, state, {
      action: "marca_checklist",
      actorId,
      detail: { document_key: item.documentKey, from: item.state, to: state },
    });
  }

  /**
   * Adds a document the catalogue does not list, for this case only (SDD v5 §6.2).
   * Same boundary as `marcar()`: only while the expediente is still *en armado*.
   */
  async agregarDocumento(
    expedienteId: Id,
    item: NewChecklistItem,
    actorId: Id,
  ): Promise<Id> {
    await this.mustBeEditable(expedienteId);
    const key = item.documentKey.trim();
    if (!key) throw new DomainError("El documento necesita una clave");
    if (!item.name.trim()) throw new DomainError("El documento necesita un nombre");

    const checklist = await this.repo.getChecklist(expedienteId);
    if (checklist.some((i) => i.documentKey === key)) {
      throw new DomainError("Ese documento ya está en el checklist del expediente");
    }

    return this.repo.addItem(
      expedienteId,
      { ...item, documentKey: key },
      {
        action: "marca_checklist",
        actorId,
        detail: { added: key, is_required: item.isRequired },
        note: null,
      },
    );
  }

  // -------------------------------------------------------------------------
  // Moving through the process
  // -------------------------------------------------------------------------

  async avanzar(
    expedienteId: Id,
    toState: ExpedienteState,
    actorId: Id,
    options: { reason?: DesistidoReason; note?: string } = {},
  ): Promise<void> {
    const expediente = await this.mustBeOpen(expedienteId);

    if (TERMINAL.has(expediente.state)) {
      throw new DomainError(`«${expediente.state}» es terminal: no admite más avances`);
    }
    if (DERIVED.has(toState)) {
      throw new DomainError(
        "«entregado» no se marca a mano: lo deriva la cita de llaves de Entregas",
      );
    }
    if (!isLegalTransition(expediente.creditType, expediente.state, toState)) {
      throw new DomainError(
        `No permitido en ${expediente.creditType}: ${expediente.state} → ${toState}`,
      );
    }
    if (toState === "desistido" && !options.reason) {
      throw new DomainError("Desistir exige un motivo");
    }
    if (toState !== "desistido" && options.reason) {
      throw new DomainError("El motivo solo acompaña a un desistimiento");
    }
    if (toState === "expediente_completo") {
      const pendientes = CreditoService.pendientes(await this.repo.getChecklist(expedienteId));
      if (pendientes.length > 0) {
        throw new DomainError(
          `Faltan ${pendientes.length} documentos obligatorios por recibir o marcar como no aplica`,
        );
      }
    }

    await this.repo.applyChange(
      expedienteId,
      { state: toState, ...(toState === "desistido" ? { desistidoReason: options.reason } : {}) },
      {
        action: "transicion",
        actorId,
        fromState: expediente.state,
        toState,
        desistidoReason: options.reason ?? null,
        note: options.note ?? null,
      },
    );
  }

  /**
   * Marks the unit as handed over. Called by Entregas when the keys appointment is
   * completed — never by a person in Créditos (SDD v5 §8.6). If the expediente is not
   * where delivery makes sense, it does not move and the appointment still closes.
   *
   * `origen` is recorded in the history so a delivery says where it came from. The lab's
   * temporary simulation (E06, local only) passes its own, so a simulated delivery can
   * never be mistaken for a real appointment.
   */
  async marcarEntregado(
    expedienteId: Id,
    actorId: Id,
    origen = "cita de llaves completada",
  ): Promise<boolean> {
    const expediente = await this.repo.getExpediente(expedienteId);
    if (!expediente || !expediente.active) return false;
    if (expediente.state !== "escrituracion_completada") return false;

    await this.repo.applyChange(
      expedienteId,
      { state: "entregado" },
      {
        action: "transicion",
        actorId,
        fromState: expediente.state,
        toState: "entregado",
        detail: { origen },
      },
    );
    return true;
  }

  // -------------------------------------------------------------------------
  // Notes, corrections, removal
  // -------------------------------------------------------------------------

  /** A free-text note that changes no state — for what the state machine cannot say. */
  async anotar(expedienteId: Id, note: string, actorId: Id): Promise<void> {
    await this.mustBeOpen(expedienteId);
    if (!note.trim()) throw new DomainError("La nota no puede ir vacía");
    await this.repo.applyChange(expedienteId, {}, { action: "nota", actorId, note: note.trim() });
  }

  /** The only editable field is the compliance category (SDD v5 §8.4). */
  async editarCumplimiento(
    expedienteId: Id,
    categoria: CumplimientoCategoria | null,
    actorId: Id,
  ): Promise<void> {
    const expediente = await this.mustBeOpen(expedienteId);
    if (expediente.cumplimientoCategoria === categoria) return;
    await this.repo.applyChange(
      expedienteId,
      { cumplimientoCategoria: categoria },
      {
        action: "edicion",
        actorId,
        detail: { cumplimiento_categoria: { from: expediente.cumplimientoCategoria, to: categoria } },
      },
    );
  }

  /**
   * Logical removal: the expediente leaves the usual views, its data and its history
   * stay, and its reservation is free again — which is what makes a wrong subtype
   * fixable (SDD v5 §8.5).
   */
  async eliminar(expedienteId: Id, actorId: Id): Promise<void> {
    await this.mustBeOpen(expedienteId);
    await this.repo.applyChange(
      expedienteId,
      { active: false, deletedDate: new Date().toISOString(), deletedById: actorId },
      { action: "eliminacion", actorId },
    );
  }

  // -------------------------------------------------------------------------

  private async mustExist(id: Id): Promise<ExpedienteSummary> {
    const expediente = await this.repo.getExpediente(id);
    if (!expediente) throw new DomainError("El expediente no existe");
    return expediente;
  }

  private async mustBeOpen(id: Id): Promise<ExpedienteSummary> {
    const expediente = await this.mustExist(id);
    if (!expediente.active) throw new DomainError("El expediente está eliminado");
    return expediente;
  }

  /** Open, and still in the one state whose checklist may be written to. */
  private async mustBeEditable(id: Id): Promise<ExpedienteSummary> {
    const expediente = await this.mustBeOpen(id);
    if (expediente.state !== "en_armado") {
      throw new DomainError(
        "El checklist ya no se puede modificar: el expediente dejó de estar en armado.",
      );
    }
    return expediente;
  }
}
