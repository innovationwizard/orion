import { Suspense } from "react";
import type { Metadata } from "next";
import CreditosClient from "./creditos-client";

export const metadata: Metadata = {
  title: "Créditos | Puerta Abierta",
  description:
    "Panel de análisis del departamento de créditos — portafolio, absorción, financiamiento",
};

export default function CreditosPage() {
  return (
    <Suspense>
      <CreditosClient />
    </Suspense>
  );
}
