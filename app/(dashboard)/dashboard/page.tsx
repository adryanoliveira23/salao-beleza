"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Cake,
  TrendingUp,
  CheckCircle2,
  MessageCircle,
  Plus,
  ArrowRight,
  Link2,
  Check,
  Scissors,
  DollarSign,
  Activity,
  Crown,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  ArrowUpRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import { soundEffects } from "@/lib/soundEffects";
import { formatBRL } from "@/lib/formatters";

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

  // Saudação acolhedora e natural
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, [now]);

  // Formatação de data em português elegante
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

  // Nome do salão / estúdio
  const salonName = useMemo(() => {
    return profile?.salon_name?.trim() || "Meu Salão";
  }, [profile]);

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
      const clean = c.birthDate.trim();
      if (clean.includes("-")) {
        const parts = clean.split("-");
        const m = parts[0].length === 4 ? Number(parts[1]) : Number(parts[1]);
        return m === currentMonth;
      } else if (clean.includes("/")) {
        const parts = clean.split("/");
        return Number(parts[1]) === currentMonth;
      }
      return false;
    });

    // 6. Faturamento real dos últimos 7 dias
    const last7Days: { label: string; dateStr: string; value: number }[] = [];
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
      const dayNum = d.toLocaleDateString("pt-BR", { day: "2-digit" });
      last7Days.push({
        label: `${dayLabel.replace(".", "")} (${dayNum})`,
        dateStr: dStr,
        value: val,
      });
    }

    // 7. Faturamento real dos últimos 6 meses
    const last6Months: { label: string; dateStr: string; value: number }[] = [];
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
      last6Months.push({
        label: monthLabel.replace(".", ""),
        dateStr: mStr,
        value: val,
      });
    }

    // 8. Comparativo de crescimento real
    const currentRev = financialHealth.monthlyRevenue;
    const prevRev = financialHealth.previousMonthRevenue;
    let growthText = "0%";
    let growthIsPositive = true;
    let hasComparison = false;
    if (prevRev > 0) {
      const diff = Math.round(((currentRev - prevRev) / prevRev) * 100);
      growthText = `${diff >= 0 ? "+" : ""}${diff}%`;
      growthIsPositive = diff >= 0;
      hasComparison = true;
    } else if (currentRev > 0) {
      growthText = "+100%";
      growthIsPositive = true;
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
      growthIsPositive,
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

  // URL real do agendamento online
  const activeUsername = useMemo(() => {
    if (profile?.username?.trim()) {
      return profile.username.trim().toLowerCase();
    }
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
        : "temos alguns horários disponíveis hoje";
    const text = `Oi meninas! Passando para avisar que ${slotsText} no ${salonName}! ✨💅\n\nResponda esta mensagem para garantir seu horário ou reserve direto pelo link:\n${link}`;
    navigator.clipboard.writeText(text);
    setCopiedBroadcast(true);
    soundEffects.playSuccess();
    setTimeout(() => setCopiedBroadcast(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex bg-[#FAF5F2] dark:bg-[#0E0C10] h-full items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#9C3B5E] border-t-transparent"></div>
          <span className="text-xs font-medium text-[#706268] dark:text-[#A1949B]">
            Carregando painel do estúdio...
          </span>
        </div>
      </div>
    );
  }

  // Dados do gráfico
  const chartData = chartPeriod === "7d" ? metrics.last7Days : metrics.last6Months;
  const maxChartVal = Math.max(10, ...chartData.map((d) => d.value));
  const totalChartPeriodRevenue = chartData.reduce((acc, d) => acc + d.value, 0);
  const avgChartPeriodRevenue =
    chartData.length > 0 ? totalChartPeriodRevenue / chartData.length : 0;
  const peakChartItem = chartData.reduce(
    (max, d) => (d.value > max.value ? d : max),
    chartData[0] || { label: "", value: 0 },
  );

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
    <div className="flex flex-col min-h-full bg-[#FAF5F2] dark:bg-[#0E0C10] text-[#20181B] dark:text-[#F6EEF2] transition-colors duration-200">
      <Header title="Painel Principal" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* =========================================================================
            1. BARRA EDITORIAL DE BOAS-VINDAS & AÇÕES RÁPIDAS
            ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#EAE2DC] dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F2E8E4] dark:bg-[#201822] text-[#6A2035] dark:text-[#F3BACD] border border-[#E5D7D1] dark:border-[#382331]">
                Ateliê Aberto
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#20181B] dark:text-[#F6EEF2]">
                {greeting}, {salonName}
              </h1>
            </div>
            <p className="text-xs text-[#706268] dark:text-[#A1949B] capitalize mt-1">
              {todayFormatted} • Operação em andamento
            </p>
          </div>

          {/* Ações Rápidas Elegantes (Sem excesso de sombras, profundidade intencional) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Alternador de Áudio Tátil */}
            <button
              type="button"
              onClick={() => {
                const active = soundEffects.toggleMute();
                setSoundActive(active);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#161218] border border-[#EAE2DC] dark:border-white/[0.08] text-xs font-semibold text-[#5A4F54] dark:text-[#C5B8BF] hover:text-[#20181B] dark:hover:text-white transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95"
              title={soundActive ? "Efeitos sonoros táteis ativados" : "Sem som"}
            >
              {soundActive ? (
                <>
                  <Volume2 size={14} className="text-[#9C3B5E] dark:text-[#E67595]" />
                  <span className="hidden sm:inline">Sons Ativos</span>
                </>
              ) : (
                <>
                  <VolumeX size={14} className="text-[#9E9199]" />
                  <span className="hidden sm:inline">Mudo</span>
                </>
              )}
            </button>

            {/* Copiar Link da Bio */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#161218] border border-[#EAE2DC] dark:border-white/[0.08] text-xs font-semibold text-[#3C3035] dark:text-[#E8DCE2] hover:border-[#9C3B5E]/40 transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95"
              title="Copiar link do agendamento para a Bio do Instagram"
            >
              {copiedLink ? (
                <>
                  <Check size={14} className="text-[#386B4F] dark:text-[#529770]" />
                  <span className="text-[#386B4F] dark:text-[#529770] font-bold">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Link2 size={14} className="text-[#9C3B5E] dark:text-[#E67595]" />
                  <span>Link da Bio</span>
                </>
              )}
            </button>

            {/* Divulgar Horários Livres */}
            <button
              type="button"
              onClick={handleCopyBroadcast}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EFF5F1] dark:bg-[#102117] border border-[#DCE7DF] dark:border-[#1E3526] text-xs font-semibold text-[#2B563D] dark:text-[#9ECBB0] hover:bg-[#E5EFE8] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95"
              title="Copia mensagem carinhosa com seus horários livres para divulgar no WhatsApp ou Stories"
            >
              {copiedBroadcast ? (
                <>
                  <Check size={14} className="text-[#386B4F] dark:text-[#529770]" />
                  <span className="font-bold">Texto Copiado!</span>
                </>
              ) : (
                <>
                  <MessageCircle size={14} />
                  <span>Divulgar Horários ({metrics.availableSlotsToday} livres)</span>
                </>
              )}
            </button>

            {/* Novo Agendamento (Botão Nobre Vinho) */}
            <Link
              href="/agenda"
              onClick={() => soundEffects.playSparkle()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6A1B34] hover:bg-[#521327] text-white text-xs font-bold transition-all shadow-[0_2px_6px_rgba(106,27,52,0.25)] active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Novo Agendamento</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. OS 4 CARDS DE INDICADORES (SUPERFÍCIES INTENCIONAIS & CORES EDITORIAIS)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CARD 1: FATURAMENTO NO MÊS (HERO VINHO & BLUSH SUAVE) */}
          <div className="rounded-2xl p-5 bg-[#FCF4F6] dark:bg-[#181116] border border-[#EED7DE] dark:border-[#382331] shadow-[0_1px_3px_rgba(30,15,20,0.03)] flex flex-col justify-between transition-all duration-200 hover:border-[#E0BCC8] dark:hover:border-[#4E2E44]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wide uppercase text-[#6A1B34] dark:text-[#F3BACD]">
                  Faturamento no Mês
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F2D6DF] dark:bg-[#2D1A27] text-[#6A1B34] dark:text-[#F3BACD] flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3F0D1C] dark:text-[#FDEEF4] tabular-nums">
                {formatBRL(financialHealth.monthlyRevenue)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EED7DE]/80 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#706268] dark:text-[#A1949B]">
                <span className="font-medium">
                  Meta: {formatBRL(settings.monthlyGoal)}
                </span>
                <span className="font-bold text-[#6A1B34] dark:text-[#F3BACD] bg-[#F2D6DF]/60 dark:bg-[#2D1A27] px-2 py-0.5 rounded-full text-[11px]">
                  {metrics.hasComparison ? metrics.growthText : `${goalPercent}% atingido`}
                </span>
              </div>
              {/* Barra de progresso delicada */}
              <div className="h-2 w-full bg-[#EED7DE]/60 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#8E2845] to-[#B34567] dark:from-[#E67595] dark:to-[#F494AF] rounded-full transition-all duration-500"
                  style={{ width: `${goalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: ATENDIMENTOS HOJE (LINHO & CREME REFINADO) */}
          <div className="rounded-2xl p-5 bg-[#F8F5EE] dark:bg-[#151411] border border-[#EAE3D4] dark:border-[#2C271E] shadow-[0_1px_3px_rgba(30,25,15,0.03)] flex flex-col justify-between transition-all duration-200 hover:border-[#DACFB8] dark:hover:border-[#3D362B]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wide uppercase text-[#5A4527] dark:text-[#DFCAA8]">
                  Atendimentos Hoje
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#ECE3CE] dark:bg-[#282116] text-[#5A4527] dark:text-[#DFCAA8] flex items-center justify-center">
                  <Calendar size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F261B] dark:text-[#F5EFE4] tabular-nums">
                  {metrics.todayApts.length}
                </span>
                <span className="text-xs font-medium text-[#7A6A55] dark:text-[#B3A694]">
                  clientes na grade
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EAE3D4]/80 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#2B563D] dark:text-[#9ECBB0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#386B4F]" />
                {metrics.confirmedTodayCount} confirmados
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#8A5624] dark:text-[#E2B075]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C28E51]" />
                {metrics.pendingTodayCount} aguardando
              </span>
            </div>
          </div>

          {/* CARD 3: TICKET MÉDIO (PÊSSEGO & ÂMBAR TERROSO) */}
          <div className="rounded-2xl p-5 bg-[#FAF3EA] dark:bg-[#18130E] border border-[#EFE1D0] dark:border-[#332415] shadow-[0_1px_3px_rgba(30,20,10,0.03)] flex flex-col justify-between transition-all duration-200 hover:border-[#DECEB8] dark:hover:border-[#4A341E]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wide uppercase text-[#7A4B1D] dark:text-[#E6BC88]">
                  Ticket Médio
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#F3DFCA] dark:bg-[#2C1D10] text-[#7A4B1D] dark:text-[#E6BC88] flex items-center justify-center">
                  <Crown size={16} />
                </div>
              </div>

              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#43270C] dark:text-[#F6E7D7] tabular-nums">
                {formatBRL(financialHealth.averageTicket)}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#EFE1D0]/80 dark:border-white/[0.06] flex items-center justify-between text-xs text-[#7A6A55] dark:text-[#B3A694]">
              <span className="font-medium">
                {metrics.completedMonthCount} concluídos no mês
              </span>
              <span className="font-bold text-[#7A4B1D] dark:text-[#E6BC88] bg-[#F3DFCA]/60 dark:bg-[#2C1D10] px-2 py-0.5 rounded-full text-[11px]">
                Média Real
              </span>
            </div>
          </div>

          {/* CARD 4: OCUPAÇÃO DA GRADE (VERDE SÁLVIA FRESCO) */}
          <div className="rounded-2xl p-5 bg-[#EFF5F1] dark:bg-[#0F1713] border border-[#DCE7DF] dark:border-[#1E3025] shadow-[0_1px_3px_rgba(15,30,20,0.03)] flex flex-col justify-between transition-all duration-200 hover:border-[#C4D9CA] dark:hover:border-[#2C4636]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold tracking-wide uppercase text-[#29563C] dark:text-[#9ECBB0]">
                  Ocupação da Grade
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#DFECE3] dark:bg-[#182C20] text-[#29563C] dark:text-[#9ECBB0] flex items-center justify-center">
                  <Activity size={16} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#173624] dark:text-[#E3F2E9] tabular-nums">
                  {metrics.occupancyRate}%
                </div>

                {/* Mini anel elegante em sálvia */}
                <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                  <svg className="w-9 h-9 -rotate-90 transform" viewBox="0 0 36 36">
                    <path
                      className="text-[#DCE7DF] dark:text-[#1E3025]"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#386B4F] dark:text-[#529770] transition-all duration-700 ease-out"
                      strokeDasharray={`${metrics.occupancyRate}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#DCE7DF]/80 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-[#556E5E] dark:text-[#8AA896] font-medium">
                Vagas disponíveis
              </span>
              <span className="font-bold text-[#29563C] dark:text-[#9ECBB0] bg-[#DFECE3]/70 dark:bg-[#182C20] px-2 py-0.5 rounded-full text-[11px]">
                {metrics.availableSlotsToday} livres hoje
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ESTRUTURA PRINCIPAL: GRÁFICO DE FATURAMENTO + AGENDA DO DIA
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUNA ESQUERDA (7 COLS): GRÁFICO DE FATURAMENTO & RANKING DE SERVIÇOS */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* GRÁFICO COM PREENCHIMENTO SUAVE E INFORMAÇÕES QUE FACILITAM A LEITURA */}
            <div className="bg-white dark:bg-[#161218] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(20,10,15,0.02)] space-y-5">
              {/* Cabeçalho do Gráfico com Indicadores Integrados */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE2DC] dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#9C3B5E]" />
                    <h3 className="text-base font-bold text-[#20181B] dark:text-[#F6EEF2]">
                      Evolução de Faturamento
                    </h3>
                  </div>
                  <p className="text-xs text-[#706268] dark:text-[#A1949B] mt-0.5">
                    Receita de atendimentos realizados e confirmados no caixa
                  </p>
                </div>

                {/* Alternador 7 Dias / 6 Meses */}
                <div className="flex items-center p-1 rounded-xl bg-[#FAF5F2] dark:bg-[#1D1720] border border-[#EAE2DC] dark:border-white/[0.08] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playPop();
                      setChartPeriod("7d");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "7d"
                        ? "bg-white dark:bg-[#281F2C] text-[#6A1B34] dark:text-[#F3BACD] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        : "text-[#706268] dark:text-[#A1949B] hover:text-[#20181B] dark:hover:text-white"
                    }`}
                  >
                    Últimos 7 Dias
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playPop();
                      setChartPeriod("6m");
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chartPeriod === "6m"
                        ? "bg-white dark:bg-[#281F2C] text-[#6A1B34] dark:text-[#F3BACD] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                        : "text-[#706268] dark:text-[#A1949B] hover:text-[#20181B] dark:hover:text-white"
                    }`}
                  >
                    Últimos 6 Meses
                  </button>
                </div>
              </div>

              {/* Faixa com Destaques do Período (Preenchimento e Contexto Útil) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF5F2]/80 dark:bg-[#1A141D] border border-[#EAE2DC]/80 dark:border-white/[0.04]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706268] dark:text-[#A1949B] block">
                    Total no Período
                  </span>
                  <span className="text-base font-extrabold text-[#20181B] dark:text-[#F6EEF2] tabular-nums mt-0.5 block">
                    {formatBRL(totalChartPeriodRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#706268] dark:text-[#A1949B] block">
                    Média {chartPeriod === "7d" ? "Diária" : "Mensal"}
                  </span>
                  <span className="text-base font-extrabold text-[#20181B] dark:text-[#F6EEF2] tabular-nums mt-0.5 block">
                    {formatBRL(avgChartPeriodRevenue)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#386B4F] dark:text-[#9ECBB0] block">
                    Melhor Desempenho
                  </span>
                  <span className="text-xs font-bold text-[#2B563D] dark:text-[#9ECBB0] mt-0.5 block truncate">
                    {peakChartItem.label}: <strong>{formatBRL(peakChartItem.value)}</strong>
                  </span>
                </div>
              </div>

              {/* Área Gráfica com Altura Adequada, Sem Vazio Excessivo */}
              <div className="pt-4 pb-2">
                <div className="h-60 flex items-end justify-between gap-2.5 sm:gap-4 px-2">
                  {chartData.map((bar, idx) => {
                    const isPeak = bar.value > 0 && bar.value === peakChartItem.value;
                    const heightPercent =
                      bar.value > 0
                        ? Math.max(14, Math.round((bar.value / maxChartVal) * 100))
                        : 6;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                      >
                        {/* Tooltip / Valor formatado visível no topo da barra */}
                        <div className="text-[11px] font-bold text-[#5A182E] dark:text-[#F3BACD] tabular-nums text-center whitespace-nowrap transition-all">
                          {bar.value > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-[#FAF5F2] dark:bg-[#201822] border border-[#EAE2DC] dark:border-white/[0.08] text-[10px]">
                              {formatBRL(bar.value)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#A89DA2] dark:text-[#5F545B]">
                              R$ 0
                            </span>
                          )}
                        </div>

                        {/* Barra com Estilo Aveludado Editorial (Sem Neon) */}
                        <div
                          className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative ${
                            isPeak
                              ? "bg-gradient-to-t from-[#6A1B34] to-[#9C3B5E] dark:from-[#A83758] dark:to-[#E67595]"
                              : bar.value > 0
                              ? "bg-gradient-to-t from-[#8E445B]/85 to-[#B8697F]/85 dark:from-[#3C222E] dark:to-[#6E354A] hover:brightness-105"
                              : "bg-[#F2E8E4]/60 dark:bg-white/[0.03] border border-dashed border-[#EAE2DC] dark:border-white/[0.04]"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {isPeak && (
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#386B4F] text-white">
                              Pico
                            </span>
                          )}
                        </div>

                        {/* Rótulo do Dia / Mês */}
                        <span
                          className={`text-xs font-semibold capitalize truncate max-w-full text-center ${
                            isPeak
                              ? "text-[#6A1B34] dark:text-[#F3BACD] font-bold"
                              : "text-[#706268] dark:text-[#A1949B]"
                          }`}
                        >
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RANKING DE SERVIÇOS MAIS PROCURADOS */}
            <div className="bg-white dark:bg-[#161218] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(20,10,15,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2DC] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF3EA] dark:bg-[#201811] text-[#7A4B1D] dark:text-[#E6BC88] flex items-center justify-center">
                    <Scissors size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#20181B] dark:text-[#F6EEF2]">
                      Serviços Mais Procurados do Mês
                    </h3>
                  </div>
                </div>
                <Link
                  href="/servicos"
                  className="text-xs font-bold text-[#9C3B5E] dark:text-[#E67595] hover:underline flex items-center gap-1"
                >
                  Ver Catálogo <ArrowRight size={13} />
                </Link>
              </div>

              {metrics.topServices.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#FAF5F2]/60 dark:bg-white/[0.02] border border-dashed border-[#EAE2DC] dark:border-white/[0.06]">
                  <Scissors size={20} className="mx-auto text-[#9E9199] mb-1.5 opacity-60" />
                  <p className="text-xs font-semibold text-[#20181B] dark:text-[#F6EEF2]">
                    Nenhum serviço registrado neste mês ainda
                  </p>
                  <p className="text-[11px] text-[#706268] dark:text-[#A1949B] mt-0.5">
                    Conforme você concluir atendimentos, o ranking dos mais procurados aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {metrics.topServices.map((srv, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-[13px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-[#FAF5F2] dark:bg-[#201822] text-[#6A1B34] dark:text-[#F3BACD] border border-[#EAE2DC] dark:border-white/[0.08] text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-[#20181B] dark:text-[#F6EEF2] truncate">
                            {srv.name}
                          </span>
                          <span className="text-[11px] text-[#706268] dark:text-[#A1949B] shrink-0 font-medium">
                            • {srv.count} {srv.count === 1 ? "visita" : "visitas"}
                          </span>
                        </div>
                        <span className="font-bold text-[#2B563D] dark:text-[#9ECBB0] tabular-nums shrink-0 ml-2">
                          {formatBRL(srv.revenue)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#FAF5F2] dark:bg-white/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#9C3B5E] to-[#C28E51] rounded-full transition-all duration-500"
                          style={{ width: `${srv.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SAÚDE FINANCEIRA & RESERVAS (CREME & SÁLVIA NOBRE) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-4 sm:p-5 bg-[#F8F5EE] dark:bg-[#151411] border border-[#EAE3D4] dark:border-[#2C271E] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#5A4527] dark:text-[#DFCAA8] flex items-center gap-1.5">
                    <ShieldCheck size={15} />
                    Reserva de Custos Fixos
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ECE3CE] dark:bg-[#282116] text-[#5A4527] dark:text-[#DFCAA8] font-bold">
                    Provisionado
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#2F261B] dark:text-[#F5EFE4] tabular-nums">
                  {formatBRL(financialHealth.mustSaveForFixedCosts)}
                </div>
                <p className="text-[11px] text-[#7A6A55] dark:text-[#B3A694] mt-1">
                  Aluguel, energia, internet e despesas essenciais do salão
                </p>
              </div>

              <div className="rounded-2xl p-4 sm:p-5 bg-[#EFF5F1] dark:bg-[#0F1713] border border-[#DCE7DF] dark:border-[#1E3025] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#29563C] dark:text-[#9ECBB0] flex items-center gap-1.5">
                    <CheckCircle2 size={15} />
                    Livre para Retirada
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DFECE3] dark:bg-[#182C20] text-[#29563C] dark:text-[#9ECBB0] font-bold">
                    Pró-Labore
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#173624] dark:text-[#E3F2E9] tabular-nums">
                  {formatBRL(financialHealth.safeToWithdraw)}
                </div>
                <p className="text-[11px] text-[#556E5E] dark:text-[#8AA896] mt-1">
                  Lucro líquido seguro liberado para transferir à proprietária
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (5 COLS): AGENDA DO DIA + ANIVERSARIANTES */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* AGENDA DE HOJE */}
            <div className="bg-white dark:bg-[#161218] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(20,10,15,0.02)] flex flex-col space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2DC] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FCF4F6] dark:bg-[#201822] text-[#6A1B34] dark:text-[#F3BACD] flex items-center justify-center">
                    <Calendar size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#20181B] dark:text-[#F6EEF2]">
                      Agenda de Hoje
                    </h3>
                  </div>
                </div>
                <Link
                  href="/agenda"
                  className="text-xs font-bold text-[#9C3B5E] dark:text-[#E67595] hover:underline"
                >
                  Ver Completa
                </Link>
              </div>

              {metrics.todayApts.length === 0 ? (
                /* Estado Vazio Acolhedor */
                <div className="py-8 px-4 text-center rounded-xl bg-[#FAF5F2]/60 dark:bg-white/[0.02] border border-dashed border-[#EAE2DC] dark:border-white/[0.06] flex flex-col items-center">
                  <div className="w-9 h-9 rounded-xl bg-[#F8F5EE] dark:bg-[#201822] text-[#5A4527] dark:text-[#DFCAA8] flex items-center justify-center mb-2">
                    <Calendar size={16} />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#20181B] dark:text-[#F6EEF2]">
                    Nenhum agendamento para hoje ainda ✨
                  </p>
                  <p className="text-[11px] text-[#706268] dark:text-[#A1949B] mt-1 max-w-xs leading-relaxed">
                    Você possui {metrics.availableSlotsToday} horários livres para novos encaixes hoje.
                  </p>
                  <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={handleCopyBroadcast}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE2DC] dark:border-white/[0.08] bg-white dark:bg-[#1D1720] text-xs font-semibold text-[#20181B] dark:text-[#F6EEF2] hover:bg-[#FAF5F2] transition cursor-pointer"
                    >
                      {copiedBroadcast ? "Copiado!" : "Divulgar Horários"}
                    </button>
                    <Link
                      href="/agenda"
                      className="px-3.5 py-1.5 rounded-xl bg-[#6A1B34] text-white text-xs font-bold transition hover:bg-[#521327]"
                    >
                      Agendar Cliente
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {metrics.todayApts.map((apt) => {
                    const statusConfig: Record<
                      string,
                      { label: string; badgeCls: string }
                    > = {
                      confirmed: {
                        label: "Confirmado",
                        badgeCls:
                          "bg-[#EFF5F1] dark:bg-[#102117] text-[#2B563D] dark:text-[#9ECBB0] border-[#DCE7DF] dark:border-[#1E3526]",
                      },
                      pending: {
                        label: "Aguardando",
                        badgeCls:
                          "bg-[#FAF3EA] dark:bg-[#1D170E] text-[#7A4B1D] dark:text-[#E6BC88] border-[#EFE1D0] dark:border-[#332415]",
                      },
                      completed: {
                        label: "Concluído",
                        badgeCls:
                          "bg-[#FAF5F2] dark:bg-white/[0.04] text-[#706268] dark:text-[#A1949B] border-[#EAE2DC] dark:border-white/[0.08]",
                      },
                      cancelled: {
                        label: "Cancelado",
                        badgeCls:
                          "bg-[#FCF4F6] dark:bg-[#201217] text-[#8E2845] dark:text-[#F3BACD] border-[#EED7DE] dark:border-[#382331]",
                      },
                      no_show: {
                        label: "Faltou",
                        badgeCls:
                          "bg-stone-100 text-stone-600 border-stone-200 dark:bg-white/[0.04] dark:text-stone-400",
                      },
                    };

                    const currentStatus =
                      statusConfig[apt.status] || statusConfig.pending;

                    return (
                      <div
                        key={apt.id}
                        className="p-3 rounded-xl border border-[#EAE2DC]/80 dark:border-white/[0.06] bg-[#FAF5F2]/50 dark:bg-[#1A141D]/40 hover:bg-white dark:hover:bg-[#1D1720] transition-all flex items-center justify-between gap-3"
                      >
                        {/* Horário & Cliente */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-[#F8F5EE] dark:bg-[#201822] border border-[#EAE3D4] dark:border-white/[0.06] min-w-[50px] text-center shrink-0">
                            <span className="text-xs font-black text-[#2F261B] dark:text-[#F5EFE4]">
                              {apt.time}
                            </span>
                            <span className="text-[10px] text-[#7A6A55] dark:text-[#B3A694]">
                              {apt.duration}m
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-[#20181B] dark:text-[#F6EEF2] truncate">
                                {apt.clientName}
                              </h4>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border ${currentStatus.badgeCls}`}
                              >
                                {currentStatus.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#706268] dark:text-[#A1949B] truncate mt-0.5">
                              {apt.serviceName}
                            </p>
                          </div>
                        </div>

                        {/* Preço e WhatsApp */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-[#2B563D] dark:text-[#9ECBB0] tabular-nums hidden sm:inline">
                            {formatBRL(apt.price)}
                          </span>
                          {apt.clientPhone ? (
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                const clean = apt.clientPhone.replace(/\D/g, "");
                                const num = clean.length <= 11 ? `55${clean}` : clean;
                                const msg = encodeURIComponent(
                                  `Olá ${apt.clientName}! Passando para confirmar seu horário hoje às ${apt.time} para ${apt.serviceName} no ${salonName}. Te esperamos! ✨`,
                                );
                                window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                              }}
                              className="p-1.5 rounded-lg text-[#2B563D] dark:text-[#9ECBB0] bg-[#EFF5F1] dark:bg-[#102117] hover:bg-[#E2EDE5] border border-[#DCE7DF] dark:border-[#1E3526] transition-all cursor-pointer"
                              title="Enviar confirmação pelo WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ANIVERSARIANTES DO MÊS */}
            <div className="bg-white dark:bg-[#161218] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(20,10,15,0.02)] space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE2DC] dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF3EA] dark:bg-[#201811] text-[#7A4B1D] dark:text-[#E6BC88] flex items-center justify-center">
                    <Cake size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#20181B] dark:text-[#F6EEF2]">
                      Aniversariantes do Mês
                    </h3>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#7A4B1D] dark:text-[#E6BC88] bg-[#FAF3EA] dark:bg-[#201811] border border-[#EFE1D0] dark:border-[#332415] px-2 py-0.5 rounded-full">
                  {metrics.birthdaysThisMonth.length} clientes
                </span>
              </div>

              {metrics.birthdaysThisMonth.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-xl bg-[#FAF5F2]/60 dark:bg-white/[0.02] border border-dashed border-[#EAE2DC] dark:border-white/[0.06]">
                  <p className="text-xs font-semibold text-[#20181B] dark:text-[#F6EEF2]">
                    Nenhuma aniversariante neste mês
                  </p>
                  <p className="text-[11px] text-[#706268] dark:text-[#A1949B] mt-0.5">
                    Cadastre o aniversário das clientes para parabenizá-las e fidelizar.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {metrics.birthdaysThisMonth.map((c) => {
                    const day = c.birthDate?.split("-")[2] || c.birthDate?.split("/")[0] || "";

                    return (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-xl border border-[#EAE2DC]/80 dark:border-white/[0.06] bg-[#FAF5F2]/50 dark:bg-[#1A141D]/40 hover:bg-white dark:hover:bg-[#1D1720] transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#F3DFCA] dark:bg-[#2C1D10] text-[#7A4B1D] dark:text-[#E6BC88] font-black flex items-center justify-center shrink-0 text-xs">
                            {day}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-[#20181B] dark:text-[#F6EEF2] truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-[#706268] dark:text-[#A1949B] truncate">
                              {c.phone || "Sem telefone"}
                            </p>
                          </div>
                        </div>

                        {c.phone ? (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              const clean = c.phone.replace(/\D/g, "");
                              const num = clean.length <= 11 ? `55${clean}` : clean;
                              const msg = encodeURIComponent(
                                `Parabéns, ${c.name}! 🎂✨ Toda a equipe do ${salonName} deseja muitas felicidades! Preparamos um presente especial para o seu mês de aniversário. Vamos agendar seu horário?`,
                              );
                              window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                            }}
                            className="px-2.5 py-1 rounded-lg text-[#2B563D] dark:text-[#9ECBB0] bg-[#EFF5F1] dark:bg-[#102117] hover:bg-[#E2EDE5] border border-[#DCE7DF] dark:border-[#1E3526] text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <MessageCircle size={13} /> Mimo
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
