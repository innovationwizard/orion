import { Suspense } from "react";
import type { Metadata } from "next";
import CotizadorConfigClient from "./cotizador-config-client";

export const metadata: Metadata = {
  title: "Configuración Cotizador | Puerta Abierta",
  description: "Gestión de configuraciones del cotizador por proyecto/torre",
};

export default function CotizadorConfigPage() {
  return (
    <Suspense>
      <CotizadorConfigClient />
    </Suspense>
  );
}
