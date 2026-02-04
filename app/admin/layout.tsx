"use client";

import React from "react";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { PlatformConfigProvider } from "@/contexts/PlatformConfigContext";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthProvider>
      <AdminRouteGuard>
        <PlatformConfigProvider>{children}</PlatformConfigProvider>
      </AdminRouteGuard>
    </AdminAuthProvider>
  );
}
