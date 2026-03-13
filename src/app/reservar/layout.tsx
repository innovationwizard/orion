import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  icons: {
    icon: "/icons/reservar/icon-192.png",
    apple: "/icons/reservar/apple-touch-icon.png",
  },
};

export default function ReservarLayout({ children }: { children: ReactNode }) {
  return children;
}
