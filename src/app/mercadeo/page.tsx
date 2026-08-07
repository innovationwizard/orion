import type { Metadata } from "next";
import NavBar from "@/components/nav-bar";
import FunnelStrip from "./funnel-strip";
import LeadsMetasStrip from "./leads-metas-strip";
import RoasStrip from "./roas-strip";

export const metadata: Metadata = {
  title: "Mercadeo | Puerta Abierta",
  description:
    "Reporte maestro de mercadeo — funnel de conversión, performance de pauta, inversión vs reservas, campañas y presupuesto",
};

export default function MercadeoPage() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <FunnelStrip />
      <LeadsMetasStrip />
      <RoasStrip />
      <iframe
        src="/mercadeo/performance.html"
        title="Reporte maestro de mercadeo — Performance Dashboard Puerta Abierta"
        className="flex-1 w-full border-0"
      />
    </div>
  );
}
