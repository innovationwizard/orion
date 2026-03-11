import { Suspense } from "react";
import type { Metadata } from "next";
import ReservasAdminClient from "./reservas-admin-client";

export const metadata: Metadata = {
  title: "Reservas Admin | Puerta Abierta",
  description: "Panel de administración de reservas",
};

export default function ReservasAdminPage() {
  return (
    <Suspense>
      <ReservasAdminClient />
    </Suspense>
  );
}
