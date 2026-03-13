import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "PAI | Reservas, Pagos y Comisiones",
  description: "Puerta Abierta Inmobiliaria — Business Intelligence Dashboard",
  metadataBase,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Reservar",
  },
  openGraph: {
    type: "website",
    title: "PAI | Reservas, Pagos y Comisiones",
    description: "Puerta Abierta Inmobiliaria — Business Intelligence Dashboard",
    url: `${baseUrl}/`,
    siteName: "Puerta Abierta Inmobiliaria",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Puerta Abierta Inmobiliaria",
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
        <main className="p-[clamp(16px,4vw,32px)] grid gap-[clamp(16px,3vw,28px)]">
          {children}
        </main>
      </body>
    </html>
  );
}
