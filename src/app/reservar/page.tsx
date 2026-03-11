import { Suspense } from "react";
import type { Metadata } from "next";
import ReservarClient from "./reservar-client";

export const metadata: Metadata = {
  title: "Reservar | Puerta Abierta",
  description: "Formulario de reserva para asesores de venta",
};

export default function ReservarPage() {
  return (
    <Suspense>
      <ReservarClient />
    </Suspense>
  );
}
