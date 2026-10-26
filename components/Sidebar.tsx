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
  const { isOpen, toggle, close } = useSidebar();
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
      {/* Overlay em mobile quando sidebar aberta */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`w-[240px] max-w-[85vw] bg-[var(--card-bg)] text-[var(--foreground)] border-r border-[var(--card-border)] flex flex-col z-50 h-dvh fixed left-0 top-0 transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand Header - Limpo, Profissional & Direto */}
        <div className="flex items-center justify-between gap-3 px-5 h-16 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-rose-950/30">
              <Scissors size={16} />
            </div>
            <div>
              <span className="text-[15px] font-extrabold tracking-tight text-[var(--foreground)] block leading-tight">
                BellaMais
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium block">
                Gestão de Salões
              </span>
            </div>
          </div>
          <button
            onClick={close}
            className="md:hidden p-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-[var(--muted)] cursor-pointer"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto sidebar-scrollbar">
          {menuSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              <span className="px-2.5 text-[10px] uppercase tracking-wider font-semibold text-[var(--muted)]/80 dark:text-rose-200/50 mb-1">
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
                      close();
                    }}
                    className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl transition-all text-[13px] ${
                      isActive
                        ? "bg-rose-50 dark:bg-rose-500/15 text-[var(--primary)] dark:text-rose-300 font-bold shadow-2xs dark:border dark:border-rose-500/25"
                        : "text-[var(--muted)] hover:bg-stone-100/70 dark:hover:bg-white/[0.05] hover:text-[var(--foreground)] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        size={16}
                        className={`shrink-0 ${
                          isActive
                            ? "text-[var(--primary)] dark:text-rose-400"
                            : "text-[var(--muted)]"
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          isActive
                            ? "bg-[var(--primary)] text-white"
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

        {/* Bottom Profile / Settings & Sound Mute Toggle */}
        <div className="p-3 border-t border-[var(--card-border)] flex items-center justify-between gap-1.5">
          <Link
            href="/configuracoes"
            onClick={() => {
              soundEffects.playPop();
              close();
            }}
            className={`flex items-center gap-2.5 px-2.5 py-2 flex-1 rounded-lg transition-colors text-[13px] ${
              pathname.startsWith("/configuracoes")
                ? "bg-stone-100 dark:bg-zinc-800 text-[var(--foreground)] font-semibold"
                : "text-[var(--muted)] hover:bg-stone-100/70 dark:hover:bg-zinc-800/60 hover:text-[var(--foreground)] font-medium"
            }`}
          >
            <Settings size={16} className="shrink-0 text-[var(--muted)]" />
            Configurações
          </Link>

          <button
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-stone-100/70 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
            title={soundActive ? "Sons táteis ativados (clique para silenciar)" : "Sons táteis desativados (clique para ativar)"}
            aria-label="Alternar sons do sistema"
          >
            {soundActive ? (
              <Volume2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <VolumeX size={16} className="text-[var(--muted)]" />
            )}
          </button>
        </div>
      </aside>

      {/* Navegação Inferior Adaptada para Celular */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--card-bg)]/95 backdrop-blur-md border-t border-[var(--card-border)] z-40 flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {mobileBottomItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => soundEffects.playPop()}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-[var(--primary)] font-bold bg-[var(--primary-light)]"
                  : "text-[var(--muted)]"
              }`}
            >
              <item.icon size={19} />
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
          className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer ${
            isOpen
              ? "text-[var(--primary)] font-bold bg-[var(--primary-light)]"
              : "text-[var(--muted)]"
          }`}
          aria-label="Abrir menu completo"
        >
          <Menu size={19} />
          <span className="text-[10px] leading-none font-medium">Mais</span>
        </button>
      </nav>
    </>
  );
}
