import { Suspense } from "react";
import ValorizacionClient from "./valorizacion-client";

export default function ValorizacionPage() {
  return (
    <Suspense>
      <ValorizacionClient />
    </Suspense>
  );
}
