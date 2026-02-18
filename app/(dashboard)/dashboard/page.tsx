"use client";

export const dynamic = "force-dynamic";

import React from "react";
import {
  Wallet,
  PiggyBank,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  HelpCircle,
  Menu,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { financialHealth, settings, isLoading } = useFinance();
  const { toggle } = useSidebar();
  const [showValues, setShowValues] = React.useState(true);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="flex bg-[#f5f5f5] h-full items-center justify-center text-[var(--primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (value: number) => {
    return showValues
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(value)
      : "R$ ••••";
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] font-sans">
      {/* Nubank-style Header Section */}
      <div className="bg-[var(--primary)] text-white p-6 md:px-8 md:pt-8 md:pb-16 rounded-b-[2rem] shadow-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="md:hidden p-2 -ml-2 hover:bg-[var(--primary-dark)] rounded-full transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>
            <div className="bg-[var(--primary-dark)] p-3 rounded-full hover:bg-opacity-80 transition cursor-pointer shrink-0">
              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">
                <span className="font-bold text-sm">
                  {user?.displayName?.charAt(0) || "U"}
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold mb-0 leading-tight break-words">
                Olá, {user?.displayName?.split(" ")[0] || "Parceira"}
              </h1>
              <p className="text-[var(--primary-light)] text-xs capitalize opacity-80">
                {today}
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-center self-end md:self-auto">
            <button
              onClick={() => setShowValues(!showValues)}
              className="hover:bg-[var(--primary-dark)] p-2 rounded-full transition"
            >
              {showValues ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
            <button className="hover:bg-[var(--primary-dark)] p-2 rounded-full transition">
              <HelpCircle size={24} />
            </button>
          </div>
        </div>

        {/* Main Account Balance */}
        <div className="mt-2">
          <span className="text-sm font-medium opacity-90 block mb-1">
            Conta da Empresa
          </span>
          <div className="text-3xl font-bold mb-1">
            {formatCurrency(financialHealth.dailyRevenue)}
          </div>
          <span className="text-xs text-[var(--primary-light)]">
            Entradas de hoje
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8 md:px-8 -mt-10 space-y-6">
        {/* Horizontal Scroll Cards (App Style) used as Grid here for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card: Daily Goal */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-medium text-sm">
                Meta Diária
              </span>
              <Zap
                className={`w-5 h-5 ${financialHealth.dailyGoalStatus === "ahead" ? "text-green-500" : "text-yellow-500"}`}
              />
            </div>
            <div className="text-2xl font-bold text-[var(--foreground)] mb-1">
              {formatCurrency(financialHealth.dailyRevenue)}
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 mb-1">
              <div
                className={`h-1.5 rounded-full ${financialHealth.dailyGoalStatus === "ahead" ? "bg-green-500" : "bg-[var(--primary)]"}`}
                style={{
                  width: `${Math.min((financialHealth.dailyRevenue / (settings.monthlyGoal / 30 || 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-400">
              Meta: {formatCurrency(settings.monthlyGoal / 30)}
            </span>
          </div>

          {/* Card: Save for Fixed Costs */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-medium text-sm">
                Quanto Guardar (Contas)
              </span>
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(financialHealth.mustSaveForFixedCosts)}
            </div>
            <span className="text-xs text-gray-400">
              Para pagar custos fixos este mês
            </span>
          </div>

          {/* Card: Safe to Withdraw */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-500 font-medium text-sm">
                Disponível para Você
              </span>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(financialHealth.safeToWithdraw)}
            </div>
            <span className="text-xs text-gray-400">
              Já descontando custos e reservas
            </span>
          </div>
        </div>

        {/* Growth Stats - 20% Goal Section */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-lg">
              Crescimento Mensal (Meta 20%)
            </h3>
            {financialHealth.growthGoalReached ? (
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck size={14} /> Meta Batida
              </span>
            ) : (
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                Em progresso
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Mês Passado</p>
              <p className="text-lg font-bold text-gray-400">
                {formatCurrency(financialHealth.previousMonthRevenue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Este Mês</p>
              <p className="text-lg font-bold text-[var(--primary)]">
                {formatCurrency(financialHealth.monthlyRevenue)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-1">
                Progresso Meta de Crescimento
              </p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-1">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((financialHealth.monthlyRevenue / (financialHealth.previousMonthRevenue * 1.2 || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-right text-[10px] text-gray-400 mt-1">
                Faltam{" "}
                {formatCurrency(
                  Math.max(
                    0,
                    financialHealth.previousMonthRevenue * 1.2 -
                      financialHealth.monthlyRevenue,
                  ),
                )}{" "}
                para +20%
              </p>
            </div>
          </div>
        </div>

        {/* AI Insight & Combo section */}
        <div className="bg-[var(--primary-light)]/30 rounded-2xl p-6 border border-[var(--primary-light)] flex gap-4 items-start">
          <div className="bg-white p-3 rounded-full shadow-sm text-[var(--primary)]">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-bold text-[var(--primary-dark)] text-lg mb-1">
              Consultor Inteligente
            </h3>
            <p className="text-gray-700 text-sm mb-3">
              {financialHealth.advice ||
                "Analisando seus dados para gerar insights..."}
            </p>
            {financialHealth.suggestedCombo && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 mt-2 inline-block">
                <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">
                  Sugestão de Combo
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold text-gray-800">
                    {financialHealth.suggestedCombo.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(financialHealth.suggestedCombo.price)}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    {formatCurrency(
                      financialHealth.suggestedCombo.originalPrice,
                    )}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                    14% OFF
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Caixinhas (Funds) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">
            Minhas Caixinhas (Reservas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(settings.customFunds || []).map((fund) => {
              if (!fund.enabled) return null;
              const colorClasses: Record<string, string> = {
                emerald: "text-emerald-600 bg-emerald-100",
                blue: "text-blue-600 bg-blue-100",
                orange: "text-orange-600 bg-orange-100",
                red: "text-red-600 bg-red-100",
                violet: "text-purple-600 bg-purple-100",
              };
              const styleClass =
                colorClasses[fund.color] ||
                "text-[var(--primary)] bg-purple-100";
              const amount = financialHealth.fundsAccumulated[fund.id] || 0;
              return (
                <div
                  key={fund.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 transition-shadow hover:shadow-md"
                >
                  <div className={`p-3 rounded-full ${styleClass}`}>
                    <PiggyBank size={24} />
                  </div>
                  <div>
                    <span className="block text-sm text-gray-500 font-medium">
                      {fund.name}
                    </span>
                    <span className="block text-xl font-bold text-gray-800">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
