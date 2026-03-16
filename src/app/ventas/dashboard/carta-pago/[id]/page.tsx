import type { Metadata } from "next";
import CartaPagoClient from "@/app/admin/reservas/carta-pago/[id]/carta-pago-client";

export const metadata: Metadata = {
  title: "Carta de Pago | Puerta Abierta",
};

export default async function VentasCartaPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CartaPagoClient reservationId={id} />;
}
