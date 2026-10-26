import React from "react";
import { Sidebar } from "@/components/Sidebar";
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
          <main className="flex-1 flex flex-col min-w-0 pl-0 md:pl-[248px] pb-24 md:pb-0">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </DashboardGuard>
  );
}
