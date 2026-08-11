"use client";

import { useEffect, useState } from "react";
import {
  areaCompletion,
  areaRequirements,
  hudTotal,
  type HudArea,
  type HudAreaKey,
  type HudRequirement,
  type HudSection,
} from "../hud/areas";
import { ODOO_HUD_AREAS } from "./areas";

// ─── Completion color: red (0%) → green (100%), desaturated for elegance ─────
function completionColor(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  return `hsl(${Math.round(clamped * 1.2)}, 62%, 52%)`;
}

// ─── Count-up animation ──────────────────────────────────────
function useCountUp(target: number, durationMs = 1600): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

// ─── Refined orbital gauge ───────────────────────────────────
function OrbitalGauge({ pct, label, compact = false }: { pct: number; label: string; compact?: boolean }) {
  const display = useCountUp(pct);
  const color = completionColor(display);
  const R = 96;
  const circumference = 2 * Math.PI * R;
  const dash = (Math.max(0, Math.min(100, display)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox="0 0 480 380" className={compact ? "w-full max-w-xs" : "w-full max-w-xl"} role="img" aria-label={`${label}: ${Math.round(pct)}%`}>
        <defs>
          <linearGradient id="odooRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Concentric hairline rings */}
        <circle cx={240} cy={190} r={150} fill="none" stroke="url(#odooRing)" strokeWidth={0.75} opacity={0.5} />
        <circle cx={240} cy={190} r={126} fill="none" stroke="#94a3b8" strokeWidth={0.5} opacity={0.25} />
        <circle cx={240} cy={190} r={64} fill="none" stroke="#94a3b8" strokeWidth={0.5} opacity={0.2} />

        {/* Slow rotating accent arc on the outer ring */}
        <g style={{ transformOrigin: "240px 190px", animation: "odoo-orbit 14s linear infinite" }}>
          <path
            d="M 240 40 A 150 150 0 0 1 344.7 82.7"
            fill="none"
            stroke="#22d3ee"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.8}
          />
          <circle cx={240} cy={40} r={3} fill="#e2e8f0" style={{ filter: "drop-shadow(0 0 6px #22d3ee)" }} />
        </g>

        {/* Center glow */}
        <circle cx={240} cy={190} r={70} fill={color} opacity={0.06} />

        {/* Progress track + arc */}
        <circle cx={240} cy={190} r={R} fill="none" stroke="#ffffff" strokeWidth={2.5} opacity={0.08} />
        <circle
          cx={240}
          cy={190}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 240 190)"
          style={{ filter: `drop-shadow(0 0 10px ${color})`, transition: "stroke 300ms linear" }}
        />
      </svg>

      <div
        className={`${compact ? "text-4xl" : "text-6xl sm:text-7xl"} [font-family:var(--font-odoo-display)] font-normal tabular-nums -mt-6`}
        style={{ color, textShadow: `0 0 32px ${color}55` }}
      >
        {Math.round(display)}%
      </div>
      <div className="mt-3 [font-family:var(--font-odoo-display)] text-[10px] tracking-[0.45em] uppercase text-slate-400 text-center">
        {label}
      </div>

      <style>{`
        @keyframes odoo-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Glass tab pill ──────────────────────────────────────────
function AreaTab({ label, pct, active, onClick }: { label: string; pct: number; active: boolean; onClick: () => void }) {
  const color = completionColor(pct);
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur text-center py-2.5 px-3 transition-all whitespace-nowrap w-44 shrink-0 border ${
        active ? "border-violet-400/70 shadow-[0_0_24px_rgba(139,92,246,0.35)]" : "border-white/10 hover:border-white/25"
      }`}
      aria-pressed={active}
    >
      <span
        className="absolute inset-y-0 left-0 transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color, opacity: 0.32 }}
      />
      <span className="relative z-10 block [font-family:var(--font-odoo-display)] text-[9px] tracking-[0.2em] text-slate-100">
        {label}
      </span>
      <span className="relative z-10 block text-sm font-light tabular-nums text-slate-300">{Math.round(pct)} %</span>
    </button>
  );
}

// ─── Requirement row (migration-readiness semantics) ─────────
const STATUS_UI = {
  COMPLETA: { dot: "#34d399", badge: "Fuente asegurada", badgeClass: "border-emerald-400/50 text-emerald-300" },
  SIN_VISTA: { dot: "#fbbf24", badge: "Parcial — requiere trabajo", badgeClass: "border-amber-400/60 text-amber-300" },
  NO_VINCULADA: { dot: "#f87171", badge: "Sin fuente en ningún sistema", badgeClass: "border-red-400/60 text-red-300" },
} as const;

