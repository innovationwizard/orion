"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useReservations } from "@/hooks/use-reservations";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import AdminStats from "./admin-stats";
import ReservationFilters from "./reservation-filters";
import ReservationTable from "./reservation-table";
import ReservationDetail from "./reservation-detail";

export default function ReservasAdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusFilter = searchParams.get("status") ?? "";
  const projectFilter = searchParams.get("project") ?? "";

  const { data, loading, refetch } = useReservations({
    status: statusFilter || undefined,
    project: projectFilter || undefined,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminUserId, setAdminUserId] = useState<string>("");

  // Get admin user ID from auth
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.id) setAdminUserId(d.user.id);
      })
      .catch(() => {});
  }, []);

  // Unique project names for filter dropdown
  const projects = useMemo(() => {
    const set = new Set(data.map((r) => r.project_name));
    return [...set].sort();
  }, [data]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const stableSetSelectedId = useCallback((id: string | null) => setSelectedId(id), []);
  useKeyboardShortcuts({ data, selectedId, setSelectedId: stableSetSelectedId });

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      {/* Navigation */}
      <nav className="flex flex-wrap gap-2 items-center text-[13px]">
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/">Dashboard</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/projects">Projects</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/desistimientos">Desistimientos</a>
        <span className="text-border select-none">|</span>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/disponibilidad">Disponibilidad</a>
        <a className="text-muted no-underline px-2.5 py-1.5 rounded-full border border-transparent transition-colors hover:text-text-primary hover:border-border hover:bg-[#f8fafc]" href="/admin/reservas">Reservas</a>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Reservas</h1>
        <p className="text-sm text-muted mt-1">Panel de administración</p>
      </div>

      {/* Stats */}
      <AdminStats data={data} />

      {/* Filters */}
      <ReservationFilters
        status={statusFilter}
        project={projectFilter}
        projects={projects}
        onStatusChange={(v) => updateParam("status", v)}
        onProjectChange={(v) => updateParam("project", v)}
      />

      {/* Table */}
      {loading ? (
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-border" />
            ))}
          </div>
        </div>
      ) : (
        <ReservationTable
          data={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* Keyboard hint */}
      <div className="text-xs text-muted flex gap-4">
        <span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">j</kbd>
          {" / "}
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">k</kbd>
          {" navegar"}
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-card text-[10px] font-mono">Esc</kbd>
          {" cerrar"}
        </span>
      </div>

      {/* Detail side panel */}
      {selectedId && adminUserId && (
        <ReservationDetail
          reservationId={selectedId}
          adminUserId={adminUserId}
          onClose={() => setSelectedId(null)}
          onActionComplete={() => {
            setSelectedId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
