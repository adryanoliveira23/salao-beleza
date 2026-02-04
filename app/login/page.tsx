"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message || "Erro ao realizar login");
      } else {
        setError("Erro ao realizar login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-[#FF6B9D] to-[#C77DFF] rounded-2xl mb-4 shadow-lg">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b2e] mb-2">
              Bem-vindo
            </h1>
            <p className="text-[#2d1b2e]/70">Entre para gerenciar seu salão</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] focus:ring-2 focus:ring-[#FF6B9D]/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="••••••••"
                  required
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
              disabled={loading}
              className="w-full bg-linear-to-r from-[#FF6B9D] to-[#C77DFF] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2d1b2e]/10 text-center">
            <p className="text-sm text-[#2d1b2e]/50">
              Esqueceu sua senha?{" "}
              <a href="#" className="text-[#FF6B9D] hover:underline">
                Recuperar acesso
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
