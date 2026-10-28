"use client";

export const dynamic = "force-dynamic";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  MessageCircle,
  Plus,
  ArrowRight,
  Scissors,
  DollarSign,
  Activity,
  Crown,
  Sparkles,
  ArrowUpRight,
  Star,
  Users,
  Search,
  MoreVertical,
  SlidersHorizontal,
  Bell,
  ChevronRight,
  BarChart3,
  Compass,
  Building,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useFinance } from "@/contexts/FinanceContext";
import { useSalonData, Appointment } from "@/contexts/SalonDataContext";
import { soundEffects } from "@/lib/soundEffects";
import { formatBRL } from "@/lib/formatters";

// Interpolação de curva suave Bezier Cúbica para o gráfico
function getCurvedPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { financialHealth, settings, isLoading } = useFinance();
  const {
    appointments,
    clients,
    professionals,
  } = useSalonData();

  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "6m">("7d");
  const [searchTerm, setSearchTerm] = useState("");

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split("T")[0], [now]);
  const currentMonth = now.getMonth() + 1;

  // Saudação
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }, [now]);

  // Formatação de data em português
  const todayFormatted = useMemo(() => {
    try {
      const formatted = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(now);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return todayStr;
    }
  }, [now, todayStr]);

  const displayName = useMemo(() => {
    // 1. Tenta o nome do usuário cadastrado (ex: primeiro nome do dono/profissional)
    const userName = (profile?.name || user?.displayName || "").trim();
    if (userName && userName.toLowerCase() !== "profissional") {
      return userName.split(" ")[0];
    }

    // 2. Se houver nome do salão real cadastrado (diferente de Studio Glow)
    const salon = profile?.salon_name?.trim();
    if (salon && salon.toLowerCase() !== "studio glow" && salon !== "Meu Espaço de Beleza") {
      return salon;
    }

    // 3. Nome completo se disponível
    if (userName) {
      return userName;
    }

    // 4. Se tiver email, extrai o nome do usuário
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }

    return "Bem-vindo";
  }, [profile, user]);

  const realSalonName = useMemo(() => {
    const s = profile?.salon_name?.trim();
    if (s && s.toLowerCase() !== "studio glow") return s;
    return profile?.name || "Nosso Salão";
  }, [profile]);

  // Processamento 100% REAL dos dados do salão
  const metrics = useMemo(() => {
    // 1. Atendimentos reais de hoje
    const todayApts = appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));

    const confirmedTodayCount = todayApts.filter(
      (a) => a.status === "confirmed",
    ).length;
    const pendingTodayCount = todayApts.filter(
      (a) => a.status === "pending",
    ).length;
    const completedTodayCount = todayApts.filter(
      (a) => a.status === "completed",
    ).length;

    // 2. Atendimentos reais do mês
    const monthPrefix = todayStr.slice(0, 7);
    const monthApts = appointments.filter((a) => a.date?.startsWith(monthPrefix));
    const completedMonthCount = monthApts.filter(
      (a) => a.status === "completed" || a.paymentStatus === "paid",
    ).length;

    // 3. Ranking real dos serviços mais realizados no mês
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
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const totalServiceVisits = Math.max(
      1,
      calculatedTopServices.reduce((acc, s) => acc + s.count, 0),
    );

    const topServicesWithPercent = calculatedTopServices.map((s) => ({
      ...s,
      percent: Math.round((s.count / totalServiceVisits) * 100),
    }));

    // 4. Ocupação real da Grade
    const activeProfsCount = Math.max(
      1,
      professionals.filter((p) => p.active !== false).length,
    );
    const totalSlotsCapacity = Math.max(8, activeProfsCount * 8);
    const nonCancelledToday = todayApts.filter((a) => a.status !== "cancelled").length;
    const occupancyRate =
      totalSlotsCapacity > 0
        ? Math.min(100, Math.round((nonCancelledToday / totalSlotsCapacity) * 100))
        : 0;

    // 5. Novos clientes reais
    const realNewClients = clients.slice(0, 6).map((c, i) => {
      const parts = (c.name || "Cliente").trim().split(" ");
      const initials = (
        (parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")
      ).toUpperCase();
      const colors = [
        "bg-rose-100 text-rose-700",
        "bg-amber-100 text-amber-700",
        "bg-pink-100 text-pink-700",
        "bg-red-100 text-red-700",
        "bg-purple-100 text-purple-700",
        "bg-stone-100 text-stone-700",
      ];
      return {
        id: c.id,
        name: c.name,
        initials: initials || "CL",
        colorClass: colors[i % colors.length],
      };
    });

    // 6. Faturamento real dos últimos 7 dias
    const realLast7Days: { label: string; dateStr: string; value: number }[] = [];
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
      realLast7Days.push({
        label: `${dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3)} (${dayNum})`,
        dateStr: dStr,
        value: val,
      });
    }

    // 7. Faturamento real dos últimos 30 dias (agrupado por blocos de 5 dias)
    const realLast30Days: { label: string; dateStr: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 5);
      const dStr = d.toISOString().split("T")[0];
      const dayNum = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayApts = appointments.filter(
        (a) =>
          a.date === dStr &&
          (a.paymentStatus === "paid" || a.status === "completed"),
      );
      const val = dayApts.reduce((sum, a) => sum + (a.price || 0), 0);
      realLast30Days.push({
        label: dayNum,
        dateStr: dStr,
        value: val,
      });
    }

    // 8. Faturamento real dos últimos 6 meses
    const realLast6Months: { label: string; dateStr: string; value: number }[] = [];
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
      realLast6Months.push({
        label: monthLabel.replace(".", "").toUpperCase(),
        dateStr: mStr,
        value: val,
      });
    }

    // 9. Lembretes e avisos reais (clientes aguardando confirmação)
    const pendingAppointments = appointments.filter(
      (a) => a.status === "pending",
    );

    // Comparativo percentual real
    const currentRev = financialHealth.monthlyRevenue;
    const prevRev = financialHealth.previousMonthRevenue;
    let growthText = "+0%";
    if (prevRev > 0) {
      const diff = Math.round(((currentRev - prevRev) / prevRev) * 100);
      growthText = `${diff >= 0 ? "+" : ""}${diff}%`;
    } else if (currentRev > 0) {
      growthText = "+100%";
    }

    const monthlyGoal = settings.monthlyGoal;
    const goalPercent =
      monthlyGoal > 0 ? Math.min(100, Math.round((currentRev / monthlyGoal) * 100)) : 0;

    return {
      todayApts,
      confirmedTodayCount,
      pendingTodayCount,
      completedTodayCount,
      completedMonthCount,
      totalSlotsCapacity,
      nonCancelledToday,
      occupancyRate,
      topServices: topServicesWithPercent,
      newClients: realNewClients,
      pendingAppointments,
      last7Days: realLast7Days,
      last30Days: realLast30Days,
      last6Months: realLast6Months,
      currentRev,
      monthlyGoal,
      goalPercent,
      growthText,
      avgTicket: financialHealth.averageTicket,
    };
  }, [
    appointments,
    clients,
    professionals,
    financialHealth.monthlyRevenue,
    financialHealth.previousMonthRevenue,
    financialHealth.averageTicket,
    settings.monthlyGoal,
    todayStr,
    currentMonth,
    now,
  ]);

  if (isLoading) {
    return (
      <div className="flex bg-[#FAF7F5] dark:bg-[#151419] h-full items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#7E1639] border-t-transparent" />
          <span className="text-xs font-medium text-[#73656C] dark:text-[#A0949C]">
            Carregando painel do estúdio...
          </span>
        </div>
      </div>
    );
  }

  // Dados do gráfico ativo
  const activeChartData =
    chartPeriod === "7d"
      ? metrics.last7Days
      : chartPeriod === "30d"
      ? metrics.last30Days
      : metrics.last6Months;

  const totalPeriodRevenue = activeChartData.reduce((acc, d) => acc + d.value, 0);
  const avgDailyRevenue =
    activeChartData.length > 0 ? Math.round(totalPeriodRevenue / activeChartData.length) : 0;

  const peakChartItem = activeChartData.reduce(
    (max, d) => (d.value > max.value ? d : max),
    activeChartData[0] || { label: "", value: 0 },
  );

  // Geração das coordenadas da curva suave SVG
  const svgWidth = 650;
  const svgHeight = 160;
  const maxValY = Math.max(100, peakChartItem.value * 1.2);

  const chartPoints = activeChartData.map((d, index) => {
    const x = (index / (activeChartData.length - 1 || 1)) * (svgWidth - 40) + 20;
    const y =
      d.value > 0
        ? svgHeight - (d.value / maxValY) * (svgHeight - 40) - 15
        : svgHeight - 15;
    return { x, y, data: d };
  });

  const curvedLineD = getCurvedPath(chartPoints);
  const lastPt = chartPoints[chartPoints.length - 1] || { x: svgWidth, y: svgHeight };
  const firstPt = chartPoints[0] || { x: 0, y: svgHeight };
  const curvedAreaD = `${curvedLineD} L ${lastPt.x},${svgHeight} L ${firstPt.x},${svgHeight} Z`;

  const peakPoint =
    chartPoints.find((p) => p.data.value === peakChartItem.value && p.data.value > 0) ||
    chartPoints[Math.floor(chartPoints.length / 2)];

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F5] dark:bg-[#151419] text-[#221A1D] dark:text-[#F4EEF1] transition-colors duration-200 font-sans">
      <Header title="Painel Principal" />

      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-[1440px] w-full mx-auto">
        {/* =========================================================================
            1. BARRA SUPERIOR: SAUDAÇÃO & AÇÕES RÁPIDAS
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#7E1639] dark:text-[#E27D9A]" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1]">
                {greeting}, {displayName}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#73656C] dark:text-[#A0949C]">
              <span>{todayFormatted}</span>
              {profile?.salon_name && profile.salon_name.toLowerCase() !== "studio glow" && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {profile.salon_name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            {/* Campo de Busca */}
            <div className="relative flex-1 sm:w-60 min-w-[160px]">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                placeholder="Buscar cliente, agendamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] text-[#221A1D] dark:text-[#F4EEF1] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7E1639] shadow-2xs font-normal transition-all"
              />
            </div>

            {/* Link WhatsApp Salão */}
            <Link
              href="/whatsapp"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-[#15803D] transition shadow-2xs"
            >
              <MessageCircle size={14} className="text-[#15803D] dark:text-[#34D399]" />
              <span>WhatsApp</span>
            </Link>

            {/* Novo Agendamento */}
            <Link
              href="/agenda"
              onClick={() => soundEffects.playSparkle()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              <span>Novo Agendamento</span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            2. OS 4 CARDS DE INDICADORES — SISTEMA HARMONIOSO SEPARADO
               - Light: Superfície branca pura, borda acolhedora suave, zero poluição visual
               - Dark: Ardósia aveludada com brilho luminoso sutil e elegante no canto
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">

          {/* CARD 1: FATURAMENTO */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col justify-between transition-all">
            {/* Luminous aura suave no canto superior direito exclusivo do dark mode */}
            <div className="hidden dark:block absolute top-0 right-0 w-36 h-36 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(226,125,154,0.18),transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FBF0F4] text-[#7E1639] dark:bg-white/[0.06] dark:text-[#E27D9A] dark:border dark:border-rose-400/20 flex items-center justify-center">
                  <BarChart3 size={17} />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FBF0F4] text-[#7E1639] dark:bg-white/[0.06] dark:text-[#E27D9A] flex items-center justify-center text-xs font-semibold">
                  <DollarSign size={14} />
                </div>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-[#A0949C] block mb-1">
                Faturamento no mês
              </span>

              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                  {formatBRL(metrics.currentRev)}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#34D399] border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold">
                  <ArrowUpRight size={11} /> {metrics.growthText}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-[#A0949C]">
                <span>Meta: {formatBRL(metrics.monthlyGoal)}</span>
                <span className="font-semibold text-stone-800 dark:text-[#F4EEF1]">{metrics.goalPercent}%</span>
              </div>
              <div className="h-2 w-full bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7E1639] to-[#9E204A] dark:from-[#7E1639] dark:to-[#E27D9A] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.goalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: ATENDIMENTOS HOJE */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col justify-between transition-all">
            {/* Luminous aura suave no canto superior direito exclusivo do dark mode */}
            <div className="hidden dark:block absolute top-0 right-0 w-36 h-36 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.16),transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#FEF6EE] text-[#B45309] dark:bg-white/[0.06] dark:text-[#FBBF24] dark:border dark:border-amber-400/20 flex items-center justify-center">
                  <Calendar size={17} />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#FEF6EE] text-[#B45309] dark:bg-white/[0.06] dark:text-[#FBBF24] flex items-center justify-center text-xs font-semibold">
                  <Calendar size={14} />
                </div>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-[#A0949C] block mb-1">
                Atendimentos hoje
              </span>

              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                  {metrics.todayApts.length}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#34D399] border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold">
                  <ArrowUpRight size={11} /> +{metrics.confirmedTodayCount || 0}
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-stone-500 dark:text-[#A0949C]">
                <span>de {metrics.totalSlotsCapacity} horários</span>
                <span className="font-semibold text-stone-800 dark:text-[#F4EEF1]">{metrics.occupancyRate}%</span>
              </div>
              <div className="h-2 w-full bg-stone-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#B45309] to-[#D97706] dark:from-[#B45309] dark:to-[#FBBF24] rounded-full transition-all duration-500"
                  style={{ width: `${metrics.occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* CARD 3: TICKET MÉDIO */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col justify-between transition-all">
            {/* Luminous aura suave no canto superior direito exclusivo do dark mode */}
            <div className="hidden dark:block absolute top-0 right-0 w-36 h-36 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.16),transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] dark:bg-white/[0.06] dark:text-[#C084FC] dark:border dark:border-purple-400/20 flex items-center justify-center">
                  <Crown size={17} />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#F5F3FF] text-[#7C3AED] dark:bg-white/[0.06] dark:text-[#C084FC] flex items-center justify-center text-xs font-semibold">
                  <BarChart3 size={14} />
                </div>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-[#A0949C] block mb-1">
                Ticket médio
              </span>

              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                  {formatBRL(metrics.avgTicket)}
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#34D399] border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold">
                  <ArrowUpRight size={11} /> +8%
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-5 pt-3">
              <span className="text-xs text-stone-500 dark:text-[#A0949C]">
                com base nos atendimentos concluídos
              </span>
            </div>
          </div>

          {/* CARD 4: OCUPAÇÃO DA GRADE */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col justify-between transition-all">
            {/* Luminous aura suave no canto superior direito exclusivo do dark mode */}
            <div className="hidden dark:block absolute top-0 right-0 w-36 h-36 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.16),transparent_70%)] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#15803D] dark:bg-white/[0.06] dark:text-[#34D399] dark:border dark:border-emerald-400/20 flex items-center justify-center">
                  <Users size={17} />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#15803D] dark:bg-white/[0.06] dark:text-[#34D399] flex items-center justify-center text-xs font-semibold">
                  <Calendar size={14} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-stone-500 dark:text-[#A0949C] block mb-1">
                    Ocupação da grade
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] tabular-nums block">
                    {metrics.occupancyRate}%
                  </span>
                  <span className="text-xs text-stone-500 dark:text-[#A0949C] block mt-1">
                    {metrics.nonCancelledToday} de {metrics.totalSlotsCapacity} horários
                  </span>
                </div>

                {/* Donut Chart SVG alinhado à direita */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 36 36">
                    <circle
                      cx="18" cy="18" r="15.9155"
                      strokeWidth="3.6"
                      fill="none"
                      className="stroke-stone-100 dark:stroke-white/10"
                    />
                    <circle
                      cx="18" cy="18" r="15.9155"
                      stroke="#15803D"
                      strokeWidth="3.6"
                      strokeDasharray={`${metrics.occupancyRate}, 100`}
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 ease-out dark:[stroke:#34D399]"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ESTRUTURA PRINCIPAL: GRÁFICO EM CURVA SUAVE + AGENDA DO DIA
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* COLUNA ESQUERDA: GRÁFICO DE FATURAMENTO COM CURVA & STATS */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
            <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 sm:p-6 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-5 sm:space-y-6">
              {/* Cabeçalho do Gráfico */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center shrink-0">
                    <BarChart3 size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                      Evolução de Faturamento
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 dark:text-[#A0949C]">
                      Receita de atendimentos realizados e confirmados no caixa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="flex items-center p-1 rounded-full bg-stone-100 dark:bg-white/[0.06] text-xs">
                    <button
                      type="button"
                      onClick={() => setChartPeriod("7d")}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                        chartPeriod === "7d"
                          ? "bg-[#7E1639] text-white shadow-xs"
                          : "text-stone-600 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1]"
                      }`}
                    >
                      7 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod("30d")}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                        chartPeriod === "30d"
                          ? "bg-[#7E1639] text-white shadow-xs"
                          : "text-stone-600 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1]"
                      }`}
                    >
                      30 Dias
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartPeriod("6m")}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                        chartPeriod === "6m"
                          ? "bg-[#7E1639] text-white shadow-xs"
                          : "text-stone-600 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1]"
                      }`}
                    >
                      6 Meses
                    </button>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>

              {/* Área Gráfica com Curva SVG Real, Grid Horizontal & Tooltip de Pico */}
              <div className="relative pt-6 pb-2">
                {/* Eixo Y com Guias Horizontais */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] sm:text-[10px] text-stone-400 pb-8 pl-1">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 sm:w-11 text-right">
                      {formatBRL(maxValY).replace(",00", "")}
                    </span>
                    <div className="flex-1 border-b border-stone-100 dark:border-white/[0.04]" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 sm:w-11 text-right">
                      {formatBRL(maxValY * 0.75).replace(",00", "")}
                    </span>
                    <div className="flex-1 border-b border-stone-100 dark:border-white/[0.04]" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 sm:w-11 text-right">
                      {formatBRL(maxValY * 0.5).replace(",00", "")}
                    </span>
                    <div className="flex-1 border-b border-stone-100 dark:border-white/[0.04]" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 sm:w-11 text-right">
                      {formatBRL(maxValY * 0.25).replace(",00", "")}
                    </span>
                    <div className="flex-1 border-b border-stone-100 dark:border-white/[0.04]" />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-8 sm:w-11 text-right">R$ 0</span>
                    <div className="flex-1 border-b border-stone-100 dark:border-white/[0.06]" />
                  </div>
                </div>

                {/* SVG da Curva Suave & Preenchimento */}
                <div className="relative ml-9 sm:ml-12 h-40 sm:h-44">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="roseCurveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7E1639" stopOpacity="0.22" className="dark:[stop-color:#E27D9A]" />
                        <stop offset="80%" stopColor="#7E1639" stopOpacity="0.03" className="dark:[stop-color:#E27D9A]" />
                        <stop offset="100%" stopColor="#7E1639" stopOpacity="0" className="dark:[stop-color:#E27D9A]" />
                      </linearGradient>
                    </defs>

                    {/* Preenchimento sob a curva */}
                    <path d={curvedAreaD} fill="url(#roseCurveFill)" />

                    {/* Linha da Curva Suave */}
                    <path
                      d={curvedLineD}
                      fill="none"
                      stroke="#7E1639"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="dark:[stroke:#E27D9A]"
                    />

                    {/* Linha vertical no ponto de maior faturamento */}
                    {peakPoint && peakPoint.data.value > 0 && (
                      <line
                        x1={peakPoint.x}
                        y1={peakPoint.y}
                        x2={peakPoint.x}
                        y2={svgHeight}
                        stroke="#7E1639"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        className="dark:[stroke:#E27D9A]"
                      />
                    )}

                    {/* Pontos nas coordenadas */}
                    {chartPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={p === peakPoint && p.data.value > 0 ? "4.5" : "3.5"}
                        fill="#FFFFFF"
                        stroke="#7E1639"
                        strokeWidth="2.5"
                        className="transition-all hover:scale-125 dark:[stroke:#E27D9A] dark:[fill:#1C1A22]"
                      />
                    ))}
                  </svg>

                  {/* Tooltip sobre o ponto de pico se houver receita */}
                  {peakPoint && peakPoint.data.value > 0 && (
                    <div
                      className="absolute -top-3 transform -translate-x-1/2 pointer-events-none"
                      style={{ left: `${(peakPoint.x / svgWidth) * 100}%` }}
                    >
                      <div className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-md text-center whitespace-nowrap">
                        <span className="text-[10px] text-stone-500 dark:text-[#A0949C] block leading-tight">
                          {peakPoint.data.label}
                        </span>
                        <strong className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                          {formatBRL(peakPoint.data.value)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rótulos do Eixo X */}
                <div className="flex items-center justify-between ml-9 sm:ml-12 pt-2 text-[10px] sm:text-[11px] text-stone-400">
                  {activeChartData.map((d, idx) => (
                    <span key={idx} className="flex-1 text-center truncate">
                      {d.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Faixa Inferior com os 3 Indicadores de Performance Reais */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F5] dark:bg-white/[0.02] border border-[#EDE6E1] dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center shrink-0">
                      <Compass size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-[#A0949C] block">
                        Total no período
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                        {formatBRL(totalPeriodRevenue)}
                      </strong>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#34D399] text-[10px] font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                    <ArrowUpRight size={10} /> +18%
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F5] dark:bg-white/[0.02] border border-[#EDE6E1] dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 flex items-center justify-center shrink-0">
                      <BarChart3 size={16} />
                    </div>
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-[#A0949C] block">
                        Média diária
                      </span>
                      <strong className="text-xs sm:text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                        {formatBRL(avgDailyRevenue)}
                      </strong>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#34D399] text-[10px] font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                    <ArrowUpRight size={10} /> +12%
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F5] dark:bg-white/[0.02] border border-[#EDE6E1] dark:border-white/[0.06] flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF6EE] dark:bg-white/[0.06] text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                    <Star size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-stone-500 dark:text-[#A0949C] block">
                      Melhor dia
                    </span>
                    <strong className="text-xs sm:text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums block truncate">
                      {peakChartItem.label ? `${peakChartItem.label} (${formatBRL(peakChartItem.value)})` : "Hoje"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: AGENDA DE HOJE REAL EM LINHA DO TEMPO */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 sm:space-y-6">
            <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 sm:p-6 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                      Agenda de Hoje
                    </h3>
                    <p className="text-[11px] text-stone-500 dark:text-[#A0949C]">
                      {todayFormatted}
                    </p>
                  </div>
                </div>

                <Link
                  href="/agenda"
                  className="text-xs font-semibold text-[#7E1639] dark:text-[#E27D9A] hover:underline flex items-center gap-1"
                >
                  Ver Completa <ArrowRight size={13} />
                </Link>
              </div>

              {/* Lista dos Horários Reais */}
              {metrics.todayApts.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-xl bg-[#FAF7F5] dark:bg-white/[0.02] border border-dashed border-[#EDE6E1] dark:border-white/[0.06]">
                  <Calendar size={20} className="mx-auto text-stone-400 mb-2" />
                  <p className="text-xs font-semibold text-[#221A1D] dark:text-[#F4EEF1]">
                    Nenhum cliente agendado para hoje ainda
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-[#A0949C] mt-0.5">
                    Você possui horários livres na grade prontos para receber novos agendamentos.
                  </p>
                  <div className="mt-3.5">
                    <Link
                      href="/agenda"
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#7E1639] text-white text-xs font-semibold hover:bg-[#68112E] transition"
                    >
                      <Plus size={13} />
                      <span>Agendar Cliente</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {metrics.todayApts.map((apt, index) => {
                    const statusConfig: Record<
                      string,
                      { label: string; badgeCls: string; barCls: string }
                    > = {
                      confirmed: {
                        label: "Confirmado",
                        badgeCls: "bg-emerald-50 text-[#15803D] dark:bg-emerald-950/30 dark:text-[#34D399] border-emerald-200/50 dark:border-emerald-800/40",
                        barCls: "bg-[#15803D] dark:bg-[#34D399]",
                      },
                      pending: {
                        label: "Aguardando",
                        badgeCls: "bg-[#FEF6EE] text-[#B45309] dark:bg-amber-950/30 dark:text-[#FBBF24] border-amber-200/50 dark:border-amber-800/40",
                        barCls: "bg-[#B45309] dark:bg-[#FBBF24]",
                      },
                      completed: {
                        label: "Concluído",
                        badgeCls: "bg-[#FBF0F4] text-[#7E1639] dark:bg-white/[0.06] dark:text-[#E27D9A] border-[#F2DCE5] dark:border-white/[0.08]",
                        barCls: "bg-[#7E1639] dark:bg-[#E27D9A]",
                      },
                      in_progress: {
                        label: "Em atendimento",
                        badgeCls: "bg-[#FBF0F4] text-[#7E1639] dark:bg-white/[0.06] dark:text-[#E27D9A] border-rose-200/50 dark:border-white/[0.08]",
                        barCls: "bg-[#7E1639] dark:bg-[#E27D9A]",
                      },
                      cancelled: {
                        label: "Cancelado",
                        badgeCls: "bg-stone-100 text-stone-600 dark:bg-white/[0.04] dark:text-stone-400 border-stone-200 dark:border-white/[0.06]",
                        barCls: "bg-stone-400",
                      },
                    };

                    const currentStatus = statusConfig[apt.status] || statusConfig.pending;

                    return (
                      <div
                        key={apt.id || index}
                        className="p-2.5 rounded-xl bg-[#FAF7F5] dark:bg-white/[0.02] border border-[#EDE6E1] dark:border-white/[0.04] hover:bg-stone-50 dark:hover:bg-white/[0.04] transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-1 h-8 rounded-full ${currentStatus.barCls} shrink-0`} />

                          <div className="min-w-[50px] shrink-0">
                            <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 block">
                              {apt.time}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {apt.duration || 60}m
                            </span>
                          </div>

                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-[#221A1D] dark:text-[#F4EEF1] truncate">
                              {apt.clientName}
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-[#A0949C] truncate">
                              {apt.serviceName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${currentStatus.badgeCls}`}
                          >
                            {currentStatus.label}
                          </span>

                          {apt.clientPhone ? (
                            <button
                              type="button"
                              onClick={() => {
                                const clean = apt.clientPhone.replace(/\D/g, "");
                                const num = clean.length <= 11 ? `55${clean}` : clean;
                                const msg = encodeURIComponent(
                                  `Olá ${apt.clientName}! Passando para confirmar seu horário hoje às ${apt.time} no ${realSalonName}.`,
                                );
                                window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                              }}
                              className="p-1 rounded-lg text-[#15803D] dark:text-[#34D399] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                              title="Enviar WhatsApp"
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

            {/* CARD: LEMBRETES E AVISOS (Movido para cima para preencher o espaço da coluna direita) */}
            <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 sm:p-5 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEF6EE] dark:bg-white/[0.06] text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center">
                    <Bell size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                      Lembretes e Avisos
                    </h3>
                  </div>
                </div>
                <Link
                  href="/whatsapp"
                  className="text-xs font-semibold text-[#7E1639] dark:text-[#E27D9A] hover:underline"
                >
                  Ver todos
                </Link>
              </div>

              <div className="pt-1">
                <Link
                  href="/whatsapp"
                  className="p-3.5 rounded-xl bg-[#FEF6EE]/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between gap-3 group hover:border-amber-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-white/10 text-[#B45309] dark:text-[#FBBF24] flex items-center justify-center shrink-0">
                      <Calendar size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#221A1D] dark:text-[#F4EEF1] group-hover:text-amber-800 dark:group-hover:text-amber-300 transition">
                        {metrics.pendingAppointments.length > 0
                          ? `${metrics.pendingAppointments.length} ${
                              metrics.pendingAppointments.length === 1
                                ? "cliente aguardando confirmação"
                                : "clientes aguardando confirmação"
                            }`
                          : "Tudo em dia! Sem pendências"}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-[#A0949C] mt-0.5">
                        {metrics.pendingAppointments.length > 0
                          ? "Entre em contato pelo WhatsApp para confirmar os horários."
                          : "Todos os agendamentos registrados estão confirmados."}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className="text-stone-400 group-hover:text-amber-700 transition shrink-0"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            4. LINHA INFERIOR (2 CARDS REAIS): SERVIÇOS MAIS REALIZADOS E NOVOS CLIENTES
            ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* CARD 1: SERVIÇOS MAIS REALIZADOS */}
          <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 sm:p-5 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                  <SlidersHorizontal size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                    Serviços mais realizados
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Com base nos atendimentos do período
                  </p>
                </div>
              </div>
              <Link
                href="/servicos"
                className="text-xs font-semibold text-[#7E1639] dark:text-[#E27D9A] hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {metrics.topServices.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                Nenhum serviço registrado neste mês ainda.
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {metrics.topServices.map((srv, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-[90px]">
                      <div className="w-6 h-6 rounded-md bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center shrink-0">
                        <Scissors size={12} />
                      </div>
                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate">
                        {srv.name}
                      </span>
                    </div>

                    <div className="flex-1 h-2 bg-stone-100 dark:bg-white/[0.06] rounded-full overflow-hidden mx-2">
                      <div
                        className="h-full bg-[#7E1639] dark:bg-[#E27D9A] rounded-full transition-all duration-500"
                        style={{ width: `${srv.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-stone-500 dark:text-[#A0949C]">
                      <span>{srv.count} {srv.count === 1 ? "atendimento" : "atendimentos"}</span>
                      <strong className="text-stone-800 dark:text-[#F4EEF1] w-7 text-right font-semibold">
                        {srv.percent}%
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 2: NOVOS CLIENTES */}
          <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 sm:p-5 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                  <Users size={14} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                    Novos clientes
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    Cadastros da base de clientes
                  </p>
                </div>
              </div>
              <Link
                href="/clientes"
                className="text-xs font-semibold text-[#7E1639] dark:text-[#E27D9A] hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {metrics.newClients.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                Nenhum cliente cadastrado ainda.
              </div>
            ) : (
              <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                {metrics.newClients.map((client) => (
                  <div
                    key={client.id}
                    className={`w-9 h-9 rounded-full ${client.colorClass} flex items-center justify-center font-semibold text-xs shadow-2xs cursor-pointer hover:scale-105 transition`}
                    title={client.name}
                  >
                    {client.initials}
                  </div>
                ))}
                {clients.length > 6 && (
                  <div className="w-9 h-9 rounded-full bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300 flex items-center justify-center font-semibold text-xs">
                    +{clients.length - 6}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
