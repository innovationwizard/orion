"use client";

import { useEffect, useState } from "react";
import {
  HUD_AREAS,
  areaCompletion,
  areaRequirements,
  hudTotal,
  type HudArea,
  type HudAreaKey,
  type HudRequirement,
  type HudSection,
} from "./areas";
// ─── Completion color: red (0%) → green (100%) ───────────────
function completionColor(pct: number): string {
  const clamped = Math.max(0, Math.min(100, pct));
  return `hsl(${Math.round(clamped * 1.2)}, 78%, 46%)`;
}

// ─── Count-up animation for the gauge number ─────────────────
function useCountUp(target: number, durationMs = 1400): number {
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

// ─── Deterministic starfield (stable across SSR/client) ──────
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(19);
const STARS = Array.from({ length: 70 }, () => ({
  x: rand() * 480,
  y: rand() * 380,
  r: rand() * 1.6 + 0.5,
  o: rand() * 0.45 + 0.15,
  green: rand() > 0.72,
}));
const STREAKS = Array.from({ length: 10 }, () => {
  const x = rand() * 480;
  const y = rand() * 380;
  const a = rand() * Math.PI * 2;
  const len = rand() * 40 + 20;
  return { x1: x, y1: y, x2: x + Math.cos(a) * len, y2: y + Math.sin(a) * len, o: rand() * 0.2 + 0.08 };
});

// ─── Orbital gauge (Jarvis-style) ────────────────────────────
function OrbitalGauge({ pct, label, compact = false }: { pct: number; label: string; compact?: boolean }) {
  const display = useCountUp(pct);
  const color = completionColor(display);
  const R_PROGRESS = 92;
  const circumference = 2 * Math.PI * R_PROGRESS;
  const dash = (Math.max(0, Math.min(100, display)) / 100) * circumference;

  return (
    <div className="flex flex-col items-center select-none">
      <svg
        viewBox="0 0 480 380"
        className={compact ? "w-full max-w-xs" : "w-full max-w-xl"}
        role="img"
        aria-label={`${label}: ${Math.round(pct)}%`}
      >
        {/* Starfield */}
        {STARS.map((s, i) => (
          <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} fill={s.green ? "#6ee7a0" : "#7dd3fc"} opacity={s.o} />
        ))}
        {STREAKS.map((l, i) => (
          <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#93c5fd" strokeWidth={0.8} opacity={l.o} />
        ))}

        {/* Decorative crossing orbits, slow drift */}
        <g style={{ transformOrigin: "240px 190px", animation: "hud-drift 90s linear infinite" }}>
          <ellipse cx={240} cy={190} rx={210} ry={80} fill="none" stroke="#60a5fa" strokeWidth={0.8} opacity={0.18} transform="rotate(-24 240 190)" />
          <ellipse cx={240} cy={190} rx={200} ry={65} fill="none" stroke="#60a5fa" strokeWidth={0.8} opacity={0.14} transform="rotate(38 240 190)" />
          <ellipse cx={240} cy={190} rx={180} ry={110} fill="none" stroke="#60a5fa" strokeWidth={0.8} opacity={0.1} transform="rotate(80 240 190)" />
        </g>

        {/* Center glow */}
        <circle cx={240} cy={190} r={82} fill={color} opacity={0.07} />
        <circle cx={240} cy={190} r={50} fill="#3b82f6" opacity={0.1} />

        {/* Inner ring: faint track + progress arc */}
        <circle cx={240} cy={190} r={R_PROGRESS} fill="none" stroke={color} strokeWidth={4.5} opacity={0.18} />
        <circle
          cx={240}
          cy={190}
          r={R_PROGRESS}
          fill="none"
          stroke={color}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 240 190)"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />

        {/* Outer ring with orbiting satellite */}
        <circle cx={240} cy={190} r={128} fill="none" stroke={color} strokeWidth={1.5} opacity={0.75} />
        <g style={{ transformOrigin: "240px 190px", animation: "hud-orbit 7s linear infinite" }}>
          <circle cx={240} cy={62} r={6.5} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        </g>
      </svg>

      <div
        className={`${compact ? "text-2xl" : "text-4xl sm:text-5xl"} [font-family:var(--font-hud-display)] tabular-nums -mt-4`}
        style={{ color, textShadow: `0 0 24px ${color}` }}
      >
        {Math.round(display)}%
      </div>
      <div className="mt-3 [font-family:var(--font-hud-display)] text-[9px] tracking-[0.35em] uppercase text-cyan-300 text-center">{label}</div>

      <style>{`
        @keyframes hud-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes hud-drift { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Tab pill: dual visual completion indicator ──────────────
function AreaTab({
  label,
  pct,
  active,
  onClick,
}: {
  label: string;
  pct: number;
  active: boolean;
  onClick: () => void;
}) {
  const color = completionColor(pct);
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-full bg-white text-center py-2 px-3 transition-shadow whitespace-nowrap w-44 shrink-0 ${
        active ? "ring-2 ring-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.45)]" : "ring-1 ring-white/20"
      }`}
      aria-pressed={active}
    >
      {/* Fill: width = completion, color = red→green by completion */}
      <span
        className="absolute inset-y-0 left-0 transition-[width] duration-700"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color, opacity: 0.85 }}
      />
      <span className="relative z-10 block [font-family:var(--font-hud-display)] text-[8px] font-bold tracking-wider text-slate-900">{label}</span>
      <span className="relative z-10 block [font-family:var(--font-hud-display)] text-[9px] font-semibold tabular-nums text-slate-800">
        {Math.round(pct)} %
      </span>
    </button>
  );
}

