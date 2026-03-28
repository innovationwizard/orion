"use client";

import { useCallback, useEffect, useState } from "react";
import type { SyncRun } from "@/lib/sync/types";

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: "#22c55e",
  PARTIAL: "#f59e0b",
  FAILED: "#ef4444",
  RUNNING: "#3b82f6",
};

export function SyncClient() {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sync-status");
      if (res.ok) {
        const data = await res.json();
        setRuns(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/sync-status", { method: "POST" });
      if (res.ok) {
        await fetchRuns();
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  };

  const lastRun = runs[0];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Sincronización OneDrive</h1>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
        <button
          onClick={triggerSync}
          disabled={syncing}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 6,
            border: "none",
            background: syncing ? "#94a3b8" : "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            cursor: syncing ? "not-allowed" : "pointer",
          }}
        >
          {syncing ? "Sincronizando..." : "Sincronizar ahora"}
        </button>
      </div>

      {/* Last sync summary */}
      {lastRun && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}>
          <KpiCard label="Último estado" value={lastRun.status} color={STATUS_COLORS[lastRun.status] ?? "#6b7280"} />
          <KpiCard label="Archivos procesados" value={`${lastRun.files_processed}/${lastRun.files_checked}`} />
          <KpiCard label="Unidades actualizadas" value={String(lastRun.units_updated)} />
          <KpiCard label="Reservas creadas" value={String(lastRun.reservations_created)} />
          <KpiCard label="Errores" value={String(lastRun.errors?.length ?? 0)} color={lastRun.errors?.length ? "#ef4444" : undefined} />
        </div>
      )}

      {/* Sync history */}
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Historial de sincronizaciones</h2>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Cargando...</p>
      ) : runs.length === 0 ? (
        <p style={{ color: "#94a3b8" }}>No hay sincronizaciones registradas.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Fecha</th>
              <th style={{ padding: "0.5rem" }}>Estado</th>
              <th style={{ padding: "0.5rem" }}>Fuente</th>
              <th style={{ padding: "0.5rem" }}>Archivos</th>
              <th style={{ padding: "0.5rem" }}>Cambios</th>
              <th style={{ padding: "0.5rem" }}>Errores</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
              >
                <td style={{ padding: "0.5rem" }}>
                  {new Date(run.started_at).toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#fff",
                    background: STATUS_COLORS[run.status] ?? "#6b7280",
                  }}>
                    {run.status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>{run.trigger_source}</td>
                <td style={{ padding: "0.5rem" }}>{run.files_processed}/{run.files_checked}</td>
                <td style={{ padding: "0.5rem" }}>
                  {run.units_updated > 0 && `${run.units_updated}u `}
                  {run.reservations_created > 0 && `${run.reservations_created}r `}
                  {run.clients_created > 0 && `${run.clients_created}c`}
                  {run.units_updated === 0 && run.reservations_created === 0 && run.clients_created === 0 && "—"}
                </td>
                <td style={{ padding: "0.5rem", color: run.errors?.length ? "#ef4444" : "#94a3b8" }}>
                  {run.errors?.length ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Expanded detail */}
      {expanded && (() => {
        const run = runs.find((r) => r.id === expanded);
        if (!run) return null;
        return (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f8fafc",
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: "0.8rem",
          }}>
            <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Detalle: {run.id.slice(0, 8)}</h3>

            {run.file_results && run.file_results.length > 0 && (
              <>
                <h4 style={{ fontWeight: 600, marginTop: "0.75rem" }}>Archivos</h4>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {run.file_results.map((fr, i) => (
                    <li key={i} style={{ padding: "0.25rem 0", borderBottom: "1px solid #e2e8f0" }}>
                      <strong>{fr.fileName}</strong>
                      {fr.skipped
                        ? <span style={{ color: "#94a3b8" }}> — {fr.skipReason ?? "omitido"}</span>
                        : <span> — {fr.unitsUpdated}u, {fr.reservationsCreated}r ({fr.durationMs}ms)</span>}
                      {fr.errors?.length > 0 && (
                        <span style={{ color: "#ef4444" }}> [{fr.errors.length} errores]</span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {run.errors && run.errors.length > 0 && (
              <>
                <h4 style={{ fontWeight: 600, marginTop: "0.75rem", color: "#ef4444" }}>Errores</h4>
                <ul style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
                  {run.errors.map((e, i) => (
                    <li key={i} style={{ color: "#ef4444" }}>{e}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      padding: "0.75rem",
      borderRadius: 8,
      border: "1px solid #e2e8f0",
      background: "#fff",
    }}>
      <div style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color: color ?? "#1e293b", marginTop: "0.25rem" }}>{value}</div>
    </div>
  );
}
