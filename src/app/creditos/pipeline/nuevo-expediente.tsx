"use client";

import ExpedientesListado from "./expedientes-listado";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CUMPLIMIENTO_CATEGORIA_LABELS,
  CUMPLIMIENTO_CATEGORIA_VALUES,
  CHECKLIST_ITEM_STATE_LABELS,
  CHECKLIST_ITEM_STATE_VALUES,
  CREDIT_TYPE_LABELS,
  CREDIT_TYPE_VALUES,
  CREDIT_SUBTYPE_LABELS,
  EVENT_ACTION_LABELS,
  EXPEDIENTE_STATE_LABELS,
  SUBTYPES_BY_TYPE,
  type ChecklistItemState,
  type CreditType,
  type CreditSubtype,
  type ExpedienteState,
} from "@/lib/creditos/model.generated";
import { nextStates } from "@/lib/creditos/state-machine";
import { isLocalLab } from "@/lib/creditos/lab";

/** TEMPORARY (E06): the simulated delivery exists only when this build points at the local lab. */
const LAB = isLocalLab(process.env.NEXT_PUBLIC_SUPABASE_URL);
import type { ChecklistItem, ExpedienteSummary, HistoryEntry, Reservation } from "@/lib/creditos/repo";

const buttonClass = "rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/** Project · tower · apartment · buyer — the same four facts, wherever they come from. */
function compraLabel(compra: {
  projectName: string;
  towerName: string | null;
  unitNumber: string;
  cliente: string | null;
}) {
  return [compra.projectName, compra.towerName, compra.unitNumber, compra.cliente]
    .filter(Boolean).join(" · ");
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "No se pudo completar la operación. Intente de nuevo.");
  }
  if (!body) throw new Error("No se pudo leer la respuesta. Intente de nuevo.");
  return body as T;
}

interface Detail {
  expediente: ExpedienteSummary;
  checklist: ChecklistItem[];
  history: HistoryEntry[];
}

/** What still stands between this expediente and «Expediente completo» (SDD v5 §8.4). */
function pendientesObligatorios(checklist: ChecklistItem[]) {
  return checklist.filter((item) => item.isRequired && item.state === "pendiente");
}

