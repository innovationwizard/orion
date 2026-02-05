import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Orion | Payment Tracking",
  description: "Real estate payment tracking dashboard."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <main className="page">
          {children}
        </main>
      </body>
    </html>
  );
}
