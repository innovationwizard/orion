import type { Metadata } from "next";
import HudClient from "./hud-client";

export const metadata: Metadata = {
  title: "PAI HUD | Puerta Abierta",
  description: "HUD de avance por área — Ventas, Mercadeo, Cobros, Créditos, Cumplimiento",
};

export default function HudPage() {
  return <HudClient />;
}
