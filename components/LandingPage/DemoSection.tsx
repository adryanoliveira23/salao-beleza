"use client";

import React, { useState } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  Scissors,
  ChevronRight,
  Package,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  Crown,
  LayoutDashboard,
  Moon,
  Sun,
  ShieldCheck,
  Heart,
  Gift,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { soundEffects } from "@/lib/soundEffects";

type DemoTab =
  | "dashboard"
  | "agenda"
  | "profissionais"
  | "clientes"
  | "estoque"
  | "marketing"
  | "financeiro";

const TABS: { id: DemoTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "agenda", label: "Agenda", icon: <Calendar size={16} /> },
  { id: "clientes", label: "Clientes", icon: <Users size={16} /> },
  { id: "profissionais", label: "Equipe", icon: <Scissors size={16} /> },
  { id: "estoque", label: "Estoque", icon: <Package size={16} /> },
  { id: "marketing", label: "WhatsApp & Mkt", icon: <Megaphone size={16} /> },
  { id: "financeiro", label: "Financeiro", icon: <DollarSign size={16} /> },
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");
  const [demoTheme, setDemoTheme] = useState<"dark" | "light">("dark");
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Sincroniza a demonstração automaticamente com o tema da landing page
  React.useEffect(() => {
    const isDarkGlobal = document.documentElement.classList.contains("dark");
    setDemoTheme(isDarkGlobal ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const isNowDark = document.documentElement.classList.contains("dark");
      setDemoTheme(isNowDark ? "dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = demoTheme === "dark";

  const handleTestWhatsApp = (clientName: string) => {
    soundEffects.playSuccess();
    setWhatsappToast(`Lembrete enviado com carinho para ${clientName}!`);
    setTimeout(() => {
      setWhatsappToast(null);
    }, 3000);
  };

  return (
    <section
      className="py-14 md:py-24 bg-gradient-to-b from-[#fff5f8] via-[#fdfbfd] to-white dark:from-[#130913] dark:via-[#0d070e] dark:to-[#0d070e] transition-colors duration-300"
      id="demo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header Feminino & Elegante */}
        <div className="text-center mb-8 md:mb-14 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-[var(--primary)] dark:text-rose-400 font-bold text-xs uppercase tracking-wider shadow-2xs">
            <Sparkles size={13} className="text-[var(--primary)]" />
            <span>Demonstração Interativa da Bancada</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-bold text-[#2d1b2e] dark:text-[#fdf5f9] tracking-tight leading-tight">
            Sinta a beleza e a agilidade do BellaMais
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-[#73646d] dark:text-[#b8a3af] leading-relaxed max-w-2xl mx-auto font-sans">
            Toque nas abas abaixo para explorar a bancada operacional em tempo real. Veja como é rápido controlar faturamento, confirmar horários no WhatsApp e encantar suas clientes.
          </p>
        </div>

        {/* Demo Interface Wrapper (Moldura de Browser com Blindagem Visual) */}
        <div
          className={`rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden max-w-5xl mx-auto border ${
            isDark
              ? "dark bg-[#160c16] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
              : "bg-white border-rose-200/80 shadow-[0_20px_50px_rgba(190,24,93,0.08)]"
          }`}
        >
          {/* Browser Chrome Superior */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between gap-4 transition-colors ${
              isDark
                ? "bg-[#1a0f1a] border-white/10 text-zinc-300"
                : "bg-[#faf5f8] border-rose-100 text-zinc-700"
            }`}
          >
            {/* Botões Mac */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10" />
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold text-[#8c7885] dark:text-[#b8a3af] ml-2">
                BellaMais Control Center
              </span>
            </div>

            {/* Barra de Endereço URL Centralizada */}
            <div className="flex-1 max-w-md text-center">
              <div
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono inline-flex items-center gap-2 border shadow-2xs ${
                  isDark
                    ? "bg-[#110811] border-white/10 text-rose-300"
                    : "bg-white border-rose-200 text-rose-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>app.bellamais.com/{activeTab}</span>
              </div>
            </div>

            {/* Ações da Demo: Alternar Modo Claro/Escuro & Status */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setDemoTheme(isDark ? "light" : "dark");
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-[#241524] border-white/15 text-amber-300 hover:bg-[#2e1b2e]"
                    : "bg-white border-rose-200 text-purple-700 hover:bg-rose-50 shadow-2xs"
                }`}
                title="Trocar tema dentro da demonstração"
              >
                {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-purple-600" />}
                <span className="text-[11px] hidden sm:inline">
                  {isDark ? "Modo Claro" : "Modo Escuro"}
                </span>
              </button>

              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ao Vivo
              </span>
            </div>
          </div>

          {/* Abas Horizontais no Mobile (Scroll Sem Fricção) */}
          <div
            className={`flex md:hidden border-b p-2 overflow-x-auto gap-1.5 no-scrollbar scroll-smooth ${
              isDark ? "bg-[#140b14] border-white/10" : "bg-[#faf5f8] border-rose-100"
            }`}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playPop();
                  setActiveTab(tab.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[var(--primary)] to-pink-600 text-white shadow-xs"
                    : isDark
                    ? "bg-[#201320] text-zinc-300 border border-white/10"
                    : "bg-white text-zinc-700 border border-rose-200"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Corpo Principal da Interface */}
          <div className="flex flex-col md:flex-row min-h-[500px] md:h-[680px]">
            {/* Sidebar Desktop com Tom Velvet Ameixa Noturno */}
            <div
              className={`hidden md:flex w-[230px] flex-col shrink-0 border-r transition-colors ${
                isDark
                  ? "bg-[#140a14] border-white/10 text-white"
                  : "bg-[#20121e] border-rose-950/30 text-white"
              }`}
            >
              <div className="p-5 flex items-center gap-3 border-b border-white/10">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-rose-400 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Scissors size={16} />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight block leading-tight text-white">
                    BellaMais
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold block">
                    Salão & Gestão
                  </span>
                </div>
              </div>

              <div className="flex-1 py-4 px-2.5 flex flex-col gap-1 overflow-y-auto">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        soundEffects.playPop();
                        setActiveTab(tab.id);
                      }}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer relative ${
                        isActive
                          ? "bg-gradient-to-r from-[var(--primary)] to-pink-600 text-white font-bold shadow-sm"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="shrink-0">{tab.icon}</div>
                      <span className="truncate">{tab.label}</span>
                      {isActive && (
                        <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 border-t border-white/10 text-[10px] text-zinc-400 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Salão Sincronizado</span>
              </div>
            </div>

            {/* Área de Conteúdo da Tela Interna */}
            <div
              className={`flex-1 flex flex-col min-w-0 transition-colors ${
                isDark ? "bg-[#110811]" : "bg-[#fcfafc]"
              }`}
            >
              {/* Inner App Header */}
              <div
                className={`hidden md:flex h-14 border-b items-center justify-between px-6 shrink-0 transition-colors ${
                  isDark
                    ? "bg-[#180e18] border-white/10 text-white"
                    : "bg-white border-rose-100 text-[#2d1b2e]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm capitalize">
                    {activeTab === "marketing" ? "WhatsApp & Secretária Virtual" : activeTab}
                  </span>
                  <span className="text-xs text-zinc-400">• Painel de Controle</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[11px] font-bold text-[var(--primary)]">
                    <Sparkles size={12} />
                    <span>Studio Glow ✨</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    SG
                  </div>
                </div>
              </div>

              {/* Toast de Teste de WhatsApp */}
              {whatsappToast && (
                <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{whatsappToast}</span>
                  </div>
                  <span className="text-[10px] opacity-80 uppercase tracking-wider">Simulado</span>
                </div>
              )}

              {/* Conteúdo Rolável da Aba */}
              <div className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto min-w-0 pb-16 md:pb-6 space-y-4">
                {/* =========================================================================
                    1. ABA DASHBOARD (ESPELHO DO PRODUTO REAL)
                    ========================================================================= */}
                {activeTab === "dashboard" && (
                  <div className="space-y-4 md:space-y-5 animate-in fade-in duration-300">
                    {/* 4 CARDS DIFERENCIADOS & LUMINOSOS COM GLOW AMBIENTE */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {/* Card 1: Faturamento do Dia (Herói Esmeralda & Champagne) */}
                      <div
                        className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[120px] ${
                          isDark
                            ? "bg-gradient-to-br from-emerald-950/40 via-[#1c121c] to-[#140b14] border-emerald-500/35 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.35),0_10px_24px_-4px_rgba(0,0,0,0.65)]"
                            : "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 border-emerald-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Faturamento do Dia
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-serif text-[#2d1b2e] dark:text-[#fdf5f9] tracking-tight">
                            R$ 2.450,00
                          </div>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1 block">
                            ↑ +18% vs ontem • 18 atendimentos
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Atendimentos de Hoje (Rose Framboesa) */}
                      <div
                        className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[120px] ${
                          isDark
                            ? "bg-gradient-to-br from-rose-950/40 via-[#20121d] to-[#140b14] border-rose-500/35 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.35),0_10px_24px_-4px_rgba(0,0,0,0.65)]"
                            : "bg-gradient-to-br from-rose-50/80 via-white to-pink-50/30 border-rose-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primary)] dark:text-rose-400">
                            Atendimentos Hoje
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[var(--primary)] dark:text-rose-400 flex items-center justify-center">
                            <Calendar size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-serif text-[#2d1b2e] dark:text-[#fdf5f9] tracking-tight">
                            18 Clientes
                          </div>
                          <span className="text-[11px] text-[var(--primary)] dark:text-rose-300 font-semibold mt-1 block">
                            5 concluídos • 13 na grade
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Ticket Médio (Champagne Gold) */}
                      <div
                        className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[120px] ${
                          isDark
                            ? "bg-gradient-to-br from-amber-950/40 via-[#1f1514] to-[#140b14] border-amber-500/35 shadow-[inset_0_1px_0_0_rgba(251,191,36,0.35),0_10px_24px_-4px_rgba(0,0,0,0.65)]"
                            : "bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 border-amber-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Ticket Médio
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                            <Crown size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-bold font-serif text-[#2d1b2e] dark:text-[#fdf5f9] tracking-tight">
                            R$ 136,10
                          </div>
                          <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold mt-1 block">
                            Alta procura por combos de mechas
                          </span>
                        </div>
                      </div>

                      {/* Card 4: Ocupação da Grade (Lilás Orquídea com Radial Progress) */}
                      <div
                        className={`p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[120px] ${
                          isDark
                            ? "bg-gradient-to-br from-purple-950/40 via-[#1c1221] to-[#140b14] border-purple-500/35 shadow-[inset_0_1px_0_0_rgba(192,132,252,0.35),0_10px_24px_-4px_rgba(0,0,0,0.65)]"
                            : "bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 border-purple-300 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            Ocupação da Grade
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                            <Sparkles size={14} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <div className="text-2xl font-bold font-serif text-[#2d1b2e] dark:text-[#fdf5f9] tracking-tight">
                              85%
                            </div>
                            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold mt-0.5 block">
                              3 horários livres
                            </span>
                          </div>
                          {/* Mini Radial SVG */}
                          <div className="relative w-11 h-11 shrink-0">
                            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="14"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                className="text-purple-200/50 dark:text-purple-900/40"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="14"
                                fill="none"
                                stroke="#c084fc"
                                strokeWidth="3.5"
                                strokeDasharray="88, 100"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-purple-600 dark:text-purple-300">
                              85%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GRID DE DUAS COLUNAS: PRÓXIMOS DE HOJE + OPERAÇÃO WHATSAPP */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                      {/* Coluna Esquerda: Próximos Atendimentos de Hoje (Nomes 100% Nítidos e Legíveis) */}
                      <div
                        className={`lg:col-span-7 rounded-3xl p-4 md:p-5 border transition-all ${
                          isDark
                            ? "bg-[#180e18] border-white/10 shadow-sm"
                            : "bg-white border-rose-200/80 shadow-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-serif font-bold text-sm md:text-base text-[#2d1b2e] dark:text-[#fdf5f9] flex items-center gap-2">
                            <Clock size={16} className="text-[var(--primary)]" />
                            <span>Próximos de Hoje na Grade</span>
                          </h4>
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                            Ao Vivo
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {[
                            {
                              time: "14:30",
                              dur: "45m",
                              initials: "BO",
                              client: "Beatriz Oliveira",
                              service: "Mechas Globais & Tonalização",
                              pro: "Camila Santos",
                              price: "R$ 380,00",
                            },
                            {
                              time: "15:15",
                              dur: "30m",
                              initials: "CM",
                              client: "Carla Mendes",
                              service: "Corte Bordado & Escova Glow",
                              pro: "Juliana Santos",
                              price: "R$ 140,00",
                            },
                            {
                              time: "16:00",
                              dur: "50m",
                              initials: "DP",
                              client: "Daniela Porto",
                              service: "Spa dos Pés & Esmaltação em Gel",
                              pro: "Fernanda Lima",
                              price: "R$ 95,00",
                            },
                            {
                              time: "17:00",
                              dur: "60m",
                              initials: "MC",
                              client: "Mariana Costa",
                              service: "Tratamento Reconstrutor Kérastase",
                              pro: "Camila Santos",
                              price: "R$ 220,00",
                            },
                          ].map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                isDark
                                  ? "bg-[#211421] border-white/10 hover:border-rose-500/30"
                                  : "bg-[#fdfafc] border-rose-100 hover:border-rose-300"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Horário Monospace */}
                                <div
                                  className={`px-2.5 py-1 rounded-xl text-center shrink-0 border ${
                                    isDark
                                      ? "bg-[#140b14] border-white/10 text-rose-300"
                                      : "bg-white border-rose-200 text-rose-800"
                                  }`}
                                >
                                  <span className="text-[11px] font-mono font-bold block leading-tight">
                                    {item.time}
                                  </span>
                                  <span className="text-[9px] text-[#9c8994] dark:text-[#b8a3af] block leading-none">
                                    {item.dur}
                                  </span>
                                </div>

                                {/* Monograma Feminino */}
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-rose-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                  {item.initials}
                                </div>

                                {/* Dados da Cliente com Contraste 100% Alto e Nítido */}
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#1a1218] dark:text-[#fdf5f9] truncate">
                                    {item.client}
                                  </div>
                                  <div className="text-[11px] text-[#73646d] dark:text-[#b8a3af] truncate">
                                    {item.service} • <span className="font-medium text-[var(--primary)] dark:text-rose-300">{item.pro}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Valor e Botão Interativo de WhatsApp */}
                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="text-xs font-serif font-bold text-emerald-600 dark:text-emerald-400">
                                  {item.price}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTestWhatsApp(item.client)}
                                  className="w-7 h-7 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xs transition active:scale-90 cursor-pointer"
                                  title="Testar envio de WhatsApp na demonstração"
                                >
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Coluna Direita: Operação & Automações do Salão */}
                      <div
                        className={`lg:col-span-5 rounded-3xl p-4 md:p-5 border flex flex-col justify-between transition-all space-y-4 ${
                          isDark
                            ? "bg-[#180e18] border-white/10 shadow-sm"
                            : "bg-white border-rose-200/80 shadow-xs"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif font-bold text-sm md:text-base text-[#2d1b2e] dark:text-[#fdf5f9] flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-500" />
                              <span>Operação & Automação</span>
                            </h4>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                              3 Ativas
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {/* WhatsApp Card */}
                            <div
                              className={`p-3 rounded-2xl border transition-all ${
                                isDark
                                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                                  : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-bold text-xs">WhatsApp da Recepção Conectado</span>
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-90">
                                <strong>14 lembretes de amanhã</strong> prontos para confirmação com 1 toque.
                              </p>
                            </div>

                            {/* Agendamento da Bio */}
                            <div
                              className={`p-3 rounded-2xl border transition-all ${
                                isDark
                                  ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                                  : "bg-rose-50/80 border-rose-200 text-rose-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={13} className="text-[var(--primary)]" />
                                <span className="font-bold text-xs">Agendamento Online da Bio</span>
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-90">
                                <strong>4 clientes</strong> agendaram sozinhas pelo link do Instagram hoje.
                              </p>
                            </div>

                            {/* Economia de Faltas */}
                            <div
                              className={`p-3 rounded-2xl border transition-all ${
                                isDark
                                  ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
                                  : "bg-amber-50/80 border-amber-200 text-amber-900"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Crown size={13} className="text-amber-500" />
                                <span className="font-bold text-xs">Cadeiras Salvas no Mês</span>
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-90">
                                <strong>R$ 3.840,00 garantidos</strong> com confirmação de presença no WhatsApp.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Botão para mudar para aba de Agenda */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playPop();
                              setActiveTab("agenda");
                            }}
                            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[var(--primary)] to-pink-600 hover:from-[var(--primary-dark)] hover:to-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-98"
                          >
                            <span>Ver Agenda Completa do Salão</span>
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    2. ABA AGENDA (TIMELINE REALISTA)
                    ========================================================================= */}
                {activeTab === "agenda" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div
                      className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                        isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-[var(--primary)] to-pink-600 text-white rounded-xl text-xs font-bold shadow-2xs">
                          Hoje, Sexta-Feira
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                            isDark
                              ? "bg-[#211421] border-white/10 text-zinc-300"
                              : "bg-[#faf5f8] border-rose-100 text-zinc-700"
                          }`}
                        >
                          Visão Semanal
                        </span>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl">
                        18 horários reservados • 85% de ocupação
                      </span>
                    </div>

                    <div
                      className={`rounded-3xl border p-4 space-y-2.5 ${
                        isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                      }`}
                    >
                      {[
                        { time: "09:00", client: "Ana Clara Souza", service: "Corte Bordado & Escova Glow", pro: "Juliana Santos", tag: "Confirmado", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                        { time: "10:30", client: "Patrícia Lima", service: "Mechas Globais & Matização", pro: "Camila Santos", tag: "Em Atendimento", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" },
                        { time: "11:45", client: "Carla Dias", service: "Spa dos Pés & Esmaltação Gel", pro: "Fernanda Lima", tag: "Confirmado", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                        { time: "14:00", client: "Juliana Mendes", service: "Design de Sobrancelhas & Henna", pro: "Mariana Costa", tag: "Aguardando", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
                        { time: "15:30", client: "Fernanda Rocha", service: "Tratamento Kérastase & Escova", pro: "Camila Santos", tag: "Confirmado", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                            isDark
                              ? "bg-[#211421] border-white/10"
                              : "bg-[#fdfafc] border-rose-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`text-xs font-mono font-bold shrink-0 px-2.5 py-1 rounded-xl border ${
                                isDark
                                  ? "bg-[#140b14] border-white/10 text-rose-300"
                                  : "bg-white border-rose-200 text-rose-800"
                              }`}
                            >
                              {item.time}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#1a1218] dark:text-[#fdf5f9] truncate">
                                {item.client}
                              </h5>
                              <p className="text-[11px] text-[#73646d] dark:text-[#b8a3af] truncate">
                                {item.service} • <span className="text-[var(--primary)] dark:text-rose-300 font-medium">{item.pro}</span>
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${item.color}`}>
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    3. ABA CLIENTES (CRM INTELIGENTE)
                    ========================================================================= */}
                {activeTab === "clientes" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                        isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                      }`}
                    >
                      <span className="font-bold text-[#2d1b2e] dark:text-[#fdf5f9]">CRM & Ficha Inteligente de Clientes</span>
                      <span className="text-[11px] text-[var(--primary)] dark:text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                        Total: 428 clientes cadastradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { initials: "AC", name: "Ana Clara Souza", phone: "(11) 98451-2299", last: "Há 4 dias", total: "14 visitas", pref: "Mechas & Corte" },
                        { initials: "PL", name: "Patrícia Lima", phone: "(11) 97120-4411", last: "Hoje", total: "22 visitas", pref: "Cronograma Capilar" },
                        { initials: "CD", name: "Carla Dias", phone: "(11) 99842-1055", last: "Há 12 dias", total: "8 visitas", pref: "Manicure Semanal" },
                        { initials: "JM", name: "Juliana Mendes", phone: "(11) 98223-9900", last: "Há 28 dias", total: "5 visitas", pref: "Design & Henna" },
                      ].map((c, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                            isDark
                              ? "bg-[#180e18] border-white/10"
                              : "bg-white border-rose-100 shadow-xs"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-rose-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {c.initials}
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#1a1218] dark:text-[#fdf5f9] truncate">{c.name}</h5>
                              <p className="text-[11px] text-[#73646d] dark:text-[#b8a3af] truncate">{c.phone}</p>
                              <span className="text-[10px] text-[var(--primary)] dark:text-rose-300 font-medium">Prefere: {c.pref}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg block">
                              {c.total}
                            </span>
                            <span className="text-[9px] text-[#9c8994] dark:text-[#b8a3af] block mt-1">{c.last}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    4. ABA EQUIPE & COMISSÕES
                    ========================================================================= */}
                {activeTab === "profissionais" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      {[
                        { initials: "JS", name: "Julia Santos", role: "Cabeleireira & Colorista", com: "45%", done: "62 atendimentos", total: "R$ 4.280,00" },
                        { initials: "CS", name: "Camila Santos", role: "Especialista em Mechas", com: "50%", done: "48 atendimentos", total: "R$ 5.140,00" },
                        { initials: "FL", name: "Fernanda Lima", role: "Nail Designer & Manicure", com: "40%", done: "89 atendimentos", total: "R$ 2.920,00" },
                      ].map((pro, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-3xl border flex flex-col justify-between ${
                            isDark
                              ? "bg-[#180e18] border-white/10"
                              : "bg-white border-rose-200 shadow-xs"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary)] to-rose-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {pro.initials}
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                                Comissão {pro.com}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-[#1a1218] dark:text-[#fdf5f9]">{pro.name}</h5>
                            <p className="text-[11px] text-[#73646d] dark:text-[#b8a3af]">{pro.role}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-rose-100 dark:border-white/10 flex items-center justify-between text-xs">
                            <span className="text-[#9c8994] dark:text-[#b8a3af] text-[11px]">{pro.done}</span>
                            <span className="font-bold text-[var(--primary)] dark:text-rose-400">{pro.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    5. ABA ESTOQUE
                    ========================================================================= */}
                {activeTab === "estoque" && (
                  <div
                    className={`rounded-3xl border overflow-hidden text-xs animate-in fade-in duration-300 ${
                      isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                    }`}
                  >
                    <div
                      className={`p-3.5 border-b flex justify-between font-bold ${
                        isDark ? "bg-[#211421] border-white/10 text-zinc-300" : "bg-[#faf5f8] border-rose-100 text-zinc-700"
                      }`}
                    >
                      <span>Produto de Bancada & Revenda</span>
                      <span>Qtd. em Estoque</span>
                    </div>
                    {[
                      { name: "Shampoo Pós-Química 1L", tag: "Em uso", qty: 4, alert: false },
                      { name: "Pó Descolorante 500g", tag: "Baixo", qty: 1, alert: true },
                      { name: "Óleo Finalizador Argan 60ml", tag: "Revenda", qty: 12, alert: false },
                      { name: "Esmalte Gel Coleção Outono", tag: "Bancada", qty: 28, alert: false },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 border-b flex items-center justify-between last:border-b-0 ${
                          isDark ? "border-white/10" : "border-rose-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.alert && <AlertCircle size={15} className="text-amber-500 shrink-0" />}
                          <span className="font-semibold text-[#1a1218] dark:text-[#fdf5f9]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.alert
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : isDark
                                ? "bg-white/10 text-zinc-300"
                                : "bg-zinc-100 text-zinc-700"
                            }`}
                          >
                            {item.tag}
                          </span>
                          <span className="font-bold text-[#1a1218] dark:text-[#fdf5f9] min-w-8 text-right">{item.qty} un</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* =========================================================================
                    6. ABA WHATSAPP & MARKETING
                    ========================================================================= */}
                {activeTab === "marketing" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div
                        className={`p-4 rounded-3xl border ${
                          isDark
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                            : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                        }`}
                      >
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 inline-block bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Automação Ativa
                        </span>
                        <h5 className="font-bold text-xs text-[#1a1218] dark:text-[#fdf5f9]">Lembrete 24h na Véspera</h5>
                        <p className="text-[11px] text-[#73646d] dark:text-[#b8a3af] mt-1">Disparado no tom carinhoso do salão para reduzir até 80% das faltas.</p>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3">✓ 18 lembretes automáticos hoje</div>
                      </div>

                      <div
                        className={`p-4 rounded-3xl border ${
                          isDark
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                            : "bg-rose-50/80 border-rose-200 text-rose-900"
                        }`}
                      >
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-2 inline-block bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                          Resgate de Clientes
                        </span>
                        <h5 className="font-bold text-xs text-[#1a1218] dark:text-[#fdf5f9]">Convite com Mimo (+30 Dias)</h5>
                        <p className="text-[11px] text-[#73646d] dark:text-[#b8a3af] mt-1">Traz de volta clientes sumidas com mensagem afetuosa e mimo na volta.</p>
                        <div className="text-[11px] font-bold text-[var(--primary)] dark:text-rose-400 mt-3">✓ 14 clientes prontas para resgate</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================================
                    7. ABA FINANCEIRO
                    ========================================================================= */}
                {activeTab === "financeiro" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div
                        className={`p-3 rounded-2xl border text-center ${
                          isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                        }`}
                      >
                        <span className="text-[10px] text-[#9c8994] dark:text-[#b8a3af] font-bold uppercase block truncate">Faturamento</span>
                        <span className="text-sm sm:text-lg font-serif font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">R$ 14.850,00</span>
                        <span className="text-[9px] text-emerald-700 dark:text-emerald-300 font-semibold block">Mês atual</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl border text-center ${
                          isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                        }`}
                      >
                        <span className="text-[10px] text-[#9c8994] dark:text-[#b8a3af] font-bold uppercase block truncate">Custos Fixos</span>
                        <span className="text-sm sm:text-lg font-serif font-bold text-rose-600 dark:text-rose-400 block mt-0.5">R$ 4.200,00</span>
                        <span className="text-[9px] text-[#9c8994] dark:text-[#b8a3af] block">Reservado</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl border text-center ${
                          isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                        }`}
                      >
                        <span className="text-[10px] text-[#9c8994] dark:text-[#b8a3af] font-bold uppercase block truncate">Lucro Líquido</span>
                        <span className="text-sm sm:text-lg font-serif font-bold text-[var(--primary)] dark:text-rose-400 block mt-0.5">R$ 6.310,00</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold block">Livre no Caixa</span>
                      </div>
                    </div>

                    <div
                      className={`p-4 md:p-5 rounded-3xl border ${
                        isDark ? "bg-[#180e18] border-white/10" : "bg-white border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#1a1218] dark:text-[#fdf5f9]">Desempenho dos Últimos 7 Dias</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          ↑ +18% crescimento
                        </span>
                      </div>
                      <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2">
                        {[
                          { day: "Seg", h: "45%", val: "R$ 1.8k" },
                          { day: "Ter", h: "60%", val: "R$ 2.4k" },
                          { day: "Qua", h: "55%", val: "R$ 2.2k" },
                          { day: "Qui", h: "75%", val: "R$ 3.1k" },
                          { day: "Sex", h: "95%", val: "R$ 4.2k" },
                          { day: "Sáb", h: "100%", val: "R$ 4.6k" },
                          { day: "Dom", h: "20%", val: "Folga" },
                        ].map((bar, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <div
                              className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-[var(--primary)] to-pink-400 transition-all shadow-xs"
                              style={{ height: bar.h }}
                            />
                            <span className="text-[9px] font-bold text-[#9c8994] dark:text-[#b8a3af]">{bar.day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
