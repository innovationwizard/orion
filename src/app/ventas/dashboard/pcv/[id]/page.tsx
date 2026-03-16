import type { Metadata } from "next";
import PcvClient from "@/app/admin/reservas/pcv/[id]/pcv-client";

export const metadata: Metadata = {
  title: "PCV | Puerta Abierta",
};

export default async function VentasPcvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PcvClient reservationId={id} readOnly />;
}
