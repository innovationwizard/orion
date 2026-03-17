"use client";

import { createContext, useContext } from "react";

interface SalespersonInfo {
  id: string;
  full_name: string;
  display_name: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  towers: {
    id: string;
    name: string;
    is_default: boolean;
    project_id: string;
  }[];
}

export interface VentasContextData {
  salesperson: SalespersonInfo;
  projects: ProjectInfo[];
}

const VentasContext = createContext<VentasContextData | null>(null);

export function VentasProvider({
  value,
  children,
}: {
  value: VentasContextData;
  children: React.ReactNode;
}) {
  return (
    <VentasContext.Provider value={value}>{children}</VentasContext.Provider>
  );
}

export function useVentasContext(): VentasContextData {
  const ctx = useContext(VentasContext);
  if (!ctx) {
    throw new Error("useVentasContext must be used within a VentasProvider");
  }
  return ctx;
}
