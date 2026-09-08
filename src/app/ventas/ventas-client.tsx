"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/hooks/use-projects";
import { useVentas } from "@/hooks/use-ventas";
import { useHudVentas } from "@/hooks/use-hud-ventas";
import { useRole } from "@/hooks/use-role";
import KpiCard from "@/components/kpi-card";
import SiteNav from "@/components/site-nav";
import CollapsibleSection from "@/components/collapsible-section";
import MetaBulletChart, { type BulletDatum } from "@/components/charts/meta-bullet-chart";
import GroupedBarChart from "@/components/creditos/grouped-bar-chart";
import SectionNav from "@/app/pabi/section-nav";
import { VENTAS_SECTIONS } from "@/app/pabi/nav-links";
import MonthlyChart from "./monthly-chart";
import CumulativeChart from "./cumulative-chart";
import { ObjetivosPorAsesor } from "./ventas-analitica";
import DisponibilidadPanel from "@/app/disponibilidad/disponibilidad-panel";
import ValorizacionPanel from "@/app/valorizacion/valorizacion-panel";
import DescuentosPanel from "@/app/descuentos/descuentos-panel";
import PromocionesPanel, { promocionesScopeCaption } from "@/app/promociones/promociones-panel";

// Series names double as the chart legend label, so they read as prose.
const CANAL_KEY = "Reservas confirmadas";
const MODELO_KEY = "Unidades";

