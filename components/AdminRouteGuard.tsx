"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se estiver na página de login, não aplicar proteção
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Só redirecionar se não estiver na página de login
    if (mounted && !isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [mounted, isAuthenticated, isLoading, router, isLoginPage]);

  // Se estiver na página de login, sempre permitir acesso
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Durante SSR e hidratação inicial, sempre mostrar loading
  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B9D] mx-auto mb-4"></div>
          <p className="text-[#2d1b2e] font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Retornar um elemento vazio mas válido durante o redirecionamento
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B9D] mx-auto mb-4"></div>
          <p className="text-[#2d1b2e] font-medium">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
