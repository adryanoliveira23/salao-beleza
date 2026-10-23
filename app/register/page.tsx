"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Mail,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salonName, setSalonName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    localStorage.setItem(
      "user_registration",
      JSON.stringify({ name, email, salonName, password }),
    );

    setTimeout(() => {
      router.push("/escolher-plano");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-[#fbf2f6] to-white flex flex-col items-center justify-center p-4 sm:p-6 py-8">
      <div className="w-full max-w-md mb-3 sm:mb-4 flex items-center justify-start">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#2d1b2e]/60 hover:text-[var(--primary)] text-xs sm:text-sm font-semibold transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Voltar ao Início
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 border border-[#f0e4ea]">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl mb-3 sm:mb-4 shadow-md text-white">
              <Scissors size={26} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2d1b2e] mb-1.5 font-sans tracking-tight">
              Comece agora
            </h1>
            <p className="text-xs sm:text-sm text-[#2d1b2e]/70">
              Preencha seus dados para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                Qual seu nome?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-[#2d1b2e]/15 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all text-sm text-[#2d1b2e] font-medium"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                Melhor E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-[#2d1b2e]/15 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all text-sm text-[#2d1b2e] font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                Nome do seu Salão / Espaço
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 border border-[#2d1b2e]/15 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all text-sm text-[#2d1b2e] font-medium"
                  placeholder="Ex: Studio Bella"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                Escolha uma Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 border border-[#2d1b2e]/15 rounded-xl focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all text-sm text-[#2d1b2e] font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#2d1b2e]/40 hover:text-[var(--primary)] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm mt-2"
            >
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  Ver Planos
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2d1b2e]/10 text-center space-y-2 text-xs sm:text-sm">
            <p className="text-[#2d1b2e]/60">
              Após escolher o plano, seu acesso completo ao sistema será liberado imediatamente.
            </p>
            <p className="text-[#2d1b2e]/60">
              Já tem conta?{" "}
              <Link href="/login" className="text-[var(--primary)] font-bold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
