# Plan: Cotizador — Project Image Banner + Compact Print Layout

**Date**: 2026-05-19
**Owner**: Jorge
**Status**: Pending approval

---

## Problem Statement

Sales reps have two linked complaints:

1. **"Make it look like the Excel cotizador"** — The Excel template has a project hero image as a full-width banner at the top. The web app has nothing.
2. **Signature orphaning** — On some units, the printed output overflows one page. The signature and validity lines end up alone at the top of page 2. Clients interpret this as suspicious or as bad intent. This is a business risk.

---

## Confirmed Specs (from user)

| Question | Answer |
|---|---|
| Image storage | Static files in `/public/projects/` — slug-based filename |
| Image placement (Excel) | Full-width banner **above** the header title |
| Current print state | Some units spill to page 2. Critical symptom: signature lines alone on page 2. |
| Image management | Static (no admin UI, no DB change) |

---

## Scope

**Files changed:**

| File | Nature of change |
|---|---|
| `src/app/cotizador/cotizador-client.tsx` | JSX structure + `printStyles` CSS string |
| `public/projects/*.{jpg,png}` | **Already placed** — 5 logo files, slug-named |

**No migrations. No new API routes. No changes to sub-components.**

---

## Part 1 — Project Logo

### What the files actually are (discovered during implementation)

Inspecting the provided images with `sips`:

| File copied to `/public/projects/` | Dimensions | Format | Alpha |
|---|---|---|---|
| `benestare.png` | 2250×2250 | PNG | **Yes** (transparent bg) |
| `bosque-las-tapias.jpg` | 1600×426 | JPEG | No |
| `boulevard-5.jpg` | 1008×379 | JPEG | No |
| `casa-elisa.jpg` | 1600×720 | JPEG | No |
| `santa-elena.jpg` | 1600×723 | JPEG | No |

These are **logos**, not hero photos. Benestare is a square (1:1) PNG with a transparent background. The others are banner-proportioned JPEGs. This rules out `object-fit: cover` — that would crop the Benestare square logo to a thin strip.

**Correct approach**: `object-fit: contain` in a fixed-height container. The logo scales to fit within the height constraint, preserving aspect ratio, with no cropping.

Benestare is the only PNG. The code needs a small extension map to resolve the correct filename per project.

### Files already placed (no action needed from user)

```
/public/projects/benestare.png          (68 KB, 2250×2250, PNG + alpha)
/public/projects/bosque-las-tapias.jpg  (36 KB, 1600×426)
/public/projects/boulevard-5.jpg        (20 KB, 1008×379)
/public/projects/casa-elisa.jpg         (50 KB, 1600×720)
/public/projects/santa-elena.jpg        (49 KB, 1600×723)
```

### Screen view

The logo container sits between `<NavBar />` and `<header>`, rendered as soon as `projectSlug` is set (no need to wait for unit selection — matches Excel).

Two new state variables:
- `imageError: boolean` — hides the element on 404 instead of showing a broken icon
- The extension lookup is a static const (not state)

```tsx
// Static extension map — only entries that differ from the .jpg default
const PROJECT_LOGO_EXT: Partial<Record<string, "png">> = {
  'benestare': 'png',
};

// New state (alongside existing state declarations)
const [imageError, setImageError] = useState(false);

// Reset on project change (add to existing project-change effect, or new effect)
useEffect(() => { setImageError(false); }, [projectSlug]);

// JSX — between <NavBar /> and <header>
{projectSlug && !imageError && (
  <div className="cotizador-project-banner">
    <img
      src={`/projects/${projectSlug}.${PROJECT_LOGO_EXT[projectSlug] ?? 'jpg'}`}
      alt={currentProject?.project_name ?? projectSlug}
      className="cotizador-project-banner-img"
      onError={() => setImageError(true)}
    />
  </div>
)}
```

Screen CSS (in the existing `<style>` block or inline):
```css
.cotizador-project-banner {
  display: flex;
  align-items: center;
  padding: 8px 0 4px;
}
.cotizador-project-banner-img {
  max-height: 72px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
  display: block;
}
```

Left-aligned matches the Excel layout and respects the document's left margin.

### Print output

In `@media print`, the logo renders at the very top of the page — before the title, matching Excel. `break-after: avoid` keeps the title on the same page as the logo.

`object-fit: contain` applies uniformly to all logos regardless of shape.

```css
/* New rules in printStyles */
.cotizador-project-banner {
  display: flex !important;
  align-items: center !important;
  break-after: avoid;
  padding: 0 0 3px !important;
}
.cotizador-project-banner-img {
  max-height: 1.5cm !important;
  width: auto !important;
  max-width: 60% !important;
  object-fit: contain !important;
  object-position: left center !important;
  display: block !important;
}
```

`max-width: 60%` prevents wide logos (BLT at 3.75:1) from consuming the full print width at 1.5cm height — they'd be ~5.6cm wide which is fine, but this caps it at a reasonable proportion.

---

## Part 2 — Fix Orphaned Signature + Tighten Print Layout

### 2a. Critical fix: prevent signature orphaning

**Root cause**: `disclaimers` and `cotizador-print-footer` are sibling elements with no page-break protection between them. When content fills exactly to the bottom of page 1, the footer flows alone onto page 2.

