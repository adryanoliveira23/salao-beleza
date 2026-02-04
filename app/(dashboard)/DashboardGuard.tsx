"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-linear-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff]">
        <Loader2 className="w-12 h-12 text-[#FF6B9D] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
