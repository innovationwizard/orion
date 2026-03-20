import { Suspense } from "react";
import type { Metadata } from "next";
import AuditClient from "./audit-client";

export const metadata: Metadata = {
  title: "Auditoría | Puerta Abierta",
  description: "Registro de auditoría de acciones administrativas",
};

export default function AuditPage() {
  return (
    <Suspense>
      <AuditClient />
    </Suspense>
  );
}
