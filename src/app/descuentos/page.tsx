import { Suspense } from "react";
import type { Metadata } from "next";
import DescuentosClient from "./descuentos-client";

export const metadata: Metadata = {
  title: "Descuentos | Puerta Abierta",
  description:
    "Control de descuentos — extracción OCR de los expedientes escaneados de Boulevard 5, con monto máximo, tipo y evidencia por expediente",
};

export default function DescuentosPage() {
  return (
    <Suspense>
      <DescuentosClient />
    </Suspense>
  );
}
