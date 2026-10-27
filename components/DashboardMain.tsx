"use client";

import React from "react";
import { useSidebar } from "@/contexts/SidebarContext";

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { isDesktopOpen } = useSidebar();

  return (
    <main
      className={`flex-1 flex flex-col min-w-0 pb-20 md:pb-0 transition-[padding] duration-200 ease-in-out ${
        isDesktopOpen ? "pl-0 md:pl-[240px]" : "pl-0"
      }`}
    >
      {children}
    </main>
  );
}
