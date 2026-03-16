import type { Metadata } from "next";
import CartaClient from "./carta-client";

export const metadata: Metadata = {
  title: "Carta de Autorización | Puerta Abierta",
};

export default async function CartaAutorizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CartaClient reservationId={id} />;
}
