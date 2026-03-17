"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useReservations } from "@/hooks/use-reservations";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import AdminStats from "./admin-stats";
import ReservationFilters from "./reservation-filters";
import ReservationTable from "./reservation-table";
import ReservationDetail from "./reservation-detail";
import ActionConfirmDialog from "./action-confirm-dialog";
import NavBar from "@/components/nav-bar";

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
  const [userRole, setUserRole] = useState<string | null>(null);

  // Auto-approval toggle state
  const [autoApproval, setAutoApproval] = useState<boolean | null>(null);
  const [toggling, setToggling] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);

  // Get admin user ID from auth
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.id) {
          setAdminUserId(d.user.id);
          setUserRole(d.user.role ?? null);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch auto-approval setting
  useEffect(() => {
    fetch("/api/reservas/admin/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d != null) setAutoApproval(d.auto_approval_enabled);
      })
      .catch(() => {});
  }, []);

  const handleToggle = useCallback(async (enable: boolean) => {
    setToggling(true);
    try {
      const res = await fetch("/api/reservas/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_approval_enabled: enable }),
      });
      if (res.ok) {
        const result = await res.json();
        setAutoApproval(result.auto_approval_enabled);
      }
    } catch {
      // Silently fail — toggle stays in previous state
    } finally {
      setToggling(false);
      setShowActivateDialog(false);
    }
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
      <NavBar />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reservas</h1>
          <p className="text-sm text-muted mt-1">Panel de administración</p>
        </div>

        {/* Auto-approval toggle */}
        {autoApproval !== null && (
          <div className="flex items-center gap-2.5 shrink-0 mt-1">
            <button
              type="button"
              role="switch"
              aria-checked={autoApproval}
              disabled={toggling}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors disabled:opacity-40 ${
                autoApproval ? "bg-success" : "bg-border"
              }`}
              onClick={() => {
                if (autoApproval) {
                  // Turning OFF — apply immediately (safer default)
                  handleToggle(false);
                } else {
                  // Turning ON — show confirmation dialog
                  setShowActivateDialog(true);
                }
              }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  autoApproval ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-xs text-muted whitespace-nowrap">
              Autorización automática
              <span className={`ml-1 font-medium ${autoApproval ? "text-success" : ""}`}>
                {autoApproval ? "activa" : "inactiva"}
              </span>
            </span>
          </div>
        )}
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
          userRole={userRole}
          onClose={() => setSelectedId(null)}
          onActionComplete={() => {
            setSelectedId(null);
            refetch();
          }}
        />
      )}

      {/* Activation confirmation dialog */}
      {showActivateDialog && (
        <ActionConfirmDialog
          title="Activar autorización automática"
          description="Todas las reservas nuevas se confirmarán inmediatamente sin revisión manual. Esta función es un experimento y se puede desactivar en cualquier momento."
          confirmLabel="Activar"
          onConfirm={async () => {
            await handleToggle(true);
          }}
          onCancel={() => setShowActivateDialog(false)}
        />
      )}
    </div>
  );
}
