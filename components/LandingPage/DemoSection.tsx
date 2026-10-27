"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  MessageCircle,
  User,
  Crown,
  Scissors,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Moon,
  Sun,
  ShieldCheck,
  Gift,
  Check,
  Send,
  Phone,
  Trash2,
  Edit3,
  Users,
} from "lucide-react";
import { soundEffects } from "@/lib/soundEffects";

export type DemoTab =
  | "dashboard"
  | "agenda"
  | "whatsapp"
  | "clientes"
  | "assinaturas"
  | "caixa"
  | "servicos";

interface DemoPageItem {
  id: DemoTab;
  label: string;
  section: "Atendimento & Dia a Dia" | "Clientes & Serviços" | "Financeiro & Gestão";
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const DEMO_PAGES: DemoPageItem[] = [
  {
    id: "dashboard",
    label: "Painel Principal",
    section: "Atendimento & Dia a Dia",
    path: "/dashboard",
    icon: BarChart3,
  },
  {
    id: "agenda",
    label: "Agenda Inteligente",
    section: "Atendimento & Dia a Dia",
    path: "/agenda",
    icon: Calendar,
  },
  {
    id: "whatsapp",
    label: "WhatsApp Salão",
    section: "Atendimento & Dia a Dia",
    path: "/whatsapp",
    icon: MessageCircle,
  },
  {
    id: "clientes",
    label: "Clientes & Ficha",
    section: "Clientes & Serviços",
    path: "/clientes",
    icon: User,
  },
  {
    id: "assinaturas",
    label: "Clubes de Assinatura",
    section: "Clientes & Serviços",
    path: "/assinaturas",
    icon: Crown,
  },
  {
    id: "servicos",
    label: "Serviços & Combos",
    section: "Clientes & Serviços",
    path: "/servicos",
    icon: Scissors,
  },
  {
    id: "caixa",
    label: "Financeiro & Caixa",
    section: "Financeiro & Gestão",
    path: "/caixa",
    icon: Wallet,
  },
];

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<DemoTab>("dashboard");
  const [demoTheme, setDemoTheme] = useState<"dark" | "light">("dark");
  const [whatsappToast, setWhatsappToast] = useState<string | null>(null);

