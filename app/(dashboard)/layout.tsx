import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardMain } from "@/components/DashboardMain";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { DashboardGuard } from "./DashboardGuard";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardGuard>
      <SidebarProvider>
        <div className="flex min-h-dvh bg-[var(--background)] font-sans text-[var(--foreground)] antialiased selection:bg-[var(--primary)] selection:text-white">
          <Sidebar />
          <DashboardMain>{children}</DashboardMain>
        </div>
      </SidebarProvider>
    </DashboardGuard>
  );
}
