import type { Metadata } from "next";
import CartaClient from "@/app/admin/reservas/carta-autorizacion/[id]/carta-client";

export const metadata: Metadata = {
  title: "Carta de Autorización | Puerta Abierta",
};

export default async function VentasCartaAutorizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CartaClient reservationId={id} />;
}
