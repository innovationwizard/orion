import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const metadataBase = new URL(
  siteUrl ?? "https://orion-intelligence.vercel.app"
);

const baseUrl = metadataBase.origin;
const ogImageUrl = `${baseUrl}/og-image.jpg`;

const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;

export const metadata: Metadata = {
  title: "Orion | Reservas, Pagos y Comisiones",
  description: "ORION - Business Intelligence Dashboard",
  metadataBase,
  icons: {
    icon: "/favicon.png"
  },
  openGraph: {
    type: "website",
    title: "Orion | Reservas, Pagos y Comisiones",
    description: "ORION - Business Intelligence Dashboard",
    url: `${baseUrl}/`,
    siteName: "ORION",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Orion",
        type: "image/jpeg"
      }
    ]
  },
  other: {
    "og:type": "website",
    ...(fbAppId && { "fb:app_id": fbAppId })
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