function RequirementRow({ req }: { req: HudRequirement }) {
  const ui = STATUS_UI[req.status];
  return (
    <li className="flex items-start gap-3 py-4">
      <span
        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
        style={{ background: ui.dot, boxShadow: `0 0 10px ${ui.dot}` }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-light text-slate-100">{req.label}</span>
          <span className={`text-[10px] font-medium tracking-[0.14em] uppercase rounded-full px-2.5 py-0.5 border ${ui.badgeClass}`}>
            {ui.badge}
          </span>
        </div>
        {req.note && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{req.note}</p>}
      </div>
    </li>
  );
}

function SectionPane({ section }: { section: HudSection }) {
  return (
    <div>
      <h2 className="[font-family:var(--font-odoo-display)] text-[11px] tracking-[0.35em] uppercase text-violet-300">
        {section.label}
      </h2>
      <ul className="mt-2 divide-y divide-white/[0.06]">
        {section.requirements.map((r) => (
          <RequirementRow key={r.id} req={r} />
        ))}
      </ul>
    </div>
  );
}

function ResumenPane({ area }: { area: HudArea }) {
  const reqs = areaRequirements(area);
  const complete = reqs.filter((r) => r.status === "COMPLETA");
  const pending = reqs.filter((r) => r.status !== "COMPLETA");
  const resumenSection = area.sections.find((s) => s.key === "resumen");

  return (
    <div className="grid gap-10">
      <OrbitalGauge compact pct={areaCompletion(area)} label={area.label} />
      <p className="text-center text-[15px] font-light text-slate-300 -mt-6">
        {complete.length} de {reqs.length} requisitos con fuente asegurada para la migración
      </p>

      {resumenSection && resumenSection.requirements.length > 0 && <SectionPane section={resumenSection} />}

      {pending.length > 0 && (
        <div>
          <h2 className="[font-family:var(--font-odoo-display)] text-[11px] tracking-[0.35em] uppercase text-red-300">
            Brechas
          </h2>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            {pending.map((r) => (
              <RequirementRow key={r.id} req={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AreaView({ area }: { area: HudArea }) {
  const [sectionKey, setSectionKey] = useState(area.sections[0]?.key ?? "");
  const section = area.sections.find((s) => s.key === sectionKey) ?? area.sections[0];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12">
      <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible md:w-60 shrink-0" aria-label={`Secciones de ${area.label}`}>
        {area.sections.map((s) => {
          const total = s.requirements.length;
          const done = s.requirements.filter((r) => r.status === "COMPLETA").length;
          const active = s.key === section?.key;
          return (
            <button
              key={s.key}
              onClick={() => setSectionKey(s.key)}
              className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-[14px] font-light whitespace-nowrap transition-all border ${
                active
                  ? "bg-violet-400/10 text-violet-200 border-violet-400/40"
                  : "text-slate-300 border-transparent hover:bg-white/[0.04] hover:border-white/10"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span>{s.label}</span>
              <span
                className="[font-family:var(--font-odoo-display)] text-[9px] tabular-nums"
                style={{ color: completionColor(total ? (done / total) * 100 : 0) }}
              >
                {done}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      <section className="flex-1 min-w-0">
        {section?.key === "resumen" ? <ResumenPane area={area} /> : section && <SectionPane section={section} />}
      </section>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────
export default function OdooHudClient() {
  const [selected, setSelected] = useState<HudAreaKey | null>(null);

  const total = hudTotal(ODOO_HUD_AREAS);
  const selectedArea = ODOO_HUD_AREAS.find((a) => a.key === selected) ?? null;

  return (
    <div className="min-h-screen bg-[#04050e] bg-[radial-gradient(ellipse_at_50%_-10%,#1b1440_0%,#0a0b1c_45%,#04050e_100%)] text-slate-200 [font-family:var(--font-odoo-body)] font-light">
      <header className="sticky top-0 z-20 bg-[#04050e]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="text-center pt-4 pb-2">
          <button onClick={() => setSelected(null)} aria-label="Ir al total de la migración">
            <span className="[font-family:var(--font-odoo-display)] text-xl tracking-[0.5em] bg-gradient-to-r from-violet-300 via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              ODOO&thinsp;HUD
            </span>
          </button>
          <div className="text-[10px] tracking-[0.35em] uppercase text-slate-500 mt-1">
            Migración Odoo v19 · preparación de datos
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex justify-center gap-2.5 min-w-max px-3 pb-4 pt-1">
            {ODOO_HUD_AREAS.map((a) => (
              <AreaTab
                key={a.key}
                label={a.label}
                pct={areaCompletion(a)}
                active={selected === a.key}
                onClick={() => setSelected(selected === a.key ? null : a.key)}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="flex items-start justify-center px-4 py-12 min-h-[calc(100vh-140px)]">
        {selectedArea ? (
          <AreaView key={selectedArea.key} area={selectedArea} />
        ) : (
          <OrbitalGauge key="total" pct={total} label="Preparación total de la migración" />
        )}
      </main>
    </div>
  );
}
