"use client";

import SiteNav from "@/components/site-nav";
import DisponibilidadPanel from "./disponibilidad-panel";

export default function DisponibilidadClient() {
  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <SiteNav />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Disponibilidad</h1>
        <p className="text-sm text-muted mt-1">Estado de unidades en tiempo real</p>
      </div>

      <DisponibilidadPanel syncUrl />
    </div>
  );
}
