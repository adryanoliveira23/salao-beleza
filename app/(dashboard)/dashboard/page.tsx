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
  Link2,
  Copy,
  Check,
  Scissors,
  DollarSign,
  Activity,
  Crown,
  ChevronRight,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import { soundEffects } from "@/lib/soundEffects";

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
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);
  const [soundActive, setSoundActive] = useState(!soundEffects.isMuted());

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split("T")[0], [now]);
  const currentMonth = now.getMonth() + 1;

  // Saudação acolhedora de acordo com o turno do dia
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, [now]);

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

  // URL real e dinâmica do agendamento online baseada no @username exclusivo do salão
  const activeUsername = useMemo(() => {
    if (profile?.username?.trim()) {
      return profile.username.trim().toLowerCase();
    }
    // Fallback: se ainda não houver username configurado, gera slug limpo do salão
    return (profile?.salon_name || salonName || "salao")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "");
  }, [profile, salonName]);

  const getFullBookingUrl = () => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://bellamais.com";
    return `${origin}/agendamento/${activeUsername}`;
  };

  const handleCopyLink = () => {
    soundEffects.playClick();
    const link = getFullBookingUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyBroadcast = () => {
    soundEffects.playClick();
    const link = getFullBookingUrl();
    const slots = metrics.availableSlotsToday;
    const slotsText =
      slots > 0
        ? `temos ${slots} horários livres hoje`
        : "temos alguns horários livres hoje";
    const text = `Oi meninas! Passando para avisar que ${slotsText} no ${salonName || "salão"}! ✨💅\n\nResponda esta mensagem para garantir seu horário ou reserve direto pelo link:\n${link}`;
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex bg-[var(--background)] h-full items-center justify-center text-[var(--primary)] min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent"></div>
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
    <div className="flex flex-col min-h-full bg-transparent font-sans text-[var(--foreground)] relative overflow-hidden">
      {/* Auras Sutis de Fundo: Profundidade e Vida no Modo Claro e Escuro */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-rose-400/12 via-pink-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-gradient-to-bl from-emerald-400/12 via-teal-400/8 to-transparent rounded-full blur-3xl pointer-events-none" />

      <Header title="Painel Principal" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1480px] w-full mx-auto relative z-10">
        {/* =========================================================================
            BARRA DE CONTROLE EXECUTIVA: OBJETIVA, DIRETA E SEM POLUIÇÃO
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Visão Geral
              </h1>
              {salonName && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/25">
                  {salonName}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-[var(--muted)] capitalize mt-1 font-medium">
              {todayFormatted} • Salão aberto
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Botão de Áudio Tátil Feminino */}
            <button
              onClick={() => {
                const active = soundEffects.toggleMute();
                setSoundActive(active);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-zinc-700 hover:text-zinc-900 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 dark:bg-[var(--card-bg)] dark:border-[var(--card-border)] dark:text-[var(--muted)] dark:hover:text-[var(--foreground)]"
              title={soundActive ? "Efeitos sonoros táteis ativados ✨" : "Efeitos sonoros desativados"}
            >
              {soundActive ? (
                <>
                  <Volume2 size={14} className="text-rose-500 dark:text-rose-400 animate-pulse" />
                  <span className="hidden sm:inline">Sons Ativos</span>
                </>
              ) : (
                <>
                  <VolumeX size={14} className="text-stone-400" />
                  <span className="hidden sm:inline">Sem Som</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 dark:bg-[var(--card-bg)] dark:border-[var(--card-border)] dark:text-[var(--foreground)]"
              title="Copiar link para a bio do Instagram"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 size={14} className="text-rose-500 dark:text-[var(--muted)]" />
                  <span>Link da Bio</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyBroadcast}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-zinc-800 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 dark:bg-[var(--card-bg)] dark:border-[var(--card-border)] dark:text-[var(--foreground)]"
              title="Copia uma mensagem pronta com seus horários livres de hoje para postar no WhatsApp ou Instagram Stories"
            >
              {copiedBroadcast ? (
                <>
                  <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <MessageCircle size={14} className="text-emerald-600 dark:text-[var(--muted)]" />
                  <span>Divulgar Horários</span>
                </>
              )}
            </button>

            <Link
              href="/agenda"
              onClick={() => soundEffects.playSparkle()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold transition-all shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Novo Agendamento</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. OS 4 INDICADORES CHAVE COM DESIGN VIBRANTE, LUMINOSO E VIVO (LIGHT & DARK)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento no Mês (Esmeralda & Menta Viva) */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-emerald-300/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/70 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.18),0_2px_6px_-2px_rgba(16,185,129,0.1)] hover:-translate-y-1 hover:border-emerald-400 hover:shadow-[0_14px_30px_-4px_rgba(16,185,129,0.26)] transition-all flex flex-col justify-between group dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-emerald-950/35 dark:via-[#1e131e] dark:to-[#170e17] dark:shadow-[inset_0_1px_0_0_rgba(16,185,129,0.25),0_10px_28px_-4px_rgba(0,0,0,0.65)] dark:hover:border-emerald-400/50 dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),0_0_24px_rgba(16,185,129,0.2)]">
            {/* Ambient emerald light bloom permanente */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none group-hover:bg-emerald-400/30 dark:bg-emerald-500/15 dark:group-hover:bg-emerald-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-2.5 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Faturamento no Mês
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] flex items-center justify-center dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/35 dark:shadow-[0_0_14px_rgba(16,185,129,0.2)]">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums relative z-10">
                {formatCurrency(financialHealth.monthlyRevenue)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200/80 dark:border-white/[0.08] space-y-2 relative z-10">
              <div className="flex items-center justify-between text-[11px] text-zinc-600 dark:text-[var(--muted)]">
                <span className="font-semibold">Meta: {formatCurrency(settings.monthlyGoal)}</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300/80 dark:border-emerald-500/30">
                  {metrics.hasComparison ? metrics.growthText : `${goalPercent}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-emerald-100/80 dark:bg-black/45 border border-emerald-200/60 dark:border-white/[0.06] rounded-full overflow-hidden p-[1px]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Atendimentos Hoje (Rosé Radiante & Framboesa) */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-rose-300/80 bg-gradient-to-br from-rose-50 via-white to-pink-50/70 shadow-[0_8px_24px_-4px_rgba(244,63,94,0.18),0_2px_6px_-2px_rgba(244,63,94,0.1)] hover:-translate-y-1 hover:border-rose-400 hover:shadow-[0_14px_30px_-4px_rgba(244,63,94,0.26)] transition-all flex flex-col justify-between group dark:border-rose-500/30 dark:bg-gradient-to-br dark:from-rose-950/35 dark:via-[#221320] dark:to-[#170e17] dark:shadow-[inset_0_1px_0_0_rgba(244,63,94,0.25),0_10px_28px_-4px_rgba(0,0,0,0.65)] dark:hover:border-rose-400/50 dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),0_0_24px_rgba(244,63,94,0.2)]">
            {/* Ambient rose light bloom permanente */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-rose-400/20 blur-2xl pointer-events-none group-hover:bg-rose-400/30 dark:bg-rose-500/15 dark:group-hover:bg-rose-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-2.5 relative z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300">
                    Atendimentos Hoje
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.35)] flex items-center justify-center dark:bg-rose-500/15 dark:text-rose-300 dark:border dark:border-rose-500/35 dark:shadow-[0_0_14px_rgba(244,63,94,0.2)]">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 relative z-10">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums">
                  {metrics.todayApts.length}
                </span>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-300/80 dark:border-rose-500/25">
                  clientes na grade
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] relative z-10">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-300/80 dark:border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                {metrics.confirmedTodayCount} confirmados
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                {metrics.pendingTodayCount} aguardando
              </span>
            </div>
          </div>

          {/* Card 3: Ticket Médio (Champagne Gold / Prestígio) */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-yellow-50/70 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.18),0_2px_6px_-2px_rgba(245,158,11,0.1)] hover:-translate-y-1 hover:border-amber-400 hover:shadow-[0_14px_30px_-4px_rgba(245,158,11,0.26)] transition-all flex flex-col justify-between group dark:border-amber-500/30 dark:bg-gradient-to-br dark:from-amber-950/35 dark:via-[#211718] dark:to-[#170e17] dark:shadow-[inset_0_1px_0_0_rgba(251,191,36,0.25),0_10px_28px_-4px_rgba(0,0,0,0.65)] dark:hover:border-amber-400/50 dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),0_0_24px_rgba(251,191,36,0.2)]">
            {/* Ambient gold light bloom permanente */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl pointer-events-none group-hover:bg-amber-400/30 dark:bg-amber-500/15 dark:group-hover:bg-amber-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-2.5 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500 dark:text-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Ticket Médio
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-[0_4px_12px_rgba(245,158,11,0.35)] flex items-center justify-center dark:bg-amber-500/15 dark:text-amber-300 dark:border dark:border-amber-500/35 dark:shadow-[0_0_14px_rgba(251,191,36,0.2)]">
                  <Crown size={18} />
                </div>
              </div>

              <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums relative z-10">
                {formatCurrency(financialHealth.averageTicket)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-600 dark:text-[var(--muted)] relative z-10">
              <span className="font-semibold">{metrics.completedMonthCount} concluídos</span>
              <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-500/25">
                Média Mês
              </span>
            </div>
          </div>

          {/* Card 4: Ocupação da Grade (Lilás Orquídea com Mini-Medidor Circular SVG) */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-purple-300/80 bg-gradient-to-br from-purple-50 via-white to-violet-50/70 shadow-[0_8px_24px_-4px_rgba(168,85,247,0.18),0_2px_6px_-2px_rgba(168,85,247,0.1)] hover:-translate-y-1 hover:border-purple-400 hover:shadow-[0_14px_30px_-4px_rgba(168,85,247,0.26)] transition-all flex flex-col justify-between group dark:border-purple-500/30 dark:bg-gradient-to-br dark:from-purple-950/35 dark:via-[#1f1325] dark:to-[#160e18] dark:shadow-[inset_0_1px_0_0_rgba(192,132,252,0.25),0_10px_28px_-4px_rgba(0,0,0,0.65)] dark:hover:border-purple-400/50 dark:hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),0_0_24px_rgba(192,132,252,0.2)]">
            {/* Ambient purple light bloom permanente */}
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-purple-400/20 blur-2xl pointer-events-none group-hover:bg-purple-400/30 dark:bg-purple-500/15 dark:group-hover:bg-purple-500/25 transition-all" />

            <div>
              <div className="flex items-center justify-between mb-2 relative z-10">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Ocupação da Grade
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(168,85,247,0.35)] flex items-center justify-center dark:bg-purple-500/15 dark:text-purple-300 dark:border dark:border-purple-500/35 dark:shadow-[0_0_14px_rgba(192,132,252,0.2)]">
                  <Activity size={18} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 relative z-10">
                <div>
                  <div className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums">
                    {metrics.occupancyRate}%
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-[var(--muted)] font-semibold">da capacidade</span>
                </div>

                {/* Mini Medidor Circular Chic */}
                <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                  <svg className="w-11 h-11 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-purple-100 dark:text-white/10"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-purple-600 dark:text-purple-400 transition-all duration-700 ease-out"
                      strokeDasharray={`${metrics.occupancyRate}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-purple-700 dark:text-purple-300 tabular-nums">
                    {metrics.occupancyRate}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-200/80 dark:border-white/[0.08] flex items-center justify-between text-[11px] relative z-10">
              <span className="text-zinc-600 dark:text-[var(--muted)] font-medium">Vagas para encaixe</span>
              <span className="font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-300/80 dark:border-purple-500/25">
                {metrics.availableSlotsToday} livres
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ESTRUTURA PRINCIPAL EM 2 COLUNAS (DESEMPENHO + OPERAÇÃO DIÁRIA)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =======================================================================
              COLUNA ESQUERDA (8 COLS): GRÁFICO + SERVIÇOS + RESERVAS FINANCEIRAS
              ======================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Gráfico Comparativo de Faturamento */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] flex items-center justify-center dark:bg-rose-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20 dark:border-rose-500/35 dark:shadow-[0_0_12px_rgba(244,63,94,0.16)]">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                      Evolução de Faturamento
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Lançamentos de atendimentos concluídos e pagos
                    </p>
                  </div>
                </div>

                <div className="flex bg-stone-100 dark:bg-black/40 p-1 rounded-xl border border-stone-200/80 dark:border-white/10">
                  <button
                    onClick={() => {
                      soundEffects.playPop();
                      setChartPeriod("7d");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "7d"
                        ? "bg-white text-rose-600 shadow-sm dark:bg-rose-600 dark:text-white dark:shadow-rose-950/40"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    7 Dias
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playPop();
                      setChartPeriod("6m");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "6m"
                        ? "bg-white text-rose-600 shadow-sm dark:bg-rose-600 dark:text-white dark:shadow-rose-950/40"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    6 Meses
                  </button>
                </div>
              </div>

              {/* Bar Chart Sóbrio e Fluido com Gradiente Radiante */}
              <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-stone-200/80 dark:border-white/[0.08]">
                {chartData.map((bar, idx) => {
                  const heightPercent =
                    bar.value > 0
                      ? Math.max(12, Math.round((bar.value / maxChartVal) * 100))
                      : 4;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                    >
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap bg-white dark:bg-[#12141c] px-2 py-0.5 rounded-md shadow-md border border-rose-200 dark:border-white/10">
                        {formatCurrency(bar.value)}
                      </span>
                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 ${
                          bar.value > 0
                            ? "bg-gradient-to-t from-rose-500 via-pink-500 to-rose-400 shadow-[0_4px_12px_rgba(244,63,94,0.3)] hover:brightness-110 dark:bg-gradient-to-t dark:from-rose-600 dark:to-pink-500 dark:shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                            : "bg-rose-50/80 border border-rose-100 dark:bg-black/40 dark:border-transparent"
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold capitalize truncate max-w-full">
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Resumo Consolidado do Período */}
              <div className="mt-4 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 dark:bg-black/35 dark:border-white/[0.08] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold block">
                    Mês Anterior
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                    {formatCurrency(financialHealth.previousMonthRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 dark:bg-black/35 dark:border-white/[0.08] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-bold block">
                    Mês Atual
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums mt-0.5 block">
                    {formatCurrency(financialHealth.monthlyRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 dark:bg-black/35 dark:border-white/[0.08] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-zinc-400 font-bold block">
                    Variação Real
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">
                    {metrics.growthText}
                  </span>
                </div>
              </div>
            </div>

            {/* Ranking de Serviços Mais Vendidos */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-[0_2px_8px_rgba(245,158,11,0.3)] flex items-center justify-center dark:bg-amber-500/10 dark:text-amber-400 dark:border dark:border-amber-500/20 dark:border-amber-500/35 dark:shadow-[0_0_12px_rgba(251,191,36,0.16)]">
                    <Crown size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                      Serviços Mais Procurados
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      Classificação por receita e frequência no mês
                    </p>
                  </div>
                </div>
                <Link
                  href="/servicos"
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                >
                  Ver Catálogo <ArrowRight size={13} />
                </Link>
              </div>

              {metrics.topServices.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-stone-50/60 dark:bg-black/30 border border-dashed border-stone-200 dark:border-white/10">
                  <Scissors size={24} className="mx-auto text-zinc-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Nenhum serviço realizado este mês ainda
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                    Conforme os atendimentos forem concluídos na agenda, o ranking dos serviços mais procurados aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {metrics.topServices.map((srv, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-white/[0.08] dark:text-zinc-300 dark:border-transparent text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white truncate">
                            {srv.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 hidden sm:inline font-medium">
                            • {srv.count} {srv.count === 1 ? "atendimento" : "atendimentos"}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0 ml-2">
                          {formatCurrency(srv.revenue)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-rose-50/80 dark:bg-black/40 border border-rose-100 dark:border-white/[0.06] rounded-full overflow-hidden p-[1px]">
                        <div
                          className="h-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_2px_6px_rgba(244,63,94,0.3)] dark:bg-rose-500 dark:shadow-[0_0_8px_rgba(244,63,94,0.5)] rounded-full transition-all duration-500"
                          style={{ width: `${srv.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumo da Saúde Financeira & Reservas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/40 border border-indigo-200/80 rounded-2xl p-5 shadow-[0_8px_20px_-3px_rgba(99,102,241,0.12)] dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-950 dark:text-zinc-200 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-indigo-600 dark:text-stone-300" />
                    Reserva de Custos Fixos
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold dark:bg-white/[0.08] dark:text-zinc-300 dark:border-transparent">
                    Segurança
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight text-zinc-900 dark:text-white tabular-nums">
                  {formatCurrency(financialHealth.mustSaveForFixedCosts)}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  Montante provisionado para aluguel, luz e contas essenciais
                </p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 border border-emerald-300/80 rounded-2xl p-5 shadow-[0_8px_20px_-3px_rgba(16,185,129,0.15)] dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                    Disponível p/ Retirada
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/35">
                    Pró-Labore
                  </span>
                </div>
                <div className="text-xl font-black tracking-tight text-emerald-700 dark:text-emerald-200 tabular-nums">
                  {formatCurrency(financialHealth.safeToWithdraw)}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                  Lucro líquido seguro do salão livre para transferência
                </p>
              </div>
            </div>
          </div>

          {/* =======================================================================
              COLUNA DIREITA (4 COLS): AGENDA DO DIA + ANIVERSARIANTES
              ======================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Próximos Atendimentos de Hoje */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] flex items-center justify-center dark:bg-rose-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20 dark:border-rose-500/35 dark:shadow-[0_0_12px_rgba(244,63,94,0.16)]">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                      Agenda de Hoje
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                      {metrics.todayApts.length} atendimentos na grade
                    </p>
                  </div>
                </div>
                <Link
                  href="/agenda"
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Ver Agenda
                </Link>
              </div>

              {metrics.todayApts.length === 0 ? (
                /* Estado Vazio Amigável & Inspirador */
                <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-br from-rose-50/60 to-pink-50/40 border border-rose-200/70 flex flex-col items-center dark:bg-black/30 dark:border-white/10">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs flex items-center justify-center mb-2.5 dark:bg-rose-500/15 dark:text-rose-400 dark:border dark:border-rose-500/30">
                    <Calendar size={18} />
                  </div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    Sua agenda está livre hoje ✨
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-[var(--muted)] mt-1 max-w-xs leading-relaxed">
                    Você tem {metrics.availableSlotsToday} horários livres para novos encaixes hoje. Que tal avisar as clientes no WhatsApp ou agendar novo horário?
                  </p>

                  <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
                    <button
                      onClick={handleCopyBroadcast}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-zinc-800 hover:bg-stone-50 transition cursor-pointer shadow-2xs dark:border-white/10 dark:bg-[var(--card-bg)] dark:text-[var(--foreground)]"
                      title="Copia uma mensagem pronta com seus horários livres de hoje para postar no WhatsApp ou Instagram Stories"
                    >
                      <MessageCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{copiedBroadcast ? "Texto Copiado!" : "Divulgar Horários Livres"}</span>
                    </button>
                    <Link
                      href="/agenda"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <Plus size={14} />
                      <span>Agendar Cliente</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {metrics.todayApts.map((apt) => {
                    const statusStyles: Record<
                      string,
                      { label: string; cls: string }
                    > = {
                      confirmed: {
                        label: "Confirmado",
                        cls: "bg-emerald-100 text-emerald-800 border-emerald-300/80 font-bold dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/35",
                      },
                      pending: {
                        label: "Aguardando",
                        cls: "bg-amber-100 text-amber-800 border-amber-300/80 font-bold dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/35",
                      },
                      completed: {
                        label: "Concluído",
                        cls: "bg-stone-100 text-stone-700 border-stone-200 font-bold dark:bg-white/[0.08] dark:text-zinc-300 dark:border-white/10",
                      },
                      cancelled: {
                        label: "Cancelado",
                        cls: "bg-rose-100 text-rose-800 border-rose-300/80 font-bold dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/35",
                      },
                      no_show: {
                        label: "Faltou",
                        cls: "bg-stone-100 text-stone-700 border-stone-200 font-bold dark:bg-white/[0.05] dark:text-gray-400",
                      },
                    };

                    const currentStatus =
                      statusStyles[apt.status] || statusStyles.pending;

                    return (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-2xl border border-stone-200/80 bg-stone-50/70 hover:bg-white hover:border-rose-300 shadow-2xs hover:shadow-md transition-all flex items-center justify-between gap-3 dark:border-white/[0.08] dark:bg-black/35 dark:hover:border-rose-400/40"
                      >
                        {/* Bloco de Horário */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-rose-100/90 to-pink-100/70 border border-rose-200/90 shadow-2xs min-w-[54px] text-center shrink-0 dark:bg-rose-500/15 dark:border-rose-500/30 dark:shadow-[0_0_10px_rgba(244,63,94,0.15)]">
                            <span className="text-xs font-black text-rose-950 dark:text-rose-200 tracking-tight">
                              {apt.time}
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                              {apt.duration}m
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                                {apt.clientName}
                              </h4>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${currentStatus.cls}`}
                              >
                                {currentStatus.label}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5 font-medium">
                              {apt.serviceName}
                            </p>
                          </div>
                        </div>

                        {/* Valor e Ação de WhatsApp Rápido */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums hidden sm:inline">
                            {formatCurrency(apt.price)}
                          </span>
                          {apt.clientPhone ? (
                            <button
                              onClick={() => {
                                soundEffects.playClick();
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
                              className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs dark:text-emerald-400 dark:bg-transparent dark:hover:bg-emerald-500/10 dark:border-emerald-500/20"
                              title="Enviar confirmação no WhatsApp"
                            >
                              <MessageCircle size={16} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget de Aniversariantes do Mês */}
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:bg-gradient-to-b dark:from-[#241524] dark:to-[#170e17] dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_10px_28px_-4px_rgba(0,0,0,0.65)]">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-[0_2px_8px_rgba(244,63,94,0.3)] flex items-center justify-center dark:bg-pink-500/10 dark:text-rose-400 dark:border dark:border-rose-500/20 dark:border-rose-500/35 dark:shadow-[0_0_12px_rgba(244,63,94,0.16)]">
                    <Cake size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                      Aniversariantes do Mês
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-500/35">
                  {metrics.birthdaysThisMonth.length} clientes
                </span>
              </div>

              {metrics.birthdaysThisMonth.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-2xl bg-stone-50/60 dark:bg-black/30 border border-dashed border-stone-200 dark:border-white/10">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                    Nenhuma aniversariante neste mês
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Cadastre a data de nascimento das clientes para enviar mimos especiais.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.birthdaysThisMonth.map((c) => {
                    const day = c.birthDate?.split("-")[2] || "";

                    return (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 hover:bg-white hover:border-pink-300 shadow-2xs hover:shadow-sm transition-all flex items-center justify-between gap-3 dark:border-white/[0.08] dark:bg-black/35 dark:hover:border-rose-400/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black flex items-center justify-center shrink-0 shadow-xs text-xs">
                            {day}
                          </div>

                          <div className="truncate">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-medium">
                              {c.phone || "Sem telefone"}
                            </p>
                          </div>
                        </div>

                        {c.phone ? (
                          <button
                            onClick={() => {
                              soundEffects.playClick();
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
                            className="px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-100 hover:bg-emerald-200/80 border border-emerald-300/80 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs dark:text-emerald-300 dark:bg-transparent dark:hover:bg-emerald-950/60 dark:border-transparent"
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
          </div>
        </div>
      </div>
    </div>
  );
}
