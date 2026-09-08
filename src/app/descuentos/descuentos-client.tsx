"use client";

import { useState } from "react";
import SiteNav from "@/components/site-nav";
import type { DescuentosPayload } from "@/app/api/descuentos/route";
import DescuentosPanel, { descuentosScopeCaption } from "./descuentos-panel";

export default function DescuentosClient() {
  const [data, setData] = useState<DescuentosPayload | null>(null);

  return (
    <div>
      <SiteNav />
      <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Control de Descuentos</h1>
          <p className="text-sm text-muted mt-1">{descuentosScopeCaption(data)}</p>
        </div>

        <DescuentosPanel onData={setData} />
      </div>
    </div>
  );
}
