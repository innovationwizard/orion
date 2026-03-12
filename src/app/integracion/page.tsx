import { Suspense } from "react";
import type { Metadata } from "next";
import IntegracionClient from "./integracion-client";

export const metadata: Metadata = {
  title: "Integracion | Puerta Abierta",
  description: "Resumen de integracion por torre — pipeline de reservas y PCV",
};

export default function IntegracionPage() {
  return (
    <Suspense>
      <IntegracionClient />
    </Suspense>
  );
}
