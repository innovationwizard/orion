"use client";

import { useRef } from "react";
import { toJpeg } from "html-to-image";
import CapabilityChart from "../../../BEX/bex_capability_chart";

// Letter size: 8.5" × 11" at 96 DPI (screen) = 816 × 1056 px
// Export at 300 DPI: 2550 × 3300 px via pixelRatio
const LETTER_W = 816;
const LETTER_H = 1056;
const PIXEL_RATIO = 300 / 96; // ~3.125 for 300 DPI

export default function BEXExportPage() {
  const chartRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toJpeg(chartRef.current, {
        quality: 0.95,
        pixelRatio: PIXEL_RATIO,
      });
      const link = document.createElement("a");
      link.download = "bex-capability-chart.jpg";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }

  return (
    <div className="page" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>BEX Capability Chart</h1>
        <button type="button" className="button" onClick={handleExport}>
          Export to JPG (Letter, 300 DPI)
        </button>
      </div>
      <div
        ref={chartRef}
        style={{
          width: LETTER_W,
          height: LETTER_H,
          backgroundColor: "white",
          overflow: "hidden",
        }}
      >
        <CapabilityChart forExport />
      </div>
    </div>
  );
}
