"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import {
  ShieldCheck,
  Calendar,
  Clock,
  Cake,
  TrendingUp,
  CheckCircle2,
  MessageCircle,
  Plus,
  ArrowRight,
  Award,
  Link2,
  Copy,
  Check,
  Scissors,
  DollarSign,
  Activity,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { financialHealth, settings, isLoading } = useFinance();
  const {
    appointments,
    clients,
    professionals,
    updateAppointment,
  } = useSalonData();

  const [chartPeriod, setChartPeriod] = useState<"7d" | "6m">("7d");
  const [copiedLink, setCopiedLink] = useState(false);

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split("T")[0], [now]);
  const currentMonth = now.getMonth() + 1;

  // Formatação de data em português
  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now);
    } catch {
      return todayStr;
    }
  }, [now, todayStr]);

  // Nome do salão / loja para a saudação principal
  const salonName = useMemo(() => {
    return profile?.salon_name?.trim() || "Meu Salão";
  }, [profile]);

  // Formatador monetário limpo
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  // Processamento 100% REAL dos dados do salão
  const metrics = useMemo(() => {
    // 1. Atendimentos de hoje (dados reais)
    const todayApts = appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));

    const upcomingToday = todayApts.filter(
      (a) => a.status === "pending" || a.status === "confirmed",
    );
    const confirmedTodayCount = todayApts.filter(
      (a) => a.status === "confirmed",
    ).length;
    const pendingTodayCount = todayApts.filter(
      (a) => a.status === "pending",
    ).length;
    const completedTodayCount = todayApts.filter(
      (a) => a.status === "completed",
    ).length;

    // 2. Atendimentos do mês
    const monthPrefix = todayStr.slice(0, 7);
    const monthApts = appointments.filter((a) => a.date?.startsWith(monthPrefix));
    const completedMonthCount = monthApts.filter(
      (a) => a.status === "completed" || a.paymentStatus === "paid",
    ).length;

    // 3. Ranking real dos serviços mais vendidos no mês
    const serviceCounts: Record<
      string,
      { name: string; count: number; revenue: number }
    > = {};

    monthApts.forEach((a) => {
      if (a.status === "cancelled" || a.status === "no_show") return;
      const key = a.serviceId || a.serviceName || "Serviço";
      if (!serviceCounts[key]) {
        serviceCounts[key] = {
          name: a.serviceName || "Serviço",
          count: 0,
          revenue: 0,
        };
      }
      serviceCounts[key].count += 1;
      serviceCounts[key].revenue += a.price || 0;
    });

    const calculatedTopServices = Object.values(serviceCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const maxServiceRevenue = Math.max(
      1,
      ...calculatedTopServices.map((s) => s.revenue),
    );

    const topServicesWithPercent = calculatedTopServices.map((s) => ({
      ...s,
      percent: Math.round((s.revenue / maxServiceRevenue) * 100),
    }));

    // 4. Ocupação e horários reais
    const activeProfsCount = Math.max(
      1,
      professionals.filter((p) => p.active !== false).length,
    );
    const totalSlotsPossible = activeProfsCount * 8;
    const nonCancelledToday = todayApts.filter((a) => a.status !== "cancelled").length;
    const availableSlotsToday = Math.max(0, totalSlotsPossible - nonCancelledToday);
    const occupancyRate =
      totalSlotsPossible > 0
        ? Math.min(100, Math.round((nonCancelledToday / totalSlotsPossible) * 100))
        : 0;

    // 5. Aniversariantes reais do mês
    const birthdaysThisMonth = clients.filter((c) => {
      if (!c.birthDate) return false;
      const parts = c.birthDate.split("-");
      if (parts.length >= 2) {
        return parseInt(parts[1], 10) === currentMonth;
      }
      return false;
    });

    // 6. Faturamento real dos últimos 7 dias
    const last7Days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const dayApts = appointments.filter(
        (a) =>
          a.date === dStr &&
          (a.paymentStatus === "paid" || a.status === "completed"),
      );
      const val = dayApts.reduce((sum, a) => sum + (a.price || 0), 0);
      const dayLabel = d.toLocaleDateString("pt-BR", { weekday: "short" });
      last7Days.push({ label: dayLabel.replace(".", ""), value: val });
    }

    // 7. Faturamento real dos últimos 6 meses
    const last6Months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mApts = appointments.filter(
        (a) =>
          a.date?.startsWith(mStr) &&
          (a.paymentStatus === "paid" || a.status === "completed"),
      );
      const val = mApts.reduce((sum, a) => sum + (a.price || 0), 0);
      const monthLabel = d.toLocaleDateString("pt-BR", { month: "short" });
      last6Months.push({ label: monthLabel.replace(".", ""), value: val });
    }

    // 8. Comparativo de crescimento real
    const currentRev = financialHealth.monthlyRevenue;
    const prevRev = financialHealth.previousMonthRevenue;
    let growthText = "0%";
    let hasComparison = false;
    if (prevRev > 0) {
      const diff = Math.round(((currentRev - prevRev) / prevRev) * 100);
      growthText = `${diff >= 0 ? "+" : ""}${diff}%`;
      hasComparison = true;
    } else if (currentRev > 0) {
      growthText = "+100%";
      hasComparison = true;
    }

    return {
      todayApts,
      upcomingToday,
      confirmedTodayCount,
      pendingTodayCount,
      completedTodayCount,
      completedMonthCount,
      topServices: topServicesWithPercent,
      availableSlotsToday,
      occupancyRate,
      birthdaysThisMonth,
      totalActiveProfessionals: activeProfsCount,
      last7Days,
      last6Months,
      growthText,
      hasComparison,
    };
  }, [
    appointments,
    clients,
    professionals,
    financialHealth.monthlyRevenue,
    financialHealth.previousMonthRevenue,
    todayStr,
    currentMonth,
    now,
  ]);

  const handleCopyLink = () => {
    const slug = (salonName || "meusalao")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
    const link = `https://bellamais.com/agendar/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="flex bg-[var(--background)] h-full items-center justify-center text-[var(--primary)] min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-11 w-11 border-3 border-[var(--primary)] border-t-transparent"></div>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Carregando painel do salão...
          </span>
        </div>
      </div>
    );
  }

  const chartData =
    chartPeriod === "7d" ? metrics.last7Days : metrics.last6Months;
  const maxChartVal = Math.max(10, ...chartData.map((d) => d.value));

  const goalPercent =
    settings.monthlyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (financialHealth.monthlyRevenue / settings.monthlyGoal) * 100,
          ),
        )
      : 0;

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Header title="Painel Principal" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1480px] w-full mx-auto">
        {/* =========================================================================
            1. TOPO: SAUDAÇÃO ACOLHEDORA COM GRADIENTE VIVO & LUXO VISUAL
            ========================================================================= */}
        <div className="bg-gradient-to-r from-rose-50/90 via-pink-50/50 to-amber-50/40 dark:from-rose-950/30 dark:via-[#1c151b] dark:to-amber-950/20 border border-rose-200/70 dark:border-rose-900/40 rounded-3xl p-5 md:p-7 shadow-[0_4px_20px_rgba(158,49,96,0.04)] relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              {/* Badge Elegante de Identidade */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0 mt-0.5">
                <Scissors size={22} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300/70 dark:border-emerald-800/60 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Salão Aberto Hoje
                  </span>
                  <span className="text-xs text-rose-900/70 dark:text-rose-300/70 font-medium capitalize hidden sm:inline">
                    {todayFormatted}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                  Olá, {salonName}
                </h2>
                <p className="text-xs md:text-sm text-[var(--muted)] mt-1 flex items-center gap-2 flex-wrap">
                  <span>
                    Hoje você tem{" "}
                    <strong className="text-[var(--foreground)] font-bold">
                      {metrics.todayApts.length} atendimentos
                    </strong>
                  </span>
                  <span className="text-[var(--card-border)]">•</span>
                  <span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {metrics.availableSlotsToday} horários livres
                    </strong>{" "}
                    na grade
                  </span>
                </p>
              </div>
            </div>

            {/* Ações Rápidas Vibrantes */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full md:w-auto self-start md:self-center shrink-0">
              <Link
                href="/whatsapp"
                className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/60 text-xs font-bold transition-all shadow-2xs active:scale-[0.98]"
              >
                <MessageCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>WhatsApp Salão</span>
              </Link>

              <Link
                href="/agenda"
                className="flex-1 sm:flex-initial justify-center inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] via-rose-600 to-pink-600 hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition-all active:scale-[0.98]"
              >
                <Plus size={17} />
                <span>Novo Agendamento</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. OS 4 INDICADORES COM VIDA, CORES HARMONIOSAS & DADOS REAIS
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento no Mês (Esmeralda / Menta Fresca) */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 dark:from-emerald-950/30 dark:via-[#1c151b] dark:to-transparent border border-emerald-200/80 dark:border-emerald-800/50 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Faturamento no Mês
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shadow-emerald-500/25">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-emerald-950 dark:text-emerald-100 tabular-nums">
              {formatCurrency(financialHealth.monthlyRevenue)}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-900/30">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                Meta: {formatCurrency(settings.monthlyGoal)}
              </span>
              {metrics.hasComparison ? (
                <span className="font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-900/70 px-2 py-0.5 rounded-full">
                  ↗ {metrics.growthText}
                </span>
              ) : (
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {goalPercent}% atingido
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Atendimentos Hoje (Framboesa / Rose Glow) */}
          <div className="bg-gradient-to-br from-rose-50/70 via-white to-pink-50/30 dark:from-rose-950/30 dark:via-[#1c151b] dark:to-transparent border border-rose-200/80 dark:border-rose-800/50 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                Atendimentos Hoje
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-xs shadow-rose-500/25">
                <Calendar size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-rose-950 dark:text-rose-100 tabular-nums">
              {metrics.todayApts.length} clientes
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-rose-100 dark:border-rose-900/30">
              <span className="text-rose-700/80 dark:text-rose-400/80 font-medium">
                {metrics.confirmedTodayCount} confirmados
              </span>
              <span className="font-bold text-rose-800 dark:text-rose-200 bg-rose-100/90 dark:bg-rose-900/70 px-2 py-0.5 rounded-full">
                {metrics.pendingTodayCount} aguardando
              </span>
            </div>
          </div>

          {/* Card 3: Ticket Médio (Champagne Gold / Âmbar Quente) */}
          <div className="bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/30 dark:from-amber-950/30 dark:via-[#1c151b] dark:to-transparent border border-amber-200/80 dark:border-amber-800/50 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Ticket Médio
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-xs shadow-amber-500/25">
                <Activity size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-amber-950 dark:text-amber-100 tabular-nums">
              {formatCurrency(financialHealth.averageTicket)}
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/30">
              <span className="text-amber-700/80 dark:text-amber-400/80 font-medium">
                {metrics.completedMonthCount} finalizados no mês
              </span>
              <span className="font-bold text-amber-800 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-900/70 px-2 py-0.5 rounded-full">
                Média
              </span>
            </div>
          </div>

          {/* Card 4: Ocupação da Grade (Lavanda / Violeta / Safira) */}
          <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/30 dark:from-purple-950/30 dark:via-[#1c151b] dark:to-transparent border border-purple-200/80 dark:border-purple-800/50 rounded-2xl p-5 shadow-xs hover:shadow-sm hover:border-purple-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                Ocupação da Grade
              </span>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-purple-500/25">
                <Clock size={16} />
              </div>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-purple-950 dark:text-purple-100 tabular-nums">
              {metrics.occupancyRate}%
            </div>
            <div className="mt-2.5">
              <div className="h-1.5 w-full bg-purple-100 dark:bg-purple-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                  style={{ width: `${metrics.occupancyRate}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold mt-1 block text-right">
                {metrics.availableSlotsToday} horários livres
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ESTRUTURA PRINCIPAL: COLUNA CENTRAL (8 COLS) + COLUNA OPERACIONAL (4 COLS)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =======================================================================
              COLUNA CENTRAL (PRINCIPAL): GRÁFICO + RANKINGS + SAÚDE FINANCEIRA REAL
              ======================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Gráfico Comparativo de Faturamento Real */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-5 md:p-6 border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs shadow-rose-500/20">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                      Comparativo de Faturamento
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Lançamentos reais de atendimentos concluídos e pagos
                    </p>
                  </div>
                </div>

                <div className="flex bg-[var(--background)] p-1 rounded-xl border border-[var(--card-border)]">
                  <button
                    onClick={() => setChartPeriod("7d")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "7d"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    7 Dias
                  </button>
                  <button
                    onClick={() => setChartPeriod("6m")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "6m"
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    6 Meses
                  </button>
                </div>
              </div>

              {/* Bar Chart Visual Vibrante */}
              <div className="h-56 flex items-end justify-between gap-2.5 pt-6 pb-2 px-2 border-b border-[var(--card-border)]">
                {chartData.map((bar, idx) => {
                  const heightPercent =
                    bar.value > 0
                      ? Math.max(12, Math.round((bar.value / maxChartVal) * 100))
                      : 5;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                        {formatCurrency(bar.value)}
                      </span>
                      <div
                        className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                          bar.value > 0
                            ? "bg-gradient-to-t from-[var(--primary)] via-rose-500 to-pink-400 group-hover:from-rose-600 group-hover:to-amber-300 shadow-xs"
                            : "bg-slate-200 dark:bg-zinc-800"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-[var(--muted)] font-bold capitalize truncate max-w-full">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Resumo da Tendência do Período em Cards Coloridos Suaves */}
              <div className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-800 dark:text-indigo-300 font-bold block">
                    Mês Anterior
                  </span>
                  <span className="text-sm font-bold font-sans text-[var(--foreground)] tabular-nums mt-0.5 block">
                    {formatCurrency(financialHealth.previousMonthRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                  <span className="text-[10px] uppercase tracking-wider text-rose-800 dark:text-rose-300 font-bold block">
                    Mês Atual
                  </span>
                  <span className="text-sm font-bold font-sans text-rose-900 dark:text-rose-200 tabular-nums mt-0.5 block">
                    {formatCurrency(financialHealth.monthlyRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold block">
                    Variação Real
                  </span>
                  <span className="text-sm font-bold font-sans text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">
                    {metrics.growthText}
                  </span>
                </div>
              </div>
            </div>

            {/* Ranking de Serviços Mais Vendidos com Cores Vivas e Medalhas */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-5 md:p-6 border border-[var(--card-border)] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Crown size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                      Serviços Mais Vendidos no Salão
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Participação por faturamento e quantidade real no mês
                    </p>
                  </div>
                </div>
                <Link
                  href="/servicos"
                  className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                >
                  Ver Catálogo <ArrowRight size={13} />
                </Link>
              </div>

              {metrics.topServices.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-rose-50/30 dark:bg-rose-950/10 border border-dashed border-rose-200/60">
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Nenhum serviço realizado este mês ainda
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1 max-w-sm mx-auto">
                    Conforme os atendimentos forem concluídos na agenda, o ranking dos serviços mais procurados aparecerá aqui com barras de progresso.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {metrics.topServices.map((srv, idx) => {
                    const medalGradients = [
                      "from-amber-400 to-yellow-500 text-white shadow-xs shadow-amber-500/25",
                      "from-rose-400 to-pink-500 text-white shadow-xs",
                      "from-amber-600 to-amber-800 text-white shadow-xs",
                      "from-purple-400 to-indigo-500 text-white",
                      "from-emerald-400 to-teal-500 text-white",
                    ];
                    const progressGradients = [
                      "from-amber-400 via-rose-500 to-pink-500",
                      "from-rose-500 to-purple-500",
                      "from-purple-500 to-indigo-500",
                      "from-emerald-500 to-teal-400",
                      "from-sky-500 to-blue-500",
                    ];

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-5 h-5 rounded-full bg-gradient-to-br ${
                                medalGradients[idx] || medalGradients[0]
                              } text-[10px] font-bold flex items-center justify-center shrink-0`}
                            >
                              {idx + 1}
                            </span>
                            <span className="font-bold text-[var(--foreground)] truncate">
                              {srv.name}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] shrink-0 hidden sm:inline">
                              • {srv.count} atendimentos
                            </span>
                          </div>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums shrink-0 ml-2">
                            {formatCurrency(srv.revenue)}
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${
                              progressGradients[idx] || progressGradients[0]
                            } rounded-full transition-all duration-500`}
                            style={{ width: `${srv.percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo da Saúde Financeira & Reservas (Colorido & Seguro) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50/80 via-white to-sky-50/30 dark:from-blue-950/30 dark:via-[#1c151b] dark:to-transparent border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-blue-600" />
                    Guardar p/ Custos Fixos
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                    Reserva Segura
                  </span>
                </div>
                <div className="text-xl font-bold font-sans text-blue-950 dark:text-blue-100 tabular-nums">
                  {formatCurrency(financialHealth.mustSaveForFixedCosts)}
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-1 font-medium">
                  Garante custos fixos e despesas essenciais
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 dark:from-emerald-950/30 dark:via-[#1c151b] dark:to-transparent border border-emerald-200/80 dark:border-emerald-900/40 rounded-2xl p-4.5 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Disponível p/ Retirada
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-bold">
                    Pró-Labore
                  </span>
                </div>
                <div className="text-xl font-bold font-sans text-emerald-950 dark:text-emerald-100 tabular-nums">
                  {formatCurrency(financialHealth.safeToWithdraw)}
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1 font-medium">
                  Lucro líquido seguro deduzidas as despesas
                </p>
              </div>
            </div>
          </div>

          {/* =======================================================================
              COLUNA DA DIREITA (OPERAÇÃO / AÇÕES DO DIA): ATENDIMENTOS E CONTATOS
              ======================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Próximos Atendimentos de Hoje (Vibrante & Focado em Horários) */}
            <div className="bg-[var(--card-bg)] rounded-3xl p-5 md:p-6 border border-[var(--card-border)] shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                    <Calendar size={17} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                      Próximos Atendimentos
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Grade de horários do dia
                    </p>
                  </div>
                </div>
                <Link
                  href="/agenda"
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  Abrir Agenda
                </Link>
              </div>

              {metrics.todayApts.length === 0 ? (
                <div className="py-9 px-4 text-center rounded-2xl bg-rose-50/40 dark:bg-rose-950/15 border border-dashed border-rose-200/70 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-[var(--primary)] flex items-center justify-center mb-2.5">
                    <Calendar size={18} />
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Nenhum agendamento para hoje
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1 max-w-xs leading-relaxed">
                    Sua grade está livre nesta {todayFormatted}. Cadastre um novo atendimento ou divulgue horários no WhatsApp.
                  </p>
                  <div className="flex items-center gap-2 mt-4">
                    <Link
                      href="/agenda"
                      className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] transition shadow-xs"
                    >
                      Novo Agendamento
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.todayApts.map((apt) => {
                    const statusStyles: Record<
                      string,
                      { label: string; cls: string }
                    > = {
                      confirmed: {
                        label: "Confirmado",
                        cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300/80",
                      },
                      pending: {
                        label: "Aguardando",
                        cls: "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300/80",
                      },
                      completed: {
                        label: "Concluído",
                        cls: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border-slate-300",
                      },
                      cancelled: {
                        label: "Cancelado",
                        cls: "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300",
                      },
                      no_show: {
                        label: "Não compareceu",
                        cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-300",
                      },
                    };

                    const currentStatus =
                      statusStyles[apt.status] || statusStyles.pending;

                    return (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-2xl border border-[var(--card-border)] hover:border-rose-300/80 transition-all bg-[var(--card-bg)] shadow-2xs hover:shadow-xs flex items-center justify-between gap-3"
                      >
                        {/* Bloco de Horário em Destaque Colorido */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col items-center justify-center px-3 py-1.5 rounded-xl bg-gradient-to-b from-rose-50 to-pink-50/80 dark:from-rose-950/40 dark:to-transparent border border-rose-200/80 dark:border-rose-900/50 min-w-[58px] text-center shrink-0">
                            <span className="text-sm font-bold font-sans text-rose-950 dark:text-rose-100 tracking-tight">
                              {apt.time}
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                              {apt.duration}m
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                                {apt.clientName}
                              </h4>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${currentStatus.cls}`}
                              >
                                {currentStatus.label}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted)] truncate mt-0.5 font-medium">
                              {apt.serviceName}
                            </p>
                            <p className="text-[10px] text-[var(--muted)]/90 mt-0.5">
                              Prof.{" "}
                              <strong className="text-[var(--foreground)] font-semibold">
                                {apt.professionalName}
                              </strong>
                            </p>
                          </div>
                        </div>

                        {/* Valor e Ação de WhatsApp Rápido */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums hidden sm:inline">
                            {formatCurrency(apt.price)}
                          </span>
                          {apt.clientPhone ? (
                            <button
                              onClick={() => {
                                const clean = apt.clientPhone.replace(/\D/g, "");
                                const num =
                                  clean.length <= 11 ? `55${clean}` : clean;
                                const msg = encodeURIComponent(
                                  `Olá ${apt.clientName}! Passando para confirmar seu horário hoje às ${apt.time} para ${apt.serviceName} no ${salonName}. Te esperamos! ✨`,
                                );
                                window.open(
                                  `https://wa.me/${num}?text=${msg}`,
                                  "_blank",
                                );
                              }}
                              className="p-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white transition-all shadow-xs shadow-[#25D366]/30 shrink-0 cursor-pointer"
                              title="Enviar confirmação via WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget de Aniversariantes do Mês (Vibrante com Festa & Mimos) */}
            <div className="bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 dark:from-rose-950/20 dark:via-[#1c151b] dark:to-transparent rounded-3xl p-5 md:p-6 border border-rose-200/70 dark:border-rose-900/40 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/50 text-pink-600 dark:text-pink-300 flex items-center justify-center">
                    <Cake size={17} />
                  </div>
                  <h3 className="text-sm font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Aniversariantes do Mês
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-full">
                  {metrics.birthdaysThisMonth.length} clientes
                </span>
              </div>

              {metrics.birthdaysThisMonth.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-2xl bg-white/70 dark:bg-zinc-900/60 border border-dashed border-rose-200">
                  <p className="text-xs font-bold text-[var(--foreground)]">
                    Nenhuma aniversariante neste mês
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    Preencha a data de nascimento no cadastro das clientes para enviar mimos e felicitações.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.birthdaysThisMonth.map((c) => {
                    const day = c.birthDate?.split("-")[2] || "";

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-900/80 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Badge de Dia Colorido */}
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold flex flex-col items-center justify-center shadow-xs shadow-pink-500/20 shrink-0">
                            <span className="text-xs leading-none">{day}</span>
                            <span className="text-[8px] uppercase tracking-wider opacity-90">
                              Dia
                            </span>
                          </div>

                          <div className="truncate">
                            <p className="text-xs font-bold text-[var(--foreground)] truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[var(--muted)] truncate">
                              {c.phone || "Sem telefone"}
                            </p>
                          </div>
                        </div>

                        {c.phone ? (
                          <button
                            onClick={() => {
                              const clean = c.phone.replace(/\D/g, "");
                              const num =
                                clean.length <= 11 ? `55${clean}` : clean;
                              const msg = encodeURIComponent(
                                `Parabéns, ${c.name}! 🎂✨ Que seu novo ciclo seja maravilhoso! Preparamos um presente especial para seu mês de aniversário aqui no ${salonName}. Vamos agendar seu horário?`,
                              );
                              window.open(
                                `https://wa.me/${num}?text=${msg}`,
                                "_blank",
                              );
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] font-bold shadow-xs shadow-[#25D366]/20 transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <MessageCircle size={13} /> Felicitar
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget Rápido: Link de Agendamento da Bio do Instagram */}
            <div className="bg-gradient-to-br from-purple-50 via-pink-50/40 to-amber-50/40 dark:from-purple-950/25 dark:via-pink-950/20 dark:to-amber-950/15 rounded-3xl p-5 border border-purple-200/70 dark:border-purple-900/40 shadow-xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-xs shadow-purple-500/25 shrink-0">
                  <Link2 size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--foreground)]">
                    Link de Agendamento Online
                  </h4>
                  <p className="text-[10px] text-[var(--muted)] font-medium">
                    Coloque na Bio do seu Instagram
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-zinc-900 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900/40 text-[11px] text-[var(--foreground)] truncate font-mono">
                  bellamais.com/agendar/
                  {(salonName || "meusalao")
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]/g, "")}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs shadow-purple-500/25"
                  title="Copiar Link da Bio"
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
