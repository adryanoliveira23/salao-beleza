"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scissors,
  BarChart3,
  Calendar,
  Users,
  Package,
  User,
  Link2,
  Settings,
  X,
  DollarSign,
  Wallet,
  Menu,
  Crown,
  MessageCircle,
  HeartHandshake,
  PieChart,
  Volume2,
  VolumeX,
  PanelLeftClose,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { soundEffects } from "@/lib/soundEffects";

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  path: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isDesktopOpen, toggle, close, closeMobile, openDesktop } = useSidebar();
  const [soundActive, setSoundActive] = useState(true);

  useEffect(() => {
    setSoundActive(!soundEffects.isMuted());
    const unsubscribe = soundEffects.subscribe((muted) => {
      setSoundActive(!muted);
    });
    return unsubscribe;
  }, []);

  const handleToggleSound = () => {
    const nextActive = soundEffects.toggleMute();
    setSoundActive(nextActive);
  };

  const menuSections: MenuSection[] = [
    {
      title: "Atendimento & Dia a Dia",
      items: [
        { name: "Painel Principal", icon: BarChart3, path: "/dashboard" },
        { name: "Agenda Inteligente", icon: Calendar, path: "/agenda" },
        {
          name: "WhatsApp Salão",
          icon: MessageCircle,
          path: "/whatsapp",
        },
        { name: "Agendamento Online", icon: Link2, path: "/meu-link" },
      ],
    },
    {
      title: "Clientes & Serviços",
      items: [
        { name: "Clientes & Ficha", icon: User, path: "/clientes" },
        { name: "Serviços & Combos", icon: Scissors, path: "/servicos" },
        {
          name: "Marketing & Fidelidade",
          icon: HeartHandshake,
          path: "/marketing",
        },
        { name: "Clubes de Assinatura", icon: Crown, path: "/assinaturas" },
      ],
    },
    {
      title: "Financeiro & Gestão",
      items: [
        { name: "Financeiro & Caixa", icon: Wallet, path: "/caixa" },
        { name: "Custos & Despesas", icon: DollarSign, path: "/custos" },
        { name: "Equipe & Comissões", icon: Users, path: "/colaboradores" },
        { name: "Estoque & Produtos", icon: Package, path: "/estoque" },
        { name: "Relatórios & BI", icon: PieChart, path: "/relatorios" },
      ],
    },
  ];

  const mobileBottomItems = [
    { name: "Início", icon: BarChart3, path: "/dashboard" },
    { name: "Agenda", icon: Calendar, path: "/agenda" },
    { name: "WhatsApp", icon: MessageCircle, path: "/whatsapp" },
    { name: "Clientes", icon: User, path: "/clientes" },
    { name: "Caixa", icon: Wallet, path: "/caixa" },
  ];

  return (
    <>
      {/* Alça lateral discreta no centro da borda esquerda (apenas no desktop quando menu recolhido) */}
      {!isDesktopOpen && (
        <button
          type="button"
          onClick={openDesktop}
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center w-5 hover:w-8 h-16 rounded-r-lg bg-white dark:bg-[#1C1A22] border border-l-0 border-[#EDE6E1] dark:border-white/[0.12] shadow-md hover:bg-[#7E1639] hover:text-white dark:hover:bg-[#7E1639] text-[#7E1639] dark:text-[#E27D9A] transition-all cursor-pointer group"
          title="Abrir menu lateral"
          aria-label="Abrir menu lateral"
        >
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Overlay backdrop em mobile quando sidebar aberta */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={closeMobile}
        aria-hidden="true"
      />

      <aside
        className={`w-[260px] md:w-[240px] max-w-[85vw] bg-white dark:bg-[#1C1A22] text-[#221A1D] dark:text-[#F4EEF1] border-r border-[#EDE6E1] dark:border-white/[0.08] flex flex-col z-50 h-dvh fixed left-0 top-0 transition-transform duration-200 ease-in-out shadow-sm
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDesktopOpen ? "md:translate-x-0" : "md:-translate-x-full"}`}
      >
        {/* Brand Header com Botão Dedicado de Fechar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-16 border-b border-[#EDE6E1] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Scissors size={16} />
            </div>
            <div className="truncate">
              <span className="text-[15px] font-extrabold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] block leading-tight">
                BellaMais
              </span>
              <span className="text-[10px] text-stone-500 dark:text-[#A0949C] font-medium block truncate">
                Gestão de Salões
              </span>
            </div>
          </div>

          {/* Botão Fechar Sidebar — Funciona tanto no Mobile quanto no Desktop */}
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg text-stone-500 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1] hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Fechar menu lateral"
            aria-label="Fechar menu lateral"
          >
            <X size={18} className="md:hidden" />
            <PanelLeftClose size={18} className="hidden md:block" />
          </button>
        </div>

        {/* Navigation Links — Ao clicar em desktop, a sidebar permanece aberta! Em mobile, fecha suavemente o drawer */}
        <nav className="flex-1 px-3 py-3.5 flex flex-col gap-4 overflow-y-auto sidebar-scrollbar">
          {menuSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              <span className="px-2.5 text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-[#A0949C]/70 mb-1">
                {section.title}
              </span>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.path ||
                  (item.path !== "/" && pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => {
                      soundEffects.playPop();
                      closeMobile();
                    }}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 sm:py-1.5 rounded-xl transition-all text-[13px] ${
                      isActive
                        ? "bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] font-semibold dark:border dark:border-white/[0.08]"
                        : "text-stone-600 dark:text-[#A0949C] hover:bg-stone-100/80 dark:hover:bg-white/[0.04] hover:text-[#221A1D] dark:hover:text-[#F4EEF1] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        size={16}
                        className={`shrink-0 ${
                          isActive
                            ? "text-[#7E1639] dark:text-[#E27D9A]"
                            : "text-stone-400 dark:text-[#A0949C]"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          isActive
                            ? "bg-[#7E1639] text-white"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Botão de Fechar Rápido em Mobile (ao fim da lista) */}
        <div className="md:hidden px-3 pt-1">
          <button
            type="button"
            onClick={closeMobile}
            className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <X size={14} />
            <span>Fechar Menu</span>
          </button>
        </div>

        {/* Bottom Profile / Settings & Sound Mute Toggle */}
        <div className="p-3 border-t border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between gap-1.5 shrink-0">
          <Link
            href="/configuracoes"
            onClick={() => {
              soundEffects.playPop();
              closeMobile();
            }}
            className={`flex items-center gap-2.5 px-2.5 py-2 flex-1 rounded-lg transition-colors text-[13px] ${
              pathname.startsWith("/configuracoes")
                ? "bg-stone-100 dark:bg-white/[0.06] text-[#221A1D] dark:text-[#F4EEF1] font-semibold"
                : "text-stone-600 dark:text-[#A0949C] hover:bg-stone-100/70 dark:hover:bg-white/[0.04] hover:text-[#221A1D] dark:hover:text-[#F4EEF1] font-medium"
            }`}
          >
            <Settings size={16} className="shrink-0 text-stone-400 dark:text-[#A0949C]" />
            Configurações
          </Link>

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-lg text-stone-500 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1] hover:bg-stone-100/70 dark:hover:bg-white/[0.04] transition-colors cursor-pointer shrink-0"
            title={soundActive ? "Sons táteis ativados (clique para silenciar)" : "Sons táteis desativados (clique para ativar)"}
            aria-label="Alternar sons do sistema"
          >
            {soundActive ? (
              <Volume2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX size={16} className="text-stone-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Navegação Inferior Adaptada para Celular */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white/95 dark:bg-[#1C1A22]/95 backdrop-blur-md border-t border-[#EDE6E1] dark:border-white/[0.08] z-40 flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        {mobileBottomItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => soundEffects.playPop()}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-[#7E1639] dark:text-[#E27D9A] font-semibold bg-[#FBF0F4] dark:bg-white/[0.08]"
                  : "text-stone-500 dark:text-[#A0949C]"
              }`}
            >
              <item.icon size={18} />
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => {
            soundEffects.playPop();
            toggle();
          }}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            isOpen
              ? "text-[#7E1639] dark:text-[#E27D9A] font-semibold bg-[#FBF0F4] dark:bg-white/[0.08]"
              : "text-stone-500 dark:text-[#A0949C]"
          }`}
          aria-label={isOpen ? "Fechar menu" : "Abrir menu completo"}
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
          <span className="text-[10px] leading-none font-medium">{isOpen ? "Fechar" : "Mais"}</span>
        </button>
      </nav>
    </>
  );
}
