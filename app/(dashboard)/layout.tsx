import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardGuard } from "./DashboardGuard";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardGuard>
        <SidebarProvider>
          <div className="flex min-h-dvh bg-linear-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] font-sans text-[#2d1b2e]">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 pl-0 md:pl-[280px] overflow-hidden">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </DashboardGuard>
    </AuthProvider>
  );
}