// ─── Requirement row with completion status ──────────────────
const STATUS_UI = {
  COMPLETA: { dot: "#34d399", badge: "Completa", badgeClass: "border-emerald-400/60 text-emerald-300" },
  SIN_VISTA: { dot: "#fbbf24", badge: "Vista todavía no creada", badgeClass: "border-amber-400/70 text-amber-300" },
  NO_VINCULADA: { dot: "#ef4444", badge: "Data todavía no vinculada", badgeClass: "border-red-400/70 text-red-300" },
} as const;

function RequirementRow({ req }: { req: HudRequirement }) {
  const ui = STATUS_UI[req.status];
  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: ui.dot, boxShadow: `0 0 8px ${ui.dot}` }}
        aria-hidden
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg leading-tight text-emerald-100">{req.label}</span>
          <span className={`text-sm font-bold tracking-wider uppercase rounded-full px-2 py-0.5 border ${ui.badgeClass}`}>
            {ui.badge}
          </span>
        </div>
        {req.note && <p className="mt-1 text-base leading-snug text-emerald-300/70">{req.note}</p>}
        {req.proof && req.proof.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {req.proof.map((p) => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-baseline gap-1.5 rounded-full border border-sky-400/60 px-3 py-1 text-sm font-semibold text-sky-300 hover:bg-sky-400/10 transition-colors"
              >
                Ver →<span className="font-normal text-sky-200/80">{p.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Section pane (one left-panel item's content) ────────────
function SectionPane({ section }: { section: HudSection }) {
  return (
    <div>
      <h2 className="[font-family:var(--font-hud-display)] text-[10px] font-bold tracking-[0.25em] uppercase text-cyan-300">{section.label}</h2>
      <ul className="mt-2 divide-y divide-white/10">
        {section.requirements.map((r) => (
          <RequirementRow key={r.id} req={r} />
        ))}
      </ul>
    </div>
  );
}

// ─── Resumen pane: area gauge + gap list ─────────────────────
function ResumenPane({ area }: { area: HudArea }) {
  const reqs = areaRequirements(area);
  const complete = reqs.filter((r) => r.status === "COMPLETA");
  const pending = reqs.filter((r) => r.status !== "COMPLETA");
  const resumenSection = area.sections.find((s) => s.key === "resumen");

  return (
    <div className="grid gap-8">
      <OrbitalGauge compact pct={areaCompletion(area)} label={area.label} />
      <p className="text-center text-lg text-emerald-200 -mt-4">
        {complete.length} de {reqs.length} requisitos completos (data vinculada y desplegada)
      </p>

      {resumenSection && resumenSection.requirements.length > 0 && (
        <SectionPane section={resumenSection} />
      )}

      {pending.length > 0 && (
        <div>
          <h2 className="[font-family:var(--font-hud-display)] text-[10px] font-bold tracking-[0.25em] uppercase text-red-300">
            Pendientes
          </h2>
          <ul className="mt-2 divide-y divide-white/10">
            {pending.map((r) => (
              <RequirementRow key={r.id} req={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Area view: left side panel + content ────────────────────
function AreaView({ area }: { area: HudArea }) {
  const [sectionKey, setSectionKey] = useState(area.sections[0]?.key ?? "");
  const section = area.sections.find((s) => s.key === sectionKey) ?? area.sections[0];

  if (area.sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <OrbitalGauge pct={0} label={area.label} />
        <p className="text-lg text-emerald-300/70">Requisitos aún no definidos para esta área.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10">
      {/* Left side panel */}
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-56 shrink-0" aria-label={`Secciones de ${area.label}`}>
        {area.sections.map((s) => {
          const total = s.requirements.length;
          const done = s.requirements.filter((r) => r.status === "COMPLETA").length;
          const active = s.key === section?.key;
          return (
            <button
              key={s.key}
              onClick={() => setSectionKey(s.key)}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-lg whitespace-nowrap transition-colors ${
                active ? "bg-sky-400/15 text-cyan-300 ring-1 ring-sky-400/40" : "text-emerald-200 hover:bg-white/5"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span>{s.label}</span>
              <span
                className="[font-family:var(--font-hud-display)] text-[8px] font-semibold tabular-nums"
                style={{ color: completionColor(total ? (done / total) * 100 : 0) }}
              >
                {done}/{total}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Content pane — gap status + "Ver →" proof links only; all data lives on its own page */}
      <section className="flex-1 min-w-0">
        {section?.key === "resumen" ? <ResumenPane area={area} /> : section && <SectionPane section={section} />}
      </section>
    </div>
  );
}

// ─── Main HUD ────────────────────────────────────────────────
export default function HudClient() {
  const [selected, setSelected] = useState<HudAreaKey | null>(null);

  const total = hudTotal(HUD_AREAS);
  const selectedArea = HUD_AREAS.find((a) => a.key === selected) ?? null;

  return (
    <div className="min-h-screen bg-[#0b1230] bg-[radial-gradient(ellipse_at_50%_30%,#12204d_0%,#0b1230_65%)] text-emerald-100 [font-family:var(--font-hud-body)]">
      {/* Sticky header: title + tabs */}
      <header className="sticky top-0 z-20 bg-[#0b1230]/90 backdrop-blur border-b border-white/10">
        <div className="text-center py-3">
          <button
            onClick={() => setSelected(null)}
            className="[font-family:var(--font-hud-display)] text-sm font-bold tracking-[0.3em] text-emerald-300"
            aria-label="Ir al total del proyecto"
          >
            PAI HUD
          </button>
        </div>
        <div className="overflow-x-auto">
          {/* Fixed equal-width pills; min-w-max keeps justify-center from clipping when the row overflows */}
          <div className="flex justify-center gap-2 min-w-max px-3 pb-3">
            {HUD_AREAS.map((a) => (
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

      {/* Body: project total (home) or selected area */}
      <main className="flex items-start justify-center px-4 py-10 min-h-[calc(100vh-120px)]">
        {selectedArea ? (
          <AreaView key={selectedArea.key} area={selectedArea} />
        ) : (
          <OrbitalGauge key="total" pct={total} label="Total del proyecto" />
        )}
      </main>
    </div>
  );
}
