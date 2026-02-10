import { z } from "zod";
import { getSupabaseConfigError, getSupabaseServerClient } from "@/lib/supabase";
import { jsonError, jsonOk, parseQuery } from "@/lib/api";
import { requireAuth } from "@/lib/auth";
import type { PaymentType } from "@/lib/types";

const analyticsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

type PaymentRow = {
  id: string;
  amount: number;
  payment_type: PaymentType;
  payment_date: string;
};

type SaleRow = {
  id: string;
  project_id: string;
  unit_id: string;
  client_id: string;
  down_payment_amount: number;
  financed_amount: number;
  projects?: { name: string | null }[] | { name: string | null } | null;
  units?: { unit_number: string | null }[] | { unit_number: string | null } | null;
  clients?: { full_name: string | null }[] | { full_name: string | null } | null;
  payments?: PaymentRow[] | null;
};

type AnalyticsUnit = {
  unitId: string;
  unitNumber: string;
  clientName: string;
  totalExpected: number;
  totalPaid: number;
  percentPaid: number;
  /** Total down payment (Reserva + Enganche fraccionado) */
  engancheTotal: { expected: number; paid: number };
  reserve: { expected: number; paid: number };
  /** Remaining down payment after reserve; paid in monthly installments */
  downPayment: { expected: number; paid: number };
  installments: { expected: number; paid: number };
  paymentHistory: Array<{
    id: string;
    paymentDate: string;
    paymentType: PaymentType;
    amount: number;
  }>;
};

function sumAmounts(payments: PaymentRow[]) {
  return payments.reduce((total, payment) => total + (payment.amount ?? 0), 0);
}

