"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CREDIT_TYPE_LABELS, CREDIT_TYPE_VALUES,
  EXPEDIENTE_STATE_LABELS, EXPEDIENTE_STATE_VALUES,
} from "@/lib/creditos/model.generated";
import type { ExpedienteSummary } from "@/lib/creditos/repo";

const control = "rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary";

/** The live workspace owns its query keys; Resumen uses the historical ones. */
export default function ExpedientesListado({ onOpen }: { onOpen: (id: string) => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [navigating, startNavigation] = useTransition();
  const project = params.get("opProyecto") ?? "";
  const type = params.get("opTipo") ?? "";
  const state = params.get("opEstado") ?? "";
  const includeDeleted = params.get("opEliminados") === "true";
  const [rows, setRows] = useState<ExpedienteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  function change(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    startNavigation(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  function reset() {
    const next = new URLSearchParams(params.toString());
    for (const key of ["opProyecto", "opTipo", "opEstado", "opEliminados"]) next.delete(key);
    startNavigation(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await fetch(`/api/creditos/expedientes?include_deleted=${includeDeleted}`, {
          signal: controller.signal, cache: "no-store",
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "No se pudo leer el listado.");
        if (!controller.signal.aborted) setRows(body.expedientes);
      } catch (reason) {
        if (!controller.signal.aborted) setError(
          reason instanceof Error && reason.name !== "TypeError"
            ? reason.message : "No se pudo conectar. Intente de nuevo.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [includeDeleted, revision]);

  const projects = [...new Map(rows.map((row) => [row.companyId, row.projectName])).entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"));
  const base = rows.filter((row) => (!project || row.companyId === project) && (!type || row.creditType === type));
  const counts = new Map<string, number>();
  for (const row of base) counts.set(row.state, (counts.get(row.state) ?? 0) + 1);
  const filtered = base.filter((row) => !state || row.state === state);
  const knownState = EXPEDIENTE_STATE_VALUES.some((value) => value === state);
  const knownType = CREDIT_TYPE_VALUES.some((value) => value === type);

  return (
    <div className="grid gap-4">
      <fieldset disabled={navigating} aria-busy={navigating} className="flex flex-wrap items-end gap-3">
        <legend className="sr-only">Filtros de expedientes</legend>
        <label className="grid gap-1 text-sm text-text-primary">
          Proyecto
          <select aria-label="Proyecto" className={control} value={project} onChange={(e) => change("opProyecto", e.target.value)}>
            <option value="">Todos los proyectos</option>
            {project && !projects.some(([id]) => id === project) ? <option value={project}>Proyecto sin resultados</option> : null}
            {projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-text-primary">
          Tipo de crédito
          <select aria-label="Tipo de crédito" className={control} value={type} onChange={(e) => change("opTipo", e.target.value)}>
            <option value="">Todos los tipos</option>
            {type && !knownType ? <option value={type}>Tipo no válido</option> : null}
            {CREDIT_TYPE_VALUES.map((value) => <option key={value} value={value}>{CREDIT_TYPE_LABELS[value]}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm text-text-primary">
          Estado
          <select aria-label="Estado" className={control} value={state} onChange={(e) => change("opEstado", e.target.value)}>
            <option value="">Todos los estados</option>
            {state && !knownState ? <option value={state}>Estado no válido</option> : null}
            {EXPEDIENTE_STATE_VALUES.map((value) => <option key={value} value={value}>{EXPEDIENTE_STATE_LABELS[value]}</option>)}
          </select>
        </label>
        <button type="button" className={control} onClick={reset}>Limpiar filtros</button>
        <button type="button" className={control} disabled={loading} onClick={() => setRevision((n) => n + 1)}>Actualizar</button>
        <label className="flex items-center gap-2 text-sm text-text-primary py-2">
          <input type="checkbox" checked={includeDeleted} onChange={(e) => change("opEliminados", e.target.checked ? "true" : "")} />
          Ver eliminados
        </label>
      </fieldset>
      {loading ? <p role="status" className="text-sm text-muted">Cargando expedientes…</p> : error ? (
        <div role="alert" className="text-sm text-danger">
          <p>{error}</p>
          <button type="button" className={control} onClick={() => setRevision((n) => n + 1)}>Reintentar</button>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <h3 className="text-sm font-medium text-text-primary">Expedientes por estado</h3>
            <p className="text-xs text-muted">Conteos según proyecto y tipo de crédito. Pulse un estado para filtrar.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={navigating} aria-pressed={!state} className={`${control} ${!state ? "border-primary bg-primary/5" : ""}`}
                onClick={() => change("opEstado", "")}>Todos · {base.length}</button>
              {EXPEDIENTE_STATE_VALUES.map((value) => (
                <button key={value} type="button" disabled={navigating} aria-pressed={state === value}
                  className={`${control} ${state === value ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => change("opEstado", value)}>
                  {EXPEDIENTE_STATE_LABELS[value]} · {counts.get(value) ?? 0}
                </button>
              ))}
            </div>
          </div>
          <p role="status" className="text-sm text-muted">{filtered.length} expedientes</p>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted">{rows.length === 0
              ? "Todavía no hay expedientes para mostrar."
              : "No hay expedientes que coincidan con los filtros."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <caption className="sr-only">Listado de expedientes</caption>
                <thead className="text-muted border-b border-border">
                  <tr>{["Cliente", "Proyecto", "Torre / unidad", "Tipo de crédito", "Estado", "Detalle"].map((label) =>
                    <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-b border-border text-text-primary">
                      <td className="px-3 py-3">{row.cliente ?? "Sin cliente"}</td>
                      <td className="px-3 py-3">{row.projectName}</td>
                      <td className="px-3 py-3">{[row.towerName, row.unitNumber].filter(Boolean).join(" · ")}</td>
                      <td className="px-3 py-3">{CREDIT_TYPE_LABELS[row.creditType]}</td>
                      <td className="px-3 py-3">{EXPEDIENTE_STATE_LABELS[row.state]}{!row.active ? " · Eliminado" : ""}</td>
                      <td className="px-3 py-3">
                        <button type="button" disabled={navigating} className={control} onClick={() => onOpen(row.id)}
                          aria-label={`Abrir expediente de ${row.cliente ?? row.unitNumber}`}>Abrir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
