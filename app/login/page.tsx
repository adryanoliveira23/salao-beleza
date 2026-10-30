"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  // Se o usuário marcou "Lembrar-me" e já está autenticado no Firebase, redireciona direto pro dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const isRemembered = localStorage.getItem("bellamais_remember_session") !== "false";
      if (isRemembered) {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("bellamais_remembered_email");
      const savedRemember = localStorage.getItem("bellamais_remember_session");
      if (savedEmail) {
        setEmail(savedEmail);
      }
      if (savedRemember !== null) {
        setRememberMe(savedRemember === "true");
      }
    } catch {
      // Ignorar caso localStorage não esteja acessível em modo privado
    }

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (rememberMe) {
        localStorage.setItem("bellamais_remembered_email", email);
        localStorage.setItem("bellamais_remember_session", "true");
      } else {
        localStorage.removeItem("bellamais_remembered_email");
        localStorage.setItem("bellamais_remember_session", "false");
      }

      const {
        signInWithEmailAndPassword,
        setPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      } = await import("firebase/auth");
      const { auth } = await import("@/app/lib/firebase");

      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );

      await signInWithEmailAndPassword(auth, email, password);

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("auth/invalid-credential")) {
          setError("Email ou senha inválidos.");
        } else {
          setError(error.message || "Erro ao realizar login");
        }
      } else {
        setError("Erro ao realizar login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Enquanto verifica a sessão salva, se já existir usuário e estiver lembrado, exibe carregamento suave
  if (authLoading || (user && localStorage.getItem("bellamais_remember_session") !== "false")) {
    return (
      <div className="min-h-screen bg-[#faf8f7] dark:bg-[#090a0f] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-pulse">
            <Scissors size={22} />
          </div>
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Acessando seu salão...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f7] dark:bg-[#090a0f] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 py-8 transition-colors duration-200 relative overflow-hidden font-sans">
      {/* Auras Sutis de Fundo: Iluminação e Sofisticação */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-rose-400/15 via-pink-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-indigo-400/12 via-rose-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar com Navegação e Adaptador de Tema */}
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
          className="w-9 h-9 rounded-full bg-white dark:zinc-800 border border-stone-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
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
              Acesse sua Conta
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
              Entre com suas credenciais para gerenciar seu salão
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo de Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail size={18} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-xs sm:text-sm transition-all"
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={18} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-stone-50 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-xs sm:text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Lembrar-me e Esqueceu a Senha */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-stone-300 dark:border-zinc-700 text-rose-500 focus:ring-rose-500 cursor-pointer accent-rose-500"
                />
                <span className="font-semibold">Lembrar-me</span>
              </label>
              <Link
                href="/recuperar-senha"
                className="text-rose-600 dark:text-rose-400 font-bold hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-red-600 dark:text-red-300 text-xs sm:text-sm font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold py-3.5 sm:py-4 rounded-xl shadow-[0_4px_20px_rgba(244,63,94,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin text-white" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-200/80 dark:border-zinc-800 text-center text-xs sm:text-sm">
            <p className="text-zinc-500 dark:text-zinc-400">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="text-rose-600 dark:text-rose-400 font-extrabold hover:underline"
              >
                Crie sua conta aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
