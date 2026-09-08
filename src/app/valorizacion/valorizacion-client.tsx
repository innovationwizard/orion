"use client";

import { useSearchParams, useRouter } from "next/navigation";
import SiteNav from "@/components/site-nav";
import ValorizacionPanel from "./valorizacion-panel";

export default function ValorizacionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <SiteNav />

      <header>
        <h1 className="text-2xl font-bold text-text-primary">Valorizacion</h1>
        <p className="text-sm text-muted mt-1">
          Historial de incrementos de precio y apreciacion acumulada
        </p>
      </header>

      <ValorizacionPanel
        projectSlug={projectSlug}
        onProjectChange={(slug) => updateParam("project", slug)}
      />
    </div>
  );
}
