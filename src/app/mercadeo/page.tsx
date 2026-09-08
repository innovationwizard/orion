import { Suspense } from "react";
import type { Metadata } from "next";
import SiteNav from "@/components/site-nav";
import MercadeoClient from "@/app/pabi/mercadeo/mercadeo-client";

export const metadata: Metadata = {
  title: "Mercadeo | Puerta Abierta",
  description:
    "Reporte maestro de mercadeo — metas de lead, uso de presupuesto, ROAS/ROI, costo por cierre, campañas y canales digitales",
};

/**
 * Native page by default. Set NEXT_PUBLIC_MERCADEO_VARIANT=iframe and redeploy
 * to fall back to the Power BI export at public/mercadeo/performance.html,
 * which stays in place untouched — same rollback shape as NEXT_PUBLIC_NAV_VARIANT.
 */
export default function MercadeoPage() {
  const variant = process.env.NEXT_PUBLIC_MERCADEO_VARIANT ?? "native";

  if (variant === "iframe") {
    return (
      <div className="flex flex-col h-screen">
        <SiteNav />
        <iframe
          src="/mercadeo/performance.html"
          title="Reporte maestro de mercadeo — Performance Dashboard Puerta Abierta"
          className="flex-1 w-full border-0"
        />
      </div>
    );
  }

  return (
    <Suspense>
      <MercadeoClient />
    </Suspense>
  );
}
