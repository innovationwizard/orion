import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Orion | Reservas, Pagos y Comisiones",
  description: "Panel de Orion.",
  icons: {
    icon: "/favicon.png"
  },
  openGraph: {
    title: "Orion | Reservas, Pagos y Comisiones",
    description: "Panel de Orion.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Orion"
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
