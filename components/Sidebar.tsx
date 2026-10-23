"use client";

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
  TrendingUp,
  Activity,
  Menu,
  Crown,
  CheckSquare,
  MessageCircle,
  HeartHandshake,
  PieChart,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

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
  const { isOpen, close } = useSidebar();

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
          badge: "Ativo",
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
        { name: "Metas de Lucro", icon: TrendingUp, path: "/metas" },
        { name: "Diagnóstico & Metas", icon: Activity, path: "/ia-consultora" },
        { name: "Checklist Diário", icon: CheckSquare, path: "/checklist" },
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
        className={`w-[248px] max-w-[85vw] bg-[var(--card-bg)] text-[var(--foreground)] border-r border-[var(--card-border)] flex flex-col shadow-[2px_0_16px_rgba(35,25,32,0.02)] z-50 h-dvh fixed left-0 top-0 transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Brand Header - Minimalista & Editorial */}
        <div className="flex items-center justify-between gap-3 px-5 h-18 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-pink-500 text-white flex items-center justify-center shadow-xs shadow-rose-500/20 shrink-0">
              <Scissors size={16} />
            </div>
            <div>
              <span className="text-base font-bold font-sans text-[var(--foreground)] block leading-tight tracking-tight">
                BellaMais
              </span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-rose-800/80 dark:text-rose-300 font-bold">
                Beleza & Gestão
              </span>
            </div>
          </div>
          <button
            onClick={close}
            className="md:hidden p-1.5 hover:bg-[var(--primary-light)] rounded-lg transition-colors text-[var(--muted)] cursor-pointer"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links - Line Icons & Fundo Suave */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto sidebar-scrollbar">
          {menuSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-0.5">
              <span className="px-3 text-[9px] uppercase tracking-[0.15em] font-bold text-[var(--muted)]/70 mb-1">
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
                    onClick={close}
                    className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 text-xs sm:text-[13px]
                    ${
                      isActive
                        ? "bg-gradient-to-r from-rose-50 to-pink-50/70 dark:from-rose-950/40 dark:to-transparent text-[var(--primary)] font-bold shadow-2xs border-l-3 border-[var(--primary)]"
                        : "text-[var(--muted)] hover:bg-rose-50/40 hover:text-[var(--foreground)] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        size={16}
                        className={
                          isActive
                            ? "text-[var(--primary)] shrink-0"
                            : "text-[var(--muted)]/80 shrink-0"
                        }
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? "bg-[var(--primary)] text-white shadow-2xs"
                            : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 shadow-2xs"
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

        {/* Bottom Settings Link */}
        <div className="p-3 border-t border-[var(--card-border)]">
          <Link
            href="/configuracoes"
            onClick={close}
            className={`flex items-center gap-2.5 px-3 py-2 w-full rounded-xl transition-all duration-150 text-xs sm:text-[13px] ${
              pathname.startsWith("/configuracoes")
                ? "bg-[var(--primary-light)] text-[var(--primary)] font-bold border-l-2.5 border-[var(--primary)]"
                : "text-[var(--muted)] hover:bg-[var(--primary-light)]/50 hover:text-[var(--foreground)] font-medium"
            }`}
          >
            <Settings size={16} className="shrink-0 text-[var(--muted)]/80" />
            Configurações do Salão
          </Link>
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
          onClick={() =>
            isOpen
              ? close()
              : document
                  .querySelector<HTMLButtonElement>(
                    'button[aria-label="Abrir menu"]',
                  )
                  ?.click()
          }
          className="flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-[var(--muted)] cursor-pointer"
        >
          <Menu size={19} />
          <span className="text-[10px] leading-none font-medium">Mais</span>
        </button>
      </nav>
    </>
  );
}
