import { Suspense } from "react";
import type { Metadata } from "next";
import DisponibilidadClient from "./disponibilidad-client";

export const metadata: Metadata = {
  title: "Disponibilidad | Puerta Abierta",
  description: "Tablero de disponibilidad de unidades en tiempo real",
};

export default function DisponibilidadPage() {
  return (
    <Suspense>
      <DisponibilidadClient />
    </Suspense>
  );
}