**Fix**: Wrap both inside a single `cotizador-print-bottom` container. This is the minimal, targeted change — no restructuring of sections, no risky rewrites.

JSX change in `cotizador-client.tsx` (wraps two existing elements):

```tsx
{/* Bottom block — disclaimers + signature, must never split across pages */}
<div className="cotizador-print-bottom">
  {disclaimers.length > 0 && (
    <section className="cotizador-disclaimers text-xs text-muted space-y-1 px-1">
      {disclaimers.map((d, i) => (
        <p key={i}>* {d}</p>
      ))}
    </section>
  )}

  {/* Print footer — visible only in print */}
  <div className="cotizador-print-footer" style={{ display: "none" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 16, borderTop: "1px solid #ddd" }}>
      <div>
        {salespersonName && <div>Asesor: {salespersonName}</div>}
        <div style={{ marginTop: 32, borderTop: "1px solid #000", width: 200, paddingTop: 4 }}>Firma</div>
      </div>
      <div style={{ textAlign: "right", fontSize: "9pt", color: "#888" }}>
        <div>Puerta Abierta Inmobiliaria</div>
        <div>Cotización válida {config.validity_days} días</div>
      </div>
    </div>
  </div>
</div>
```

Print CSS addition:

```css
/* Disclaimers + signature block — must stay on the same page, no orphans */
.cotizador-print-bottom {
  break-inside: avoid;
  break-before: avoid;
}
```

`break-inside: avoid` prevents the block from being split across pages.
`break-before: avoid` prevents a forced page break from being inserted just before this block.

Browser support: Chrome, Safari, Firefox, Edge — all support this correctly.

### 2b. Tighten margins and spacing

Adding the 2.5cm image requires recovering that space elsewhere. Targeted reductions:

| CSS rule | Current | New | Space saved |
|---|---|---|---|
| `@page` margin | `0.8cm 1.2cm` | `0.5cm 0.8cm` | ~0.6cm vertical |
| `.cotizador-page` gap | `4px` | `3px` | ~7 × 1px = 7px |
| `.cotizador-page section` padding | `4px 6px` | `3px 5px` | ~8px vertical |
| `.cotizador-page section` gap | `3px` | `2px` | small |
| `table th/td` padding | `1px 3px` | `1px 2px` | minor |
| Detail grid gap | `3px` | `2px` | minor |
| Unit summary item gap | `2px 12px` | `2px 8px` | minor |

Combined savings: approximately 1.5–2cm vertical, offsetting the image height.

### 2c. Rough per-configuration page budget after changes

Usable print area after new margins: `(27.94 - 1.0) cm = 26.94cm` vertical.

| Section | Estimated height |
|---|---|
| Project logo | 1.5cm |
| Header (title + date) | 1.0cm |
| Client identity section | 1.5cm |
| Unit summary (compact inline) | 1.0cm |
| Enganche summary + 7-cuota table | 4.0cm |
| Financing matrix (4 plazos, 2 rows) | 2.5cm |
| Escrituracion (3 rows) | 2.5cm |
| Disclaimers + signature | 2.0cm |
| Section gaps (8 × 3px) | 0.2cm |
| **Total (7-cuota, 4-plazo config)** | **~16.2cm ✓** |

7-cuota configurations (BEN, B5, CE): fit comfortably on one page with the image.

For 24–28 cuota configurations (BLT): the installment table alone is ~14cm. Those WILL overflow to a 2nd page — acceptable — but the `cotizador-print-bottom` wrapper guarantees the signature always ends up on the same page as the disclaimers, never alone.

---

## Implementation Order

1. Update `printStyles` constant:
   - New `@page` margins
   - Tighter gap/padding across sections
   - Banner print rules
   - `cotizador-print-bottom` rules

2. Add `imageError` state + reset in the project-change effect

3. Add `cotizador-project-banner` element in JSX (between `<NavBar />` and `<header>`)

4. Wrap existing disclaimers section + print-footer div inside `<div className="cotizador-print-bottom">`

5. ~~User drops image files~~ — already done. `/public/projects/` contains all 5 slug-named files.

6. Test print: BEN (7 cuotas), BLT Torre B (28 cuotas), B5, CE at their max-cuota configs

7. Verify: signature never appears alone on its own page in any configuration

---

## What This Does NOT Change

- No database migrations
- No API routes
- No admin UI
- `installment-table.tsx` — untouched
- `financing-matrix.tsx` — untouched
- `escrituracion-panel.tsx` — untouched
- PCV / Carta de Pago — untouched
- All computation logic — untouched

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Image 404 for a project | None — all 5 files placed | `onError` handler hides element as fallback |
| Benestare PNG shows white box on dark bg | None — cotizador background is white | Alpha renders correctly on white canvas |
| `break-before: avoid` ignored by some browser | Low | All modern browsers support this in print context |
| Tighter margins clip content on some printers | Low | 0.5cm is within standard printer margin minimums; browser print dialog adds safety |
| BLT 28-cuota still overflows | Expected | Acceptable — goal is no orphaned signature, not 1-page for all configs |
| `object-fit: contain` print rendering | None | Universally supported |
