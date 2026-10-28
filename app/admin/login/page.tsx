"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Lock, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (!password.trim()) {
      setError("Por favor, insira a senha de administrador.");
      setIsLoading(false);
      return;
    }

    const success = login(password.trim());

    if (success) {
      router.push("/admin");
    } else {
      setError("Senha de administrador incorreta.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--card-bg)] rounded-3xl shadow-xl p-6 sm:p-8 md:p-10 border border-[var(--card-border)]">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-[#7e1639] text-white rounded-2xl mb-3 sm:mb-4 shadow-md">
              <Shield size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-1.5 font-sans tracking-tight">
              Central de Controle
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Acesso administrativo restrito à gestão da rede BellaMais
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-semibold text-[var(--foreground)] mb-1.5"
              >
                Senha de Administrador
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--muted)]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl focus:outline-none focus:border-[#7e1639] focus:ring-2 focus:ring-[#7e1639]/20 transition-all text-sm text-[var(--foreground)] font-medium placeholder:text-[var(--muted)]"
                  placeholder="Digite a senha de acesso"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                  title={showPassword ? "Ocultar senha" : "Ver senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs sm:text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#7e1639] hover:bg-[#64112e] text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {isLoading ? "Verificando..." : "Entrar no Painel"}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-[var(--card-border)]">
            <p className="text-xs text-center text-[var(--muted)]">
              Acesso exclusivo para administradores da plataforma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
