import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Orion | Reservas, Pagos y Comisiones",
  description: "Orion Dashboard"
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
