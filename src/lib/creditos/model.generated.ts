/**
 * GENERADO por scripts/generate-spec.mjs desde spec/*.json. No editar a mano.
 *
 * Los mismos nombres, valores y obligatoriedades que la migración 073, para que
 * el modelo y los tipos no puedan separarse. Las etiquetas están en español
 * porque son lo que la gente lee en pantalla.
 */

/** Estado del documento */
export const CHECKLIST_ITEM_STATE_VALUES = ["pendiente", "recibido", "na"] as const;
export type ChecklistItemState = (typeof CHECKLIST_ITEM_STATE_VALUES)[number];
export const CHECKLIST_ITEM_STATE_LABELS: Record<ChecklistItemState, string> = {
  pendiente: "Pendiente",
  recibido: "Recibido",
  na: "No aplica",
};

/** Subtipo de crédito — Los ocho subtipos con checklist propio. Crédito Directo no tiene Extranjero: el banco no presta a quien no reside en el país. */
export const CREDIT_SUBTYPE_VALUES = ["contado_individual", "contado_juridica", "directo_negocio_propio", "directo_relacion_dependencia", "directo_servicios_profesionales", "fha_negocio_servicios", "fha_relacion_dependencia", "fha_extranjero"] as const;
export type CreditSubtype = (typeof CREDIT_SUBTYPE_VALUES)[number];
export const CREDIT_SUBTYPE_LABELS: Record<CreditSubtype, string> = {
  contado_individual: "Contado · Persona individual",
  contado_juridica: "Contado · Persona jurídica",
  directo_negocio_propio: "Directo · Negocio propio",
  directo_relacion_dependencia: "Directo · Relación de dependencia",
  directo_servicios_profesionales: "Directo · Servicios profesionales",
  fha_negocio_servicios: "FHA · Negocio propio / Servicios profesionales",
  fha_relacion_dependencia: "FHA · Relación de dependencia",
  fha_extranjero: "FHA · Guatemalteco en el extranjero",
};

/** Tipo de crédito */
export const CREDIT_TYPE_VALUES = ["contado", "directo", "fha"] as const;
export type CreditType = (typeof CREDIT_TYPE_VALUES)[number];
export const CREDIT_TYPE_LABELS: Record<CreditType, string> = {
  contado: "Contado",
  directo: "Crédito directo",
  fha: "FHA",
};

/** Categoría de cumplimiento — Espejo manual de Cumplimiento. Este módulo no escribe ni dispara nada en ese proceso. */
export const CUMPLIMIENTO_CATEGORIA_VALUES = ["normal", "pep", "cpe"] as const;
export type CumplimientoCategoria = (typeof CUMPLIMIENTO_CATEGORIA_VALUES)[number];
export const CUMPLIMIENTO_CATEGORIA_LABELS: Record<CumplimientoCategoria, string> = {
  normal: "Normal",
  pep: "PEP",
  cpe: "CPE",
};

/** Motivo de desistimiento — Cinco motivos, sin uno nuevo para el cambio de tipo de compra: ese caso se registra como «el equipo desiste» con una nota. */
export const DESISTIDO_REASON_VALUES = ["cliente_no_interesado", "cliente_no_puede_pagar", "cliente_sin_respuesta", "equipo_desiste", "banco_rechazo_definitivo"] as const;
export type DesistidoReason = (typeof DESISTIDO_REASON_VALUES)[number];
export const DESISTIDO_REASON_LABELS: Record<DesistidoReason, string> = {
  cliente_no_interesado: "El cliente ya no está interesado",
  cliente_no_puede_pagar: "El cliente no puede pagar",
  cliente_sin_respuesta: "El cliente no responde",
  equipo_desiste: "El equipo desiste",
  banco_rechazo_definitivo: "Rechazo definitivo del banco",
};

/** Acción — Qué ocurrió. La nota no cambia el estado; la edición solo alcanza a la categoría de cumplimiento; la eliminación es lógica. */
export const EVENT_ACTION_VALUES = ["creacion", "transicion", "marca_checklist", "edicion", "nota", "eliminacion"] as const;
export type EventAction = (typeof EVENT_ACTION_VALUES)[number];
export const EVENT_ACTION_LABELS: Record<EventAction, string> = {
  creacion: "Creación",
  transicion: "Transición",
  marca_checklist: "Marca de checklist",
  edicion: "Edición",
  nota: "Nota",
  eliminacion: "Eliminación",
};

