import { Suspense } from "react";
import type { Metadata } from "next";
import CotizadorClient from "./cotizador-client";

export const metadata: Metadata = {
  title: "Cotizador | Puerta Abierta",
  description: "Cotizador de unidades — calcula enganche, financiamiento y escrituracion",
};

export default function CotizadorPage() {
  return (
    <Suspense>
      <CotizadorClient />
    </Suspense>
  );
}
