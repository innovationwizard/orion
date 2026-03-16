import type { Metadata } from "next";
import { Suspense } from "react";
import VentasDashboardClient from "./ventas-dashboard-client";

export const metadata: Metadata = {
  title: "Mi Panel | Puerta Abierta",
};

export default function VentasDashboardPage() {
  return (
    <Suspense>
      <VentasDashboardClient />
    </Suspense>
  );
}
