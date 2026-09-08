"use client";

import SiteNav from "@/components/site-nav";
import { useHudVentas } from "@/hooks/use-hud-ventas";
import PromocionesPanel, { promocionesScopeCaption } from "./promociones-panel";

export default function PromocionesClient() {
  const { data, error } = useHudVentas();
  const vales = data?.vales;

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <SiteNav />

      <header>
        <h1 className="text-2xl font-bold text-text-primary">Promociones — Vales</h1>
        <p className="text-sm text-muted mt-1">{promocionesScopeCaption(vales)}</p>
      </header>

      <PromocionesPanel vales={vales} error={error} />
    </div>
  );
}
