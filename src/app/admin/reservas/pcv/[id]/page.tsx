import type { Metadata } from "next";
import PcvClient from "./pcv-client";

export const metadata: Metadata = {
  title: "PCV | Puerta Abierta",
};

export default async function PcvPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PcvClient reservationId={id} />;
}
