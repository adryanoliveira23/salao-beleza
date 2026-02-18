"use client";

export const dynamic = "force-dynamic";

import React from "react";
// import { useRouter } from "next/navigation"; // Unused
import {
  TrendingUp,
  CreditCard,
  Wallet,
  // AlertCircle, // Unused
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
// import { Header } from "@/components/Header"; // Unused
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
// import { useSalonData } from "@/contexts/SalonDataContext"; // Unused

export default function Dashboard() {
  // const router = useRouter(); // Unused
  const { user } = useAuth();
  const { financialHealth, settings } = useFinance();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate percentages for bars
  const billsProgress = Math.min(
    (financialHealth.billsDueToday / (settings.monthlyGoal / 30)) * 100,
    100,
  );
  const maintenanceProgress = Math.min(
    (financialHealth.maintenanceFundAccumulated / 1000) * 100,
    100,
  ); // Arbitrary goal for bar
  const emergencyProgress = Math.min(
    (financialHealth.emergencyFundAccumulated / 5000) * 100,
    100,
  );

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      {/* Nubank-style Header Section */}
      <div className="bg-[var(--primary)] text-white p-6 md:p-8 rounded-b-[3rem] shadow-lg mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-outfit mb-1">
              Olá, {user?.displayName?.split(" ")[0] || "Parceira"}
            </h1>
            <p className="text-[var(--primary-light)] text-sm capitalize">
              {today}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-[var(--primary-dark)] p-2 rounded-full">
              <ShieldCheck className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Main Status Card - Floating overlap */}
        <div className="bg-white text-[var(--foreground)] rounded-2xl p-6 shadow-xl relative top-8 mb-[-2rem]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium text-sm">
              Meta Diária
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                financialHealth.dailyGoalStatus === "ahead"
                  ? "bg-green-100 text-green-700"
                  : financialHealth.dailyGoalStatus === "on_track"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {financialHealth.dailyGoalStatus === "ahead"
                ? "Batida! 🚀"
                : financialHealth.dailyGoalStatus === "on_track"
                  ? "No Caminho"
                  : "Atenção"}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold text-[var(--foreground)]">
              R$ {financialHealth.dailyRevenue.toFixed(2)}
            </h2>
            <span className="text-gray-400 text-sm">
              / R$ {(settings.monthlyGoal / 30).toFixed(2)}
            </span>
          </div>

          {financialHealth.gapToDailyGoal > 0 && (
            <div className="mt-4 bg-purple-50 p-3 rounded-lg border border-purple-100 flex items-start gap-3">
              <Zap className="text-[var(--primary)] shrink-0" size={20} />
              <div>
                <p className="text-xs text-[var(--primary)] font-bold mb-1">
                  DICA DA IA
                </p>
                <p className="text-sm text-gray-700">
                  Faltam{" "}
                  <strong>
                    R$ {financialHealth.gapToDailyGoal.toFixed(2)}
                  </strong>{" "}
                  para a meta. Sugiro lançar uma oferta relâmpago:
                  <span className="font-bold">
                    {" "}
                    Combo Reconstrução + Escova
                  </span>{" "}
                  com 14% OFF!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-12 pb-8 md:px-8 space-y-8">
        {/* Financial Cards Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 font-outfit">
            Fluxo de Hoje
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Safe to Withdraw */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={64} className="text-green-600" />
              </div>
              <p className="text-gray-500 text-sm mb-1">
                Pode Retirar (Meu Salário)
              </p>
              <h4 className="text-2xl font-bold text-green-600">
                R$ {financialHealth.safeToWithdraw.toFixed(2)}
              </h4>
              <p className="text-xs text-gray-400 mt-2">
                Disponível na conta física
              </p>
            </div>

            {/* Bills Due */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <ArrowDownRight size={64} className="text-red-500" />
              </div>
              <p className="text-gray-500 text-sm mb-1">Contas a Pagar Hoje</p>
              <h4 className="text-2xl font-bold text-red-500">
                R$ {financialHealth.billsDueToday.toFixed(2)}
              </h4>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                <div
                  className="bg-red-500 h-1.5 rounded-full"
                  style={{ width: `${billsProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Maintenance Fund */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <CreditCard size={64} className="text-orange-500" />
              </div>
              <p className="text-gray-500 text-sm mb-1">Reserva Manutenção</p>
              <h4 className="text-2xl font-bold text-orange-500">
                R$ {financialHealth.maintenanceFundAccumulated.toFixed(2)}
              </h4>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                <div
                  className="bg-orange-500 h-1.5 rounded-full"
                  style={{ width: `${maintenanceProgress}%` }}
                ></div>
              </div>
            </div>

            {/* Emergency Fund */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <PiggyBank size={64} className="text-[var(--primary)]" />
              </div>
              <p className="text-gray-500 text-sm mb-1">Fundo de Emergência</p>
              <h4 className="text-2xl font-bold text-[var(--primary)]">
                R$ {financialHealth.emergencyFundAccumulated.toFixed(2)}
              </h4>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
                <div
                  className="bg-[var(--primary)] h-1.5 rounded-full"
                  style={{ width: `${emergencyProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Growth & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Monthly Growth Chart (Simulated) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 font-outfit">
                Crescimento Mensal (Meta: +20%)
              </h3>
              <TrendingUp className="text-green-500" />
            </div>

            <div className="flex items-end gap-4 h-48">
              {[40, 55, 45, 60, 75, 65, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-full bg-[var(--primary-light)] rounded-t-lg relative group-hover:bg-[var(--primary)] transition-colors"
                    style={{ height: `${h}%` }}
                  >
                    {i === 6 && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                        +22%
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">Dia {i + 14}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Actions Checklist */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 font-outfit mb-4">
              Ações Recomendadas
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${financialHealth.dailyGoalStatus === "ahead" ? "border-green-500 bg-green-500" : "border-gray-300"}`}
                >
                  {financialHealth.dailyGoalStatus === "ahead" && (
                    <ArrowUpRight size={14} className="text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  Verificar Estoque de Shampoos
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                <span className="text-sm text-gray-600">
                  Confirmar agenda de amanhã
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                <span className="text-sm text-gray-600">
                  Postar foto &quot;Antes e Depois&quot;
                </span>
              </div>
            </div>
            <button className="w-full mt-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-dark)] transition-colors">
              Ver Checklist Completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
