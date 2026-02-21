"use client";

import { useRef } from "react";
import { toJpeg } from "html-to-image";
import OdooBillableChart from "../../../BEX/odoo_billable_chart";

const PIXEL_RATIO = 300 / 96;

export default function OdooExportPage() {
  const chartRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    if (!chartRef.current) return;
    try {
      const dataUrl = await toJpeg(chartRef.current, {
        quality: 0.95,
        pixelRatio: PIXEL_RATIO,
      });
      const link = document.createElement("a");
      link.download = "odoo-billable-chart.jpg";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }

  return (
    <div className="page" style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>Odoo Billable Chart</h1>
        <button type="button" className="button" onClick={handleExport}>
          Export to JPG (300 DPI)
        </button>
      </div>
      <div
        ref={chartRef}
        style={{
          width: 900,
          minHeight: 1200,
          backgroundColor: "white",
          overflow: "hidden",
        }}
      >
        <OdooBillableChart forExport />
      </div>
    </div>
  );
}
