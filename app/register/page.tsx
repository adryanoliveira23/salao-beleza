"use client";

import React, { useState, useEffect } from "react";
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
  Sun,
  Moon,
  Loader2,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [salonName, setSalonName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("agendly_theme_mode");
      const isDarkActive =
        savedTheme === "dark" ||
        document.documentElement.classList.contains("dark");
      setIsDark(isDarkActive);
      if (isDarkActive) {
        document.documentElement.classList.add("dark");
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) {
          document.documentElement.classList.add("dark");
          document.documentElement.setAttribute("data-theme", "dark");
          document.documentElement.style.colorScheme = "dark";
          localStorage.setItem("agendly_theme_mode", "dark");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.setAttribute("data-theme", "light");
          document.documentElement.style.colorScheme = "light";
          localStorage.setItem("agendly_theme_mode", "light");
        }
      }
      return next;
    });
  };

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
    <div className="min-h-screen bg-[#faf8f7] dark:bg-[#090a0f] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 py-8 transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Auras Sutis de Fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-rose-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-indigo-400/12 via-rose-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs sm:text-sm font-semibold transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>Voltar ao Início</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
          className="w-9 h-9 rounded-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
          aria-label="Alternar tema claro/escuro"
        >
          {isDark ? (
            <Sun size={16} className="text-amber-400" />
          ) : (
            <Moon size={16} className="text-zinc-600" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-[#12141c] rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 sm:p-9 md:p-10 border border-stone-200/90 dark:border-zinc-800 transition-all">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600 rounded-2xl mb-3 sm:mb-4 shadow-[0_4px_16px_rgba(244,63,94,0.35)] text-white">
              <Scissors size={26} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-1 tracking-tight">
              Comece agora
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Preencha seus dados para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Qual seu nome?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-stone-50/70 hover:bg-white focus:bg-white dark:bg-[#0b0c12] border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium transition-all shadow-2xs"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Melhor E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-stone-50/70 hover:bg-white focus:bg-white dark:bg-[#0b0c12] border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium transition-all shadow-2xs"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nome do seu Salão / Espaço
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 bg-stone-50/70 hover:bg-white focus:bg-white dark:bg-[#0b0c12] border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium transition-all shadow-2xs"
                  placeholder="Ex: Studio Bella"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Escolha uma Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 sm:pl-11 pr-11 py-2.5 sm:py-3 bg-stone-50/70 hover:bg-white focus:bg-white dark:bg-[#0b0c12] border border-stone-200 dark:border-zinc-700/80 rounded-xl focus:outline-none focus:border-rose-500 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20 text-base sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-medium transition-all shadow-2xs"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold py-3.5 sm:py-4 rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Preparando sua conta...</span>
                </>
              ) : (
                <>
                  <span>Continuar para Escolha do Plano</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200/80 dark:border-zinc-800 text-center text-xs sm:text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-rose-600 dark:text-rose-400 font-extrabold hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
