import { Suspense } from "react";
import BuyerPersonaClient from "./buyer-persona-client";

export default function BuyerPersonaPage() {
  return (
    <Suspense>
      <BuyerPersonaClient />
    </Suspense>
  );
}
