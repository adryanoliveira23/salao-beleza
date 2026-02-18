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
} from "lucide-react";

export function DemoSection() {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "agenda"
    | "profissionais"
    | "clientes"
    | "estoque"
    | "marketing"
    | "financeiro"
  >("dashboard");

  return (
    <section className="py-20 bg-linear-to-b from-[#fff5f7] to-white" id="demo">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
            Experimente Agora
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-[#2d1b2e] mb-6 font-serif">
            Veja como é simples gerenciar seu salão
          </h2>
          <p className="text-lg text-[#666]">
            Navegue pelas abas abaixo e descubra como o Agendly Glow transforma
            a gestão do seu negócio em uma experiência visual e intuitiva.
          </p>
        </div>

        {/* Demo Interface Wrapper */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#f0f0f0] ring-4 ring-primary/5 max-w-5xl mx-auto">
          {/* Fake Browser Header */}
          <div className="bg-[#f8f9fa] border-b border-[#eee] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
              <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="bg-white px-3 py-1 rounded-md text-xs text-[#999] inline-flex items-center gap-2 border border-[#eee] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                app.agendlyglow.com/dashboard
              </div>
            </div>
          </div>

          <div className="flex h-[600px] md:h-[700px]">
            {/* Fake Sidebar */}
            <div className="w-[70px] md:w-[240px] bg-[#2d1b2e] text-white flex flex-col shrink-0">
              <div className="p-4 md:p-6 flex items-center gap-3 border-b border-white/10">
                <div className="w-8 h-8 bg-linear-to-br from-primary to-primary-dark rounded-lg shrink-0"></div>
                <span className="font-bold text-lg hidden md:block">Glow</span>
              </div>

              <div className="flex-1 py-6 px-2 md:px-4 flex flex-col gap-2">
                <SidebarItem
                  icon={<LayoutDashboard size={20} />}
                  label="Dashboard"
                  active={activeTab === "dashboard"}
                  onClick={() => setActiveTab("dashboard")}
                />
                <SidebarItem
                  icon={<Calendar size={20} />}
                  label="Agenda"
                  active={activeTab === "agenda"}
                  onClick={() => setActiveTab("agenda")}
                />
                <SidebarItem
                  icon={<Users size={20} />}
                  label="Clientes"
                  active={activeTab === "clientes"}
                  onClick={() => setActiveTab("clientes")}
                />
                <SidebarItem
                  icon={<Scissors size={20} />}
                  label="Profissionais"
                  active={activeTab === "profissionais"}
                  onClick={() => setActiveTab("profissionais")}
                />
                <SidebarItem
                  icon={<Package size={20} />}
                  label="Estoque"
                  active={activeTab === "estoque"}
                  onClick={() => setActiveTab("estoque")}
                />
                <SidebarItem
                  icon={<Megaphone size={20} />}
                  label="Marketing"
                  active={activeTab === "marketing"}
                  onClick={() => setActiveTab("marketing")}
                />
                <SidebarItem
                  icon={<DollarSign size={20} />}
                  label="Financeiro"
                  active={activeTab === "financeiro"}
                  onClick={() => setActiveTab("financeiro")}
                />
              </div>
            </div>

            {/* Fake Content Area */}
            <div className="flex-1 bg-[#fcfcfc] flex flex-col min-w-0">
              {/* Fake App Header */}
              <div className="h-16 bg-white border-b border-[#f0f0f0] flex items-center justify-between px-6">
                <h3 className="font-bold text-lg text-[#2d1b2e] capitalize">
                  {activeTab}
                </h3>
                <div className="flex items-center gap-4">
                  <Search size={20} className="text-[#999]" />
                  <Bell size={20} className="text-[#999]" />
                  <div className="w-8 h-8 rounded-full bg-[#e0e0e0] overflow-hidden ml-2">
                    <img src="https://i.pravatar.cc/150?img=32" alt="User" />
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 p-6 overflow-y-auto relative">
                {/* DASHBOARD TAB */}
                {activeTab === "dashboard" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#999] uppercase tracking-wider">
                            Receita Hoje
                          </span>
                          <TrendingUp size={16} className="text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-[#2d1b2e]">
                          R$ 2.450,00
                        </div>
                        <div className="text-xs text-green-500 mt-1">
                          +15% em relação a ontem
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#999] uppercase tracking-wider">
                            Agendamentos
                          </span>
                          <Calendar size={16} className="text-primary" />
                        </div>
                        <div className="text-2xl font-bold text-[#2d1b2e]">
                          18
                        </div>
                        <div className="text-xs text-[#666] mt-1">
                          5 concluídos hoje
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-[#999] uppercase tracking-wider">
                            Novos Clientes
                          </span>
                          <Users size={16} className="text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-[#2d1b2e]">
                          4
                        </div>
                        <div className="text-xs text-blue-500 mt-1">
                          Meta do mês: 80%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-sm p-4">
                        <h4 className="font-bold text-[#2d1b2e] mb-4 flex items-center gap-2">
                          <Clock size={18} /> Próximos de Hoje
                        </h4>
                        <div className="space-y-3">
                          {[
                            {
                              time: "14:30",
                              client: "Beatriz Oliveira",
                              service: "Mechas",
                            },
                            {
                              time: "15:00",
                              client: "Carla Mendes",
                              service: "Corte",
                            },
                            {
                              time: "16:15",
                              client: "Daniela Porto",
                              service: "Manicure",
                            },
                          ].map((app, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-[#fcfcfc] rounded-lg border border-[#f5f5f5]"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-primary">
                                  {app.time}
                                </span>
                                <div>
                                  <div className="text-sm font-semibold text-[#2d1b2e]">
                                    {app.client}
                                  </div>
                                  <div className="text-xs text-[#999]">
                                    {app.service}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-[#ccc]" />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-sm p-4">
                        <h4 className="font-bold text-[#2d1b2e] mb-4 flex items-center gap-2">
                          <CheckCircle2 size={18} /> Atividades Rápidas
                        </h4>
                        <div className="space-y-2">
                          <button className="w-full text-left p-3 text-sm rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-[#e0e0e0] flex items-center gap-2">
                            <Plus size={16} /> Abrir novo caixa
                          </button>
                          <button className="w-full text-left p-3 text-sm rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-[#e0e0e0] flex items-center gap-2">
                            <Plus size={16} /> Registrar despesa
                          </button>
                          <button className="w-full text-left p-3 text-sm rounded-lg hover:bg-primary/5 transition-colors border border-dashed border-[#e0e0e0] flex items-center gap-2">
                            <Plus size={16} /> Cadastrar cupom
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* AGENDA TAB */}
                {activeTab === "agenda" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex gap-2">
                        <span className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm font-medium text-[#666]">
                          Hoje
                        </span>
                        <span className="px-4 py-2 bg-white border border-[#e0e0e0] rounded-lg text-sm font-medium text-[#666]">
                          Semana
                        </span>
                      </div>
                      <button className="bg-[#2d1b2e] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <Plus size={16} /> Novo Agendamento
                      </button>
                    </div>

                    <div className="bg-white border border-[#f0f0f0] rounded-xl flex-1 shadow-sm overflow-hidden flex min-h-[400px]">
                      <div className="w-16 border-r border-[#f0f0f0] flex flex-col py-4 shrink-0 bg-[#fafafa]">
                        {[
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                        ].map((t) => (
                          <div
                            key={t}
                            className="h-20 text-xs text-center text-[#999] font-medium"
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                      <div className="flex-1 relative bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-white overflow-x-auto">
                        <div className="min-w-[600px] h-full relative">
                          {/* Professional Columns Headers */}
                          <div className="absolute top-0 left-0 right-0 h-10 border-b border-[#f0f0f0] flex bg-white/80 backdrop-blur-sm z-10">
                            <div className="flex-1 border-r border-[#f0f0f0] flex items-center justify-center text-[10px] font-bold uppercase text-[#999]">
                              Julia Santos
                            </div>
                            <div className="flex-1 border-r border-[#f0f0f0] flex items-center justify-center text-[10px] font-bold uppercase text-[#999]">
                              Ricardo O.
                            </div>
                            <div className="flex-1 flex items-center justify-center text-[10px] font-bold uppercase text-[#999]">
                              Fernanda L.
                            </div>
                          </div>

                          {/* Appointment Cards */}
                          <div className="absolute top-12 left-[2%] w-[30%] h-[70px] bg-[#eefda3] border-l-4 border-[#c7d966] rounded-md p-2 text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            <div className="font-bold text-[#2d1b2e]">
                              Corte e Escova
                            </div>
                            <div className="text-[#666]">Ana Clara • 09:00</div>
                          </div>

                          <div className="absolute top-[172px] left-[35%] w-[30%] h-[150px] bg-[#ffd6e6] border-l-4 border-[#ff6b9d] rounded-md p-2 text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            <div className="font-bold text-[#2d1b2e]">
                              Mechas e Tonalização
                            </div>
                            <div className="text-[#666]">
                              Patrícia Lima • 11:00
                            </div>
                          </div>

                          <div className="absolute top-[260px] left-[2%] w-[30%] h-[70px] bg-[#e0f2fe] border-l-4 border-[#38bdf8] rounded-md p-2 text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            <div className="font-bold text-[#2d1b2e]">
                              Manicure
                            </div>
                            <div className="text-[#666]">
                              Carla Dias • 13:00
                            </div>
                          </div>

                          <div className="absolute top-[80px] left-[68%] w-[30%] h-[100px] bg-[#f0e7ff] border-l-4 border-[#a855f7] rounded-md p-2 text-xs shadow-sm hover:scale-105 transition-transform cursor-pointer">
                            <div className="font-bold text-[#2d1b2e]">
                              Design de Sobrancelha
                            </div>
                            <div className="text-[#666]">
                              Juliana M. • 10:00
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROFISSIONAIS TAB */}
                {activeTab === "profissionais" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <ProfessionalCard
                        name="Julia Santos"
                        role="Hairstylist Senior"
                        image="https://i.pravatar.cc/150?img=5"
                        rating={5.0}
                        services={124}
                        status="Disponível"
                      />
                      <ProfessionalCard
                        name="Ricardo Oliveira"
                        role="Barbeiro Master"
                        image="https://i.pravatar.cc/150?img=11"
                        rating={4.9}
                        services={98}
                        status="Em atendimento"
                      />
                      <ProfessionalCard
                        name="Fernanda Lima"
                        role="Manicure e Pedicure"
                        image="https://i.pravatar.cc/150?img=9"
                        rating={4.8}
                        services={215}
                        status="Disponível"
                      />
                      <div className="border-2 border-dashed border-[#e0e0e0] rounded-xl flex flex-col items-center justify-center p-8 text-[#999] hover:bg-[#fafafa] cursor-pointer transition-colors h-[180px]">
                        <div className="w-12 h-12 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-3">
                          <Plus size={24} />
                        </div>
                        <span className="font-medium">
                          Adicionar Profissional
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FINANCEIRO TAB */}
                {activeTab === "financeiro" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="text-sm text-[#999] mb-1">
                          Faturamento Hoje
                        </div>
                        <div className="text-2xl font-bold text-[#2d1b2e]">
                          R$ 1.240,00
                        </div>
                        <div className="text-xs text-green-500 mt-1">
                          ↑ 12% vs ontem
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="text-sm text-[#999] mb-1">
                          Ticket Médio
                        </div>
                        <div className="text-2xl font-bold text-[#2d1b2e]">
                          R$ 145,00
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm">
                        <div className="text-sm text-[#999] mb-1">
                          Comissões
                        </div>
                        <div className="text-2xl font-bold text-[#ff6b9d]">
                          R$ 320,00
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-[#f0f0f0] shadow-sm h-64 flex items-center justify-center relative">
                      {/* Fake Graph */}
                      <div className="absolute inset-0 flex items-end justify-between px-8 pb-8 pt-16 gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div
                            key={i}
                            className="w-full bg-[#FF6B9D]/20 hover:bg-[#FF6B9D] transition-colors rounded-t-sm relative group"
                            style={{ height: `${h}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              R$ {h * 100},00
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* CLIENTES TAB */}
                {activeTab === "clientes" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-[#f0f0f0] flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center overflow-hidden">
                            <img
                              src={`https://i.pravatar.cc/150?img=${20 + i}`}
                              alt="Client"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-[#2d1b2e]">
                              Cliente Exemplo {i}
                            </div>
                            <div className="text-xs text-[#999]">
                              (11) 99999-9999
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs font-semibold text-[#2d1b2e]">
                              Última visita
                            </div>
                            <div className="text-xs text-[#999]">
                              Há {i * 2} dias
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-[#ccc]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ESTOQUE TAB */}
                {activeTab === "estoque" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-xl border border-[#f0f0f0] shadow-sm overflow-hidden text-sm">
                      <div className="bg-[#fafafa] flex items-center p-4 border-b border-[#f0f0f0] font-bold text-[#666]">
                        <div className="flex-1">Produto</div>
                        <div className="w-24 text-center">Preço</div>
                        <div className="w-24 text-center">Status</div>
                        <div className="w-24 text-center">Qtd.</div>
                      </div>
                      {[
                        {
                          name: "Shampoo Premium 500ml",
                          price: "R$ 85,00",
                          qty: 12,
                          status: "Normal",
                        },
                        {
                          name: "Condicionador Glow 300ml",
                          price: "R$ 62,00",
                          qty: 3,
                          status: "Baixo",
                        },
                        {
                          name: "Óleo Finalizador Argan",
                          price: "R$ 115,00",
                          qty: 0,
                          status: "Faltando",
                        },
                        {
                          name: "Máscara Hidratação Profunda",
                          price: "R$ 145,00",
                          qty: 8,
                          status: "Normal",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center p-4 border-b border-[#f5f5f5] hover:bg-[#fcfcfc] transition-colors"
                        >
                          <div className="flex-1 font-medium text-[#2d1b2e] flex items-center gap-2">
                            {item.qty <= 5 && (
                              <AlertCircle size={14} className="text-red-500" />
                            )}
                            {item.name}
                          </div>
                          <div className="w-24 text-center text-[#666]">
                            {item.price}
                          </div>
                          <div className="w-24 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                item.status === "Normal"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "Baixo"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <div className="w-24 text-center font-bold text-[#2d1b2e]">
                            {item.qty}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MARKETING TAB */}
                {activeTab === "marketing" && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                        <div className="relative z-10">
                          <h4 className="font-bold text-[#2d1b2e] mb-1">
                            Aniversariantes do Mês
                          </h4>
                          <p className="text-sm text-[#666] mb-4">
                            Envie um cupom de 20% OFF automaticamente via
                            WhatsApp.
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="bg-primary text-white text-[10px] px-2 py-1 rounded-full">
                              Campanha Ativa
                            </span>
                            <span className="text-xs text-[#999]">
                              12 disparos hoje
                            </span>
                          </div>
                        </div>
                        <Megaphone
                          size={60}
                          className="absolute -right-4 -bottom-4 text-primary/10 group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="p-5 rounded-2xl bg-linear-to-br from-blue-50 to-blue-100/50 border border-blue-100 relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer">
                        <div className="relative z-10">
                          <h4 className="font-bold text-[#2d1b2e] mb-1">
                            Recuperar Clientes
                          </h4>
                          <p className="text-sm text-[#666] mb-4">
                            Clientes que não voltam há mais de 45 dias.
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full">
                              850 clientes aptos
                            </span>
                          </div>
                        </div>
                        <Users
                          size={60}
                          className="absolute -right-4 -bottom-4 text-blue-500/10 group-hover:scale-110 transition-transform"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-[#f0f0f0] shadow-sm">
                      <h4 className="font-bold text-[#2d1b2e] mb-4">
                        Programa de Fidelidade
                      </h4>
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#999]">
                              Metas atingidas (Mês)
                            </span>
                            <span className="font-bold text-primary">78%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[78%] rounded-full"></div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#2d1b2e]">
                            452
                          </div>
                          <div className="text-xs text-[#999]">
                            Vouchers resgatados
                          </div>
                        </div>
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

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all w-full text-left
      ${active ? "bg-white/10 text-white font-medium shadow-sm" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
    >
      {icon}
      <span className="hidden md:block">{label}</span>
    </button>
  );
}

interface ProfessionalCardProps {
  name: string;
  role: string;
  image: string;
  rating: number;
  services: number;
  status: string;
}

function ProfessionalCard({
  name,
  role,
  image,
  rating,
  services,
  status,
}: ProfessionalCardProps) {
  return (
    <div className="bg-white p-4 rounded-xl border border-[#f0f0f0] shadow-sm hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={image}
            alt={name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
          />
          <div>
            <h4 className="font-bold text-[#2d1b2e]">{name}</h4>
            <p className="text-xs text-[#666]">{role}</p>
          </div>
        </div>
        <div
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${status === "Disponível" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
        >
          {status}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm py-3 border-t border-[#f8f8f8]">
        <div className="flex items-center gap-1 text-amber-500 font-semibold">
          <Star size={14} fill="currentColor" /> {rating}
        </div>
        <div className="text-[#999]">{services} atendimentos</div>
      </div>

      <button className="w-full mt-2 bg-[#f8f8f8] text-[#2d1b2e] py-2 rounded-lg text-sm font-medium group-hover:bg-[#2d1b2e] group-hover:text-white transition-colors">
        Ver Agenda
      </button>
    </div>
  );
}
