import { Suspense } from "react";
import type { Metadata } from "next";
import CumplimientoClient from "./cumplimiento-client";

export const metadata: Metadata = {
  title: "Cumplimiento | Puerta Abierta",
  description:
    "Expedientes de cumplimiento — status de DPI y RTU por comprador, promesas, fuente de ingresos, precalificación y observaciones del oficial",
};

export default function CumplimientoPage() {
  return (
    <Suspense>
      <CumplimientoClient />
    </Suspense>
  );
}
