import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DashboardGuard } from "./DashboardGuard";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardGuard>
        <NotificationProvider>
          <SidebarProvider>
            <div className="flex min-h-dvh bg-linear-to-br from-primary-light via-primary-light-hover to-white font-sans text-[#2d1b2e]">
              <Sidebar />
              <main className="flex-1 flex flex-col min-w-0 pl-0 md:pl-[280px]">
                {children}
              </main>
            </div>
          </SidebarProvider>
        </NotificationProvider>
      </DashboardGuard>
    </AuthProvider>
  );
}
