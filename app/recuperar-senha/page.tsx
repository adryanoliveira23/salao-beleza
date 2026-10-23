"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scissors,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app } from "@/app/lib/firebase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = getAuth(app);
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("E-mail não encontrado.");
      } else {
        setError("Erro ao enviar e-mail. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-[#fbf2f6] to-white flex flex-col items-center justify-center p-4 sm:p-6 py-8">
      <div className="w-full max-w-md mb-3 sm:mb-4 flex items-center justify-start">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[#2d1b2e]/60 hover:text-[var(--primary)] text-xs sm:text-sm font-semibold transition-colors group"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Voltar ao Login
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 border border-[#f0e4ea]">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-2xl mb-3 sm:mb-4 shadow-md text-white">
              <Scissors size={26} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2d1b2e] mb-1.5 font-sans tracking-tight">
              Recuperar Senha
            </h1>
            <p className="text-xs sm:text-sm text-[#2d1b2e]/70">
              {submitted
                ? "Verifique sua caixa de entrada"
                : "Informe seu e-mail para receber o link de recuperação"}
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-4 rounded-2xl mb-5 flex items-center justify-center gap-2.5 text-xs sm:text-sm">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <span className="font-bold">E-mail enviado com sucesso!</span>
              </div>
              <p className="text-[#666] mb-6 text-xs sm:text-sm leading-relaxed">
                Enviamos o link de redefinição para <strong>{email}</strong>. Verifique também a pasta de spam.
              </p>
              <Link
                href="/login"
                className="block w-full bg-[var(--primary)] text-white font-bold py-3 sm:py-3.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors text-sm"
              >
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#2d1b2e] mb-1.5">
                  E-mail cadastrado
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
                  "Enviando..."
                ) : (
                  <>
                    Enviar Link de Recuperação
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#2d1b2e]/10 text-center">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-[var(--primary)] font-semibold hover:underline"
            >
              Lembrou sua senha? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
