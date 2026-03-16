import type { Metadata } from "next";
import CartaPagoClient from "./carta-pago-client";

export const metadata: Metadata = {
  title: "Carta de Pago | Puerta Abierta",
};

export default async function CartaPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CartaPagoClient reservationId={id} />;
}
