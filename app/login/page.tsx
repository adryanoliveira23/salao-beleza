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
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("bellamais_remembered_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignorar caso localStorage não esteja acessível em modo privado
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (rememberMe) {
        localStorage.setItem("bellamais_remembered_email", email);
      } else {
        localStorage.removeItem("bellamais_remembered_email");
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
              Bem-vindo
            </h1>
            <p className="text-xs sm:text-sm text-[#2d1b2e]/70">Entre para gerenciar seu salão</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                E-mail
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
                Senha
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

            {/* Lembrar-me e Esqueceu a Senha */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#2d1b2e]/80 hover:text-[#2d1b2e]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md border-[#2d1b2e]/20 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer accent-[var(--primary)]"
                />
                <span className="font-medium">Lembrar-me</span>
              </label>
              <Link
                href="/recuperar-senha"
                className="text-[var(--primary)] font-semibold hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs sm:text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white font-bold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
            >
              {loading ? (
                "Entrando..."
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#2d1b2e]/10 text-center text-xs sm:text-sm">
            <p className="text-[#2d1b2e]/60">
              Ainda não tem conta?{" "}
              <Link
                href="/register"
                className="text-[var(--primary)] font-bold hover:underline"
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
