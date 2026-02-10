import type { ReactNode } from "react";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const baseUrl = siteUrl ?? "https://orion-intelligence.vercel.app";
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/og-image.png`;

export const metadata = {
  title: "Orion | Reservas, Pagos y Comisiones",
  description: "ORION - Business Intelligence Dashboard",
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
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
        secureUrl: ogImageUrl,
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

const fbAppId = process.env.NEXT_PUBLIC_FB_APP_ID;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es-419">
      <head>
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Orion | Reservas, Pagos y Comisiones" />
        <meta property="og:description" content="ORION - Business Intelligence Dashboard" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:url" content={`${baseUrl}/`} />
        <meta property="og:site_name" content="ORION" />
        {fbAppId ? (
          <meta property="fb:app_id" content={fbAppId} />
        ) : null}
      </head>
      <body>
        <main className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
