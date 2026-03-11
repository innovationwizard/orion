import { Suspense } from "react";
import DashboardClient from "./dashboard-client";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-card rounded-2xl p-4 shadow-card grid gap-2.5">
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "40%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "90%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "85%" }} />
          <div className="h-3.5 rounded-full bg-gradient-to-r from-[#eef2f7] via-[#f8fafc] to-[#eef2f7] animate-pulse" style={{ width: "80%" }} />
        </section>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