function withinRange(date: string, startDate?: string, endDate?: string) {
  if (startDate && date < startDate) {
    return false;
  }
  if (endDate && date > endDate) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const configError = getSupabaseConfigError();
  if (configError) {
    return jsonError(500, configError);
  }
  const auth = await requireAuth();
  if (auth.response) {
    return auth.response;
  }
  const supabase = getSupabaseServerClient();
  const { data: query, error } = parseQuery(request, analyticsQuerySchema);
  if (error) {
    return jsonError(400, error.error, error.details);
  }

  try {
    let builder = supabase
      .from("sales")
      .select(
        "id, project_id, unit_id, client_id, down_payment_amount, financed_amount, projects ( name ), units ( unit_number ), clients ( full_name ), payments ( id, amount, payment_type, payment_date )"
      );

    if (query?.project_id) {
      builder = builder.eq("project_id", query.project_id);
    }

    const { data, error: dbError } = await builder;
    if (dbError) {
      return jsonError(500, "Database error", dbError.message);
    }

    const projectsMap = new Map<string, { projectId: string; projectName: string; units: AnalyticsUnit[] }>();
    let summaryExpected = 0;
    let summaryPaid = 0;

    (data ?? []).forEach((sale) => {
      const typedSale = sale as SaleRow;
      const projectId = typedSale.project_id;
      const projectRel = Array.isArray(typedSale.projects)
        ? typedSale.projects[0]
        : typedSale.projects;
      const unitRel = Array.isArray(typedSale.units) ? typedSale.units[0] : typedSale.units;
      const clientRel = Array.isArray(typedSale.clients)
        ? typedSale.clients[0]
        : typedSale.clients;
      const projectName = projectRel?.name ?? "Proyecto";
      const unitNumber = unitRel?.unit_number ?? "—";
      const clientName = clientRel?.full_name ?? "—";
      const allPayments = (typedSale.payments ?? []).filter((payment) => Boolean(payment.payment_date));
      const filteredPayments =
        query?.start_date || query?.end_date
          ? allPayments.filter((payment) =>
              withinRange(payment.payment_date, query?.start_date, query?.end_date)
            )
          : allPayments;

      const sortedAllPayments = [...allPayments].sort((a, b) =>
        a.payment_date.localeCompare(b.payment_date)
      );
      const firstPayment = sortedAllPayments[0];

      const reservationPayments = allPayments.filter((payment) => payment.payment_type === "reservation");
      const downPaymentPayments = allPayments.filter((payment) => payment.payment_type === "down_payment");
      const financedPayments = allPayments.filter((payment) => payment.payment_type === "financed_payment");

      const reservationPaid = sumAmounts(
        filteredPayments.filter((payment) => payment.payment_type === "reservation")
      );
      const downPaymentPaidTotal = sumAmounts(
        filteredPayments.filter((payment) => payment.payment_type === "down_payment")
      );
      const financedPaid = sumAmounts(
        filteredPayments.filter((payment) => payment.payment_type === "financed_payment")
      );

      const reserveExpected = reservationPayments.length
        ? sumAmounts(reservationPayments)
        : firstPayment?.amount ?? 0;

      let downPaymentPaid = downPaymentPaidTotal;
      let installmentsPaid = 0;
      let installmentsExpected = 0;

      if (financedPayments.length > 0) {
        installmentsExpected = typedSale.financed_amount ?? 0;
        installmentsPaid = financedPaid;
      } else if (downPaymentPayments.length > 1) {
        const sortedDownPayments = [...downPaymentPayments].sort((a, b) =>
          a.payment_date.localeCompare(b.payment_date)
        );
        const firstDownPayment = sortedDownPayments[0];
        downPaymentPaid = sumAmounts(
          filteredPayments.filter(
            (payment) => payment.payment_type === "down_payment" && payment.id === firstDownPayment?.id
          )
        );
        installmentsPaid = downPaymentPaidTotal - downPaymentPaid;
        installmentsExpected = Math.max(
          0,
          (typedSale.down_payment_amount ?? 0) - (firstDownPayment?.amount ?? 0)
        );
      }

      // Down payment (Enganche) = total down payment minus reserve (reserva is part of down payment)
      const totalDownPaymentAmount = typedSale.down_payment_amount ?? 0;
      const downPaymentExpected = Math.max(0, totalDownPaymentAmount - reserveExpected);
      const totalExpected =
        totalDownPaymentAmount + (financedPayments.length ? installmentsExpected : 0);
      const totalPaid = reservationPaid + downPaymentPaid + installmentsPaid;
      const percentPaid = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

      summaryExpected += totalExpected;
      summaryPaid += totalPaid;

      const engancheTotalPaid = reservationPaid + downPaymentPaid;

      const unit: AnalyticsUnit = {
        unitId: typedSale.unit_id,
        unitNumber,
        clientName,
        totalExpected,
        totalPaid,
        percentPaid,
        engancheTotal: { expected: totalDownPaymentAmount, paid: engancheTotalPaid },
        reserve: { expected: reserveExpected, paid: reservationPaid },
        downPayment: { expected: downPaymentExpected, paid: downPaymentPaid },
        installments: { expected: installmentsExpected, paid: installmentsPaid },
        paymentHistory: [...filteredPayments]
          .sort((a, b) => a.payment_date.localeCompare(b.payment_date))
          .map((payment) => ({
            id: payment.id,
            paymentDate: payment.payment_date,
            paymentType: payment.payment_type,
            amount: payment.amount
          }))
      };

      const entry = projectsMap.get(projectId) ?? {
        projectId,
        projectName,
        units: []
      };
      entry.units.push(unit);
      projectsMap.set(projectId, entry);
    });

    const byProject = Array.from(projectsMap.values()).map((project) => ({
      ...project,
      units: project.units.sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
    }));

    const summaryPercent = summaryExpected > 0 ? Math.round((summaryPaid / summaryExpected) * 100) : 0;

    return jsonOk({
      byProject,
      summary: {
        totalExpected: summaryExpected,
        totalPaid: summaryPaid,
        percentPaid: summaryPercent
      }
    });
  } catch (error) {
    return jsonError(500, "Database error", error);
  }
}
