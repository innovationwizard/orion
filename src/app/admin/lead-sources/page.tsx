import { Suspense } from "react";
import type { Metadata } from "next";
import LeadSourcesClient from "./lead-sources-client";

export const metadata: Metadata = {
  title: "Fuentes de Clientes | Puerta Abierta",
  description: "Gestión de fuentes de captación de clientes (lead sources)",
};

export default function LeadSourcesPage() {
  return (
    <Suspense>
      <LeadSourcesClient />
    </Suspense>
  );
}
