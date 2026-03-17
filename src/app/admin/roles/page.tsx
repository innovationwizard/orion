import { Suspense } from "react";
import type { Metadata } from "next";
import RolesClient from "./roles-client";

export const metadata: Metadata = {
  title: "Roles de Gestión | Puerta Abierta",
  description: "Gestión de roles gerenciales y comisiones condicionales por proyecto",
};

export default function RolesPage() {
  return (
    <Suspense>
      <RolesClient />
    </Suspense>
  );
}
