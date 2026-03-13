import { Suspense } from "react";
import type { Metadata } from "next";
import CesionClient from "./cesion-client";

export const metadata: Metadata = {
  title: "Cesion de Derechos | Puerta Abierta",
  description:
    "Panel de control financiero — Aptos cesion de derechos Boulevard 5",
};

export default function CesionPage() {
  return (
    <Suspense>
      <CesionClient />
    </Suspense>
  );
}
