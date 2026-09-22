/**
 * The only door to the module's data (SDD v5 §6.5).
 *
 * The domain service talks to this interface and nothing else, so the same rules run
 * whichever database is underneath: today Supabase, and — where a customer runs Odoo
 * 19 — that instance's API. Exactly one implementation serves an installation.
 *
 * Two rules keep it portable:
 *   - a record id is opaque here; nothing assumes uuid or integer;
 *   - every write that changes something also writes its history event, in ONE
 *     transaction. That is why `createExpediente` and `applyChange` take the event.
 */
import type {
  ChecklistItemState,
  CreditSubtype,
  CreditType,
  CumplimientoCategoria,
  DesistidoReason,
  EventAction,
  ExpedienteState,
} from "./model.generated";

/** uuid in PAI APP mode; whatever the other backend uses elsewhere. */
export type Id = string;

/** The purchase an expediente is opened against. */
export interface Reservation {
  id: Id;
  /** What the person sees when choosing: project, tower, apartment, buyer. */
  projectId: Id;
  projectName: string;
  unitId: Id;
  unitNumber: string;
  towerName: string | null;
  cliente: string | null;
  /** A confirmed reservation means the PCV is signed and the first installment paid. */
  confirmed: boolean;
}

/** One row of the catalogue, ready to be copied into an expediente. */
export interface TemplateRow {
  documentKey: string;
  name: string;
  condition: string | null;
  isConditional: boolean;
  sequence: number;
}

export interface Expediente {
  id: Id;
  reservationId: Id;
  unitId: Id;
  companyId: Id;
  creditType: CreditType;
  creditSubtype: CreditSubtype;
  state: ExpedienteState;
  cumplimientoCategoria: CumplimientoCategoria | null;
  desistidoReason: DesistidoReason | null;
  active: boolean;
}

export interface ChecklistItem {
  id: Id;
  documentKey: string;
  name: string;
  condition: string | null;
  isConditional: boolean;
  isRequired: boolean;
  isExtra: boolean;
  sequence: number;
  state: ChecklistItemState;
  receivedDate: string | null;
}

export interface HistoryEntry {
  id: Id;
  action: EventAction;
  fromState: ExpedienteState | null;
  toState: ExpedienteState | null;
  desistidoReason: DesistidoReason | null;
  detail: Record<string, unknown> | null;
  note: string | null;
  actorId: Id;
  createdAt: string;
}

/** What the service asks the repository to write. Never the credit type: it is set once. */
export interface ExpedienteChange {
  state?: ExpedienteState;
  desistidoReason?: DesistidoReason | null;
  cumplimientoCategoria?: CumplimientoCategoria | null;
  active?: boolean;
  deletedDate?: string | null;
  deletedById?: Id | null;
}

export interface EventInput {
  action: EventAction;
  actorId: Id;
  fromState?: ExpedienteState | null;
  toState?: ExpedienteState | null;
  desistidoReason?: DesistidoReason | null;
  detail?: Record<string, unknown> | null;
  note?: string | null;
}

export interface NewExpediente {
  reservationId: Id;
  unitId: Id;
  companyId: Id;
  creditType: CreditType;
  creditSubtype: CreditSubtype;
  cumplimientoCategoria?: CumplimientoCategoria | null;
}

/** A document added by hand to one expediente (SDD v5 §6.2). */
export interface NewChecklistItem {
  documentKey: string;
  name: string;
  condition: string | null;
  isRequired: boolean;
}

export interface ListFilter {
  companyId?: Id;
  state?: ExpedienteState;
  creditType?: CreditType;
  /** Deleted expedientes are hidden unless the team asks to see them. */
  includeDeleted?: boolean;
}

/** The expediente as the board lists it, with the purchase resolved for display. */
export interface ExpedienteSummary extends Expediente {
  projectName: string;
  unitNumber: string;
  towerName: string | null;
  cliente: string | null;
  createdAt: string;
}

/** Raised by a backend: a constraint, an access rule, a failed request. */
export class RepoError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "RepoError";
    this.cause = cause;
  }
}

export class ReservationConflictError extends RepoError {
  constructor(cause?: unknown) {
    super("Esa reserva ya tiene un expediente.", cause);
    this.name = "ReservationConflictError";
  }
}

export interface CreditoRepo {
  /** Confirmed reservations that do not already have an active expediente. */
  reservationsAvailable(search?: string): Promise<Reservation[]>;
  getReservation(id: Id): Promise<Reservation | null>;
  templatesFor(subtype: CreditSubtype): Promise<TemplateRow[]>;

  /** The expediente, its checklist copied from the catalogue, and its creation event. */
  createExpediente(values: NewExpediente, items: TemplateRow[], event: EventInput): Promise<Id>;

  list(filter: ListFilter): Promise<ExpedienteSummary[]>;
  /**
   * Reads the full view, so a screen that opens an expediente by its id alone can still
   * name the purchase — project, tower, unit and buyer — without a second call.
   */
  getExpediente(id: Id): Promise<ExpedienteSummary | null>;
  getChecklist(expedienteId: Id): Promise<ChecklistItem[]>;
  getHistory(expedienteId: Id): Promise<HistoryEntry[]>;

  /** A change and its event, together. */
  applyChange(id: Id, change: ExpedienteChange, event: EventInput): Promise<void>;
  /** A checklist mark and its event, together. */
  markItem(
    expedienteId: Id,
    itemId: Id,
    state: ChecklistItemState,
    event: EventInput,
  ): Promise<void>;
  /** A document added to this expediente alone, and its event. */
  addItem(expedienteId: Id, item: NewChecklistItem, event: EventInput): Promise<Id>;
}
