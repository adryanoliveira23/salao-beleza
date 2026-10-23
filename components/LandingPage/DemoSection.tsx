"use client";

import React, { useState } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  Scissors,
  ChevronRight,
  Star,
  Search,
  Bell,
  Plus,
  LayoutDashboard,
  Package,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

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

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-[#fff5f7] via-white to-white" id="demo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-14 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-xs uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Demonstração Interativa
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-[#2d1b2e] mb-3 md:mb-5 font-sans tracking-tight text-balance">
            Veja como é simples gerenciar seu salão
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-[#666] leading-relaxed max-w-2xl mx-auto text-balance">
            Toque nas abas abaixo para navegar pela interface do BellaMais e sentir a facilidade de organizar sua rotina.
          </p>
        </div>

        {/* Demo Interface Wrapper */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-[#efe6ea] overflow-hidden max-w-5xl mx-auto ring-1 ring-black/5">
          {/* Desktop Browser Chrome (Apenas em telas médias e grandes) */}
          <div className="hidden md:flex bg-[#f8f9fa] border-b border-[#eee] px-4 py-3 items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <div className="bg-white px-3.5 py-1 rounded-md text-xs text-[#888] inline-flex items-center gap-2 border border-[#eee] shadow-2xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                app.bellamais.com/{activeTab}
              </div>
            </div>
            <div className="w-12 text-right">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ao Vivo
              </span>
            </div>
          </div>

          {/* Mobile Top App Bar (Apenas em Celulares) */}
          <div className="flex md:hidden bg-white border-b border-[#f0f0f0] px-3.5 py-2.5 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[var(--primary)] to-pink-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Scissors size={14} />
              </div>
              <div>
                <span className="font-bold text-xs text-[#2d1b2e] block leading-tight">
                  BellaMais
                </span>
                <span className="text-[9px] text-[#999] uppercase tracking-wider block">
                  Demonstração
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          {/* Mobile Horizontal Tabs Bar (Scroll Horizontal Sem Fricção) */}
          <div className="flex md:hidden bg-[#faf7f9] border-b border-[#ede4e9] p-2 overflow-x-auto gap-1.5 no-scrollbar scroll-smooth">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-white text-[#666] hover:text-[#2d1b2e] border border-[#f0e6eb]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Main Interface Body */}
          <div className="flex flex-col md:flex-row min-h-[480px] md:h-[660px]">
            {/* Desktop Sidebar (Oculta no Mobile) */}
            <div className="hidden md:flex w-[220px] bg-[#231920] text-white flex-col shrink-0">
              <div className="p-5 flex items-center gap-2.5 border-b border-white/10">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-pink-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Scissors size={15} />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight block leading-tight text-white">
                    BellaMais
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-rose-300 font-bold block">
                    Salão & Gestão
                  </span>
                </div>
              </div>

              <div className="flex-1 py-4 px-2.5 flex flex-col gap-1 overflow-y-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-white/15 text-white font-bold shadow-2xs border-l-3 border-[var(--primary)]"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-3 border-t border-white/10 text-[10px] text-white/50 text-center">
                Visualização Interativa
              </div>
            </div>

            {/* Content Area (100% da largura no Mobile) */}
            <div className="flex-1 bg-[#fcfafc] flex flex-col min-w-0">
              {/* Desktop Inner App Header */}
              <div className="hidden md:flex h-14 bg-white border-b border-[#f0e8ed] items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#2d1b2e] capitalize">
                    {activeTab}
                  </span>
                  <span className="text-xs text-[#999]">• Modo Demonstração</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[var(--primary)] flex items-center justify-center font-bold text-xs border border-rose-200">
                    BM
                  </div>
                </div>
              </div>

              {/* Tab Scrollable Content */}
              <div className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto min-w-0 pb-16 md:pb-6">
                {/* 1. DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                  <div className="space-y-4 md:space-y-5 animate-in fade-in duration-300">
                    {/* 3 Core KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#ede4e9] shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
                            Receita Hoje
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <TrendingUp size={14} />
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#2d1b2e]">
                          R$ 2.450,00
                        </div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                          ↑ +15% vs ontem
                        </div>
                      </div>

                      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#ede4e9] shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
                            Atendimentos
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-rose-50 text-[var(--primary)] flex items-center justify-center">
                            <Calendar size={14} />
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#2d1b2e]">
                          18 clientes
                        </div>
                        <div className="text-[11px] text-[#888] font-medium mt-1">
                          5 concluídos • 13 previstos
                        </div>
                      </div>

                      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#ede4e9] shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
                            Ticket Médio
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <DollarSign size={14} />
                          </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#2d1b2e]">
                          R$ 136,10
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold mt-1">
                          Alta ocupação na grade
                        </div>
                      </div>
                    </div>

                    {/* Próximos Atendimentos & Ações */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Próximos de Hoje */}
                      <div className="bg-white rounded-2xl border border-[#ede4e9] shadow-xs p-4">
                        <div className="flex items-center justify-between mb-3.5">
                          <h4 className="font-bold text-xs sm:text-sm text-[#2d1b2e] flex items-center gap-2">
                            <Clock size={16} className="text-[var(--primary)]" />
                            Próximos de Hoje
                          </h4>
                          <span className="text-[10px] font-bold text-[var(--primary)] bg-rose-50 px-2 py-0.5 rounded-full">
                            Grade em tempo real
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {[
                            {
                              time: "14:30",
                              dur: "45m",
                              client: "Beatriz Oliveira",
                              service: "Mechas & Tonalização",
                              pro: "Camila",
                              price: "R$ 380",
                            },
                            {
                              time: "15:15",
                              dur: "30m",
                              client: "Carla Mendes",
                              service: "Corte & Escova",
                              pro: "Juliana",
                              price: "R$ 140",
                            },
                            {
                              time: "16:00",
                              dur: "50m",
                              client: "Daniela Porto",
                              service: "Manicure & Pedicure",
                              pro: "Fernanda",
                              price: "R$ 95",
                            },
                          ].map((app, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 sm:p-3 bg-[#faf7f9] rounded-xl border border-[#f2eaef] hover:border-[var(--primary)]/30 transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="px-2 py-1 rounded-lg bg-white border border-[#eae0e6] text-center shrink-0">
                                  <span className="text-[11px] font-bold text-[var(--primary)] block leading-tight">
                                    {app.time}
                                  </span>
                                  <span className="text-[9px] text-[#999] block leading-none">
                                    {app.dur}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#2d1b2e] truncate">
                                    {app.client}
                                  </div>
                                  <div className="text-[10px] text-[#777] truncate">
                                    {app.service} • {app.pro}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs font-bold text-emerald-700">
                                  {app.price}
                                </span>
                                <div className="w-6 h-6 rounded-lg bg-[#25D366] text-white flex items-center justify-center shadow-2xs">
                                  <MessageCircle size={12} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ações Rápidas & WhatsApp */}
                      <div className="bg-white rounded-2xl border border-[#ede4e9] shadow-xs p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <h4 className="font-bold text-xs sm:text-sm text-[#2d1b2e] flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" />
                              Operação & Disparos
                            </h4>
                          </div>

                          <div className="space-y-2">
                            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs">
                              <span className="font-bold text-emerald-900 block mb-0.5">
                                WhatsApp Conectado
                              </span>
                              <span className="text-[11px] text-emerald-800">
                                14 lembretes de amanhã prontos para confirmação com 1 clique.
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/60 text-xs">
                              <span className="font-bold text-rose-900 block mb-0.5">
                                Agendamento da Bio Ativo
                              </span>
                              <span className="text-[11px] text-rose-800">
                                4 clientes agendaram sozinhas pelo link do Instagram hoje.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#f2eaef] mt-3">
                          <button
                            onClick={() => setActiveTab("agenda")}
                            className="w-full py-2.5 rounded-xl bg-[#2d1b2e] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#442c3b] transition cursor-pointer"
                          >
                            <span>Abrir Agenda Completa</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AGENDA TAB */}
                {activeTab === "agenda" && (
                  <div className="space-y-3 md:space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-2xl border border-[#ede4e9]">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-xl text-xs font-bold">
                          Hoje, Quinta
                        </span>
                        <span className="px-3 py-1.5 bg-[#faf7f9] text-[#666] rounded-xl text-xs font-bold border border-[#f0e8ed]">
                          Semana
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        18 horários reservados
                      </span>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#ede4e9] p-3 md:p-4 shadow-xs space-y-2.5">
                      {[
                        { time: "09:00", client: "Ana Clara Souza", service: "Corte Bordado & Escova", pro: "Juliana", tag: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
                        { time: "10:30", client: "Patrícia Lima", service: "Mechas Globais & Matização", pro: "Camila", tag: "Em Atendimento", color: "bg-blue-100 text-blue-800" },
                        { time: "11:45", client: "Carla Dias", service: "Spa dos Pés & Esmaltação", pro: "Fernanda", tag: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
                        { time: "14:00", client: "Juliana Mendes", service: "Design de Sobrancelhas & Henna", pro: "Mariana", tag: "Aguardando", color: "bg-amber-100 text-amber-800" },
                        { time: "15:30", client: "Fernanda Rocha", service: "Tratamento Reconstrutor Kérastase", pro: "Camila", tag: "Confirmado", color: "bg-emerald-100 text-emerald-800" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#faf7f9] border border-[#f2eaef]">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-bold text-[var(--primary)] shrink-0 bg-white px-2.5 py-1 rounded-lg border border-[#e8dfe5]">
                              {item.time}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-[#2d1b2e] truncate">{item.client}</h5>
                              <p className="text-[10px] text-[#777] truncate">{item.service} • {item.pro}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${item.color}`}>
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. CLIENTES TAB (SEM FOTOS FALSAS) */}
                {activeTab === "clientes" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-white p-3 rounded-2xl border border-[#ede4e9] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#2d1b2e]">Cadastro Inteligente de Clientes (CRM)</span>
                      <span className="text-[11px] text-[var(--primary)] font-bold">Total: 428 clientes</span>
                    </div>

                    {[
                      { initials: "AC", name: "Ana Clara Souza", phone: "(11) 98451-2299", last: "Há 4 dias", total: "14 visitas", pref: "Mechas & Corte" },
                      { initials: "PL", name: "Patrícia Lima", phone: "(11) 97120-4411", last: "Hoje", total: "22 visitas", pref: "Cronograma Capilar" },
                      { initials: "CD", name: "Carla Dias", phone: "(11) 99842-1055", last: "Há 12 dias", total: "8 visitas", pref: "Manicure Semanal" },
                      { initials: "JM", name: "Juliana Mendes", phone: "(11) 98223-9900", last: "Há 28 dias", total: "5 visitas", pref: "Design & Henna" },
                    ].map((c, i) => (
                      <div key={i} className="bg-white p-3.5 rounded-xl border border-[#ede4e9] flex items-center justify-between hover:shadow-xs transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-100 to-pink-100 text-[var(--primary)] font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200">
                            {c.initials}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-[#2d1b2e] truncate">{c.name}</h5>
                            <p className="text-[10px] text-[#888] truncate">{c.phone} • Prefere: {c.pref}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md block">
                            {c.total}
                          </span>
                          <span className="text-[9px] text-[#999] block mt-0.5">{c.last}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. EQUIPE & COMISSÕES (SEM FOTOS FALSAS) */}
                {activeTab === "profissionais" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { initials: "JS", name: "Julia Santos", role: "Cabeleireira & Colorista", com: "45%", done: "62 atendimentos", total: "R$ 4.280" },
                        { initials: "CS", name: "Camila Santos", role: "Especialista em Mechas", com: "50%", done: "48 atendimentos", total: "R$ 5.140" },
                        { initials: "FL", name: "Fernanda Lima", role: "Nail Designer & Manicure", com: "40%", done: "89 atendimentos", total: "R$ 2.920" },
                      ].map((pro, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-[#ede4e9] shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {pro.initials}
                              </div>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Comissão {pro.com}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-[#2d1b2e]">{pro.name}</h5>
                            <p className="text-[11px] text-[#777]">{pro.role}</p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#f2eaef] flex items-center justify-between text-xs">
                            <span className="text-[#888] text-[11px]">{pro.done}</span>
                            <span className="font-bold text-[var(--primary)]">{pro.total}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. ESTOQUE TAB */}
                {activeTab === "estoque" && (
                  <div className="bg-white rounded-2xl border border-[#ede4e9] overflow-hidden text-xs animate-in fade-in duration-300">
                    <div className="bg-[#faf7f9] p-3 border-b border-[#ede4e9] flex justify-between font-bold text-[#666]">
                      <span>Produto de Bancada & Revenda</span>
                      <span>Qtd. em Estoque</span>
                    </div>
                    {[
                      { name: "Shampoo Pós-Química 1L", tag: "Em uso", qty: 4, alert: false },
                      { name: "Pó Descolorante 500g", tag: "Baixo", qty: 1, alert: true },
                      { name: "Óleo Finalizador Argan 60ml", tag: "Revenda", qty: 12, alert: false },
                      { name: "Esmalte Gel Coleção Outono", tag: "Bancada", qty: 28, alert: false },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 border-b border-[#f5edf1] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.alert && <AlertCircle size={14} className="text-amber-500 shrink-0" />}
                          <span className="font-semibold text-[#2d1b2e]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#777] bg-gray-100 px-2 py-0.5 rounded-md">
                            {item.tag}
                          </span>
                          <span className="font-bold text-[#2d1b2e] min-w-8 text-right">{item.qty} un</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. MARKETING TAB */}
                {activeTab === "marketing" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full mb-2 inline-block">
                          Automação Ativa
                        </span>
                        <h5 className="font-bold text-xs text-[#2d1b2e]">Lembrete 24h WhatsApp</h5>
                        <p className="text-[11px] text-[#666] mt-1">Disparado na véspera para reduzir faltas (no-show).</p>
                        <div className="text-[11px] font-bold text-emerald-700 mt-3">✓ 18 disparos automáticos hoje</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full mb-2 inline-block">
                          Fidelização
                        </span>
                        <h5 className="font-bold text-xs text-[#2d1b2e]">Aniversariantes do Mês</h5>
                        <p className="text-[11px] text-[#666] mt-1">Mensagem de carinho com mimo exclusivo do salão.</p>
                        <div className="text-[11px] font-bold text-[var(--primary)] mt-3">✓ 6 aniversariantes esta semana</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. FINANCEIRO TAB */}
                {activeTab === "financeiro" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                      <div className="bg-white p-3 rounded-xl border border-[#ede4e9] text-center">
                        <span className="text-[10px] text-[#888] font-bold uppercase block">Faturamento</span>
                        <span className="text-base sm:text-lg font-bold text-emerald-700 block mt-0.5">R$ 14.850</span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">Mês atual</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-[#ede4e9] text-center">
                        <span className="text-[10px] text-[#888] font-bold uppercase block">Custos Fixos</span>
                        <span className="text-base sm:text-lg font-bold text-rose-700 block mt-0.5">R$ 4.200</span>
                        <span className="text-[9px] text-[#999] block">Reservado</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-[#ede4e9] text-center">
                        <span className="text-[10px] text-[#888] font-bold uppercase block">Lucro Líquido</span>
                        <span className="text-base sm:text-lg font-bold text-[var(--primary)] block mt-0.5">R$ 6.310</span>
                        <span className="text-[9px] text-emerald-600 font-semibold block">Livre</span>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#ede4e9] shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[#2d1b2e]">Desempenho dos Últimos 7 Dias</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
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
                              className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-[var(--primary)] to-pink-400 transition-all"
                              style={{ height: bar.h }}
                            />
                            <span className="text-[9px] font-bold text-[#888]">{bar.day}</span>
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
