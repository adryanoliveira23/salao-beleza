"use client";

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
    // Só redirecionar se já estiver autenticado
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#FF6B9D] to-[#C77DFF] rounded-2xl mb-4 shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b2e] mb-2">
              Área Administrativa
            </h1>
            <p className="text-[#2d1b2e]/70">
              Digite a chave de acesso para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="accessKey"
                className="block text-sm font-medium text-[#2d1b2e] mb-2"
              >
                Chave de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="Digite a chave de acesso"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Verificando..." : "Acessar"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#2d1b2e]/10">
            <p className="text-xs text-center text-[#2d1b2e]/50">
              Acesso restrito apenas para administradores autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
