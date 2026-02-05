import { headers } from "next/headers";
import DashboardClient from "./dashboard-client";
import type { Commission, Payment, Sale } from "@/lib/types";

type DashboardData = {
  payments: Payment[];
  commissions: Commission[];
  sales: Sale[];
};

function getBaseUrl() {
  const headerList = headers();
  const host = headerList.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  return host ? `${protocol}://${host}` : "";
}

async function fetchJson<T>(path: string) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return { data: [] as T };
  }
  const res = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return (await res.json()) as { data: T };
}

export default async function DashboardPage() {
  let initialData: DashboardData = { payments: [], commissions: [], sales: [] };

  try {
    const [payments, commissions, sales] = await Promise.all([
      fetchJson<Payment[]>("/api/payments"),
      fetchJson<Commission[]>("/api/commissions"),
      fetchJson<Sale[]>("/api/sales")
    ]);

    initialData = {
      payments: payments.data,
      commissions: commissions.data,
      sales: sales.data
    };
  } catch {
    initialData = { payments: [], commissions: [], sales: [] };
  }

  return <DashboardClient initialData={initialData} />;
}
