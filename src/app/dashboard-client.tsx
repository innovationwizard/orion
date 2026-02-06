"use client";

import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Commission, Payment, Sale } from "@/lib/types";
import { supabaseBrowser } from "@/lib/supabase-browser";
import Filters from "@/components/filters";
import KpiCard from "@/components/kpi-card";
import Tabs from "@/components/tabs";
import DataTable from "@/components/data-table";

type DashboardData = {
  payments: Payment[];
  commissions: Commission[];
  sales: Sale[];
};

type SessionInfo = {
  email: string | null;
  is_superuser: boolean;
  role: string | null;
};

type ProjectOption = {
  id: string;
  name: string;
};

type PaymentWithContext = Payment & {
  unit_number?: string | null;
  client_name?: string | null;
};

type SaleWithContext = Sale & {
  project_name?: string | null;
  unit_number?: string | null;
  client_name?: string | null;
};

type CommissionWithContext = Commission & {
  payment_amount?: number | null;
  payment_date?: string | null;
  sale_date?: string | null;
  unit_id?: string | null;
  client_id?: string | null;
  phase_name?: string | null;
};

type TabKey = "payments" | "commissions" | "sales";

const currency = new Intl.NumberFormat("es-GT", {
  style: "currency",
  currency: "GTQ",
  maximumFractionDigits: 0
});

function formatPaymentType(type: string) {
  const map: Record<string, string> = {
    down_payment: "Enganche",
    reservation: "Reserva"
  };
  return map[type] ?? type;
}

