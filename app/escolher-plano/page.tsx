"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Timer, Sparkles, Crown, ShieldCheck } from "lucide-react";
import { PLANS } from "@/contexts/PlatformConfigContext";

export default function ChoosePlanPage() {
  const [timeLeft, setTimeLeft] = useState(900);
  const [baseParams, setBaseParams] = useState("");

  useEffect(() => {
    const registrationData = localStorage.getItem("user_registration");
    if (registrationData) {
      try {
        const { email, name, salonName } = JSON.parse(registrationData);
        const params = new URLSearchParams();
        if (email) params.append("email", email);
        if (name) params.append("name", name);
        if (salonName) params.append("metadata[salonName]", salonName);
        setBaseParams(params.toString() ? `?${params.toString()}` : "");
      } catch (e) {
        console.error("Error parsing registration data", e);
      }
    }
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const planCards = [
    {
      key: "essencial" as const,
      plan: PLANS.essencial,
      popular: false,
      badge: "Para Autônomas",
    },
    {
      key: "profissional" as const,
      plan: PLANS.profissional,
      popular: true,
      badge: "Mais Escolhido",
    },
    {
      key: "premium" as const,
      plan: PLANS.premium,
      popular: false,
      badge: "Salão Completo + IA",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf6f2] py-8 sm:py-12 px-3.5 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#f5e1ea] text-[#b83b6b] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs mb-3 sm:mb-4 max-w-full text-balance">
            <Timer size={16} className="shrink-0" />
            <span>TESTE GRÁTIS INCLUSO • OFERTA EXPIRA EM: {formatTime(timeLeft)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#2b1822] mb-2 sm:mb-3 font-serif text-balance">
            Escolha o plano ideal para o seu{" "}
            <span className="text-[#b83b6b]">Salão de Beleza</span>
          </h1>
          <p className="text-[#7d6570] text-xs sm:text-sm md:text-base max-w-2xl mx-auto text-balance">
            Organize sua agenda, automatize o WhatsApp com Inteligência Artificial, controle comissões e aumente o lucro do seu espaço.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {planCards.map(({ key, plan, popular, badge }) => (
            <div
              key={key}
              className={`bg-white rounded-3xl p-5 sm:p-7 flex flex-col justify-between relative transition-all ${
                popular
                  ? "border-2 border-[#b83b6b] shadow-xl md:scale-[1.02]"
                  : "border border-rose-100 shadow-md"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold uppercase px-3 py-1 rounded-full ${
                      popular
                        ? "bg-[#b83b6b] text-white"
                        : "bg-[#f5e1ea] text-[#88234b]"
                    }`}
                  >
                    {badge}
                  </span>
                  {key === "premium" ? (
                    <Crown size={20} className="text-[#c59b27]" />
                  ) : (
                    <Sparkles size={20} className="text-[#b83b6b]" />
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#2b1822] mb-1">
                  Plano {plan.name}
                </h2>
                <p className="text-xs text-[#7d6570] mb-4 sm:mb-6 min-h-[34px]">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 mb-5 sm:mb-6">
                  <span className="text-base sm:text-lg font-semibold text-[#b83b6b]">R$</span>
                  <span className="text-3xl sm:text-4xl font-black text-[#2b1822]">
                    {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-xs text-[#7d6570]">/mês</span>
                </div>

                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-[#2b1822]">
                      <CheckCircle2
                        size={16}
                        className="text-[#b83b6b] shrink-0 mt-0.5"
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`https://pay.cakto.com.br/4j8q5du_754033${baseParams}`}
                className={`block w-full text-center font-bold py-3 sm:py-3.5 rounded-xl transition-all text-xs sm:text-sm ${
                  popular
                    ? "bg-gradient-to-r from-[#b83b6b] to-[#88234b] text-white shadow-lg hover:opacity-95"
                    : "bg-[#f5e1ea] text-[#88234b] hover:bg-[#b83b6b] hover:text-white"
                }`}
              >
                Assinar Plano {plan.name}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#7d6570]">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck size={16} className="text-emerald-600" />
            Dados protegidos conforme LGPD
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Sem fidelidade • Cancele quando quiser
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Liberação imediata após confirmação
          </span>
        </div>
      </div>
    </div>
  );
}
