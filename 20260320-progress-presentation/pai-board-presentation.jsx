import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// PAI — REPORTE DE AVANCE A JUNTA DIRECTIVA
// Grupo Orión → Puerta Abierta Inmobiliaria + Proyectos Inmobiliarios
// Presentado por: Jorge Luis Contreras Herrera
// ══════════════════════════════════════════════════════════════════════════

// Palette aligned with infraestructura_it_wishlist.pdf (dark navy + electric blue)
const C = {
  bg: "#0a0c1b", surface: "#0f1428", surfaceAlt: "#141a32", card: "#121a30",
  border: "#1e3a5f", borderLight: "#2a4a78",
  accent: "#3b82f6", accentLight: "#60a5fa", accentDim: "#1e3a8a", accentBg: "rgba(59,130,246,0.10)",
  green: "#00e090", greenDim: "rgba(0,224,144,0.12)",
  blue: "#38bdf8", blueDim: "rgba(56,189,248,0.12)",
  orange: "#fbbf24", orangeDim: "rgba(251,191,36,0.10)",
  red: "#f87171", redDim: "rgba(248,113,113,0.10)",
  purple: "#a78bfa", purpleDim: "rgba(167,139,250,0.10)",
  text: "#f8fafc", textMuted: "#9ca3af", textDim: "#64748b",
};

// ── PLACEHOLDER DATA ────────────────────────────────────────────────────
// Claude Code: replace {{PLACEHOLDERS}} with real data from the repo
const P = {
  totalUnidadesVendidas: "{{TOTAL_UNITS_SOLD}}",
  totalValorVentas: "{{TOTAL_SALES_VALUE_GTQ}}",
  totalAsesores: "{{TOTAL_ACTIVE_REPS}}",
  totalProyectosActivos: "{{TOTAL_ACTIVE_PROJECTS}}",
  comisionesCalculadas: "{{TOTAL_COMMISSIONS_CALCULATED_GTQ}}",
  expedientesCumplimiento: "{{TOTAL_COMPLIANCE_FILES_PROCESSED}}",
  ventasMesActual: "{{CURRENT_MONTH_SALES_UNITS}}",
  cumplimientoMeta: "{{TARGET_ACHIEVEMENT_PCT}}",
  ticketPromedio: "{{AVG_TICKET_GTQ}}",
  carteraTotal: "{{TOTAL_PORTFOLIO_GTQ}}",
  clientesAlDia: "{{CLIENTS_GREEN}}",
  clientesNaranja: "{{CLIENTS_ORANGE}}",
  clientesRojo: "{{CLIENTS_RED}}",
};

// Typography aligned with vendedoresMASTER: geometric sans (titles) + JetBrains Mono (labels, data, chrome)
const font = "'Space Grotesk', 'Helvetica Neue', sans-serif";
const fontDisplay = "'Space Grotesk', 'Helvetica Neue', sans-serif";
const fontMono = "'JetBrains Mono', 'Roboto Mono', ui-monospace, monospace";

// ── SHARED COMPONENTS ───────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    done: { bg: C.greenDim, color: C.green, label: "Completado" },
    progress: { bg: C.blueDim, color: C.blue, label: "En progreso" },
    pending: { bg: C.orangeDim, color: C.orange, label: "Pendiente" },
    live: { bg: C.greenDim, color: C.green, label: "EN PRODUCCIÓN" },
    eliminated: { bg: C.greenDim, color: C.green, label: "✓ Eliminado" },
    in_progress: { bg: C.blueDim, color: C.blue, label: "En proceso" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, padding: "3px 10px", borderRadius: 4,
      fontSize: 11, fontWeight: 600, fontFamily: fontMono, letterSpacing: 0.5,
      textTransform: "uppercase", whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
};

const ProgressBar = ({ pct, color = C.accent, h = 6 }) => (
  <div style={{ width: "100%", height: h, background: C.border, borderRadius: h / 2, overflow: "hidden" }}>
    <div style={{ width: `${pct}%`, height: "100%", borderRadius: h / 2, background: `linear-gradient(90deg, ${color}, ${color}cc)`, transition: "width 1s ease" }} />
  </div>
);