/** Estado del expediente — Los 19 estados, en el orden real del proceso. Autorización de contado es solo de Contado; análisis, suspensión, reanálisis, expediente técnico, aprobación final, desembolso y liquidación son solo de Directo y FHA. Archivado y desistido son terminales. */
export const EXPEDIENTE_STATE_VALUES = ["en_armado", "expediente_completo", "autorizacion_contado", "en_analisis", "suspendido", "en_reanalisis", "aprobado", "tecnico_validado", "aprobacion_final", "en_escrituracion", "escrituracion_completada", "entregado", "firma_completada", "impuestos_pagados", "registrado_rgp", "desembolso_parcial", "liquidado", "archivado", "desistido"] as const;
export type ExpedienteState = (typeof EXPEDIENTE_STATE_VALUES)[number];
export const EXPEDIENTE_STATE_LABELS: Record<ExpedienteState, string> = {
  en_armado: "En armado",
  expediente_completo: "Expediente completo",
  autorizacion_contado: "Autorización de ventas al contado",
  en_analisis: "En análisis",
  suspendido: "Suspendido",
  en_reanalisis: "Re-análisis",
  aprobado: "Aprobado",
  tecnico_validado: "Expediente técnico",
  aprobacion_final: "Aprobación final",
  en_escrituracion: "Escrituración en proceso",
  escrituracion_completada: "Escrituración completada",
  entregado: "Entregado",
  firma_completada: "Recaudación de firmas",
  impuestos_pagados: "Pago de impuestos",
  registrado_rgp: "Ingreso al registro",
  desembolso_parcial: "Desembolso",
  liquidado: "Liquidación",
  archivado: "Archivado",
  desistido: "Desistido",
};

/** Qué subtipos pertenecen a cada tipo de crédito. De aquí sale la restricción que la base impone, de modo que los valores y la regla no puedan separarse. */
export const SUBTYPES_BY_TYPE: Record<CreditType, readonly CreditSubtype[]> = {
  contado: ["contado_individual", "contado_juridica"],
  directo: ["directo_negocio_propio", "directo_relacion_dependencia", "directo_servicios_profesionales"],
  fha: ["fha_negocio_servicios", "fha_relacion_dependencia", "fha_extranjero"],
};

/** Expediente de crédito — tabla pai_credito_expediente */
export interface PaiCreditoExpedienteRow {
  id: string;
  /** Reserva */
  reservation_id: string;
  /** Unidad */
  unit_id: string;
  /** Proyecto */
  company_id: string;
  /** Tipo de crédito */
  credit_type: CreditType;
  /** Subtipo de crédito */
  credit_subtype: CreditSubtype;
  /** Estado */
  state: ExpedienteState;
  /** Categoría de cumplimiento */
  cumplimiento_categoria: CumplimientoCategoria | null;
  /** Motivo de desistimiento */
  desistido_reason: DesistidoReason | null;
  active: boolean;
  deleted_date: string | null;
  deleted_by_id: string | null;
  create_uid: string | null;
  create_date: string;
  write_uid: string | null;
  write_date: string;
}

/** Documento del checklist — tabla pai_credito_checklist_item */
export interface PaiCreditoChecklistItemRow {
  id: string;
  /** Expediente */
  expediente_id: string;
  /** Proyecto */
  company_id: string | null;
  /** Clave del documento */
  document_key: string;
  /** Documento */
  name: string;
  /** Condición */
  condition: string | null;
  /** Condicional */
  is_conditional: boolean;
  /** Obligatorio para este caso */
  is_required: boolean;
  /** Agregado a mano */
  is_extra: boolean;
  /** Orden */
  sequence: number;
  /** Estado */
  state: ChecklistItemState;
  /** Recibido el */
  received_date: string | null;
  /** Marcado por */
  marked_by_id: string | null;
  create_uid: string | null;
  create_date: string;
  write_uid: string | null;
  write_date: string;
}

/** Plantilla de checklist — tabla pai_credito_checklist_template */
export interface PaiCreditoChecklistTemplateRow {
  id: string;
  /** Tipo de crédito */
  credit_type: CreditType;
  /** Subtipo de crédito */
  credit_subtype: CreditSubtype;
  /** Clave del documento */
  document_key: string;
  /** Documento */
  name: string;
  /** Condición */
  condition: string | null;
  /** Condicional */
  is_conditional: boolean;
  /** Orden */
  sequence: number;
  create_uid: string | null;
  create_date: string;
  write_uid: string | null;
  write_date: string;
}

/** Evento del historial — tabla pai_credito_expediente_evento */
export interface PaiCreditoExpedienteEventoRow {
  id: string;
  /** Expediente */
  expediente_id: string;
  /** Proyecto */
  company_id: string | null;
  /** Acción */
  action: EventAction;
  /** Estado anterior */
  from_state: ExpedienteState | null;
  /** Estado nuevo */
  to_state: ExpedienteState | null;
  /** Motivo de desistimiento */
  desistido_reason: DesistidoReason | null;
  /** Detalle */
  detail: Record<string, unknown> | null;
  /** Nota */
  note: string | null;
  /** Quién */
  actor_id: string;
  create_uid: string | null;
  create_date: string;
  write_uid: string | null;
  write_date: string;
}
