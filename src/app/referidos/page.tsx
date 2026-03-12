import { Suspense } from "react";
import ReferidosClient from "./referidos-client";

export default function ReferidosPage() {
  return (
    <Suspense>
      <ReferidosClient />
    </Suspense>
  );
}
