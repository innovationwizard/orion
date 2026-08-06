import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import HudClient from "./hud-client";

const hudDisplay = Press_Start_2P({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-hud-display",
});

const hudBody = VT323({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-hud-body",
});

export const metadata: Metadata = {
  title: "PAI HUD | Puerta Abierta",
  description: "HUD de avance por área — Ventas, Mercadeo, Cobros, Créditos, Cumplimiento",
};

export default function HudPage() {
  return (
    <div className={`${hudDisplay.variable} ${hudBody.variable}`}>
      <HudClient />
    </div>
  );
}
