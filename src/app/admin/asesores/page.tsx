import { Suspense } from "react";
import type { Metadata } from "next";
import AsesoresClient from "./asesores-client";

export const metadata: Metadata = {
  title: "Gestión de Asesores | Puerta Abierta",
  description: "Administración de cuentas y proyectos de asesores de venta",
};

export default function AsesoresPage() {
  return (
    <Suspense>
      <AsesoresClient />
    </Suspense>
  );
}