export default function DashboardClient({
  initialData
}: {
  initialData: DashboardData;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>("payments");
  const [payments, setPayments] = useState<PaymentWithContext[]>(initialData.payments);
  const [commissions, setCommissions] = useState<CommissionWithContext[]>(
    initialData.commissions
  );
  const [sales, setSales] = useState<SaleWithContext[]>(initialData.sales);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);
  const [paidOverrides, setPaidOverrides] = useState<Record<string, boolean>>({});
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [expandedCommissionPaymentId, setExpandedCommissionPaymentId] = useState<
    string | null
  >(null);

  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const saleDialogRef = useRef<HTMLDialogElement>(null);
  const newSaleDialogRef = useRef<HTMLDialogElement>(null);
  const commissionDialogRef = useRef<HTMLDialogElement>(null);
  const adminDialogRef = useRef<HTMLDialogElement>(null);

  const projectId = searchParams.get("project_id") ?? "";
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";

  const pendingPayments = useMemo(() => {
    const downPaymentTotal = sales.reduce(
      (sum, sale) => sum + (sale.down_payment_amount ?? 0),
      0
    );
    const paidDownPayments = payments
      .filter((payment) => payment.payment_type === "down_payment")
      .reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, downPaymentTotal - paidDownPayments);
  }, [sales, payments]);

  const totalPayments = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments]
  );

  const totalCommissions = useMemo(
    () => commissions.reduce((sum, commission) => sum + commission.commission_amount, 0),
    [commissions]
  );

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/sales?distinct=project", {
          cache: "no-store"
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudieron cargar los proyectos.");
        }
        setProjects(payload.data ?? []);
      } catch {
        setProjects([]);
      }
    }

    fetchProjects();
  }, []);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          return;
        }
        setSessionInfo(payload.data ?? null);
      } catch {
        setSessionInfo(null);
      }
    }

    fetchSession();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (projectId) {
        query.set("project_id", projectId);
      }
      if (startDate) {
        query.set("start_date", startDate);
      }
      if (endDate) {
        query.set("end_date", endDate);
      }

      try {
        const [paymentsRes, commissionsRes, salesRes] = await Promise.all([
          fetch(`/api/payments?${query.toString()}`, { cache: "no-store" }),
          fetch(`/api/commissions?${query.toString()}`, { cache: "no-store" }),
          fetch(`/api/sales?${query.toString()}`, { cache: "no-store" })
        ]);

        const [paymentsPayload, commissionsPayload, salesPayload] = await Promise.all([
          paymentsRes.json(),
          commissionsRes.json(),
          salesRes.json()
        ]);

        if (!paymentsRes.ok || !commissionsRes.ok || !salesRes.ok) {
          const message =
            paymentsPayload?.error ||
            commissionsPayload?.error ||
            salesPayload?.error ||
            "No se pudieron cargar los datos del panel.";
          throw new Error(message);
        }

        setPayments(paymentsPayload.data ?? []);
        setCommissions(commissionsPayload.data ?? []);
        setSales(salesPayload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [projectId, startDate, endDate]);

  const paymentCommissions = useMemo(() => {
    return commissions.reduce<Record<string, CommissionWithContext[]>>(
      (acc, commission) => {
        const paymentId = commission.payment_id ?? "unassigned";
        if (!acc[paymentId]) {
          acc[paymentId] = [];
        }
        acc[paymentId].push(commission);
        return acc;
      },
      {}
    );
  }, [commissions]);

  const groupedCommissions = useMemo(() => {
    return Object.entries(paymentCommissions).map(([paymentId, items]) => ({
      paymentId,
      items,
        total: items.reduce((sum, item) => sum + item.commission_amount, 0)
    }));
  }, [paymentCommissions]);

  function updateFilters(next: { project_id?: string; start_date?: string; end_date?: string }) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (next.project_id !== undefined) {
      if (next.project_id) {
        nextParams.set("project_id", next.project_id);
      } else {
        nextParams.delete("project_id");
      }
    }

    if (next.start_date !== undefined) {
      if (next.start_date) {
        nextParams.set("start_date", next.start_date);
      } else {
        nextParams.delete("start_date");
      }
    }

    if (next.end_date !== undefined) {
      if (next.end_date) {
        nextParams.set("end_date", next.end_date);
      } else {
        nextParams.delete("end_date");
      }
    }

    router.replace(`?${nextParams.toString()}`);
  }

  function openPaymentModal(id: string) {
    setSelectedPaymentId(id);
    paymentDialogRef.current?.showModal();
  }

  function openSaleModal(id: string) {
    setSelectedSaleId(id);
    saleDialogRef.current?.showModal();
  }

  function openCommissionModal(id: string) {
    setSelectedCommissionId(id);
    commissionDialogRef.current?.showModal();
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabaseBrowser.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteStatus(null);
    setIsInviting(true);

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo enviar la invitación.");
      }
      setInviteStatus(`Invitación enviada a ${payload.data?.email ?? inviteEmail}.`);
      setInviteEmail("");
    } catch (err) {
      setInviteStatus(err instanceof Error ? err.message : "Error al enviar invitación.");
    } finally {
      setIsInviting(false);
    }
  }

  const selectedPayment = payments.find((payment) => payment.id === selectedPaymentId);
  const selectedSale = sales.find((sale) => sale.id === selectedSaleId);
  const selectedCommission = commissions.find((commission) => commission.id === selectedCommissionId);

  const selectedPaymentCommissions = selectedPayment
    ? commissions.filter((commission) => commission.payment_id === selectedPayment.id)
    : [];

  const selectedSalePayments = selectedSale
    ? payments.filter((payment) => payment.sale_id === selectedSale.id)
    : [];

  return (
    <section className="page">
      <header className="header">
        <h1>Seguimiento de Pagos y Comisiones</h1>
        <div className="header-actions">
          <Filters
            projects={projects}
            projectId={projectId}
            startDate={startDate}
            endDate={endDate}
            onChange={updateFilters}
          />
          <button className="button" onClick={() => newSaleDialogRef.current?.showModal()}>
            + Nueva venta
          </button>
          {sessionInfo?.is_superuser || sessionInfo?.role === "master" ? (
            <button
              className="button secondary small"
              onClick={() => adminDialogRef.current?.showModal()}
            >
              Master
            </button>
          ) : null}
          <button className="button" onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? "Saliendo..." : "Salir"}
          </button>
        </div>
      </header>

      {error ? <div className="banner">{error}</div> : null}

      <section className="kpi-grid">
        <KpiCard label="Pagos totales" value={currency.format(totalPayments)} hint="Histórico" />
        <KpiCard
          label="Pagos pendientes"
          value={currency.format(pendingPayments)}
          hint="Saldo de enganche"
        />
        <KpiCard
          label="Comisiones totales"
          value={currency.format(totalCommissions)}
          hint="Auto-calculado"
          positive
        />
      </section>

      <dialog ref={adminDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Master</h3>
            <button
              className="modal-close"
              onClick={() => adminDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Envía un enlace mágico para crear usuarios.
          </p>
          <form onSubmit={handleInvite} style={{ display: "grid", gap: 12 }}>
            <input
              className="input"
              type="email"
              placeholder="Correo del usuario"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              required
            />
            <button className="button" type="submit" disabled={isInviting}>
              {isInviting ? "Enviando..." : "Enviar enlace mágico"}
            </button>
            {inviteStatus ? <div className="banner">{inviteStatus}</div> : null}
          </form>
        </div>
      </dialog>

      <Tabs
        value={tab}
        onChange={(value) => setTab(value as TabKey)}
        tabs={[
          { id: "payments", label: "Pagos" },
          { id: "commissions", label: "Comisiones" },
          { id: "sales", label: "Ventas" }
        ]}
      />

      {isLoading ? (
        <div className="card skeleton">
          <div className="skeleton-line" style={{ width: "40%" }} />
          <div className="skeleton-line" style={{ width: "90%" }} />
          <div className="skeleton-line" style={{ width: "85%" }} />
          <div className="skeleton-line" style={{ width: "80%" }} />
        </div>
      ) : (
        <section className="table-card">
          {tab === "payments" && (
            <DataTable
              columns={[
                "Unidad #",
                "Cliente",
                "Monto",
                "Fecha",
                "Tipo",
                "Acciones"
              ]}
              emptyState="Aún no hay pagos."
            >
              {payments.map((payment) => (
                <Fragment key={payment.id}>
                  <tr
                    onClick={() =>
                      setExpandedPaymentId((prev) => (prev === payment.id ? null : payment.id))
                    }
                  >
                    <td>{payment.unit_number ?? "—"}</td>
                    <td>{payment.client_name ?? "—"}</td>
                    <td>{currency.format(payment.amount)}</td>
                    <td>{payment.payment_date}</td>
                    <td>
                      <span className="pill">{formatPaymentType(payment.payment_type)}</span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="link-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPaymentModal(payment.id);
                          }}
                        >
                          Detalles
                        </button>
                        <button
                          className="link-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setExpandedPaymentId((prev) =>
                              prev === payment.id ? null : payment.id
                            );
                          }}
                        >
                          {expandedPaymentId === payment.id ? "Ocultar" : "Desglose"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedPaymentId === payment.id && (
                    <tr>
                      <td colSpan={6}>
                        {paymentCommissions[payment.id]?.length ? (
                          <div className="card">
                            <strong>Desglose de comisiones</strong>
                            {paymentCommissions[payment.id].map((commission) => (
                              <div key={commission.id}>
                                {commission.recipient_id ?? "Beneficiario"} ·{" "}
                                {currency.format(commission.commission_amount)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">
                            No hay comisiones para este pago.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </DataTable>
          )}

          {tab === "commissions" && (
            <DataTable
              columns={[
                "Beneficiario",
                "Monto",
                "Fase",
                "Fecha de pago",
                "Pagado",
                "Acciones"
              ]}
              emptyState="Aún no hay comisiones."
            >
              {groupedCommissions.map((group) => (
                <Fragment key={group.paymentId}>
                  <tr
                    onClick={() =>
                      setExpandedCommissionPaymentId((prev) =>
                        prev === group.paymentId ? null : group.paymentId
                      )
                    }
                  >
                    <td>
                      <button
                        className="link-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedCommissionPaymentId((prev) =>
                            prev === group.paymentId ? null : group.paymentId
                          );
                        }}
                      >
                        Pago {group.paymentId}
                      </button>
                    </td>
                    <td>{currency.format(group.total)}</td>
                    <td>—</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <button
                        className="link-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setExpandedCommissionPaymentId((prev) =>
                            prev === group.paymentId ? null : group.paymentId
                          );
                        }}
                      >
                        {expandedCommissionPaymentId === group.paymentId
                          ? "Ocultar"
                          : "Ver"}
                      </button>
                    </td>
                  </tr>
                  {expandedCommissionPaymentId === group.paymentId
                    ? group.items.map((commission) => (
                        <tr key={commission.id}>
                          <td>{commission.recipient_id ?? "Beneficiario"}</td>
                          <td>{currency.format(commission.commission_amount)}</td>
                          <td>{commission.phase_name ?? "—"}</td>
                          <td>{commission.payment_date ?? "—"}</td>
                          <td>
                            <label>
                              <input
                                type="checkbox"
                                checked={
                                  paidOverrides[commission.id] ??
                                  Boolean(commission.paid)
                                }
                                onChange={(event) =>
                                  setPaidOverrides((prev) => ({
                                    ...prev,
                                    [commission.id]: event.target.checked
                                  }))
                                }
                              />{" "}
                              Pagado
                            </label>
                          </td>
                          <td>
                            <button
                              className="link-button"
                              onClick={() => openCommissionModal(commission.id)}
                            >
                              Detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              ))}
            </DataTable>
          )}

          {tab === "sales" && (
            <DataTable
              columns={[
                "Unidad #",
                "Cliente",
                "Precio",
                "Enganche",
                "Estado",
                "Asesor",
                "Acciones"
              ]}
              emptyState="Aún no hay ventas."
            >
              {sales.map((sale) => (
                <tr key={sale.id} onClick={() => openSaleModal(sale.id)}>
                  <td>{sale.unit_number ?? "—"}</td>
                  <td>{sale.client_name ?? "—"}</td>
                  <td>{currency.format(sale.price_with_tax)}</td>
                  <td>{currency.format(sale.down_payment_amount)}</td>
                  <td>
                    <span className="pill">{sale.status}</span>
                  </td>
                  <td>{sale.sales_rep_id ?? "—"}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openSaleModal(sale.id);
                      }}
                    >
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      )}

      <dialog ref={newSaleDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Nueva venta</h3>
            <button
              className="modal-close"
              onClick={() => newSaleDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <form className="card">
            <input className="input" placeholder="ID del proyecto" />
            <input className="input" placeholder="ID de la unidad" />
            <input className="input" placeholder="ID del cliente" />
            <input className="input" placeholder="ID del asesor" />
            <input className="input" type="date" placeholder="Fecha de venta" />
            <input className="input" placeholder="Precio con impuestos" />
            <input className="input" placeholder="Monto de enganche" />
            <button className="button" type="button">
              Guardar borrador
            </button>
          </form>
        </div>
      </dialog>

      <dialog ref={paymentDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Detalles del pago</h3>
            <button className="modal-close" onClick={() => paymentDialogRef.current?.close()}>
              ×
            </button>
          </div>
          {selectedPayment ? (
            <>
              <div>Monto: {currency.format(selectedPayment.amount)}</div>
              <div>Tipo: {formatPaymentType(selectedPayment.payment_type)}</div>
              <div>Fecha: {selectedPayment.payment_date}</div>
              <div>Notas: {selectedPayment.notes ?? "—"}</div>
              <div>
                Comisiones:
                {selectedPaymentCommissions.length ? (
                  selectedPaymentCommissions.map((commission) => (
                    <div key={commission.id}>
                      {commission.recipient_id ?? "Beneficiario"} ·{" "}
                      {currency.format(commission.commission_amount)}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No se generaron comisiones.</div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Selecciona un pago para ver detalles.</div>
          )}
        </div>
      </dialog>

      <dialog ref={saleDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Detalles de la venta</h3>
            <button className="modal-close" onClick={() => saleDialogRef.current?.close()}>
              ×
            </button>
          </div>
          {selectedSale ? (
            <>
              <div>Precio con impuestos: {currency.format(selectedSale.price_with_tax)}</div>
              <div>Enganche: {currency.format(selectedSale.down_payment_amount)}</div>
              <div>Estado: {selectedSale.status}</div>
              <div>Asesor: {selectedSale.sales_rep_id ?? "—"}</div>
              <div>Pagos:</div>
              {selectedSalePayments.length ? (
                selectedSalePayments.map((payment) => (
                  <div key={payment.id}>
                    {payment.payment_date} · {currency.format(payment.amount)} ·{" "}
                    {formatPaymentType(payment.payment_type)}
                  </div>
                ))
              ) : (
                <div className="empty-state">Aún no hay pagos.</div>
              )}
            </>
          ) : (
            <div className="empty-state">Selecciona una venta para ver detalles.</div>
          )}
        </div>
      </dialog>

      <dialog ref={commissionDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Detalles de la comisión</h3>
            <button
              className="modal-close"
              onClick={() => commissionDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          {selectedCommission ? (
            <>
              <div>Beneficiario: {selectedCommission.recipient_id ?? "—"}</div>
              <div>Monto: {currency.format(selectedCommission.commission_amount)}</div>
              <div>Pagado: {selectedCommission.paid ? "Sí" : "No"}</div>
              <div>Creado: {selectedCommission.created_at}</div>
            </>
          ) : (
            <div className="empty-state">Selecciona una comisión para ver detalles.</div>
          )}
        </div>
      </dialog>
    </section>
  );
}
