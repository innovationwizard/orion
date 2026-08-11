import type { Metadata } from "next";
import { Exo_2, Michroma } from "next/font/google";
import OdooHudClient from "./odoo-hud-client";

const odooDisplay = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-odoo-display",
});

const odooBody = Exo_2({
  weight: ["300", "400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-odoo-body",
});

export const metadata: Metadata = {
  title: "ODOO HUD | Puerta Abierta",
  description:
    "Preparación de datos para la migración a Odoo v19 — cobertura de fuentes por área: Orion, Pipedrive, Odoo v15",
};

export default function OdooHudPage() {
  return (
    <div className={`${odooDisplay.variable} ${odooBody.variable}`}>
      <OdooHudClient />
    </div>
  );
}
