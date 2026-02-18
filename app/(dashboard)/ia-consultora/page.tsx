"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import {
  Sparkles,
  Zap,
  MessageCircle,
  TrendingUp,
  Calculator,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function IAConsultoraPage() {
  const { financialHealth, settings } = useFinance();
  const { clients } = useSalonData();

  const { dailyRevenue, dailyGoalStatus, advice, suggestedCombo } =
    financialHealth;

  const targetDailyGoal = settings.monthlyGoal / 22; // Approx business days
  const percentReached = Math.min(100, (dailyRevenue / targetDailyGoal) * 100);

  // Helper for whatsapp
  const lostClient = clients.find((c) => {
    if (!c.lastVisit) return true;
    const days =
      (new Date().getTime() - new Date(c.lastVisit).getTime()) /
      (1000 * 3600 * 24);
    return days > 30;
  }) || { name: "Cliente", phone: "" };

  const handleWhatsappBlast = () => {
    if (!lostClient.phone)
      return alert("Nenhum cliente inativo encontrado para disparar mensagem.");

    const message = `Oi ${lostClient.name}, sumida(o)! 💖 Estou com saudade! Que tal agendar um horário essa semana? Tenho um mimozinho pra você! 😘`;
    const phone = lostClient.phone.replace(/\D/g, "");
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // State for Calculator
  const [calcPrice, setCalcPrice] = useState("");
  const [calcCost, setCalcCost] = useState("");
  const [calcCommission, setCalcCommission] = useState(30);

  const calculateProfit = () => {
    const price = parseFloat(calcPrice) || 0;
    const cost = parseFloat(calcCost) || 0;
    const commission = (price * calcCommission) / 100;
    const profit = price - cost - commission;
    return profit;
  };

  const profit = calculateProfit();
  const profitMargin =
    (parseFloat(calcPrice) || 0) > 0
      ? (profit / parseFloat(calcPrice)) * 100
      : 0;

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="IA Consultora" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* 1. Status Card - The "Headlines" */}
          <div
            className={`rounded-3xl p-6 md:p-8 shadow-sm border-2 ${dailyGoalStatus === "behind" ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl ${dailyGoalStatus === "behind" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}
              >
                {dailyGoalStatus === "behind" ? (
                  <Zap size={32} />
                ) : (
                  <Sparkles size={32} />
                )}
              </div>
              <div className="flex-1">
                <h2
                  className={`text-2xl font-bold mb-2 ${dailyGoalStatus === "behind" ? "text-orange-800" : "text-green-800"}`}
                >
                  {dailyGoalStatus === "behind"
                    ? "Vamos recuperar o dia?"
                    : "Dia Incrível!"}
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  {advice || "Estou analisando seus números..."}
                </p>

                {/* Progress Bar Simplified */}
                <div className="bg-white/50 rounded-full h-4 w-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dailyGoalStatus === "behind" ? "bg-orange-400" : "bg-green-400"}`}
                    style={{ width: `${percentReached}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm font-medium mt-2 opacity-70">
                  <span>Faturado: R$ {dailyRevenue.toFixed(2)}</span>
                  <span>Meta: R$ {targetDailyGoal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Card - "O que fazer agora" */}
          {dailyGoalStatus === "behind" && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <MessageCircle className="text-[var(--primary)]" />
                Sugestão Rápida
              </h3>
              <p className="text-gray-600 mb-4">
                Identifiquei que alguns clientes não vêm há mais de 30 dias. Que
                tal mandar um &quot;oi&quot;?
              </p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  Modelo de mensagem:
                </p>
                <p className="italic text-gray-700">
                  &quot;Oi {lostClient.name || "Fulana"}, sumida(o)! 💖 Estou
                  com saudade! Que tal agendar um horário essa semana? Tenho um
                  mimozinho pra você! 😘&quot;
                </p>
              </div>

              <button
                onClick={handleWhatsappBlast}
                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Enviar Mensagem Agora <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Combo Strategy */}
          {suggestedCombo && dailyGoalStatus === "behind" && (
            <div className="bg-linear-to-r from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-2 opacity-90">
                <TrendingUp size={20} />
                <span className="font-bold uppercase tracking-wider text-sm">
                  Ideia de Promoção
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">{suggestedCombo.name}</h3>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold">
                  R$ {suggestedCombo.price.toFixed(2)}
                </span>
                <span className="text-white/70 line-through">
                  R$ {suggestedCombo.originalPrice.toFixed(2)}
                </span>
                <span className="bg-white/20 px-2 py-1 rounded-lg text-sm font-bold">
                  Economia de 14%
                </span>
              </div>
              <p className="opacity-90">
                Ofereça este combo para aumentar o ticket médio de hoje!
              </p>
            </div>
          )}

          {/* 5. Subscription Plan Idea */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-green-500" />
              Oportunidade de Assinatura
            </h3>
            <p className="text-gray-600 mb-6">
              Para garantir faturamento fixo, que tal criar um plano de
              recorrência?
            </p>

            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h4 className="font-bold text-green-800 mb-2">
                Clube da Escova Ilimitada
              </h4>
              <p className="text-sm text-green-700 mb-4 italic">
                &quot;Receba por mês e a cliente pode vir toda semana no
                salão&quot;
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle2 size={14} /> 4 Escovas por mês
                </li>
                <li className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle2 size={14} /> 1 Hidratação cortesia
                </li>
              </ul>
              <div className="flex items-center justify-between border-t border-green-200 pt-4">
                <span className="text-green-800 font-bold">
                  Sugestão de Preço:
                </span>
                <span className="text-2xl font-black text-green-600">
                  R$ 199,90
                </span>
              </div>
            </div>
          </div>

          {/* 4. Simple Calculator */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calculator className="text-gray-400" />
              Calculadora de Lucro Rápida
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Preço do Serviço
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    value={calcPrice}
                    onChange={(e) => setCalcPrice(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-[var(--primary)]"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Custo Produtos
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    value={calcCost}
                    onChange={(e) => setCalcCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-[var(--primary)]"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Comissão (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={calcCommission}
                    onChange={(e) => setCalcCommission(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-[var(--primary)]"
                    placeholder="30"
                  />
                  <span className="absolute right-3 top-3 text-gray-400">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 text-white flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">
                  Seu Lucro Líquido
                </p>
                <p
                  className={`text-3xl font-bold ${profit > 0 ? "text-green-400" : "text-gray-500"}`}
                >
                  R$ {profit.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs uppercase font-bold mb-1">
                  Margem
                </p>
                <p
                  className={`text-xl font-bold ${profitMargin > 30 ? "text-green-400" : profitMargin > 0 ? "text-yellow-400" : "text-red-400"}`}
                >
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
