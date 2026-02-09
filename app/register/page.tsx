"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
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

    // Simulate data collection
    localStorage.setItem(
      "user_registration",
      JSON.stringify({ name, email, salonName, password }),
    );

    setTimeout(() => {
      router.push("/escolher-plano");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-light via-primary-light-hover to-white flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-[#2d1b2e]/60 hover:text-primary font-medium transition-colors group"
      >
        <ArrowLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Voltar ao Início
      </Link>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-primary to-primary-dark rounded-2xl mb-4 shadow-lg">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#2d1b2e] mb-2">
              Comece agora
            </h1>
            <p className="text-[#2d1b2e]/70">
              Preencha seus dados para criar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Qual seu nome?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Melhor E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Nome do seu Salão
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="Ex: Studio Glow"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2d1b2e] mb-2">
                Escolha uma Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-[#2d1b2e]/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-[#2d1b2e] font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#2d1b2e]/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-primary to-primary-dark text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                "Salvando..."
              ) : (
                <>
                  Ver Planos
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2d1b2e]/10 text-center space-y-2">
            <p className="text-sm text-[#2d1b2e]/50">
              Após escolher o plano e realizar o pagamento, você receberá seus
              dados de acesso por e-mail.
            </p>
            <p className="text-sm text-[#2d1b2e]/50">
              Já tem conta?{" "}
              <a href="/login" className="text-primary hover:underline">
                Fazer login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