  // Sincroniza a demonstração automaticamente com o tema global
  useEffect(() => {
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
  const activePage = DEMO_PAGES.find((p) => p.id === activeTab) || DEMO_PAGES[0];

  const handleTestWhatsApp = (clientName: string) => {
    soundEffects.playSuccess();
    setWhatsappToast(`Lembrete enviado com sucesso para ${clientName}!`);
    setTimeout(() => {
      setWhatsappToast(null);
    }, 3000);
  };

  return (
    <section
      className="py-14 md:py-24 bg-gradient-to-b from-[#FFF9F6] via-[#FAF7F5] to-white dark:from-[#110F14] dark:via-[#151419] dark:to-[#151419] transition-colors duration-300 font-sans"
      id="demo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-14 max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-[#7E1639]/10 dark:bg-[#7E1639]/20 border border-[#7E1639]/20 text-[#7E1639] dark:text-[#ffb2bf] font-bold text-xs uppercase tracking-wider shadow-2xs">
            <Sparkles size={13} />
            <span>Demonstração Interativa do Sistema</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tracking-tight leading-tight">
            Sinta a agilidade e a elegância do BellaMais
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-stone-600 dark:text-[#A0949C] leading-relaxed max-w-2xl mx-auto">
            Navegue pelas abas da barra lateral para experimentar a bancada real em tempo real. Veja o painel de faturamento, a agenda inteligente, o WhatsApp automatizado e os clubes de assinatura.
          </p>
        </div>

        {/* Demo Interface Wrapper (Moldura de Browser) */}
        <div
          className={`rounded-2xl md:rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden max-w-6xl mx-auto border ${
            isDark
              ? "bg-[#1C1A22] border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.7)] text-[#F4EEF1]"
              : "bg-white border-[#EDE6E1] shadow-[0_25px_60px_rgba(126,22,57,0.08)] text-[#221A1D]"
          }`}
        >
          {/* Barra Superior do Browser */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between gap-4 transition-colors ${
              isDark
                ? "bg-[#151419] border-white/[0.08] text-stone-300"
                : "bg-[#FAF7F5] border-[#EDE6E1] text-stone-700"
            }`}
          >
            {/* Botões do Browser */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-black/10" />
                <div className="w-3 h-3 rounded-full bg-[#28c840] border border-black/10" />
              </div>
              <span className="hidden sm:inline-block text-[11px] font-bold text-stone-500 dark:text-[#A0949C] ml-2">
                BellaMais Gestão de Salões
              </span>
            </div>

            {/* Barra de Endereço URL Centralizada */}
            <div className="flex-1 max-w-md text-center">
              <div
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-2 border shadow-2xs ${
                  isDark
                    ? "bg-[#1C1A22] border-white/[0.08] text-[#E27D9A]"
                    : "bg-white border-[#EDE6E1] text-[#7E1639]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tabular-nums">app.bellamais.com{activePage.path}</span>
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
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-white/[0.06] border-white/10 text-amber-300 hover:bg-white/10"
                    : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 shadow-2xs"
                }`}
                title="Trocar tema dentro da demonstração"
              >
                {isDark ? <Sun size={13} className="text-amber-400" /> : <Moon size={13} className="text-[#7E1639]" />}
                <span className="text-[11px] hidden sm:inline">
                  {isDark ? "Modo Claro" : "Modo Escuro"}
                </span>
              </button>

              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ao Vivo
              </span>
            </div>
          </div>

          {/* Abas Horizontais no Mobile */}
          <div
            className={`flex md:hidden border-b p-2 overflow-x-auto gap-1.5 no-scrollbar scroll-smooth ${
              isDark ? "bg-[#151419] border-white/[0.08]" : "bg-[#FAF7F5] border-[#EDE6E1]"
            }`}
          >
            {DEMO_PAGES.map((page) => {
              const IconComp = page.icon;
              const isActive = activeTab === page.id;
              return (
                <button
                  key={page.id}
                  onClick={() => {
                    soundEffects.playPop();
                    setActiveTab(page.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#7E1639] text-white shadow-xs font-bold"
                      : isDark
                      ? "bg-white/[0.04] text-stone-300 border border-white/[0.08]"
                      : "bg-white text-stone-700 border border-stone-200/80"
                  }`}
                >
                  <IconComp size={14} />
                  <span>{page.label}</span>
                </button>
              );
            })}
          </div>

          {/* Corpo Principal da Interface */}
          <div className="flex flex-col md:flex-row min-h-[520px] md:h-[680px]">
            {/* Sidebar Desktop — Fiel ao Layout Real do BellaMais */}
            <div
              className={`hidden md:flex w-[240px] flex-col shrink-0 border-r transition-colors ${
                isDark
                  ? "bg-[#1C1A22] border-white/[0.08] text-[#F4EEF1]"
                  : "bg-white border-[#EDE6E1] text-[#221A1D]"
              }`}
            >
              {/* Brand Header */}
              <div className="p-4 flex items-center gap-2.5 border-b border-[#EDE6E1] dark:border-white/[0.08]">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Scissors size={16} />
                </div>
                <div className="min-w-0">
                  <span className="font-extrabold text-[15px] tracking-tight block leading-tight text-[#221A1D] dark:text-[#F4EEF1]">
                    BellaMais
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-[#A0949C] font-semibold block truncate uppercase tracking-wider">
                    Gestão de Salões
                  </span>
                </div>
              </div>

              {/* Menu com Grupos Oficiais do BellaMais */}
              <div className="flex-1 py-3 px-2.5 flex flex-col gap-3 overflow-y-auto">
                {(["Atendimento & Dia a Dia", "Clientes & Serviços", "Financeiro & Gestão"] as const).map(
                  (sectionName) => (
                    <div key={sectionName} className="space-y-0.5">
                      <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block">
                        {sectionName}
                      </span>
                      {DEMO_PAGES.filter((p) => p.section === sectionName).map((page) => {
                        const IconComp = page.icon;
                        const isActive = activeTab === page.id;
                        return (
                          <button
                            key={page.id}
                            onClick={() => {
                              soundEffects.playPop();
                              setActiveTab(page.id);
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer ${
                              isActive
                                ? "bg-[#7E1639] text-white font-bold shadow-xs"
                                : "text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.06] hover:text-[#221A1D] dark:hover:text-[#F4EEF1]"
                            }`}
                          >
                            <IconComp
                              size={15}
                              className={
                                isActive
                                  ? "text-white"
                                  : "text-stone-500 dark:text-[#A0949C]"
                              }
                            />
                            <span className="truncate">{page.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ),
                )}
              </div>

              {/* Rodapé da Sidebar */}
              <div className="p-3 border-t border-[#EDE6E1] dark:border-white/[0.08] text-[11px] text-stone-500 dark:text-[#A0949C] flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="font-medium">Salão Sincronizado</span>
              </div>
            </div>

            {/* Área de Conteúdo da Página Ativa */}
            <div
              className={`flex-1 flex flex-col min-w-0 transition-colors ${
                isDark ? "bg-[#151419]" : "bg-[#FAF7F5]"
              }`}
            >
              {/* Header Interno com Título Oficial e Crachá */}
              <div
                className={`hidden md:flex h-14 border-b items-center justify-between px-6 shrink-0 transition-colors ${
                  isDark
                    ? "bg-[#1C1A22] border-white/[0.08]"
                    : "bg-white border-[#EDE6E1]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm text-[#221A1D] dark:text-[#F4EEF1]">
                    {activePage.label}
                  </h3>
                  <span className="text-xs text-stone-400">• Salão Aberto</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#ffb2bf] border border-[#7E1639]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    BellaMais Studio
                  </span>
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    BM
                  </div>
                </div>
              </div>

              {/* Toast de Teste de Ações */}
              {whatsappToast && (
                <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{whatsappToast}</span>
                  </div>
                  <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Simulado</span>
                </div>
              )}

              {/* Conteúdo Rolável da Tela */}
              <div className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto min-w-0 space-y-4">
                {/* ══════════════════════════════════════════════════════════════
                    1. PAINEL PRINCIPAL (DASHBOARD)
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "dashboard" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    {/* 4 Cards de Métricas Principais */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Card 1: Faturamento do Dia */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs flex flex-col justify-between min-h-[115px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Faturamento do Dia
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums tracking-tight">
                            R$ 2.450,00
                          </div>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                            ↑ +18% vs ontem • 18 atendimentos
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Atendimentos Hoje */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs flex flex-col justify-between min-h-[115px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E1639] dark:text-[#E27D9A]">
                            Atendimentos Hoje
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                            <Calendar size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums tracking-tight">
                            18 Clientes
                          </div>
                          <span className="text-[11px] text-stone-500 dark:text-[#A0949C] font-semibold mt-0.5 block">
                            5 concluídos • 13 na grade
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Ticket Médio */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs flex flex-col justify-between min-h-[115px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Ticket Médio
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Crown size={14} />
                          </span>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums tracking-tight">
                            R$ 136,10
                          </div>
                          <span className="text-[11px] text-stone-500 dark:text-[#A0949C] font-semibold mt-0.5 block">
                            Alta procura por combos & mechas
                          </span>
                        </div>
                      </div>

                      {/* Card 4: Ocupação da Grade */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs flex flex-col justify-between min-h-[115px]">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7E1639] dark:text-[#E27D9A]">
                            Ocupação da Grade
                          </span>
                          <span className="w-7 h-7 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                            <Sparkles size={14} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums tracking-tight">
                              85%
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                              3 horários livres
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                            85%
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Próximos Atendimentos */}
                    <div className="bg-white dark:bg-[#1C1A22] rounded-3xl p-4 sm:p-5 border border-[#EDE6E1] dark:border-white/[0.08] shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1]">
                          Próximos Atendimentos de Hoje
                        </span>
                        <span className="text-[11px] font-semibold text-stone-500">18 na grade</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { time: "14:00", client: "Ana Clara Souza", service: "Corte Bordado & Escova", pro: "Juliana Santos", status: "Confirmado", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
                          { time: "15:30", client: "Patrícia Lima", service: "Mechas Globais & Matização", pro: "Camila Rocha", status: "Em Atendimento", color: "bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#ffb2bf]" },
                          { time: "16:45", client: "Carla Dias", service: "Spa dos Pés & Esmaltação Gel", pro: "Fernanda Lima", status: "Confirmado", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300" },
                        ].map((row, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.04]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] tabular-nums shrink-0">
                                {row.time}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] block truncate">
                                  {row.client}
                                </span>
                                <span className="text-[11px] text-stone-500 dark:text-[#A0949C] block truncate">
                                  {row.service} • {row.pro}
                                </span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.color}`}>
                              {row.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    2. AGENDA INTELIGENTE
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "agenda" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-[#7E1639] text-white rounded-xl text-xs font-bold">
                          Hoje, Grade Completa
                        </span>
                        <span className="text-xs text-stone-500 dark:text-[#A0949C]">3 profissionais ativas</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-xl">
                        85% ocupação
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#1C1A22] rounded-3xl p-4 border border-[#EDE6E1] dark:border-white/[0.08] space-y-2">
                      {[
                        { time: "09:00", client: "Juliana Alves", service: "Escova Modelada", pro: "Juliana Santos", tag: "Concluído", price: "R$ 80,00" },
                        { time: "10:30", client: "Mariana Silva", service: "Mechas & Matização", pro: "Camila Rocha", tag: "Em Atendimento", price: "R$ 380,00" },
                        { time: "13:00", client: "Camila Ferreira", service: "Corte Bordado", pro: "Juliana Santos", tag: "Confirmado", price: "R$ 120,00" },
                        { time: "14:30", client: "Fernanda Rocha", service: "Tratamento Kérastase", pro: "Camila Rocha", tag: "Confirmado", price: "R$ 220,00" },
                        { time: "16:00", client: "Beatriz Costa", service: "Spa dos Pés & Mãos", pro: "Fernanda Lima", tag: "Aguardando", price: "R$ 95,00" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.04]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] tabular-nums shrink-0">
                              {item.time}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] truncate">
                                {item.client}
                              </h5>
                              <p className="text-[11px] text-stone-500 dark:text-[#A0949C] truncate">
                                {item.service} • {item.pro}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-extrabold text-[#221A1D] dark:text-[#F4EEF1] tabular-nums">
                              {item.price}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                              {item.tag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    3. WHATSAPP SALÃO
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "whatsapp" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1]">Central de Atendimento WhatsApp</span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                          Conectado
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A]">
                        Automação de Confirmação Ativa
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[360px]">
                      {/* Lista de Conversas */}
                      <div className="md:col-span-5 bg-white dark:bg-[#1C1A22] rounded-3xl p-3 border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col gap-2">
                        <span className="text-[10px] font-bold uppercase text-stone-400 px-2">Conversas Recentes</span>
                        {[
                          { name: "Mariana Silva", last: "Gostaria de agendar para amanhã...", time: "10:42", badge: "1" },
                          { name: "Camila Ferreira", last: "Confirmado! Estarei aí às 13h.", time: "10:15", badge: null },
                          { name: "Juliana Alves", last: "Obrigada! Amei o resultado ❤️", time: "09:58", badge: null },
                        ].map((c, i) => (
                          <div
                            key={i}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                              i === 0
                                ? "bg-[#7E1639]/10 border-[#7E1639]/30 text-[#221A1D] dark:text-[#F4EEF1]"
                                : "bg-stone-50 dark:bg-white/[0.03] border-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold truncate">{c.name}</span>
                              <span className="text-[10px] text-stone-400 tabular-nums">{c.time}</span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-stone-500 truncate">{c.last}</span>
                              {c.badge && (
                                <span className="w-4 h-4 rounded-full bg-[#7E1639] text-white text-[9px] font-bold flex items-center justify-center">
                                  {c.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chat Central */}
                      <div className="md:col-span-7 bg-white dark:bg-[#1C1A22] rounded-3xl p-3.5 border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-white/[0.06]">
                            <div>
                              <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] block">Mariana Silva</span>
                              <span className="text-[10px] text-emerald-600 font-semibold">Online agora • Mechas & Corte</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleTestWhatsApp("Mariana")}
                              className="px-2.5 py-1 rounded-xl bg-[#7E1639] hover:bg-[#9E204A] text-white text-xs font-bold transition-all cursor-pointer"
                            >
                              Enviar Lembrete
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="bg-stone-100 dark:bg-white/[0.06] p-2.5 rounded-2xl text-xs max-w-[80%] text-stone-800 dark:text-stone-200">
                              Oi! Gostaria de confirmar meu agendamento de escova para amanhã às 14h com a Juliana.
                            </div>
                            <div className="bg-[#7E1639] text-white p-2.5 rounded-2xl text-xs max-w-[80%] ml-auto">
                              Olá Mariana! Agendamento confirmado com sucesso para amanhã às 14:00. Te esperamos! ✨
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value="Digite uma mensagem..."
                            className="flex-1 px-3 py-1.5 rounded-xl bg-stone-50 dark:bg-white/[0.04] text-xs text-stone-400 border border-stone-200/80 dark:border-white/10"
                          />
                          <button
                            type="button"
                            className="w-8 h-8 rounded-xl bg-[#7E1639] text-white flex items-center justify-center"
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    4. CLIENTES & FICHA
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "clientes" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#221A1D] dark:text-[#F4EEF1]">CRM & Ficha de Clientes</span>
                      <span className="text-[11px] text-[#7E1639] dark:text-[#ffb2bf] font-bold bg-[#7E1639]/10 px-3 py-1 rounded-full border border-[#7E1639]/20">
                        Total: 428 clientes cadastradas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { initials: "AC", name: "Ana Clara Souza", phone: "(11) 98451-2299", last: "Há 4 dias", total: "14 visitas", pref: "Mechas & Corte" },
                        { initials: "PL", name: "Patrícia Lima", phone: "(11) 97120-4411", last: "Hoje", total: "22 visitas", pref: "Cronograma Capilar" },
                        { initials: "CD", name: "Carla Dias", phone: "(11) 99842-1055", last: "Há 12 dias", total: "8 visitas", pref: "Manicure Semanal" },
                        { initials: "JM", name: "Juliana Mendes", phone: "(11) 96321-7788", last: "Há 1 mês", total: "6 visitas", pref: "Sobrancelhas" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#ffb2bf] flex items-center justify-center text-xs font-bold">
                              {item.initials}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1]">{item.name}</h5>
                              <p className="text-[11px] text-stone-500">{item.pref} • {item.total}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTestWhatsApp(item.name.split(" ")[0])}
                            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:scale-105 transition-all cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <Phone size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    5. CLUBES DE ASSINATURA
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "assinaturas" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] block">
                          Receita Recorrente Previsível
                        </span>
                        <span className="text-[11px] text-stone-500">Pacotes mensais automáticos</span>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        MRR: R$ 6.999,80/mês
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Card Clube 1 */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-8 h-8 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#ffb2bf] flex items-center justify-center">
                              <Crown size={16} />
                            </span>
                            <div className="flex items-center gap-1">
                              <button type="button" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700">
                                <Edit3 size={14} />
                              </button>
                              <button type="button" className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">Clube da Escova VIP</h4>
                          <div className="text-xl font-extrabold text-[#7E1639] dark:text-[#E27D9A] my-1 tabular-nums">
                            R$ 149,90 <span className="text-xs text-stone-400 font-normal">/Mensal</span>
                          </div>
                          <div className="space-y-1.5 mt-3 text-xs text-stone-600 dark:text-stone-300">
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>4 Escovas no mês (Seg a Qui)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>1 Hidratação profunda</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>10% OFF em produtos</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center justify-between">
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Users size={13} /> 24 assinantes ativas
                          </span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer">
                            <Trash2 size={12} /> Remover
                          </span>
                        </div>
                      </div>

                      {/* Card Clube 2 */}
                      <div className="p-4 rounded-3xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-8 h-8 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:bg-[#7E1639]/30 dark:text-[#ffb2bf] flex items-center justify-center">
                              <Crown size={16} />
                            </span>
                            <div className="flex items-center gap-1">
                              <button type="button" className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700">
                                <Edit3 size={14} />
                              </button>
                              <button type="button" className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">Unhas & Pés Perfeitos</h4>
                          <div className="text-xl font-extrabold text-[#7E1639] dark:text-[#E27D9A] my-1 tabular-nums">
                            R$ 189,90 <span className="text-xs text-stone-400 font-normal">/Mensal</span>
                          </div>
                          <div className="space-y-1.5 mt-3 text-xs text-stone-600 dark:text-stone-300">
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>4 Manicures completas no mês</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>2 Pedicures completas no mês</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check size={12} className="text-emerald-500" />
                              <span>Prioridade de horário na agenda</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center justify-between">
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Users size={13} /> 18 assinantes ativas
                          </span>
                          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 cursor-pointer">
                            <Trash2 size={12} /> Remover
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    6. SERVIÇOS & COMBOS
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "servicos" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#221A1D] dark:text-[#F4EEF1]">Catálogo de Procedimentos & Combos</span>
                      <span className="text-xs font-bold text-[#7E1639] dark:text-[#ffb2bf]">Grade de Comissões Ativa</span>
                    </div>

                    <div className="bg-white dark:bg-[#1C1A22] rounded-3xl p-4 border border-[#EDE6E1] dark:border-white/[0.08] space-y-2">
                      {[
                        { name: "Corte Bordado & Escova Glow", category: "Cabelo", dur: "1h", price: "R$ 120,00", com: "50%" },
                        { name: "Mechas Globais & Matização", category: "Coloração", dur: "3h 30m", price: "R$ 380,00", com: "50%" },
                        { name: "Manicure & Pedicure Spa", category: "Unhas", dur: "1h 15m", price: "R$ 95,00", com: "60%" },
                        { name: "Design de Sobrancelhas & Henna", category: "Estética", dur: "45m", price: "R$ 65,00", com: "55%" },
                        { name: "Tratamento Kérastase Fusio-Dose", category: "Tratamento", dur: "1h", price: "R$ 220,00", com: "45%" },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.04]"
                        >
                          <div>
                            <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1] block">{item.name}</span>
                            <span className="text-[11px] text-stone-500">{item.category} • Duração: {item.dur} • Comissão: {item.com}</span>
                          </div>
                          <span className="text-sm font-extrabold text-[#7E1639] dark:text-[#E27D9A] tabular-nums">
                            {item.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    7. FINANCEIRO & CAIXA
                    ══════════════════════════════════════════════════════════════ */}
                {activeTab === "caixa" && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] text-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Faturamento Mês</span>
                        <span className="text-base sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5 tabular-nums">R$ 14.850,00</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] text-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Custos & Despesas</span>
                        <span className="text-base sm:text-xl font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5 tabular-nums">R$ 4.200,00</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.08] text-center">
                        <span className="text-[10px] text-stone-400 font-bold uppercase block">Lucro Líquido</span>
                        <span className="text-base sm:text-xl font-extrabold text-[#7E1639] dark:text-[#E27D9A] block mt-0.5 tabular-nums">R$ 6.310,00</span>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-[#1C1A22] rounded-3xl p-4 sm:p-5 border border-[#EDE6E1] dark:border-white/[0.08]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#221A1D] dark:text-[#F4EEF1]">Desempenho dos Últimos 7 Dias</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
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
                              className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-[#7E1639] to-[#E27D9A] transition-all shadow-xs"
                              style={{ height: bar.h }}
                            />
                            <span className="text-[10px] font-bold text-stone-500">{bar.day}</span>
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
