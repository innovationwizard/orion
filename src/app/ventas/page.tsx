import { Suspense } from "react";
import type { Metadata } from "next";
import VentasClient from "./ventas-client";

export const metadata: Metadata = {
  title: "Ventas | Puerta Abierta",
  description: "Ritmo de ventas — velocidad de absorcion y tendencias mensuales",
};

export default function VentasPage() {
  return (
    <Suspense>
      <VentasClient />
    </Suspense>
  );
}
