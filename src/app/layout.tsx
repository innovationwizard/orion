import type { ReactNode } from "react";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata = {
  title: "Orion | Reservas, Pagos y Comisiones",
  description: "ORION - Business Intelligence Dashboard",
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  icons: {
    icon: "/favicon.png"
  },
  openGraph: {
    title: "Orion | Reservas, Pagos y Comisiones",
    description: "ORION - Business Intelligence Dashboard",
    url: siteUrl ?? "https://orion-intelligence.vercel.app/",
    siteName: "ORION",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Orion",
        type: "image/png"
      }
    ]
  }
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es-419">
      <body>
        <main className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
