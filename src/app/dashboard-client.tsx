"use client";

import { Fragment, useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Commission, Payment, Sale } from "@/lib/types";
import Filters from "@/components/filters";
import KpiCard from "@/components/kpi-card";
import Tabs from "@/components/tabs";
import DataTable from "@/components/data-table";

type DashboardData = {
  payments: Payment[];
  commissions: Commission[];
  sales: Sale[];
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

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

  const paymentDialogRef = useRef<HTMLDialogElement>(null);
  const saleDialogRef = useRef<HTMLDialogElement>(null);
  const newSaleDialogRef = useRef<HTMLDialogElement>(null);
  const commissionDialogRef = useRef<HTMLDialogElement>(null);

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
    () => commissions.reduce((sum, commission) => sum + commission.amount, 0),
    [commissions]
  );

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch("/api/sales?distinct=project", {
          cache: "no-store"
        });
        const payload = await response.json();
        setProjects(payload.data ?? []);
      } catch {
        setProjects([]);
      }
    }

    fetchProjects();
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

        if (!paymentsRes.ok || !commissionsRes.ok || !salesRes.ok) {
          throw new Error("Failed to load dashboard data.");
        }

        const [paymentsPayload, commissionsPayload, salesPayload] = await Promise.all([
          paymentsRes.json(),
          commissionsRes.json(),
          salesRes.json()
        ]);

        setPayments(paymentsPayload.data ?? []);
        setCommissions(commissionsPayload.data ?? []);
        setSales(salesPayload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
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
      total: items.reduce((sum, item) => sum + item.amount, 0)
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
        <h1>Real Estate Payment Tracker</h1>
        <div className="header-actions">
          <Filters
            projects={projects}
            projectId={projectId}
            startDate={startDate}
            endDate={endDate}
            onChange={updateFilters}
          />
          <button className="button" onClick={() => newSaleDialogRef.current?.showModal()}>
            + New Sale
          </button>
        </div>
      </header>

      {error ? <div className="banner">{error}</div> : null}

      <section className="kpi-grid">
        <KpiCard label="Total Payments" value={currency.format(totalPayments)} hint="All time" />
        <KpiCard
          label="Pending Payments"
          value={currency.format(pendingPayments)}
          hint="Down payment balance"
        />
        <KpiCard
          label="Total Commissions"
          value={currency.format(totalCommissions)}
          hint="Auto-calculated"
          positive
        />
      </section>

      <Tabs
        value={tab}
        onChange={(value) => setTab(value as TabKey)}
        tabs={[
          { id: "payments", label: "Payments" },
          { id: "commissions", label: "Commissions" },
          { id: "sales", label: "Sales" }
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
                "Unit #",
                "Client",
                "Amount",
                "Date",
                "Type",
                "Actions"
              ]}
              emptyState="No payments yet."
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
                      <span className="pill">{payment.payment_type}</span>
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
                          Details
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
                          {expandedPaymentId === payment.id ? "Hide" : "Breakdown"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedPaymentId === payment.id && (
                    <tr>
                      <td colSpan={6}>
                        {paymentCommissions[payment.id]?.length ? (
                          <div className="card">
                            <strong>Commission Breakdown</strong>
                            {paymentCommissions[payment.id].map((commission) => (
                              <div key={commission.id}>
                                {commission.recipient_id ?? "Recipient"} ·{" "}
                                {currency.format(commission.amount)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-state">No commissions for this payment.</div>
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
                "Recipient",
                "Amount",
                "Phase",
                "Payment Date",
                "Paid",
                "Actions"
              ]}
              emptyState="No commissions yet."
            >
              {groupedCommissions.map((group) => (
                <tr key={group.paymentId}>
                  <td colSpan={6}>
                    <details>
                      <summary>
                        Payment {group.paymentId} · {currency.format(group.total)}
                      </summary>
                      <table>
                        <tbody>
                          {group.items.map((commission) => (
                            <tr key={commission.id}>
                              <td>{commission.recipient_id ?? "Recipient"}</td>
                              <td>{currency.format(commission.amount)}</td>
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
                                  Paid
                                </label>
                              </td>
                              <td>
                                <button
                                  className="link-button"
                                  onClick={() => openCommissionModal(commission.id)}
                                >
                                  Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  </td>
                </tr>
              ))}
            </DataTable>
          )}

          {tab === "sales" && (
            <DataTable
              columns={[
                "Unit #",
                "Client",
                "Price",
                "Down Payment",
                "Status",
                "Rep",
                "Actions"
              ]}
              emptyState="No sales yet."
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
                      Details
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
            <h3>New Sale</h3>
            <button
              className="modal-close"
              onClick={() => newSaleDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          <form className="card">
            <input className="input" placeholder="Project ID" />
            <input className="input" placeholder="Unit ID" />
            <input className="input" placeholder="Client ID" />
            <input className="input" placeholder="Sales Rep ID" />
            <input className="input" type="date" placeholder="Sale Date" />
            <input className="input" placeholder="Price with tax" />
            <input className="input" placeholder="Down payment amount" />
            <button className="button" type="button">
              Save Draft
            </button>
          </form>
        </div>
      </dialog>

      <dialog ref={paymentDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Payment Details</h3>
            <button className="modal-close" onClick={() => paymentDialogRef.current?.close()}>
              ×
            </button>
          </div>
          {selectedPayment ? (
            <>
              <div>Amount: {currency.format(selectedPayment.amount)}</div>
              <div>Type: {selectedPayment.payment_type}</div>
              <div>Date: {selectedPayment.payment_date}</div>
              <div>Notes: {selectedPayment.notes ?? "—"}</div>
              <div>
                Commissions:
                {selectedPaymentCommissions.length ? (
                  selectedPaymentCommissions.map((commission) => (
                    <div key={commission.id}>
                      {commission.recipient_id ?? "Recipient"} ·{" "}
                      {currency.format(commission.amount)}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No commissions generated.</div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a payment to view details.</div>
          )}
        </div>
      </dialog>

      <dialog ref={saleDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Sale Details</h3>
            <button className="modal-close" onClick={() => saleDialogRef.current?.close()}>
              ×
            </button>
          </div>
          {selectedSale ? (
            <>
              <div>Price with tax: {currency.format(selectedSale.price_with_tax)}</div>
              <div>Down payment: {currency.format(selectedSale.down_payment_amount)}</div>
              <div>Status: {selectedSale.status}</div>
              <div>Rep: {selectedSale.sales_rep_id ?? "—"}</div>
              <div>Payments:</div>
              {selectedSalePayments.length ? (
                selectedSalePayments.map((payment) => (
                  <div key={payment.id}>
                    {payment.payment_date} · {currency.format(payment.amount)} ·{" "}
                    {payment.payment_type}
                  </div>
                ))
              ) : (
                <div className="empty-state">No payments yet.</div>
              )}
            </>
          ) : (
            <div className="empty-state">Click a sale to view details.</div>
          )}
        </div>
      </dialog>

      <dialog ref={commissionDialogRef}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Commission Details</h3>
            <button
              className="modal-close"
              onClick={() => commissionDialogRef.current?.close()}
            >
              ×
            </button>
          </div>
          {selectedCommission ? (
            <>
              <div>Recipient: {selectedCommission.recipient_id ?? "—"}</div>
              <div>Amount: {currency.format(selectedCommission.amount)}</div>
              <div>Paid: {selectedCommission.paid ? "Yes" : "No"}</div>
              <div>Created: {selectedCommission.created_at}</div>
            </>
          ) : (
            <div className="empty-state">Select a commission to view details.</div>
          )}
        </div>
      </dialog>
    </section>
  );
}
