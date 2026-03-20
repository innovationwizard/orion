import { Suspense } from "react";
import type { Metadata } from "next";
import OperacionesClient from "./operaciones-client";

export const metadata: Metadata = {
  title: "Centro de Operaciones | Puerta Abierta",
  description: "Panel operativo — cola de trabajo, tasas pendientes, documentos",
};

export default function OperacionesPage() {
  return (
    <Suspense>
      <OperacionesClient />
    </Suspense>
  );
}
