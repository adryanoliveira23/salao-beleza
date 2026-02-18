"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Mail,
  ArrowRight,
  CheckCircle2,
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
    <div className="min-h-screen bg-linear-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff] flex items-center justify-center p-4 relative">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-[#2d1b2e]/60 hover:text-[#FF6B9D] font-medium transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Voltar ao Login
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-[#FF6B9D] to-[#C73866] rounded-2xl mb-4 shadow-lg">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b2e] mb-2 font-serif">
              Recuperar Senha
            </h1>
            <p className="text-[#666]">
              {submitted
                ? "Verifique sua caixa de entrada"
                : "Informe seu e-mail para receber o link de recuperação"}
            </p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 flex items-center justify-center gap-2">
                <CheckCircle2 size={24} />
                <span className="font-semibold">E-mail enviado!</span>
              </div>
              <p className="text-[#666] mb-8 text-sm">
                Enviamos um link de recuperação para <strong>{email}</strong>.
                Verifique também sua caixa de spam.
              </p>
              <Link
                href="/login"
                className="block w-full bg-[#f5f5f5] text-[#2d1b2e] font-semibold py-3.5 rounded-xl hover:bg-[#eee] transition-colors"
              >
                Voltar para o Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#2d1b2e]/40" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#f0f0f0] rounded-xl focus:outline-none focus:border-[#FF6B9D] transition-all text-[#2d1b2e] font-medium"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-linear-to-r from-[#FF6B9D] to-[#C73866] text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    Enviar Link
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
