/**
 * Entregas domain types — cronograma de escrituración y entrega de unidades.
 *
 * Mirrors migration 071. Two milestones (ESCRITURA, LLAVES) are scheduled
 * independently per unit; the expediente (`entregas`) holds what belongs to
 * the sale rather than to a single appointment.
 */

export type EntregaMilestone = "ESCRITURA" | "LLAVES";

export type EntregaEstado = "PROGRAMADA" | "CONFIRMADA" | "COMPLETADA" | "CANCELADA";

export type EntregaTipoPago = "FHA" | "CREDITO_DIRECTO" | "CONTADO";

/** One row of `v_entregas_full` — a single cita with unit, project and titular resolved. */
export interface EntregaCitaFull {
  cita_id: string;
  milestone: EntregaMilestone;
  /** ISO date, YYYY-MM-DD. */
  fecha: string;
  /** 24h time, HH:MM:SS as returned by Postgres. */
  hora: string;
  estado: EntregaEstado;
  reprogramaciones: number;
  completada_at: string | null;
  cancelada_motivo: string | null;
  cita_notas: string | null;
  cita_updated_at: string;
  entrega_id: string;
  tipo_pago: EntregaTipoPago | null;
  banco: string | null;
  entrega_notas: string | null;
  unit_id: string;
  unit_number: string;
  unit_code: string | null;
  unit_status: string;
  tower_name: string | null;
  project_id: string;
  project_slug: string;
  project_name: string;
  reservation_id: string;
  cliente: string | null;
  cliente_phone: string | null;
  titulares_count: number;
}

/**
 * A unit that can receive an entrega: sold, with a confirmed reservation,
 * and not yet in the cronograma for the milestone being scheduled.
 */
export interface EntregaCandidato {
  unit_id: string;
  unit_number: string;
  unit_code: string | null;
  tower_name: string | null;
  project_id: string;
  reservation_id: string;
  cliente: string | null;
  /** Existing expediente, if the unit already has one milestone scheduled. */
  entrega_id: string | null;
  tipo_pago: EntregaTipoPago | null;
  banco: string | null;
  /** Milestones already scheduled for this unit. */
  milestones_agendados: EntregaMilestone[];
  /**
   * Suggestion from the Pipedrive créditos snapshot (boundary 2026-08-05).
   * Never authoritative — Torre de Control confirms or overrides it.
   */
  sugerencia: {
    tipo_pago: EntregaTipoPago | null;
    banco: string | null;
  } | null;
}
