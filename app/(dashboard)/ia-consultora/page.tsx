"use client";

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import {
  TrendingUp,
  MessageCircle,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Activity,
  Target,
  Sparkles,
  DollarSign,
  Users,
} from "lucide-react";

export default function DiagnosticoMetasPage() {
  const { financialHealth, settings } = useFinance();
  const { clients } = useSalonData();

  const { dailyRevenue, dailyGoalStatus, advice, suggestedCombo } =
    financialHealth;

  const targetDailyGoal = settings.monthlyGoal / 22; // Dias úteis estimados
  const percentReached = Math.min(100, (dailyRevenue / targetDailyGoal) * 100);

  // Helper para resgate de clientes inativos
  const lostClient = clients.find((c) => {
    if (!c.lastVisit) return true;
    const days =
      (new Date().getTime() - new Date(c.lastVisit).getTime()) /
      (1000 * 3600 * 24);
    return days > 30;
  }) || { name: "Cliente", phone: "" };

  const handleWhatsappBlast = () => {
    if (!lostClient.phone)
      return alert("Nenhum cliente inativo com telefone válido encontrado para contato.");

    const message = `Olá ${lostClient.name}! Sentimos sua falta aqui no salão. Que tal agendar seu próximo horário esta semana? Temos novidades especiais para você!`;
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
    <div className="flex flex-col min-h-full bg-[var(--background)]">
      <Header title="Diagnóstico & Metas" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 1. Status Card - Diagnóstico do Dia */}
          <div
            className={`rounded-3xl p-6 md:p-8 shadow-xs border transition-all ${
              dailyGoalStatus === "behind"
                ? "bg-gradient-to-br from-amber-500/10 via-[var(--card-bg)] to-amber-500/5 border-amber-500/30"
                : "bg-gradient-to-br from-emerald-500/10 via-[var(--card-bg)] to-emerald-500/5 border-emerald-500/30"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  dailyGoalStatus === "behind"
                    ? "bg-amber-500 text-white"
                    : "bg-emerald-600 text-white"
                }`}
              >
                {dailyGoalStatus === "behind" ? (
                  <Target size={24} />
                ) : (
                  <Activity size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      dailyGoalStatus === "behind"
                        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {dailyGoalStatus === "behind"
                      ? "Atenção: Meta em Aberto"
                      : "Meta do Dia Atingida"}
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)] mb-2">
                  {dailyGoalStatus === "behind"
                    ? "Estratégia para Alavancar o Dia"
                    : "Excelente Desempenho Operacional!"}
                </h2>
                <p className="text-[var(--muted)] text-sm md:text-base leading-relaxed mb-4">
                  {advice || "Consolidando dados operacionais e financeiros da sua agenda..."}
                </p>

                {/* Progress Bar */}
                <div className="bg-[var(--card-border)] rounded-full h-3 w-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dailyGoalStatus === "behind" ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${percentReached}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-[var(--muted)] mt-2">
                  <span>Faturado: R$ {dailyRevenue.toFixed(2)}</span>
                  <span>Meta Diária: R$ {targetDailyGoal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ação Recomendada: Recuperação de Clientes Inativos */}
          {dailyGoalStatus === "behind" && (
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-xs border border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-lg font-bold font-sans text-[var(--foreground)] flex items-center gap-2">
                  <Users size={18} className="text-[var(--primary)]" />
                  Recuperação Ativa de Clientes
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                  Ação Rápida
                </span>
              </div>
              <p className="text-xs md:text-sm text-[var(--muted)] mb-4">
                Clientes que não visitam o salão há mais de 30 dias têm grande chance de retorno quando contatadas com uma mensagem atenciosa.
              </p>

              <div className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--card-border)] mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Mensagem Pronta para Envio:
                </span>
                <p className="text-xs md:text-sm text-[var(--foreground)] italic">
                  &quot;Olá {lostClient.name || "Cliente"}! Sentimos sua falta aqui no salão. Que tal agendar seu horário para esta semana? Temos novidades especiais para você!&quot;
                </p>
              </div>

              <button
                onClick={handleWhatsappBlast}
                className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
              >
                <MessageCircle size={18} /> Chamar Cliente no WhatsApp <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* 3. Sugestão de Combo Estratégico */}
          {suggestedCombo && (
            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] rounded-3xl p-6 text-white shadow-md">
              <div className="flex items-center gap-2 mb-2 text-white/90">
                <TrendingUp size={18} />
                <span className="font-bold uppercase tracking-wider text-xs">
                  Aumento de Ticket Médio
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold font-sans mb-1">{suggestedCombo.name}</h3>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-2xl md:text-3xl font-bold">
                  R$ {suggestedCombo.price.toFixed(2)}
                </span>
                <span className="text-white/70 line-through text-sm">
                  R$ {suggestedCombo.originalPrice.toFixed(2)}
                </span>
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">
                  Condição Especial
                </span>
              </div>
              <p className="text-xs md:text-sm text-white/90">
                Ofereça este combo na recepção para preencher lacunas de horário e elevar o faturamento diário.
              </p>
            </div>
          )}

          {/* 4. Calculadora de Lucro Líquido e Margem */}
          <div className="bg-[var(--card-bg)] rounded-3xl p-6 shadow-xs border border-[var(--card-border)]">
            <h3 className="text-base md:text-lg font-bold font-sans text-[var(--foreground)] mb-2 flex items-center gap-2">
              <Calculator size={18} className="text-[var(--primary)]" />
              Calculadora de Margem de Serviço
            </h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              Simule o preço cobrado, custos de produtos e comissão para garantir que seu salão não tenha prejuízo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                  Preço do Serviço (R$)
                </label>
                <input
                  type="number"
                  value={calcPrice}
                  onChange={(e) => setCalcPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)] text-sm"
                  placeholder="Ex: 120,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                  Custo de Insumos (R$)
                </label>
                <input
                  type="number"
                  value={calcCost}
                  onChange={(e) => setCalcCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)] text-sm"
                  placeholder="Ex: 25,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] uppercase mb-1">
                  Comissão da Profissional (%)
                </label>
                <input
                  type="number"
                  value={calcCommission}
                  onChange={(e) => setCalcCommission(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--card-border)] rounded-xl font-bold text-[var(--foreground)] outline-none focus:border-[var(--primary)] text-sm"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="bg-[var(--foreground)] rounded-2xl p-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-white/60 text-xs uppercase font-bold mb-1">
                  Lucro Líquido por Procedimento
                </p>
                <p
                  className={`text-2xl md:text-3xl font-bold font-sans ${
                    profit > 0 ? "text-emerald-400" : "text-gray-400"
                  }`}
                >
                  R$ {profit.toFixed(2)}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-white/60 text-xs uppercase font-bold mb-1">
                  Margem Líquida Real
                </p>
                <p
                  className={`text-xl md:text-2xl font-bold font-sans ${
                    profitMargin > 30
                      ? "text-emerald-400"
                      : profitMargin > 0
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
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