function NuevoExpedienteForm({ onCancel, onCreated }: {
  onCancel: () => void;
  onCreated: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [creditType, setCreditType] = useState<CreditType | "">("");
  const [subtype, setSubtype] = useState<CreditSubtype | "">("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => { searchInput.current?.focus(); }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError(null);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/creditos/reservas-disponibles?search=${encodeURIComponent(search.trim())}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await readResponse<{ reservas: Reservation[] }>(response);
        if (!controller.signal.aborted) setReservas(data.reservas);
      } catch (error) {
        if (!controller.signal.aborted) {
          setListError(error instanceof Error && !(error instanceof TypeError) ? error.message : "No se pudieron leer las reservas.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, revision]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !selected || !creditType || !subtype) return;
    submitting.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/creditos/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: selected.id, credit_type: creditType, credit_subtype: subtype }),
      });
      if (response.status === 409) {
        setSelected(null);
        setLoading(true);
        setRevision((value) => value + 1);
      }
      const data = await readResponse<{ id: string }>(response);
      onCreated(data.id);
    } catch (error) {
      setSaveError(error instanceof Error && !(error instanceof TypeError) ? error.message : "No se pudo crear el expediente. Intente de nuevo.");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} aria-labelledby="nuevo-expediente-title" aria-busy={saving}
      className="rounded-xl border border-border p-4 sm:p-6 grid gap-6">
      <h3 id="nuevo-expediente-title" className="text-lg font-semibold text-text-primary">Nuevo Expediente</h3>
      <fieldset disabled={saving} className="grid gap-3 min-w-0">
        <legend className="text-sm font-medium text-text-primary mb-3">1 · La compra</legend>
        <label className="sr-only" htmlFor="buscar-compra">Buscar apartamento, cliente o proyecto</label>
        <input ref={searchInput} id="buscar-compra" type="search" maxLength={200} value={search}
          onChange={(event) => { setLoading(true); setSearch(event.target.value); }}
          placeholder="Buscar apartamento, cliente o proyecto…"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary" />
        {selected ? <p className="text-sm text-text-primary">Compra seleccionada: {compraLabel(selected)}</p> : null}
        <div aria-live="polite" aria-busy={loading} className="text-sm text-muted">
          {loading ? <p>Cargando compras…</p> : listError ? (
            <div role="alert" className="flex flex-wrap items-center gap-3">
              <p className="text-danger">{listError}</p>
              <button type="button" className={buttonClass} onClick={() => setRevision((value) => value + 1)}>Reintentar</button>
            </div>
          ) : reservas.length === 0 ? (
            <p>{search.trim() ? `Ninguna compra coincide con «${search.trim()}».` : "No hay compras confirmadas pendientes de expediente."}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto grid gap-2">
              {reservas.map((reservation) => (
                <label key={reservation.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-3 text-text-primary cursor-pointer has-[:checked]:border-primary">
                  <input type="radio" name="compra" value={reservation.id} checked={selected?.id === reservation.id}
                    onChange={() => { setSelected(reservation); setSaveError(null); }} className="mt-0.5 accent-primary" />
                  <span>{compraLabel(reservation)}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset disabled={saving} className="min-w-0">
        <legend className="text-sm font-medium text-text-primary mb-3">2 · Tipo de crédito</legend>
        <div className="flex flex-wrap gap-3">
          {CREDIT_TYPE_VALUES.map((type) => (
            <label key={type} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-text-primary cursor-pointer has-[:checked]:border-primary">
              <input type="radio" name="tipo-credito" value={type} checked={creditType === type}
                onChange={() => { setCreditType(type); setSubtype(""); }} className="accent-primary" />
              {CREDIT_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset disabled={saving || !creditType} className="grid gap-2 min-w-0">
        <legend className="text-sm font-medium text-text-primary mb-3">3 · Subtipo</legend>
        {creditType ? SUBTYPES_BY_TYPE[creditType].map((value) => (
          <label key={value} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer py-1">
            <input type="radio" name="subtipo" value={value} checked={subtype === value}
              onChange={() => setSubtype(value)} className="accent-primary" />
            {CREDIT_SUBTYPE_LABELS[value]}
          </label>
        )) : <p className="text-sm text-muted">Seleccione primero el tipo de crédito.</p>}
      </fieldset>

      <p id="tipo-inmutable" className="rounded-lg border border-border bg-primary/5 p-3 text-sm text-text-primary">
        El tipo y el subtipo no se pueden cambiar después. Si se equivoca, habrá que eliminar el expediente y crearlo de nuevo.
      </p>
      {saveError ? <p role="alert" className="text-sm text-danger">{saveError}</p> : null}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={saving} onClick={onCancel} className={buttonClass}>Cancelar</button>
        <button type="submit" disabled={saving || !selected || !creditType || !subtype}
          aria-describedby="tipo-inmutable" className={`${buttonClass} bg-primary text-white`}>
          {saving ? "Creando expediente…" : "Crear expediente"}
        </button>
      </div>
    </form>
  );
}

/** The one-line form for a document the catalogue does not list (SDD v5 §6.2). */
function AgregarDocumento({ expedienteId, onAdded }: {
  expedienteId: string;
  onAdded: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [required, setRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) nameInput.current?.focus(); }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/creditos/expedientes/${encodeURIComponent(expedienteId)}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), is_required: required }),
      });
      await readResponse<{ id: string }>(response);
      setName("");
      setRequired(true);
      setOpen(false);
      await onAdded();
    } catch (reason) {
      setError(reason instanceof Error && !(reason instanceof TypeError) ? reason.message : "No se pudo agregar el documento.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={`${buttonClass} justify-self-start`} onClick={() => setOpen(true)}>
        Agregar documento
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-border p-3">
      <label className="grid gap-1 text-sm">
        <span className="text-text-primary">Documento que pidió el banco</span>
        <input ref={nameInput} type="text" maxLength={200} value={name} disabled={saving}
          onChange={(event) => setName(event.target.value)}
          placeholder="Por ejemplo: Carta de autorización del empleador"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary" />
      </label>
      <label className="flex items-center gap-2 text-sm text-text-primary">
        <input type="checkbox" checked={required} disabled={saving}
          onChange={(event) => setRequired(event.target.checked)} className="accent-primary" />
        Obligatorio para este caso
      </label>
      <p className="text-xs text-muted">
        Si es obligatorio, el expediente no podrá declararse completo hasta recibirlo o marcarlo como no aplica.
      </p>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" disabled={saving} className={buttonClass}
          onClick={() => { setOpen(false); setError(null); setName(""); }}>Cancelar</button>
        <button type="submit" disabled={saving || !name.trim()} className={`${buttonClass} bg-primary text-white`}>
          {saving ? "Agregando…" : "Agregar"}
        </button>
      </div>
    </form>
  );
}

function CumplimientoEditor({ expediente, onSaved }: {
  expediente: ExpedienteSummary;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(expediente.cumplimientoCategoria ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/creditos/expedientes/${encodeURIComponent(expediente.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cumplimiento_categoria: value || null }),
      });
      await readResponse<{ ok: boolean }>(response);
      setMessage("Categoría guardada.");
      try { await onSaved(); } catch {
        setError("La categoría se guardó, pero no se pudo actualizar el detalle. Recargue para consultarlo.");
      }
    } catch {
      setError("No se pudo confirmar el guardado de la categoría. Recargue para consultar su valor actual.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-2 rounded-lg border border-border p-3">
      <label className="grid gap-1 text-sm text-text-primary">
        Categoría de Cumplimiento
        <select aria-label="Categoría de Cumplimiento" value={value} disabled={saving || !expediente.active}
          onChange={(e) => { setValue(e.target.value as typeof value); setMessage(null); setError(null); }}
          className="rounded-lg border border-border bg-card px-3 py-2">
          <option value="">Sin clasificar</option>
          {CUMPLIMIENTO_CATEGORIA_VALUES.map((category) =>
            <option key={category} value={category}>{CUMPLIMIENTO_CATEGORIA_LABELS[category]}</option>)}
        </select>
      </label>
      <p className="text-xs text-muted">Dato informativo de este expediente. No actualiza el módulo de Cumplimiento.</p>
      {expediente.active ? <button type="submit" className={`${buttonClass} justify-self-start`}
        disabled={saving || value === (expediente.cumplimientoCategoria ?? "")}>
        {saving ? "Guardando…" : "Guardar categoría"}
      </button> : null}
      {message ? <p role="status" className="text-sm text-success">{message}</p> : null}
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </form>
  );
}

function ExpedienteDetalle({ expedienteId, justCreated }: {
  expedienteId: string;
  justCreated: boolean;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  /** The advance awaiting confirmation. Nothing is written until it is confirmed. */
  const [confirmando, setConfirmando] = useState<ExpedienteState | null>(null);
  const [revision, setRevision] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => { heading.current?.focus(); setConfirmando(null); }, [expedienteId]);

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`/api/creditos/expedientes/${encodeURIComponent(expedienteId)}`, {
      signal, cache: "no-store",
    });
    const data = await readResponse<Detail>(response);
    if (!signal?.aborted) setDetail(data);
  }, [expedienteId]);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    load(controller.signal).catch((reason: unknown) => {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error && !(reason instanceof TypeError) ? reason.message : "No se pudo leer el expediente.");
      }
    });
    return () => controller.abort();
  }, [load, revision]);

  /** The server is the authority: every change is followed by a fresh read. */
  async function marcar(item: ChecklistItem, state: ChecklistItemState) {
    if (savingItem || item.state === state) return;
    setSavingItem(item.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      const response = await fetch(
        `/api/creditos/expedientes/${encodeURIComponent(expedienteId)}/checklist/${encodeURIComponent(item.id)}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state }) },
      );
      await readResponse<{ ok: boolean }>(response);
      setActionSuccess("Cambio guardado.");
      await load();
    } catch (reason) {
      setActionError(reason instanceof Error && !(reason instanceof TypeError) ? reason.message : "No se pudo guardar la marca.");
      await load().catch(() => {});
    } finally {
      setSavingItem(null);
    }
  }

  /**
   * One path for every advance. The screen only offers what `nextStates()` allows, but
   * the answer that counts is the service's: a refused transition leaves the expediente
   * exactly as it was, and the re-read proves it rather than assuming it.
   */
  async function avanzar(toState: ExpedienteState, fallback: string) {
    if (completing) return;
    setCompleting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const base = `/api/creditos/expedientes/${encodeURIComponent(expedienteId)}`;
      // TEMPORARY (E06): `entregado` is never an ordinary advance; in the lab it goes to the simulation.
      const response = toState === "entregado"
        ? await fetch(`${base}/entregado-simulado`, { method: "POST" })
        : await fetch(`${base}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to_state: toState }),
        });
      await readResponse<{ ok: boolean }>(response);
      setActionSuccess("Cambio guardado.");
      setConfirmando(null);
      await load();
    } catch (reason) {
      setActionError(reason instanceof Error && !(reason instanceof TypeError) ? reason.message : fallback);
      await load().catch(() => {});
    } finally {
      setCompleting(false);
    }
  }

  async function declararCompleto() {
    await avanzar("expediente_completo", "No se pudo declarar el expediente completo.");
  }

  if (error) {
    return (
      <section className="grid gap-3 justify-items-start rounded-xl border border-border p-4 sm:p-6">
        <h3 tabIndex={-1} ref={heading} className="text-lg font-semibold text-text-primary">Expediente</h3>
        <p role="alert" className="text-sm text-danger">{error}</p>
        <button type="button" className={buttonClass} onClick={() => setRevision((value) => value + 1)}>Reintentar</button>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="rounded-xl border border-border p-4 sm:p-6">
        <h3 tabIndex={-1} ref={heading} className="text-lg font-semibold text-text-primary">Expediente</h3>
        <p role="status" className="text-sm text-muted mt-2">Cargando expediente…</p>
      </section>
    );
  }

  const { expediente, checklist } = detail;
  const pendientes = pendientesObligatorios(checklist);
  const enArmado = expediente.active && expediente.state === "en_armado";
  const avances: ExpedienteState[] = expediente.active && !enArmado
    ? nextStates(expediente.creditType, expediente.state).filter((to) => to !== "desistido")
    : [];
  // TEMPORARY (E06): stands in for the Entregas keys appointment, local lab only.
  if (LAB && expediente.active && expediente.state === "escrituracion_completada") avances.push("entregado");

  return (
    <section aria-labelledby="expediente-title" className="grid gap-4 rounded-xl border border-border p-4 sm:p-6">
      <h3 ref={heading} tabIndex={-1} id="expediente-title" className="text-lg font-semibold text-text-primary">
        {justCreated ? "Expediente creado" : "Expediente"}
      </h3>
      {justCreated ? (
        <p role="status" className="text-sm text-text-primary">Expediente creado. Su checklist está disponible.</p>
      ) : null}
      <p className="text-sm text-text-primary">{compraLabel(expediente)}</p>
      {!expediente.active ? <p className="text-sm text-muted">Expediente eliminado · Solo consulta.</p> : null}

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-muted">Estado</dt><dd className="font-medium text-text-primary">{EXPEDIENTE_STATE_LABELS[expediente.state]}</dd></div>
        <div><dt className="text-muted">Tipo de crédito</dt><dd className="text-text-primary">{CREDIT_TYPE_LABELS[expediente.creditType]}</dd></div>
        <div><dt className="text-muted">Subtipo</dt><dd className="text-text-primary">{CREDIT_SUBTYPE_LABELS[expediente.creditSubtype]}</dd></div>
      </dl>

      <CumplimientoEditor expediente={expediente} onSaved={() => load()} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-medium text-text-primary">Checklist · {checklist.length} documentos</h4>
        <p aria-live="polite" className={`text-sm ${pendientes.length === 0 ? "text-success" : "text-muted"}`}>
          {pendientes.length === 0
            ? "Todos los documentos obligatorios están listos."
            : `Faltan ${pendientes.length} ${pendientes.length === 1 ? "documento obligatorio" : "documentos obligatorios"}.`}
        </p>
      </div>

      {!enArmado ? (
        <p className="rounded-lg border border-border bg-primary/5 p-3 text-sm text-text-primary">
          El checklist quedó fijo: el expediente {expediente.active ? `está en «${EXPEDIENTE_STATE_LABELS[expediente.state]}»` : "está eliminado"} y ya no
          admite marcas ni documentos nuevos. Los registros y su historial se conservan.
        </p>
      ) : null}
      {actionSuccess ? <p role="status" className="text-sm text-success">{actionSuccess}</p> : null}
      {savingItem ? <p role="status" className="text-sm text-muted">Guardando documento…</p> : null}
      {actionError ? <p role="alert" className="text-sm text-danger">{actionError}</p> : null}

      <ul className="divide-y divide-border">
        {checklist.map((item) => (
          <li key={item.id} className="grid gap-3 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <p className="text-text-primary">{item.name}</p>
              {item.condition ? <p className="text-muted mt-1">{item.condition}</p> : null}
              <p className="text-xs text-muted mt-1">
                {item.isRequired ? "Obligatorio" : "Condicional"}
                {item.isExtra ? " · agregado a mano" : ""}
              </p>
            </div>
            <fieldset disabled={savingItem !== null || !enArmado} className="flex flex-wrap gap-2 sm:justify-end">
              <legend className="sr-only">Estado de {item.name}</legend>
              {CHECKLIST_ITEM_STATE_VALUES.map((state) => (
                <label key={state}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-text-primary cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/[0.08] has-[:checked]:font-semibold has-[:disabled]:cursor-not-allowed">
                  <input type="radio" name={`estado-${item.id}`} value={state} checked={item.state === state}
                    onChange={() => void marcar(item, state)} className="sr-only" />
                  {CHECKLIST_ITEM_STATE_LABELS[state]}
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ul>

      {enArmado ? <AgregarDocumento expedienteId={expedienteId} onAdded={async () => { await load(); }} /> : null}

      <div className="border-t border-border pt-4 grid gap-2">
        <h4 className="text-sm font-medium text-text-primary">Historial · {detail.history.length}</h4>
        <ul className="grid gap-2 text-sm">
          {detail.history.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-muted">
              <span className="text-text-primary">{EVENT_ACTION_LABELS[entry.action]}</span>
              {entry.fromState && entry.toState ? (
                <span>
                  {EXPEDIENTE_STATE_LABELS[entry.fromState]} → {EXPEDIENTE_STATE_LABELS[entry.toState]}
                </span>
              ) : null}
              {entry.note ? <span>· {entry.note}</span> : null}
              <span className="tabular-nums text-xs">
                {new Date(entry.createdAt).toLocaleString("es-GT")}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {enArmado ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <button type="button" onClick={() => void declararCompleto()}
            disabled={completing || pendientes.length > 0}
            className={`${buttonClass} bg-primary text-white`}>
            {completing ? "Declarando…" : "Declarar expediente completo"}
          </button>
        </div>
      ) : null}

      {avances.length > 0 ? (
        <div className="grid gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            {expediente.creditType === "contado"
              ? "Venta al contado: la revisión es interna y no pasa por Banco ni FHA."
              : "El análisis de Banco y FHA se lleva como un solo estado."}
          </p>
          {confirmando ? (
            <div role="alertdialog" aria-labelledby="confirmar-avance"
              className="grid gap-3 rounded-lg border border-border p-3 sm:p-4">
              <p id="confirmar-avance" className="text-sm text-text-primary">
                {confirmando === "entregado"
                  ? "¿Simular la entrega? Solo laboratorio: queda en el historial como simulación y no se puede revertir."
                  : `¿Registrar «${EXPEDIENTE_STATE_LABELS[confirmando]}»? Este avance no se puede revertir.`}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button type="button" disabled={completing} className={buttonClass}
                  onClick={() => setConfirmando(null)}>Cancelar</button>
                <button type="button" disabled={completing}
                  onClick={() => void avanzar(confirmando, "No se pudo registrar el avance.")}
                  className={`${buttonClass} bg-primary text-white`}>
                  {completing ? "Registrando…" : "Registrar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {avances.map((to) => (
                <button key={to} type="button" disabled={completing}
                  onClick={() => setConfirmando(to)}
                  className={`${buttonClass} bg-primary text-white`}>
                  {to === "entregado" ? "Simular entrega (laboratorio)" : EXPEDIENTE_STATE_LABELS[to]}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default function OperacionPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlExpediente = searchParams.get("expediente");

  const [open, setOpen] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (!open && restoreFocus.current) {
      restoreFocus.current = false;
      newButton.current?.focus();
    }
  }, [open]);

  /** The id lives in the URL, so a reload keeps showing the same expediente. */
  const setUrlExpediente = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "operacion");
    if (id) params.set("expediente", id);
    else params.delete("expediente");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <section className="bg-card rounded-2xl border border-border p-4 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-text-primary">Operación de expedientes</h2>
        <button ref={newButton} type="button" disabled={open}
          onClick={() => { setJustCreated(null); setUrlExpediente(null); setOpen(true); }}
          className={`${buttonClass} bg-primary text-white`}>Nuevo Expediente</button>
      </div>
      {open ? (
        <NuevoExpedienteForm
          onCancel={() => { restoreFocus.current = true; setOpen(false); }}
          onCreated={(id) => { setJustCreated(id); setUrlExpediente(id); setOpen(false); }}
        />
      ) : urlExpediente ? (
        <>
          <button type="button" className={`${buttonClass} justify-self-start`}
            onClick={() => { setJustCreated(null); setUrlExpediente(null); }}>Volver al listado</button>
          <ExpedienteDetalle key={urlExpediente} expedienteId={urlExpediente}
            justCreated={justCreated === urlExpediente} />
        </>
      ) : (
        <ExpedientesListado onOpen={(id) => { setJustCreated(null); setUrlExpediente(id); }} />
      )}
    </section>
  );
}
