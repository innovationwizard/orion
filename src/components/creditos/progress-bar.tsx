"use client";

import { STATUS_COLORS } from "@/lib/creditos/helpers";

interface ProgressBarProps {
  vendido: number;
  reservado: number;
  disponible: number;
  total: number;
  height?: number;
}

export default function CreditProgressBar({
  vendido,
  reservado,
  disponible,
  total,
  height = 6,
}: ProgressBarProps) {
  if (!total) return null;

  const pV = (vendido / total) * 100;
  const pR = (reservado / total) * 100;
  const pD = (disponible / total) * 100;

  return (
    <div
      style={{
        height,
        background: "var(--color-bg, #f1f5f9)",
        borderRadius: height / 2,
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div
        style={{ width: `${pV}%`, background: STATUS_COLORS.VENDIDO, height: "100%" }}
        title={`Vendido: ${vendido}`}
      />
      <div
        style={{ width: `${pR}%`, background: STATUS_COLORS.RESERVADO, height: "100%" }}
        title={`Reservado: ${reservado}`}
      />
      <div
        style={{ width: `${pD}%`, background: STATUS_COLORS.DISPONIBLE, height: "100%" }}
        title={`Disponible: ${disponible}`}
      />
    </div>
  );
}
