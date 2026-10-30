"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, Timer, Sparkles, Crown, ShieldCheck } from "lucide-react";
import { PLANS } from "@/contexts/PlatformConfigContext";

export default function ChoosePlanPage() {
  const [timeLeft, setTimeLeft] = useState(900);
  const [baseParams, setBaseParams] = useState("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

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
      badge: "Autônomas & Solo",
    },
    {
      key: "profissional" as const,
      plan: PLANS.profissional,
      popular: true,
      badge: "Mais Escolhido por Salões",
    },
    {
      key: "premium" as const,
      plan: PLANS.premium,
      popular: false,
      badge: "Estruturados & Spas",
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf6f2] py-8 sm:py-12 px-3.5 sm:px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-[#f5e1ea] text-[#b83b6b] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-[11px] sm:text-xs mb-3 sm:mb-4 max-w-full text-balance">
            <Timer size={16} className="shrink-0" />
            <span>PLANO DE ASSINATURA • CONDIÇÃO ESPECIAL EXPIRA EM: {formatTime(timeLeft)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#2b1822] mb-2 sm:mb-3 font-serif text-balance">
            Escolha o plano ideal para o seu{" "}
            <span className="text-[#b83b6b]">Salão de Beleza</span>
          </h1>
          <p className="text-[#7d6570] text-xs sm:text-sm md:text-base max-w-2xl mx-auto text-balance">
            Organize sua agenda, automatize o WhatsApp, controle comissões de parceiras e aumente a lucratividade do seu salão.
          </p>
        </div>

        {/* Botãozinho de Alternância: Mensal / Anual */}
        <div className="flex items-center justify-center mb-8 sm:mb-10">
          <div className="bg-[#eddce6] p-1.5 rounded-full flex items-center shadow-inner border border-rose-200/50">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-[#88234b] shadow-sm"
                  : "text-[#7d6570] hover:text-[#2b1822]"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 ${
                billingCycle === "yearly"
                  ? "bg-white text-[#88234b] shadow-sm"
                  : "text-[#7d6570] hover:text-[#2b1822]"
              }`}
            >
              <span>Anual</span>
              <span className="bg-[#b83b6b] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wide">
                Economize até 26%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-center">
          {planCards.map(({ key, plan, popular, badge }) => {
            const isYearly = billingCycle === "yearly";
            const currentPrice = isYearly ? plan.yearlyPrice : plan.price;
            const annualTotal = (plan.yearlyPrice * 12).toFixed(2).replace(".", ",");
            const discountPercent = Math.round(((plan.price - plan.yearlyPrice) / plan.price) * 100);

            // Monta parâmetros adicionais para a finalização do plano
            const planParam = baseParams
              ? `${baseParams}&plan=${key}&cycle=${billingCycle}`
              : `?plan=${key}&cycle=${billingCycle}`;

            return (
              <div
                key={key}
                className={`rounded-2xl p-4 sm:p-5 flex flex-col relative transition-all ${
                  popular
                    ? "bg-gradient-to-b from-[#fff2f6] to-white text-[#221a1d] border-2 border-[#b83b6b] shadow-xl md:scale-[1.03] z-10"
                    : "bg-white text-[#221a1d] border border-[#ede6e1] shadow-sm hover:border-[#d8c2cb]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] sm:text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${
                        popular
                          ? "bg-[#b83b6b] text-white shadow-xs"
                          : "bg-[#f4edf0] text-[#785966] border border-[#ebdce2]"
                      }`}
                    >
                      {badge}
                    </span>
                    {key === "premium" ? (
                      <Crown size={16} className="text-amber-500" />
                    ) : (
                      <Sparkles
                        size={16}
                        className={popular ? "text-[#b83b6b]" : "text-stone-400"}
                      />
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-[#221a1d] mb-0.5">
                    Plano {plan.name}
                  </h2>
                  <p className="text-[11px] text-[#73656c] mb-3">
                    {plan.description}
                  </p>

                  <div className="mb-3">
                    {isYearly && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] text-stone-400 line-through">
                          R$ {plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {discountPercent}% OFF
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-semibold text-[#b83b6b]">
                        R$
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-[#221a1d]">
                        {currentPrice.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-xs text-[#73656c]">
                        /mês
                      </span>
                    </div>
                    <p className="text-[11px] text-[#73656c] mt-0.5 font-medium">
                      {isYearly
                        ? `Faturado anualmente: R$ ${annualTotal}/ano`
                        : "Faturado mensalmente • Cancele quando quiser"}
                    </p>
                  </div>

                  <ul className="space-y-1.5 mb-3 border-t border-[#f6f0f3] pt-2.5">
                    {plan.features.map((feat, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-[#3f393d]"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-[#b83b6b] shrink-0 mt-0.5"
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={`${plan.checkoutUrl}${baseParams}`}
                  className={`block w-full text-center font-bold py-2.5 sm:py-3 rounded-xl transition-all text-xs sm:text-sm mt-2 ${
                    popular
                      ? "bg-gradient-to-r from-[#b83b6b] to-[#9a2552] text-white hover:from-[#a52f5c] hover:to-[#861e45] shadow-md shadow-[#b83b6b]/25"
                      : "bg-[#fbf7f9] text-[#88234b] border border-[#ebdbe2] hover:bg-[#f2e3ea] hover:text-[#6d1538]"
                  }`}
                >
                  Assinar Plano {plan.name}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-[#7d6570]">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck size={16} className="text-emerald-600" />
            Dados protegidos conforme LGPD
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Sem contratos abusivos • Cancele quando quiser
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Ativação imediata da sua conta
          </span>
        </div>
      </div>
    </div>
  );
}
