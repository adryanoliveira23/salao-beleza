"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Lock, Shield, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!accessKey.trim()) {
      setError("Por favor, insira a chave de acesso");
      setIsLoading(false);
      return;
    }

    const success = login(accessKey);

    if (success) {
      router.push("/admin");
    } else {
      setError("Chave de acesso inválida");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] flex items-center justify-center p-3.5 sm:p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 border border-[#f0e4ea]">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF6B9D] to-[#C77DFF] rounded-2xl mb-3 sm:mb-4 shadow-md text-white">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2d1b2e] mb-1.5 font-sans tracking-tight">
              Área Administrativa
            </h1>
            <p className="text-xs sm:text-sm text-[#2d1b2e]/70">
              Digite a chave de acesso para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="accessKey"
                className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5"
              >
                Chave de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-[#2d1b2e]/15 rounded-xl focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all text-sm text-[#2d1b2e] font-medium"
                  placeholder="Digite a chave de acesso"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isLoading ? "Verificando..." : "Acessar"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[#2d1b2e]/10">
            <p className="text-xs text-center text-[#2d1b2e]/50">
              Acesso restrito apenas para administradores autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
