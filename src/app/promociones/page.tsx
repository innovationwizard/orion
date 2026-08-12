import { Suspense } from "react";
import type { Metadata } from "next";
import PromocionesClient from "./promociones-client";

export const metadata: Metadata = {
  title: "Promociones | Puerta Abierta",
  description:
    "Control de promociones — vales activos desde el export de tratos de Pipedrive, con exposición total y detalle por trato",
};

export default function PromocionesPage() {
  return (
    <Suspense>
      <PromocionesClient />
    </Suspense>
  );
}