export default function VentasClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get("project") ?? "";
  const role = useRole();

  const { data: projects } = useProjects();
  const { data: { monthly, summary }, loading } = useVentas({ project: projectSlug || undefined });
  const { data: hud, error: hudError, forbidden: hudForbidden } = useHudVentas();

  // Which collapsible sections are expanded. The SectionNav opens one on click.
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string | null>(null);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const setSectionOpen = useCallback((id: string, next: boolean) => {
    setOpenSections((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }, []);

  /** Jump bar: expand the target section (if collapsible) and scroll to it.
   *  Entries with an href are rendered as links by SectionNav and never reach here. */
  const jumpTo = useCallback(
    (id: string) => {
      if (!document.getElementById(id)) return;
      setActiveSection(id);
      setSectionOpen(id, true);
      // Wait for the section body to mount before scrolling to it.
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [setSectionOpen],
  );

  // Only offer sections this role can actually load. The API routes remain the
  // real gate — this just avoids showing a section that would come back empty.
  const sections = useMemo(
    () => VENTAS_SECTIONS.filter((s) => !s.roles || (role != null && s.roles.includes(role))),
    [role],
  );
  const canSee = useCallback((id: string) => sections.some((s) => s.id === id), [sections]);

  // Deep links from the HUD (/ventas#objetivos, #canales, #modelos) used to land
  // on always-expanded sections. Now that sections start collapsed, open the one
  // the hash names once its data has arrived so the link still shows content.
  const hashHandled = useRef(false);
  useEffect(() => {
    if (hashHandled.current || hud == null) return;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    hashHandled.current = true;
    jumpTo(id);
  }, [hud, jumpTo]);

  // Per-project meta vs ventas, for the bullet chart.
  const bulletData: BulletDatum[] = useMemo(() => {
    if (!hud) return [];
    return hud.objetivos.proyectos.map((p) => ({
      label: p.project,
      sublabel: `${p.asesoresActivos} asesores × ${p.metaPorAsesor}${p.entrega ? ` · entrega ${p.entrega}` : ""}`,
      value: p.ventas,
      target: p.metaTotal,
    }));
  }, [hud]);

  return (
    <div className="p-[clamp(16px,3vw,32px)] grid gap-6 max-w-[1400px] mx-auto">
      <SiteNav />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Ventas por Proyecto</h1>
          <p className="text-sm text-muted mt-1">
            Ritmo, objetivos, inventario, valorización, descuentos y promociones — en una sola vista
          </p>
        </div>
        <select
          className="px-3 py-2 rounded-lg border border-border bg-card text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={projectSlug}
          onChange={(e) => updateParam("project", e.target.value)}
          aria-label="Filtrar por proyecto"
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.project_slug} value={p.project_slug}>
              {p.project_name}
            </option>
          ))}
        </select>
      </header>

      <SectionNav items={sections} onSelect={jumpTo} activeId={activeSection} />

      {/* Avance por proyecto — meta vs ventas del mes, siempre visible */}
      {canSee("avance") && !hudForbidden && (
        <section
          id="avance"
          className="bg-card rounded-2xl shadow-card border border-border p-4 grid gap-3 scroll-mt-16"
        >
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              Avance del mes {hud?.objetivos.month ?? ""} — meta vs ventas por proyecto
            </h2>
            <p className="text-sm text-muted m-0">
              Cuentan reservas confirmadas y desistidas por fecha de depósito. Meta del proyecto = meta
              por asesor × asesores activos (sin roles de gerencia). Todos los proyectos — el filtro de
              la página no aplica aquí.
            </p>
          </div>
          {hudError ? (
            <p className="text-danger text-sm m-0">No se pudo cargar objetivos: {hudError}</p>
          ) : !hud ? (
            <div className="grid gap-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-border" />
              ))}
            </div>
          ) : (
            <MetaBulletChart data={bulletData} valueLabel="Ventas" targetLabel="Meta" />
          )}
        </section>
      )}

      {/* Ritmo: KPIs, tendencia mensual y acumulado */}
      <section id="ritmo" className="grid gap-6 scroll-mt-16">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4">
          <KpiCard label="Total unidades" value={String(summary.total_units)} />
          <KpiCard
            label="Vendidas"
            value={String(summary.sold_units)}
            hint={`${Math.round(summary.absorption_rate * 100)}% absorcion`}
            positive
          />
          <KpiCard label="Disponibles" value={String(summary.available_units)} />
          <KpiCard
            label="Velocidad"
            value={`${summary.avg_monthly_velocity}/mes`}
            hint="Promedio mensual"
          />
          <KpiCard
            label="Meses restantes"
            value={summary.months_to_sellout > 0 ? String(summary.months_to_sellout) : "—"}
            hint="Al ritmo actual"
          />
        </div>

        {loading ? (
          <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-border" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <MonthlyChart data={monthly} />
            <CumulativeChart data={monthly} totalUnits={summary.total_units} />
          </>
        )}
      </section>

      {/* Detalle mensual */}
      {monthly.length > 0 && (
        <CollapsibleSection
          id="detalle-mensual"
          title="Detalle mensual"
          subtitle="Reservas, confirmadas, desistidas y neto por mes"
          open={openSections.has("detalle-mensual")}
          onToggle={(next) => setSectionOpen("detalle-mensual", next)}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Mes</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Reservas</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Confirmadas</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Desistidas</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Neto</th>
                  <th className="text-center py-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.month} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <td className="py-2 px-4 font-medium">{m.month}</td>
                    <td className="py-2 px-3 text-center">{m.reservations}</td>
                    <td className="py-2 px-3 text-center text-success">{m.confirmed}</td>
                    <td className="py-2 px-3 text-center text-danger">{m.desisted || "–"}</td>
                    <td className={`py-2 px-3 text-center font-semibold ${m.net >= 0 ? "text-success" : "text-danger"}`}>
                      {m.net >= 0 ? `+${m.net}` : m.net}
                    </td>
                    <td className="py-2 px-3 text-center">{m.cumulative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}

      {/* Objetivos por asesor */}
      {canSee("objetivos") && hud && (
        <CollapsibleSection
          id="objetivos"
          title="Objetivos por asesor"
          subtitle={`Meta, ventas y déficit/excedente de cada asesor — ${hud.objetivos.month}`}
          open={openSections.has("objetivos")}
          onToggle={(next) => setSectionOpen("objetivos", next)}
        >
          <ObjetivosPorAsesor objetivos={hud.objetivos} />
        </CollapsibleSection>
      )}

      {/* Canales */}
      {canSee("canales") && hud && (
        <CollapsibleSection
          id="canales"
          title="Ventas por canal"
          subtitle="Reservas confirmadas por lead_source — histórico completo, todos los proyectos"
          open={openSections.has("canales")}
          onToggle={(next) => setSectionOpen("canales", next)}
        >
          <GroupedBarChart
            data={hud.canales.map((c) => ({ canal: c.canal, [CANAL_KEY]: c.count }))}
            keys={[CANAL_KEY]}
            xKey="canal"
            colors={{ [CANAL_KEY]: "var(--color-primary)" }}
            layout="horizontal"
            height={Math.max(200, hud.canales.length * 34 + 40)}
          />
        </CollapsibleSection>
      )}

      {/* Modelos */}
      {canSee("modelos") && hud && (
        <CollapsibleSection
          id="modelos"
          title="Split por modelo"
          subtitle="Unidades reservadas y vendidas por proyecto y modelo — todos los proyectos"
          open={openSections.has("modelos")}
          onToggle={(next) => setSectionOpen("modelos", next)}
        >
          <GroupedBarChart
            data={hud.modelos.map((m) => ({
              modelo: `${m.project} — ${m.modelo}`,
              [MODELO_KEY]: m.count,
            }))}
            keys={[MODELO_KEY]}
            xKey="modelo"
            colors={{ [MODELO_KEY]: "var(--color-primary)" }}
            layout="horizontal"
            height={Math.max(200, hud.modelos.length * 34 + 40)}
          />
        </CollapsibleSection>
      )}

      {/* Inventario general — vendido, congelado, disponible */}
      {canSee("disponibilidad") && (
        <CollapsibleSection
          id="disponibilidad"
          title="Disponibilidad"
          subtitle="Inventario general: vendido, congelado, disponible — estado de unidades en tiempo real"
          open={openSections.has("disponibilidad")}
          onToggle={(next) => setSectionOpen("disponibilidad", next)}
        >
          <DisponibilidadPanel syncUrl={false} />
        </CollapsibleSection>
      )}

      {/* Valor de proyecto, subidas de precio y desistimientos */}
      {canSee("valorizacion") && (
        <CollapsibleSection
          id="valorizacion"
          title="Valorización"
          subtitle="Valor de proyecto, historial de subidas de precio y desistimientos con su valorización"
          open={openSections.has("valorizacion")}
          onToggle={(next) => setSectionOpen("valorizacion", next)}
        >
          <ValorizacionPanel projectSlug={projectSlug} />
        </CollapsibleSection>
      )}

      {/* Control de descuentos */}
      {canSee("descuentos") && (
        <CollapsibleSection
          id="descuentos"
          title="Control de descuentos"
          subtitle="Expedientes con descuento y exposición máxima — snapshot OCR, solo Boulevard 5"
          open={openSections.has("descuentos")}
          onToggle={(next) => setSectionOpen("descuentos", next)}
        >
          <DescuentosPanel />
        </CollapsibleSection>
      )}

      {/* Control de promociones */}
      {canSee("promociones") && !hudForbidden && (
        <CollapsibleSection
          id="promociones"
          title="Control de promociones"
          subtitle={promocionesScopeCaption(hud?.vales)}
          open={openSections.has("promociones")}
          onToggle={(next) => setSectionOpen("promociones", next)}
        >
          <PromocionesPanel vales={hud?.vales} error={hudError} />
        </CollapsibleSection>
      )}
    </div>
  );
}
