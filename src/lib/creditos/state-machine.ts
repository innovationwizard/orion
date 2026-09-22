/**
 * The Créditos process, as a map of legal moves. SDD v5 §8.2, in the order of the
 * team's own step catalogue: the apartment is delivered BEFORE the closing steps.
 *
 * This is the read-only mirror the client uses to decide which buttons to offer, and
 * the same map the domain service enforces. It is the only place the process order
 * lives in the app.
 */
import { EXPEDIENTE_STATE_VALUES, SUBTYPES_BY_TYPE } from "./model.generated";
import type { CreditType, ExpedienteState } from "./model.generated";

export { SUBTYPES_BY_TYPE };
export type { CreditType, ExpedienteState };

/** Nothing leaves these. */
export const TERMINAL: ReadonlySet<ExpedienteState> = new Set<ExpedienteState>(["archivado", "desistido"]);

/** Never typed by Créditos: it follows the keys appointment of Entregas (SDD v5 §8.6). */
export const DERIVED: ReadonlySet<ExpedienteState> = new Set<ExpedienteState>(["entregado"]);

type Edge = readonly [from: ExpedienteState, to: ExpedienteState];

const INTAKE: Edge[] = [["en_armado", "expediente_completo"]];

/** Contado never touches the bank: one internal review, then the team approves. */
const CONTADO: Edge[] = [
  ["expediente_completo", "autorizacion_contado"],
  ["autorizacion_contado", "aprobado"],
  ["aprobado", "en_escrituracion"],
];

/** Directo and FHA: the analysis loop has no cap on its turns. */
const CREDITO: Edge[] = [
  ["expediente_completo", "en_analisis"],
  ["en_analisis", "aprobado"],
  ["en_analisis", "suspendido"],
  ["suspendido", "en_reanalisis"],
  ["en_reanalisis", "aprobado"],
  ["en_reanalisis", "suspendido"],
  ["aprobado", "tecnico_validado"],
  ["tecnico_validado", "aprobacion_final"],
  ["aprobacion_final", "en_escrituracion"],
];

/** The shared tail, from the escritura on. Delivery sits in the middle of it. */
const TAIL: Edge[] = [
  ["en_escrituracion", "escrituracion_completada"],
  ["escrituracion_completada", "entregado"],
  ["entregado", "firma_completada"],
  ["firma_completada", "impuestos_pagados"],
  ["impuestos_pagados", "registrado_rgp"],
];

/** Contado has no bank money to release, so it files straight from the registry. */
const CONTADO_END: Edge[] = [["registrado_rgp", "archivado"]];
const CREDITO_END: Edge[] = [
  ["registrado_rgp", "desembolso_parcial"],
  ["desembolso_parcial", "liquidado"],
  ["liquidado", "archivado"],
];

const key = (from: ExpedienteState, to: ExpedienteState) => `${from}>${to}`;
const toSet = (edges: Edge[]) => new Set(edges.map(([from, to]) => key(from, to)));

const EDGES: Record<CreditType, ReadonlySet<string>> = {
  contado: toSet([...INTAKE, ...CONTADO, ...TAIL, ...CONTADO_END]),
  directo: toSet([...INTAKE, ...CREDITO, ...TAIL, ...CREDITO_END]),
  fha: toSet([...INTAKE, ...CREDITO, ...TAIL, ...CREDITO_END]),
};

/**
 * Desistido is reachable from any non-terminal state; everything else follows the map.
 * There are no backward moves: a mistaken advance is corrected with a note, or by
 * deleting the expediente and creating it again (SDD v5 §8.4).
 */
export function isLegalTransition(type: CreditType, from: ExpedienteState, to: ExpedienteState): boolean {
  if (TERMINAL.has(from)) return false;
  if (to === "desistido") return true;
  return EDGES[type].has(key(from, to));
}

/** What the detail screen may offer from here. `entregado` is never among them. */
export function nextStates(type: CreditType, from: ExpedienteState): ExpedienteState[] {
  return EXPEDIENTE_STATE_VALUES.filter(
    (to) => !DERIVED.has(to) && isLegalTransition(type, from, to),
  );
}

/** The last approval before the escritura — the gate Entregas waits on (SDD v5 §8.6). */
export function gateState(type: CreditType): ExpedienteState {
  return type === "contado" ? "aprobado" : "aprobacion_final";
}