const KPICard = ({ label, value, accent = false }) => (
  <div style={{
    background: accent ? C.accentBg : C.surfaceAlt, border: `1px solid ${accent ? C.accentDim : C.border}`,
    borderRadius: 8, padding: "14px 16px", flex: 1, minWidth: 120,
  }}>
    <div style={{ fontSize: 10, color: C.textMuted, fontFamily: fontMono, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 700, color: accent ? C.accent : C.text, fontFamily: fontMono, letterSpacing: -0.5 }}>{value}</div>
  </div>
);

const SectionTitle = ({ children, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ fontSize: 26, fontFamily: fontDisplay, color: C.text, margin: 0, fontWeight: 700, letterSpacing: -0.6, textTransform: "uppercase" }}>{children}</h2>
    {sub && <p style={{ fontSize: 13, color: C.textMuted, margin: "5px 0 0", fontFamily: font }}>{sub}</p>}
  </div>
);

const Bullet = ({ color = C.accent, children }) => (
  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: `1px solid ${C.border}08` }}>
    <span style={{ color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>▸</span>
    <span style={{ fontSize: 13, color: C.text, fontFamily: font, lineHeight: 1.5 }}>{children}</span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 0 — PORTADA
// ═══════════════════════════════════════════════════════════════════════
const SlidePortada = () => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", textAlign: "center", padding: 40 }}>
    <div style={{ fontSize: 11, fontFamily: fontMono, color: C.accent, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>Grupo Orión — Junta Directiva</div>
    <div style={{ width: 64, height: 2, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, marginBottom: 32 }} />
    <h1 style={{ fontSize: 42, fontFamily: fontDisplay, color: C.text, margin: 0, fontWeight: 700, lineHeight: 1.2, letterSpacing: -1 }}>
      Puerta Abierta<br />Inmobiliaria
    </h1>
    <p style={{ fontSize: 20, color: C.accent, fontFamily: font, margin: "16px 0 0", fontWeight: 500 }}>
      Reporte de Avance — Sistematización & Tecnología
    </p>
    <div style={{ width: 64, height: 2, background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`, margin: "32px 0" }} />
    <p style={{ fontSize: 14, color: C.textMuted, fontFamily: font }}>Marzo 2026 · Presentado por Jorge Luis Contreras Herrera</p>
    <div style={{ marginTop: 48, padding: "12px 24px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.surfaceAlt, fontSize: 12, color: C.textDim, fontFamily: fontMono }}>
      Usar ← → para navegar
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 1 — DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════════
const SlideDiagnostico = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="El punto de partida — febrero 2026">Diagnóstico Inicial</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
      {[
        { icon: "🏝️", title: "Datos aislados", desc: "Los procesos manuales (Excel) estaban desconectados del sistema. Lo que se hacía manual no se reflejaba digitalmente." },
        { icon: "📉", title: "Sin línea base", desc: "No existía un 'esperado' contra el cual contrastar los cobros reales. Sin fuente de verdad unificada." },
        { icon: "🗑️", title: "Archivos fuente contaminados", desc: "El Excel de comisiones fue rechazado al 100% por la base de datos. Datos con formato inconsistente, irrecuperables." },
        { icon: "🔌", title: "Cero visibilidad en tiempo real", desc: "Sin reportes automáticos de cartera, morosidad, déficit/excedente, ni alertas. Todo era retrospectivo y manual." },
      ].map((item, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: font, marginBottom: 5 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font, lineHeight: 1.5 }}>{item.desc}</div>
        </div>
      ))}
    </div>
    <div style={{ background: C.redDim, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 10, padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.red, fontFamily: font, marginBottom: 5 }}>Riesgo operativo</div>
      <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font, lineHeight: 1.5 }}>
        Cada sociedad anónima manejaba su información por separado. No había consolidado del holding. Las decisiones comerciales y financieras se tomaban sobre datos incompletos o desactualizados.
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 2 — ESTRATEGIA (3 pilares + agile)
// ═══════════════════════════════════════════════════════════════════════
const SlideEstrategia = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="Tres pilares + metodología ágil — iteraciones cortas con entrega de valor constante">Estrategia de Sistematización</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
      {[
        { num: "01", title: "PipeDrive", sub: "CRM Comercial", color: C.blue, items: ["Pipeline de ventas por asesor", "Gestión de contactos y seguimiento", "Agenda de estatus por cliente"], note: "Se mantiene. Uso exclusivo comercial." },
        { num: "02", title: "Odoo", sub: "ERP + Contabilidad", color: C.accent, items: ["Registro contable = fuente de verdad", "Facturación multiempresa", "Reportería financiera en tiempo real"], note: "Licencia activa. En implementación." },
        { num: "03", title: "PAI APP", sub: "Aplicaciones propias", color: C.green, items: ["Reportería comercial tiempo real", "Comisiones automatizadas", "Cumplimiento y créditos"], note: "5 módulos en producción." },
      ].map((p, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontFamily: fontMono, color: p.color, fontWeight: 700 }}>{p.num}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: font }}>{p.title}</div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: fontMono }}>{p.sub}</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            {p.items.map((item, j) => (
              <div key={j} style={{ fontSize: 12, color: C.textMuted, fontFamily: font, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: p.color, marginRight: 8 }}>›</span>{item}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 10, color: p.color, fontFamily: fontMono, fontWeight: 600, padding: "5px 10px", background: `${p.color}11`, borderRadius: 4 }}>{p.note}</div>
        </div>
      ))}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div style={{ background: C.redDim, border: `1px solid rgba(248,113,113,0.15)`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.red, fontFamily: font, marginBottom: 4 }}>✕ Waterfall (NO)</div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font, lineHeight: 1.5 }}>Diseñar todo el año upfront → alto riesgo de supuestos falsos y retrabajo costoso.</div>
      </div>
      <div style={{ background: C.greenDim, border: `1px solid rgba(52,211,153,0.15)`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: font, marginBottom: 4 }}>✓ Agile (SÍ)</div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font, lineHeight: 1.5 }}>Iteraciones cortas + feedback frecuente → menos riesgo, decisiones con evidencia real. Entrega de valor cada ciclo.</div>
      </div>
    </div>
    <div style={{ marginTop: 14, background: C.accentBg, border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>🎯</span>
      <span style={{ fontSize: 12, color: C.accent, fontFamily: font }}><strong>Filosofía:</strong> No cambiar a las personas — cambiar la máquina. Cada herramienta replica la conducta existente del usuario.</span>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 3 — PAI APP (5 modules)
// ═══════════════════════════════════════════════════════════════════════
const PAI_MODULES = [
  { id: "reps", title: "Portal de Asesores", user: "Asesores comerciales (~10)", icon: "👤", desc: "Vista individual por asesor: pipeline, clientes asignados, estatus de cada negociación, metas y cumplimiento personal.", status: "live", kpis: [{ l: "Asesores activos", v: P.totalAsesores }, { l: "Ventas mes actual", v: P.ventasMesActual }] },
  { id: "tower", title: "Torre de Control Comercial", user: "Patty — Asistente Comercial", icon: "🗼", desc: "Visibilidad 360° de toda la operación: inventario por proyecto, reservas, promesas de compraventa, planes de pago, seguimiento de cierres, desistimientos.", status: "live", kpis: [{ l: "Unidades vendidas", v: P.totalUnidadesVendidas }, { l: "Proyectos activos", v: P.totalProyectosActivos }] },
  { id: "gerente", title: "Reporte Gerencia Comercial", user: "Antonio — Gerente Comercial", icon: "📊", desc: "Dashboard ejecutivo: ventas vs objetivos por proyecto, absorción mensual, déficit/superávit vs fecha de cierre, rendimiento por asesor.", status: "live", kpis: [{ l: "Valor total ventas", v: P.totalValorVentas }, { l: "Cumplimiento meta", v: P.cumplimientoMeta }] },
  { id: "comisiones", title: "Cálculo de Comisiones", user: "Jorge — Administración", icon: "💰", desc: "Automatización completa: Venta → Cobro → Comisión. Reglas por proyecto, splits por asesor, fechas de corte, histórico completo. Elimina el Excel de comisiones que fue rechazado al 100% por la BD.", status: "live", kpis: [{ l: "Comisiones calculadas", v: P.comisionesCalculadas }, { l: "Ticket promedio", v: P.ticketPromedio }] },
  { id: "compliance", title: "Cumplimiento & Créditos", user: "Isaac — Cumplimiento", icon: "🛡️", desc: "Expedientes de precalificación, alertas PEP/OFAC/listas restrictivas, estatus de créditos bancarios, documentación pendiente. Alerta desde la reserva, no hasta el desembolso.", status: "live", kpis: [{ l: "Expedientes procesados", v: P.expedientesCumplimiento }, { l: "Cartera total", v: P.carteraTotal }] },
];

const SlidePAI = () => {
  const [sel, setSel] = useState(null);
  return (
    <div style={{ padding: "28px 36" }}>
      <SectionTitle sub="5 módulos en producción — plataforma unificada para toda la operación de PAI">PAI APP — Lo Entregado</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PAI_MODULES.map((m, i) => (
          <div key={m.id} onClick={() => setSel(sel === i ? null : i)} style={{
            background: sel === i ? C.surfaceAlt : C.card, border: `1px solid ${sel === i ? C.accentDim : C.border}`,
            borderRadius: 10, padding: "14px 18px", cursor: "pointer", transition: "all 0.2s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: font }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, fontFamily: fontMono }}>Usuario: {m.user}</div>
                </div>
              </div>
              <StatusBadge status={m.status} />
            </div>
            {sel === i && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 12, color: C.textMuted, fontFamily: font, lineHeight: 1.6, margin: "0 0 10px" }}>{m.desc}</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {m.kpis.map((k, j) => <KPICard key={j} label={k.l} value={k.v} accent={j === 0} />)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 4 — COBROS & COMISIONES DETAIL
// ═══════════════════════════════════════════════════════════════════════
const SlideCobrosComisiones = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="Módulos core que reemplazan los Excels más críticos de la operación">Cobros & Comisiones — Detalle</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: font, marginBottom: 12 }}>🏦 Módulo de Cobros</div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: fontMono, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Reporte Final</div>
        {["Total Cartera — monto total que nos adeudan", "Total Cobrado — cuánto hemos recibido a la fecha", "Déficit / Excedente — esperado vs ejecutado", "Mensual Esperado vs Real", "Casos Especiales — inversionistas, cuellos"].map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: C.textMuted, fontFamily: font, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.blue, marginRight: 8 }}>›</span>{item}
          </div>
        ))}
        <div style={{ marginTop: 14, fontSize: 11, color: C.textMuted, fontFamily: fontMono, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Sistema de Alertas</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { color: C.green, bg: C.greenDim, label: "Al día", sub: P.clientesAlDia },
            { color: C.orange, bg: C.orangeDim, label: "1-2 meses", sub: P.clientesNaranja },
            { color: C.red, bg: C.redDim, label: "3+ meses", sub: P.clientesRojo },
          ].map((a, i) => (
            <div key={i} style={{ flex: 1, background: a.bg, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: a.color, fontFamily: fontMono }}>{a.sub}</div>
              <div style={{ fontSize: 10, color: a.color, fontFamily: fontMono, marginTop: 2 }}>{a.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: font, marginBottom: 12 }}>💰 Módulo de Comisiones</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, padding: "12px 0" }}>
          {[
            { label: "VENTA", sub: "Fuente original", color: C.blue },
            { label: "COBRO", sub: "Materia prima", color: C.green },
            { label: "COMISIÓN", sub: "Cálculo auto", color: C.accent },
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ background: `${step.color}15`, border: `1px solid ${step.color}33`, borderRadius: 8, padding: "10px 14px", textAlign: "center", minWidth: 90 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: step.color, fontFamily: font }}>{step.label}</div>
                <div style={{ fontSize: 9, color: C.textMuted, fontFamily: fontMono, marginTop: 2 }}>{step.sub}</div>
              </div>
              {i < 2 && <span style={{ color: C.accent, fontSize: 16, fontWeight: 700 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ background: C.accentBg, border: `1px solid ${C.accentDim}`, borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.accent, fontFamily: font }}><strong>Principio clave:</strong> La fuente de verdad es la venta y el cobro. El Excel de comisiones se elimina — solo generaba problemas.</div>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: fontMono, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Funcionalidades</div>
        {["Cálculo automático basado en parámetros de venta", "Desglose por vendedor, proyecto y período", "Integración directa con módulo de cobros", "Exportable para contabilidad formal"].map((item, i) => (
          <div key={i} style={{ fontSize: 12, color: C.textMuted, fontFamily: font, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.accent, marginRight: 8 }}>›</span>{item}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 5 — MULTI-TENANT ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════════
const SlideArquitectura = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="Cada S.A. aislada — consolidado automático a nivel holding">Arquitectura Multi-Tenant</SectionTitle>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ background: C.accentBg, border: `1px solid ${C.accentDim}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.accent, fontFamily: font }}>HOLDING — Vista Consolidada</div>
        <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font, marginTop: 4 }}>Capital levantado, rendimientos, financiamiento, reportes globales</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 8 }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: 2, height: 20, background: C.accentDim }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { name: "S.A. 1", project: "Boulevard 5", color: C.blue },
          { name: "S.A. 2", project: "Gran Hava", color: C.green },
          { name: "S.A. 3", project: "Proyecto C", color: C.purple },
          { name: "S.A. N", project: "Nuevos proyectos", color: C.orange },
        ].map((sa, i) => (
          <div key={i} style={{ background: `${sa.color}10`, border: `1px solid ${sa.color}33`, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: sa.color, fontFamily: font }}>{sa.name}</div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: fontMono, marginTop: 2 }}>{sa.project}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
      {[
        { title: "FRONTEND", sub: "Aplicaciones", color: C.blue, items: ["Portal Comercial (PAI APP)", "Dashboard Gerencial", "App Junta Directiva", "Notificaciones automáticas"] },
        { title: "BACKEND", sub: "Motor de Negocio", color: C.accent, items: ["API Centralizada", "Motor de Cobros", "Motor de Comisiones", "Reportes Automáticos"] },
        { title: "DATA", sub: "Fuente de Verdad", color: C.green, items: ["Base de Datos Central", "Multi-tenant por S.A.", "Consolidado Holding", "Histórico completo + auditoría"] },
      ].map((layer, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: layer.color, fontFamily: font }}>{layer.title}</div>
          <div style={{ fontSize: 10, color: C.textMuted, fontFamily: fontMono, marginBottom: 8 }}>{layer.sub}</div>
          {layer.items.map((item, j) => (
            <div key={j} style={{ fontSize: 12, color: C.textMuted, fontFamily: font, padding: "3px 0" }}>
              <span style={{ color: layer.color, marginRight: 6 }}>✓</span>{item}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 6 — PLAN MAESTRO 13 FASES
// ═══════════════════════════════════════════════════════════════════════
const PLAN_PHASES = [
  { id: 1, fase: "Sesiones de levantamiento por empresa", resp: "Directores + JL", pct: 100, status: "done" },
  { id: 2, fase: "Diagnóstico contable y financiero", resp: "Leonel + JL", pct: 75, status: "progress" },
  { id: 3, fase: "Evaluación funcionalidades Odoo", resp: "JL", pct: 80, status: "progress" },
  { id: 4, fase: "Documento de requerimientos consolidado", resp: "JL", pct: 60, status: "progress" },
  { id: 5, fase: "Selección partner Odoo", resp: "JL", pct: 100, status: "done" },
  { id: 6, fase: "Plan implementación multi-empresa", resp: "JL + Partner", pct: 35, status: "progress" },
  { id: 7, fase: "Apps complementarias por giro", resp: "JL + Directores", pct: 70, status: "progress" },
  { id: 8, fase: "Presupuesto Odoo (licencia + impl.)", resp: "JL + Leonel", pct: 55, status: "progress" },
  { id: 9, fase: "Presupuesto apps complementarias", resp: "JL", pct: 40, status: "progress" },
  { id: 10, fase: "Presupuesto total → aprobación Junta", resp: "JL", pct: 20, status: "pending" },
  { id: 11, fase: "Estructura operativa de sistemas", resp: "JL", pct: 50, status: "progress" },
  { id: 12, fase: "Seguridad informática", resp: "JL", pct: 85, status: "progress" },
  { id: 13, fase: "Marco legal (NDA, contratos)", resp: "Octavio", pct: 15, status: "pending" },
];

const SlideAvance = () => {
  const done = PLAN_PHASES.filter(p => p.status === "done").length;
  const progress = PLAN_PHASES.filter(p => p.status === "progress").length;
  const avgPct = Math.round(PLAN_PHASES.reduce((a, p) => a + p.pct, 0) / PLAN_PHASES.length);
  return (
    <div style={{ padding: "24px 36" }}>
      <SectionTitle sub="Plan de 13 fases — estado actual de cada una">Avance del Plan Maestro</SectionTitle>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <KPICard label="Completadas" value={`${done} / ${PLAN_PHASES.length}`} accent />
        <KPICard label="En progreso" value={progress} />
        <KPICard label="Avance general" value={`${avgPct}%`} />
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: font, fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {["#", "Fase", "Resp.", "Avance", "Estado"].map((h, i) => (
                <th key={i} style={{ padding: "8px 12px", textAlign: "left", fontSize: 9, fontFamily: fontMono, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PLAN_PHASES.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}08` }}>
                <td style={{ padding: "6px 12px", color: C.textDim, fontFamily: fontMono, fontSize: 10 }}>{String(p.id).padStart(2, "0")}</td>
                <td style={{ padding: "6px 12px", color: C.text, fontWeight: 500, fontSize: 12 }}>{p.fase}</td>
                <td style={{ padding: "6px 12px", color: C.textMuted, fontFamily: fontMono, fontSize: 10 }}>{p.resp}</td>
                <td style={{ padding: "6px 12px", width: 130 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ProgressBar pct={p.pct} color={p.status === "done" ? C.green : p.status === "progress" ? C.blue : C.orange} h={4} />
                    <span style={{ fontSize: 10, fontFamily: fontMono, color: C.textMuted, minWidth: 28 }}>{p.pct}%</span>
                  </div>
                </td>
                <td style={{ padding: "6px 12px" }}><StatusBadge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 7 — CRONOGRAMA 2026
// ═══════════════════════════════════════════════════════════════════════
const MONTHS = ["FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const GANTT = [
  { name: "Sprint 0 / Inducción", s: 0, e: 1, color: C.accent, indent: false },
  { name: "Partner Odoo", s: 1, e: 2, color: C.accent, indent: false },
  { name: "Fase 1 — ERP Base", s: 2, e: 6, color: C.blue, indent: false },
  { name: "Contabilidad multiempresa", s: 2, e: 5, color: `${C.blue}99`, indent: true },
  { name: "Consolidación financiera", s: 4, e: 6, color: `${C.blue}99`, indent: true },
  { name: "Fase 2 — Apps por giro", s: 5, e: 9, color: C.green, indent: false },
  { name: "Cobros y Comisiones", s: 5, e: 7, color: `${C.green}99`, indent: true },
  { name: "Integraciones ERP", s: 7, e: 9, color: `${C.green}99`, indent: true },
  { name: "Seguridad informática", s: 0, e: 10, color: C.purple, indent: false },
  { name: "Gobernanza + Entregables", s: 1, e: 10, color: C.orange, indent: false },
  { name: "Soporte y Ampliaciones", s: 8, e: 10, color: C.textMuted, indent: false },
];
const NOW = 1; // March = index 1

const SlideCronograma = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="ERP Inmobiliario + Apps por giro — Febrero a Diciembre 2026">Cronograma Preliminar 2026</SectionTitle>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, overflow: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "180px repeat(11, 1fr)", gap: 0, marginBottom: 8 }}>
        <div />
        {MONTHS.map((m, i) => (
          <div key={m} style={{
            fontSize: 10, fontFamily: fontMono, color: i === NOW ? C.accent : C.textDim,
            textAlign: "center", fontWeight: i === NOW ? 700 : 400, padding: "4px 0",
            borderBottom: i === NOW ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          }}>{m}</div>
        ))}
      </div>
      {GANTT.map((t, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "180px repeat(11, 1fr)", gap: 0, alignItems: "center", minHeight: 28 }}>
          <div style={{
            fontSize: 11, color: t.indent ? C.textMuted : C.text, fontFamily: font,
            fontWeight: t.indent ? 400 : 600, paddingLeft: t.indent ? 12 : 0,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{t.indent ? `  ${t.name}` : t.name}</div>
          {MONTHS.map((_, mi) => (
            <div key={mi} style={{
              height: 18, margin: "2px 1px", borderRadius: 3,
              background: mi >= t.s && mi <= t.e ? t.color : "transparent",
            }} />
          ))}
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "180px repeat(11, 1fr)", gap: 0, marginTop: 8 }}>
        <div style={{ fontSize: 10, fontFamily: fontMono, color: C.accent }}>▲ ESTAMOS AQUÍ</div>
        {MONTHS.map((_, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            {i === NOW && <div style={{ width: 8, height: 8, background: C.accent, borderRadius: "50%", margin: "0 auto" }} />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 8 — EXCELS KILLED
// ═══════════════════════════════════════════════════════════════════════
const EXCELS = [
  { name: "Ventas totales por proyecto", area: "Comercial", status: "eliminated" },
  { name: "Ventas vs objetivos", area: "Comercial", status: "eliminated" },
  { name: "Déficit/superávit por asesor", area: "Comercial", status: "eliminated" },
  { name: "Control de inventario", area: "Comercial", status: "eliminated" },
  { name: "Cálculo de comisiones", area: "Administración", status: "eliminated" },
  { name: "Expedientes de cumplimiento", area: "Créditos", status: "eliminated" },
  { name: "Precalificaciones bancarias", area: "Créditos", status: "eliminated" },
  { name: "Desistimientos", area: "Comercial", status: "in_progress" },
  { name: "Entregas y escrituración", area: "Legal", status: "in_progress" },
  { name: "Cobros y cartera", area: "Cobros", status: "pending" },
  { name: "Reportería contable consolidada", area: "Contabilidad", status: "pending" },
];

const SlideExcels = () => {
  const eliminated = EXCELS.filter(e => e.status === "eliminated").length;
  return (
    <div style={{ padding: "28px 36" }}>
      <SectionTitle sub={`${eliminated} de ${EXCELS.length} hojas de cálculo eliminadas de la operación`}>Eliminación de Excel</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20, padding: "14px 18px", background: C.greenDim, border: `1px solid rgba(52,211,153,0.2)`, borderRadius: 10 }}>
        <div style={{ fontSize: 38, fontWeight: 800, color: C.green, fontFamily: fontMono }}>{eliminated}/{EXCELS.length}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.green, fontFamily: font }}>Excels eliminados de la operación</div>
          <div style={{ fontSize: 12, color: C.textMuted, fontFamily: font }}>Cada Excel eliminado = una fuente de error menos y horas-hombre recuperadas permanentemente.</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {EXCELS.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 14px" }}>
            <div>
              <div style={{ fontSize: 12, color: C.text, fontFamily: font, fontWeight: 500 }}>{e.name}</div>
              <div style={{ fontSize: 10, color: C.textDim, fontFamily: fontMono }}>{e.area}</div>
            </div>
            <StatusBadge status={e.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// SLIDE 9 — PRÓXIMOS PASOS
// ═══════════════════════════════════════════════════════════════════════
const SlideNext = () => (
  <div style={{ padding: "28px 36" }}>
    <SectionTitle sub="Acciones inmediatas y visión a mediano plazo">Próximos Pasos</SectionTitle>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontFamily: fontMono, color: C.accent, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Corto plazo (Marzo–Abril)</div>
        <Bullet color={C.accent}>Completar módulos de desistimientos y entregas</Bullet>
        <Bullet color={C.accent}>Integración PipeDrive ↔ Odoo vía webhooks</Bullet>
        <Bullet color={C.accent}>Módulo de cobros y cartera (siguiente área)</Bullet>
        <Bullet color={C.accent}>Habilitación completa licencia Odoo multiempresa</Bullet>
        <Bullet color={C.accent}>Configuración contabilidad multiempresa en Odoo</Bullet>
      </div>
      <div>
        <div style={{ fontSize: 11, fontFamily: fontMono, color: C.blue, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Mediano plazo (Mayo–Julio)</div>
        <Bullet color={C.blue}>Consolidación financiera por proyecto y holding</Bullet>
        <Bullet color={C.blue}>Reportería contable en tiempo real desde Odoo</Bullet>
        <Bullet color={C.blue}>Dashboards consolidados a nivel de holding</Bullet>
        <Bullet color={C.blue}>Presupuesto total consolidado para aprobación</Bullet>
        <Bullet color={C.blue}>Eliminación al 100% de Excels en PAI</Bullet>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
      {[
        { icon: "🎧", title: "Soporte", desc: "Modelo de administración post-implementación con SLAs claros.", color: C.blue },
        { icon: "🔒", title: "Seguridad", desc: "Implementada desde Día 1. Coordinación con Lomax + seguridad de apps.", color: C.green },
        { icon: "⚖️", title: "Legal", desc: "NDA + candados contractuales. Protección de datos, código y propiedad intelectual.", color: C.purple },
      ].map((item, i) => (
        <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 18, marginBottom: 6 }}>{item.icon}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: item.color, fontFamily: font, marginBottom: 4 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, fontFamily: font, lineHeight: 1.4 }}>{item.desc}</div>
        </div>
      ))}
    </div>
    <div style={{ background: C.accentBg, border: `1px solid ${C.accentDim}`, borderRadius: 10, padding: 18, textAlign: "center" }}>
      <div style={{ fontSize: 16, fontFamily: fontDisplay, color: C.accent, fontWeight: 700, marginBottom: 6 }}>Resultado Esperado</div>
      <div style={{ fontSize: 13, color: C.textMuted, fontFamily: font, lineHeight: 1.6 }}>
        Eliminación total de Excel · Sistematización 100% multiempresa · Reportería en tiempo real desde contabilidad · Dashboards interactivos con drill-down por área
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: C.textDim, fontFamily: fontMono }}>
        "Sin proceso no hay sistema. El proceso ya existe — ahora lo digitalizamos."
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// MAIN NAVIGATION
// ═══════════════════════════════════════════════════════════════════════
const SLIDES = [
  { label: "Portada", comp: SlidePortada },
  { label: "Diagnóstico", comp: SlideDiagnostico },
  { label: "Estrategia", comp: SlideEstrategia },
  { label: "PAI APP", comp: SlidePAI },
  { label: "Cobros", comp: SlideCobrosComisiones },
  { label: "Arquitectura", comp: SlideArquitectura },
  { label: "Avance", comp: SlideAvance },
  { label: "Cronograma", comp: SlideCronograma },
  { label: "Excels", comp: SlideExcels },
  { label: "Próximos", comp: SlideNext },
];

export default function Presentation() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); setSlide(s => Math.min(s + 1, SLIDES.length - 1)); }
      if (e.key === "ArrowLeft") { e.preventDefault(); setSlide(s => Math.max(s - 1, 0)); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const Comp = SLIDES[slide].comp;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: C.bg }}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ width: 6, flexShrink: 0, background: C.accent }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0, fontFamily: font, color: C.text, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: `1px solid ${C.accentDim}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontFamily: fontDisplay, color: C.accent, fontWeight: 700 }}>GRUPO ORIÓN</span>
          <span style={{ color: C.textDim }}>·</span>
          <span style={{ fontSize: 12, color: C.textMuted, fontFamily: fontMono }}>Puerta Abierta Inmobiliaria</span>
        </div>
        <div style={{ fontSize: 11, fontFamily: fontMono, color: C.textDim }}>{slide + 1} / {SLIDES.length}</div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}><Comp /></div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 16px", borderTop: `1px solid ${C.accentDim}`, flexShrink: 0, flexWrap: "wrap" }}>
        <button onClick={() => setSlide(s => Math.max(s - 1, 0))} disabled={slide === 0}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: slide === 0 ? C.textDim : C.text, padding: "5px 12px", cursor: slide === 0 ? "default" : "pointer", fontFamily: fontMono, fontSize: 11, marginRight: 6, opacity: slide === 0 ? 0.4 : 1 }}>←</button>
        {SLIDES.map((s, i) => (
          <button key={i} onClick={() => setSlide(i)} style={{
            background: i === slide ? C.accent : "transparent", border: `1px solid ${i === slide ? C.accent : C.border}`,
            color: i === slide ? C.bg : C.textMuted, borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            fontFamily: fontMono, fontSize: 9, fontWeight: i === slide ? 700 : 500, transition: "all 0.2s", letterSpacing: 0.3, textTransform: "uppercase",
          }}>{s.label}</button>
        ))}
        <button onClick={() => setSlide(s => Math.min(s + 1, SLIDES.length - 1))} disabled={slide === SLIDES.length - 1}
          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: slide === SLIDES.length - 1 ? C.textDim : C.text, padding: "5px 12px", cursor: slide === SLIDES.length - 1 ? "default" : "pointer", fontFamily: fontMono, fontSize: 11, marginLeft: 6, opacity: slide === SLIDES.length - 1 ? 0.4 : 1 }}>→</button>
      </div>
      </div>
    </div>
  );
}
