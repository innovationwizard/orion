import { Suspense } from "react";
import type { Metadata } from "next";
import PipelineClient from "./pipeline-client";

export const metadata: Metadata = {
  title: "Pipeline de Expedientes | Puerta Abierta",
  description:
    "Pipeline de expedientes de crédito desde Pipedrive — etapas, antigüedad, tipo de crédito, bancos y tratos",
};

export default function CreditosPipelinePage() {
  return (
    <Suspense>
      <PipelineClient />
    </Suspense>
  );
}
