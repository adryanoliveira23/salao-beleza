"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  usePlatformConfig,
  PlatformUser,
  PLANS,
  PlanType,
} from "@/contexts/PlatformConfigContext";
import {
  Users,
  Settings,
  UserPlus,
  LogOut,
  Shield,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  Edit,
  Trash2,
  X,
  Activity,
  Clock,
  Search,
  MessageCircle,
  Plus,
  Check,
  AlertCircle,
  Sparkles,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Database,
  Radio,
  Server,
  Zap,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Ban,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

function getPlanBadgeClass(plan: PlanType) {
  switch (plan) {
    case "premium":
    case "enterprise":
      return "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50";
    case "profissional":
      return "bg-[#7E1639]/10 text-[#7E1639] dark:text-[#E27D9A] border border-[#7E1639]/30";
    default:
      return "bg-stone-100 dark:bg-white/[0.08] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-white/10";
  }
}

function calculateTrialDaysRemaining(trialEndsAt?: string): {
  days: number;
  isExpired: boolean;
  label: string;
} {
  if (!trialEndsAt) {
    return { days: 0, isExpired: false, label: "Sem data limite" };
  }
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  const diffHours = (end - now) / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  if (diffHours < 0) {
    const expiredDaysAgo = Math.abs(Math.floor(diffHours / 24));
    return {
      days: diffDays,
      isExpired: true,
      label: expiredDaysAgo === 0 ? "Expirou hoje" : `Expirado há ${expiredDaysAgo}d`,
    };
  }
  if (diffDays === 0) {
    return { days: 0, isExpired: false, label: "Expira hoje" };
  }
  return {
    days: diffDays,
    isExpired: false,
    label: `${diffDays} ${diffDays === 1 ? "dia restante" : "dias restantes"}`,
  };
}

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const { config, users, updateConfig, addUser, updateUser, deleteUser, isLoading } =
    usePlatformConfig();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "monitoring"
  >("overview");

  // Sidebar Layout Navigation (padrão igual ao painel do gestor)
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { title, subtitle } = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return {
          title: "Métricas & Faturamento",
          subtitle: "Acompanhamento da receita recorrente e saúde financeira da rede",
        };
      case "users":
        return {
          title: `Salões Parceiros (${users.length})`,
          subtitle: "Gestão da base de assinantes, períodos de teste e contato direto",
        };
      case "monitoring":
        return {
          title: "Infraestrutura & Serviços",
          subtitle: "Disponibilidade dos serviços, integrações e segurança do sistema",
        };
      default:
        return {
          title: "Central de Controle",
          subtitle: "Administração do ecossistema BellaMais",
        };
    }
  }, [activeTab, users.length]);

  // Filters for Users table
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPlan, setFilterPlan] = useState<string>("all");

  // Modals & Feedback
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [selectedSalonDetails, setSelectedSalonDetails] = useState<PlatformUser | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const getPlanPrice = (plan: PlanType) => {
    if (plan === "premium" || plan === "enterprise") return config.planPrices.premium;
    if (plan === "profissional") return config.planPrices.profissional;
    return config.planPrices.essencial;
  };

  const getPlanLimit = (plan: PlanType) => {
    if (plan === "premium" || plan === "enterprise") return config.planLimits.premium;
    if (plan === "profissional") return config.planLimits.profissional;
    return config.planLimits.essencial;
  };

  // Executive SaaS KPIs & Operações Estratégicas
  const { stats, attentionUsers, recentUsers } = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const trial = users.filter((u) => u.status === "trial").length;
    const suspended = users.filter(
      (u) => u.status === "suspended" || u.status === "inactive",
    ).length;

    // Salões em teste com prazo expirado
    const expiredTrials = users.filter((u) => {
      if (u.status !== "trial") return false;
      return calculateTrialDaysRemaining(u.trialEndsAt).isExpired;
    });

    // Salões com atenção prioritária (expirados ou suspensos)
    const attention = users
      .filter((u) => {
        if (u.status === "suspended" || u.status === "inactive") return true;
        if (u.status === "trial") {
          const info = calculateTrialDaysRemaining(u.trialEndsAt);
          return info.isExpired || info.days <= 1;
        }
        return false;
      })
      .slice(0, 6);

    // Últimos salões cadastrados no ecossistema
    const recent = [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const essencialCount = users.filter((u) => u.plan === "essencial").length;
    const profissionalCount = users.filter((u) => u.plan === "profissional").length;
    const premiumCount = users.filter(
      (u) => u.plan === "premium" || u.plan === "enterprise",
    ).length;

    const mrr = users
      .filter((u) => u.status === "active")
      .reduce((sum, u) => sum + getPlanPrice(u.plan), 0);

    const arr = mrr * 12;
    const pendingAttentionCount = expiredTrials.length + suspended;
    const conversionRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return {
      stats: {
        totalSalons: total,
        activeSalons: active,
        trialSalons: trial,
        suspendedSalons: suspended,
        expiredTrialCount: expiredTrials.length,
        pendingAttentionCount,
        essencialCount,
        profissionalCount,
        premiumCount,
        mrr,
        arr,
        conversionRate,
      },
      attentionUsers: attention,
      recentUsers: recent,
    };
  }, [users, config]);

  // Filtered Salons List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = (u.name || "").toLowerCase().includes(query);
        const matchesSalon = (u.salonName || "").toLowerCase().includes(query);
        const matchesEmail = (u.email || "").toLowerCase().includes(query);
        const matchesPhone = (u.phone || "").toLowerCase().includes(query);
        if (!matchesName && !matchesSalon && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== "all" && u.status !== filterStatus) {
        return false;
      }

      // Plan filter
      if (filterPlan !== "all") {
        if (filterPlan === "premium") {
          if (u.plan !== "premium" && u.plan !== "enterprise") return false;
        } else if (u.plan !== filterPlan) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchTerm, filterStatus, filterPlan]);

  // Quick Action: Extend Trial by 7 days
  const handleExtendTrial = async (user: PlatformUser) => {
    const baseDate =
      user.trialEndsAt && new Date(user.trialEndsAt).getTime() > Date.now()
        ? new Date(user.trialEndsAt)
        : new Date();
    baseDate.setDate(baseDate.getDate() + 7);
    const newTrialDate = baseDate.toISOString();

    await updateUser(user.id, {
      trialEndsAt: newTrialDate,
      status: "trial",
    });
    showToast("Período de teste estendido em 7 dias.");
    if (selectedSalonDetails && selectedSalonDetails.id === user.id) {
      setSelectedSalonDetails({
        ...selectedSalonDetails,
        trialEndsAt: newTrialDate,
        status: "trial",
      });
    }
  };

  // Quick Action: Suspender ou Reativar Conta
  const handleToggleSuspend = async (user: PlatformUser) => {
    const isSuspended = user.status === "suspended" || user.status === "inactive";
    const nextStatus = isSuspended ? "active" : "suspended";
    await updateUser(user.id, { status: nextStatus });
    showToast(isSuspended ? "Conta reativada com sucesso." : "Conta suspensa temporariamente.");
    if (selectedSalonDetails && selectedSalonDetails.id === user.id) {
      setSelectedSalonDetails({
        ...selectedSalonDetails,
        status: nextStatus,
      });
    }
  };

  // Quick Action: Direct WhatsApp link (concierge / relacionamento)
  const openOwnerWhatsApp = (user: PlatformUser, isRecovery?: boolean) => {
    const raw = user.phone || "";
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      alert(`O salão "${user.salonName || user.name}" não possui WhatsApp cadastrado.`);
      return;
    }
    const phone = clean.length <= 11 ? `55${clean}` : clean;
    const msg = isRecovery
      ? encodeURIComponent(
          `Olá, ${user.name}! Tudo bem? Sou do time de relacionamento da BellaMais. Notamos que o período de teste do seu salão *${user.salonName || ""}* encerrou. Gostaria de estender seu teste gratuito por mais alguns dias ou tirar alguma dúvida sobre o plano?`,
        )
      : encodeURIComponent(
          `Olá, ${user.name}! Tudo bem? Sou do time de relacionamento da BellaMais. Como está a experiência do ${user.salonName || "seu salão"} com a plataforma? Estou à disposição para apoiar no que precisar.`,
        );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex transition-colors">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#7E1639] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Overlay backdrop em mobile quando sidebar aberta */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
        style={{
          opacity: isMobileOpen ? 1 : 0,
          pointerEvents: isMobileOpen ? "auto" : "none",
        }}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar do Administrador — Idêntico ao padrão de navegação do Gestor */}
      <aside
        className={`w-[260px] md:w-[240px] max-w-[85vw] bg-white dark:bg-[#1C1A22] text-[#221A1D] dark:text-[#F4EEF1] border-r border-[#EDE6E1] dark:border-white/[0.08] flex flex-col z-50 h-dvh fixed left-0 top-0 transition-transform duration-200 ease-in-out shadow-sm
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDesktopOpen ? "md:translate-x-0" : "md:-translate-x-full"}`}
      >
        {/* Brand Header com Botão Dedicado de Fechar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 h-16 border-b border-[#EDE6E1] dark:border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Shield size={16} />
            </div>
            <div className="truncate">
              <span className="text-[15px] font-extrabold tracking-tight text-[#221A1D] dark:text-[#F4EEF1] block leading-tight">
                BellaMais
              </span>
              <span className="text-[10px] text-stone-500 dark:text-[#A0949C] font-semibold block truncate">
                Central de Controle
              </span>
            </div>
          </div>

          {/* Botão Fechar Sidebar — Funciona no Mobile e no Desktop */}
          <button
            type="button"
            onClick={() => {
              setIsMobileOpen(false);
              setIsDesktopOpen(false);
            }}
            className="p-1.5 rounded-lg text-stone-500 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1] hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shrink-0"
            title="Fechar menu lateral"
            aria-label="Fechar menu lateral"
          >
            <X size={18} className="md:hidden" />
            <PanelLeftClose size={18} className="hidden md:block" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3.5 flex flex-col gap-4 overflow-y-auto sidebar-scrollbar">
          <div className="flex flex-col gap-1">
            <span className="px-2.5 text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-[#A0949C]/70 mb-1">
              Menu de Gestão
            </span>
            {[
              { id: "overview", label: "Métricas & Faturamento", icon: TrendingUp },
              {
                id: "users",
                label: "Salões Parceiros",
                icon: Users,
                badge: `${users.length}`,
              },
              { id: "monitoring", label: "Infraestrutura & Serviços", icon: Activity },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as typeof activeTab);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl transition-all text-[13px] cursor-pointer text-left ${
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
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-[#7E1639] text-white"
                          : "bg-stone-100 dark:bg-white/[0.08] text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Botão de Fechar Rápido em Mobile */}
        <div className="md:hidden px-3 pt-1">
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="w-full py-2 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] hover:bg-stone-200 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <X size={14} />
            <span>Fechar Menu</span>
          </button>
        </div>

        {/* Bottom Sair */}
        <div className="p-3 border-t border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between gap-1.5 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area — Ajusta padding com animação ao abrir/fechar a sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[padding] duration-200 ease-in-out ${
          isDesktopOpen ? "pl-0 md:pl-[240px]" : "pl-0"
        }`}
      >
        {/* Header Superior com Botão de Toggle da Sidebar (Idêntico ao Gestor) */}
        <header className="h-16 bg-white dark:bg-[#1C1A22] border-b border-[#EDE6E1] dark:border-white/[0.08] flex items-center justify-between px-3.5 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* Botão de Toggle do Menu Lateral */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsMobileOpen((prev) => !prev);
                } else {
                  setIsDesktopOpen((prev) => !prev);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                !isDesktopOpen
                  ? "bg-[#7E1639] hover:bg-[#9E204A] text-white shadow-xs"
                  : "bg-stone-100 dark:bg-white/[0.06] hover:bg-stone-200/80 dark:hover:bg-white/[0.12] text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-white/10"
              }`}
              aria-label={isDesktopOpen ? "Recolher menu lateral" : "Abrir menu lateral"}
              title={isDesktopOpen ? "Recolher menu lateral" : "Abrir menu lateral"}
            >
              {isDesktopOpen ? (
                <>
                  <PanelLeftClose size={16} className="hidden md:inline-block" />
                  <Menu size={16} className="md:hidden" />
                  <span className="hidden sm:inline">Recolher</span>
                </>
              ) : (
                <>
                  <PanelLeft size={16} className="hidden md:inline-block" />
                  <Menu size={16} className="md:hidden" />
                  <span className="hidden sm:inline">Menu</span>
                </>
              )}
            </button>

            {/* Título da Página / Aba */}
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold text-[#221A1D] dark:text-[#F4EEF1] tracking-tight truncate">
                {title}
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-[#A0949C] hidden sm:block truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Atalho no Canto Direito */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Main Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* ─── TAB 1: VISÃO EXECUTIVA & SAÚDE DO NEGÓCIO ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Indicadores Mestres de Saúde do SaaS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* MRR Card */}
              <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Receita Mensal (MRR)
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    R$ {stats.mrr.toFixed(2)}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--card-border)]/60 mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Projeção Anual:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    R$ {stats.arr.toFixed(2)}/ano
                  </span>
                </div>
              </div>

              {/* Total Salões */}
              <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Salões Cadastrados
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-[#7E1639]/10 text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                      <Users size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
                    {stats.totalSalons}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--card-border)]/60 mt-3 text-xs text-[var(--muted)] flex items-center justify-between">
                  <span>Total na base:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    {stats.totalSalons} {stats.totalSalons === 1 ? "estabelecimento" : "estabelecimentos"}
                  </span>
                </div>
              </div>

              {/* Assinantes Ativos */}
              <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Assinantes Ativos
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {stats.activeSalons}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--card-border)]/60 mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>Conversão da base:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    {stats.conversionRate}% pagantes
                  </span>
                </div>
              </div>

              {/* Pagamentos Pendentes & Atenção */}
              <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                      Pagamentos Pendentes
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        stats.pendingAttentionCount > 0
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                          : "bg-stone-100 dark:bg-white/[0.06] text-[var(--muted)]"
                      }`}
                    >
                      <AlertCircle size={16} />
                    </div>
                  </div>
                  <p
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      stats.pendingAttentionCount > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {stats.pendingAttentionCount}
                  </p>
                </div>
                <div className="pt-3 border-t border-[var(--card-border)]/60 mt-3 text-xs text-[var(--muted)] flex items-center justify-between">
                  <span>Contas em atenção:</span>
                  <span className="font-bold text-[var(--foreground)]">
                    {stats.expiredTrialCount} vencidas • {stats.suspendedSalons} suspensas
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Estratégico: Atenção Imediata & Novos Salões */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Atenção Imediata (Cobrança, Teste Vencido & Recuperação) */}
              <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[var(--foreground)]">
                        Atenção Imediata & Recuperação
                      </h3>
                      {stats.pendingAttentionCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                          {stats.pendingAttentionCount} {stats.pendingAttentionCount === 1 ? "pendência" : "pendências"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Salões com período de avaliação vencido ou contas suspensas
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFilterStatus("trial");
                      setActiveTab("users");
                    }}
                    className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] hover:underline cursor-pointer"
                  >
                    Ver todas →
                  </button>
                </div>

                {attentionUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--muted)] space-y-1">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Nenhuma pendência crítica no momento.
                    </p>
                    <p className="text-[11px]">
                      Todas as contas estão ativas ou com períodos de teste regulares.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {attentionUsers.map((u) => {
                      const trialInfo = calculateTrialDaysRemaining(u.trialEndsAt);
                      const isSuspended = u.status === "suspended" || u.status === "inactive";
                      const initials = (u.salonName || u.name || "S")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={u.id}
                          className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-hover)]/30 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-3"
                        >
                          <div
                            onClick={() => setSelectedSalonDetails(u)}
                            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[var(--foreground)] truncate">
                                {u.salonName || u.name}
                              </p>
                              <p className="text-[11px] text-[var(--muted)] truncate">
                                {u.name} • {u.phone || u.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSuspended
                                  ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                  : trialInfo.isExpired
                                    ? "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                              }`}
                            >
                              {isSuspended ? "Suspenso" : trialInfo.label}
                            </span>

                            {/* Ação rápida de WhatsApp de Recuperação */}
                            {u.phone && (
                              <button
                                onClick={() => openOwnerWhatsApp(u, true)}
                                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                title="Abrir conversa de suporte/recuperação"
                              >
                                <MessageCircle size={15} />
                              </button>
                            )}

                            {/* +7d Teste */}
                            <button
                              onClick={() => handleExtendTrial(u)}
                              className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#c59b27] hover:bg-amber-100 text-[10px] font-bold border border-amber-200/60 dark:border-amber-800/40 transition-colors cursor-pointer"
                              title="Conceder +7 dias de teste"
                            >
                              +7d
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Coluna 2: Novos Salões Recentes */}
              <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                  <div>
                    <h3 className="font-bold text-base text-[var(--foreground)]">
                      Novos Salões Cadastrados
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Últimos estabelecimentos registrados na plataforma
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setActiveTab("users");
                    }}
                    className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] hover:underline cursor-pointer"
                  >
                    Ver base completa →
                  </button>
                </div>

                {recentUsers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--muted)]">
                    Nenhum salão registrado até o momento.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentUsers.map((u) => {
                      const initials = (u.salonName || u.name || "S")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedSalonDetails(u)}
                          className="p-3 rounded-xl border border-[var(--card-border)] bg-[var(--surface-hover)]/30 hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-white/[0.08] text-stone-700 dark:text-stone-200 flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-[var(--foreground)] truncate">
                                {u.salonName || u.name}
                              </p>
                              <p className="text-[11px] text-[var(--muted)] truncate">
                                Responsável: {u.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getPlanBadgeClass(u.plan)}`}
                            >
                              Plano {PLANS[u.plan]?.name || "Essencial"}
                            </span>
                            <span className="text-[11px] text-[var(--muted)] whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                            <ArrowRight size={14} className="text-[var(--muted)]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Distribuição Comercial dos 3 Planos */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <div className="pb-2 border-b border-[var(--card-border)]">
                <h3 className="font-bold text-base text-[var(--foreground)]">
                  Distribuição da Base por Plano Comercial
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Quantidade de assinantes e limites por categoria
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["essencial", "profissional", "premium"] as const).map((key) => {
                  const count =
                    key === "essencial"
                      ? stats.essencialCount
                      : key === "profissional"
                        ? stats.profissionalCount
                        : stats.premiumCount;
                  const share =
                    stats.totalSalons > 0
                      ? Math.round((count / stats.totalSalons) * 100)
                      : 0;

                  return (
                    <div
                      key={key}
                      className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-hover)]/40 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${getPlanBadgeClass(key)}`}
                          >
                            Plano {PLANS[key].name}
                          </span>
                          <span className="font-bold text-sm text-[#7E1639] dark:text-[#E27D9A]">
                            R$ {config.planPrices[key].toFixed(2)}/mês
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted)] leading-relaxed">
                          {PLANS[key].description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[var(--card-border)]">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-xl font-extrabold text-[var(--foreground)]">
                            {count} {count === 1 ? "salão" : "salões"}
                          </span>
                          <span className="text-xs font-semibold text-[var(--muted)]">
                            {share}% da base
                          </span>
                        </div>
                        <div className="w-full bg-[var(--card-border)] h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-[#7E1639] dark:bg-[#E27D9A] h-full rounded-full transition-all"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-[var(--muted)]">
                          Capacidade: até {config.planLimits[key]} profissionais
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SALÕES CADASTRADOS & GESTÃO ATIVA ─── */}
        {activeTab === "users" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-4 md:p-6 border border-[var(--card-border)] shadow-xs space-y-4">
            {/* Header + Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                  Salões Cadastrados na Plataforma
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Gerencie contas ativas, conceda dias de teste com 1 clique e forneça suporte direto.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setShowUserModal(true);
                }}
                className="bg-[#7E1639] hover:bg-[#64112E] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition"
              >
                <UserPlus size={16} />
                <span>Cadastrar Novo Salão</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-3 border-t border-[var(--card-border)] text-xs">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  type="text"
                  placeholder="Buscar por salão, responsável, e-mail ou WhatsApp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs text-[var(--foreground)] outline-none focus:border-[#7E1639]"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-medium outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="active">Assinaturas ativas</option>
                <option value="trial">Em período de teste</option>
                <option value="suspended">Contas suspensas</option>
              </select>

              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="p-2 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-medium outline-none"
              >
                <option value="all">Todos os planos</option>
                <option value="essencial">Plano Essencial</option>
                <option value="profissional">Plano Profissional</option>
                <option value="premium">Plano Premium</option>
              </select>
            </div>

            {/* Salons Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-[11px] uppercase tracking-wider font-bold text-[var(--muted)]">
                    <th className="py-3 px-3">Salão e Responsável</th>
                    <th className="py-3 px-3">Contato</th>
                    <th className="py-3 px-3">Plano</th>
                    <th className="py-3 px-3">Situação da Conta</th>
                    <th className="py-3 px-3">Cadastro</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]/50">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--muted)] text-xs">
                        Nenhum salão encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const trialInfo = calculateTrialDaysRemaining(u.trialEndsAt);
                      const isSuspended = u.status === "suspended" || u.status === "inactive";
                      const initials = (u.salonName || u.name || "S")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-[var(--surface-hover)]/60 transition-colors"
                        >
                          {/* Salão & Nome */}
                          <td className="py-3.5 px-3">
                            <div
                              onClick={() => setSelectedSalonDetails(u)}
                              className="flex items-center gap-2.5 cursor-pointer group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-[#7E1639] dark:group-hover:text-[#E27D9A] transition-colors">
                                  {u.salonName || "Sem Nome de Salão"}
                                </p>
                                <p className="text-xs text-[var(--muted)] truncate">
                                  {u.name}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contato & WhatsApp */}
                          <td className="py-3.5 px-3">
                            <p className="text-xs text-[var(--foreground)] truncate">
                              {u.email}
                            </p>
                            {u.phone ? (
                              <button
                                onClick={() => openOwnerWhatsApp(u)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 cursor-pointer"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageCircle size={12} />
                                <span>{u.phone}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-[var(--muted)] italic">
                                Não informado
                              </span>
                            )}
                          </td>

                          {/* Plano */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPlanBadgeClass(u.plan)}`}
                            >
                              {PLANS[u.plan]?.name || "Essencial"}
                            </span>
                            <span className="block text-[10px] text-[var(--muted)] mt-0.5">
                              Até {getPlanLimit(u.plan)} profs.
                            </span>
                          </td>

                          {/* Status / Validade */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  u.status === "active"
                                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    : u.status === "trial"
                                      ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                      : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                }`}
                              >
                                {u.status === "active"
                                  ? "Assinatura ativa"
                                  : u.status === "trial"
                                    ? "Período de teste"
                                    : "Suspenso"}
                              </span>

                              {u.status === "trial" && (
                                <span
                                  className={`block text-[10px] font-semibold ${
                                    trialInfo.isExpired
                                      ? "text-red-600 dark:text-red-400 font-bold"
                                      : "text-amber-600 dark:text-amber-400"
                                  }`}
                                >
                                  {trialInfo.label}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cadastro */}
                          <td className="py-3.5 px-3 text-xs text-[var(--muted)] whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Ver Ficha Detalhada */}
                              <button
                                onClick={() => setSelectedSalonDetails(u)}
                                className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-[var(--surface-hover)] cursor-pointer"
                                title="Ver Ficha Completa do Salão"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Botão +7 Dias Trial */}
                              <button
                                onClick={() => handleExtendTrial(u)}
                                className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-[#c59b27] hover:bg-amber-100 text-[11px] font-bold border border-amber-200/60 dark:border-amber-800/40 cursor-pointer"
                                title="Conceder +7 dias de teste gratuito"
                              >
                                +7d
                              </button>

                              {/* WhatsApp Direct */}
                              <button
                                onClick={() => openOwnerWhatsApp(u)}
                                className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                title="Conversar no WhatsApp"
                              >
                                <MessageCircle size={15} />
                              </button>

                              {/* Editar */}
                              <button
                                onClick={() => {
                                  setEditingUser(u);
                                  setShowUserModal(true);
                                }}
                                className="p-1.5 rounded-lg text-[#7E1639] dark:text-[#E27D9A] hover:bg-[var(--primary-light)] cursor-pointer"
                                title="Editar dados cadastrais"
                              >
                                <Edit size={15} />
                              </button>

                              {/* Excluir */}
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja realmente remover o salão "${u.salonName || u.name}"? Esta ação é irreversível.`)) {
                                    deleteUser(u.id);
                                    showToast("Salão removido com sucesso.");
                                  }
                                }}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                                title="Excluir Salão"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: STATUS & INFRAESTRUTURA ─── */}
        {activeTab === "monitoring" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
                Telemetria de Infraestrutura & Saúde da Plataforma
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Status das integrações, endpoints de pagamento e interruptores de emergência.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Firestore */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                    Banco Multi-Tenant
                  </span>
                  <Database size={16} className="text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  ✓ Firestore Operacional
                </p>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Isolamento lógico ativo por Salão (`profiles` & `salons`).
                </p>
              </div>

              {/* Webhook WhatsApp */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-blue-800 dark:text-blue-300">
                    Webhook WhatsApp & Baileys
                  </span>
                  <Radio size={16} className="text-blue-600" />
                </div>
                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  ✓ Endpoint Ativo
                </p>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                  Rotas `/api/whatsapp/automation` e envio de mensagens operacionais.
                </p>
              </div>

              {/* Cakto Webhook */}
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-purple-800 dark:text-purple-300">
                    Integração Pagamentos Cakto
                  </span>
                  <Zap size={16} className="text-purple-600" />
                </div>
                <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                  ✓ Endpoint `/api/webhook/cakto`
                </p>
                <p className="text-[11px] text-purple-800/80 dark:text-purple-300/80">
                  Recepção de eventos de cobrança, ativação automática e webhook.
                </p>
              </div>
            </div>

            {/* Configurações Globais de Entrada e Trial */}
            <div className="p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-hover)]/30 space-y-4">
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                Configurações Globais de Trial & Cadastros Públicos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Dias Padrão de Teste Grátis (Trial)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={config.defaultTrialDays}
                    onChange={(e) => {
                      updateConfig({
                        defaultTrialDays: parseInt(e.target.value, 10) || 0,
                      });
                      showToast("Dias padrão de trial atualizados!");
                    }}
                    className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm text-[var(--foreground)] outline-none focus:border-[#7E1639]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Plano Inicial Padrão no Cadastro
                  </label>
                  <select
                    value={config.defaultPlan}
                    onChange={(e) => {
                      updateConfig({ defaultPlan: e.target.value as PlanType });
                      showToast("Plano padrão de cadastro atualizado!");
                    }}
                    className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm text-[var(--foreground)] outline-none focus:border-[#7E1639]"
                  >
                    <option value="essencial">Essencial</option>
                    <option value="profissional">Profissional</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-bold text-[var(--foreground)] p-2.5 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowNewSignups}
                      onChange={(e) => {
                        updateConfig({ allowNewSignups: e.target.checked });
                        showToast(
                          e.target.checked
                            ? "Cadastros públicos ativados!"
                            : "Cadastros públicos bloqueados!",
                        );
                      }}
                      className="accent-[#7E1639]"
                    />
                    <span>Permitir novos cadastros públicos</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modo Manutenção */}
            <div className="p-4 rounded-2xl bg-[var(--surface-hover)] border border-[var(--card-border)] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-[#7E1639] dark:text-[#E27D9A]" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">
                    Modo de Manutenção Global
                  </h4>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Quando ativo, bloqueia o acesso dos salões para upgrades ou manutenção programada.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={config.maintenanceMode}
                  onChange={(e) => {
                    updateConfig({ maintenanceMode: e.target.checked });
                    showToast(
                      e.target.checked
                        ? "Modo manutenção ATIVADO!"
                        : "Modo manutenção DESATIVADO!",
                    );
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7E1639]"></div>
              </label>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Modal / Ficha Detalhada do Salão */}
      {selectedSalonDetails && (
        <SalonDetailsModal
          user={selectedSalonDetails}
          onClose={() => setSelectedSalonDetails(null)}
          onEdit={() => {
            const u = selectedSalonDetails;
            setSelectedSalonDetails(null);
            setEditingUser(u);
            setShowUserModal(true);
          }}
          onExtendTrial={() => handleExtendTrial(selectedSalonDetails)}
          onToggleSuspend={() => handleToggleSuspend(selectedSalonDetails)}
          onOpenWhatsApp={() => openOwnerWhatsApp(selectedSalonDetails)}
          onDelete={() => {
            if (
              confirm(
                `Deseja realmente excluir o salão "${selectedSalonDetails.salonName || selectedSalonDetails.name}"? Esta ação removerá os dados permanentemente.`,
              )
            ) {
              deleteUser(selectedSalonDetails.id);
              setSelectedSalonDetails(null);
              showToast("Salão removido com sucesso.");
            }
          }}
          planLimit={getPlanLimit(selectedSalonDetails.plan)}
          planPrice={getPlanPrice(selectedSalonDetails.plan)}
        />
      )}

      {/* Modal de Criação / Edição de Salão */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={async (data) => {
            if (editingUser) {
              await updateUser(editingUser.id, data);
              showToast("Alterações salvas com sucesso.");
            } else {
              await addUser(data);
              showToast("Salão cadastrado com sucesso.");
            }
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: PlatformUser | null;
  onClose: () => void;
  onSave: (
    data: Omit<PlatformUser, "id" | "createdAt" | "lastLogin"> & { password?: string },
  ) => Promise<void> | void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [salonName, setSalonName] = useState(user?.salonName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [plan, setPlan] = useState<PlanType>(user?.plan || "profissional");
  const [status, setStatus] = useState<"active" | "trial" | "inactive" | "suspended">(
    user?.status || "trial",
  );
  const [trialDays, setTrialDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let trialEndsAt = user?.trialEndsAt;
      if (status === "trial" && !trialEndsAt) {
        const d = new Date();
        d.setDate(d.getDate() + trialDays);
        trialEndsAt = d.toISOString();
      }
      await onSave({
        name,
        email,
        salonName,
        phone,
        password,
        plan,
        status,
        trialEndsAt,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--card-bg)] rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-[var(--card-border)] space-y-4 max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {user ? "Editar Salão Assinante" : "Cadastrar Novo Salão"}
            </h3>
            <p className="text-xs text-[var(--muted)]">
              {user ? "Altere plano, status e dados de suporte" : "Cria a conta e o perfil do salão na plataforma"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold uppercase text-[var(--muted)] mb-1">
              Nome da Proprietária / Responsável *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Carla Souza"
              className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none focus:border-[#7E1639]"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-[var(--muted)] mb-1">
              Nome do Estabelecimento / Salão
            </label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Ex.: Studio Carla Beauty"
              className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none focus:border-[#7E1639]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                E-mail de Acesso *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@salao.com"
                className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none focus:border-[#7E1639]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                WhatsApp de Suporte (com DDD)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none focus:border-[#7E1639]"
              />
            </div>
          </div>

          {!user && (
            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                Senha Inicial de Acesso
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres (ou gerada automaticamente)"
                  className="w-full p-2.5 pr-10 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none focus:border-[#7E1639]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                Plano SaaS
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl font-medium outline-none"
              >
                <option value="essencial">Essencial (R$ 49,90)</option>
                <option value="profissional">Profissional (R$ 89,90)</option>
                <option value="premium">Premium (R$ 149,90)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                Status da Assinatura
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl font-medium outline-none"
              >
                <option value="active">Ativo (Pagante)</option>
                <option value="trial">Em Teste (Trial)</option>
                <option value="suspended">Suspenso / Bloqueado</option>
              </select>
            </div>
          </div>

          {status === "trial" && !user?.trialEndsAt && (
            <div>
              <label className="block font-bold uppercase text-[var(--muted)] mb-1">
                Dias de Teste Gratuito
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value, 10) || 7)}
                className="w-full p-2.5 border border-[var(--card-border)] bg-[var(--surface-hover)] text-[var(--foreground)] rounded-xl outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-[var(--card-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#7E1639] hover:bg-[#64112E] text-white text-xs font-bold shadow-md cursor-pointer transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : user ? "Salvar Alterações" : "Criar Salão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SalonDetailsModal({
  user,
  onClose,
  onEdit,
  onExtendTrial,
  onToggleSuspend,
  onOpenWhatsApp,
  onDelete,
  planLimit,
  planPrice,
}: {
  user: PlatformUser;
  onClose: () => void;
  onEdit: () => void;
  onExtendTrial: () => void;
  onToggleSuspend: () => void;
  onOpenWhatsApp: () => void;
  onDelete: () => void;
  planLimit: number;
  planPrice: number;
}) {
  const trialInfo = calculateTrialDaysRemaining(user.trialEndsAt);
  const isSuspended = user.status === "suspended" || user.status === "inactive";
  const initials = (user.salonName || user.name || "S")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div
        className="bg-[var(--card-bg)] rounded-3xl shadow-2xl p-6 max-w-lg w-full border border-[var(--card-border)] space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Avatar e Nome */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7E1639] to-[#9E204A] text-white flex items-center justify-center font-extrabold text-base shrink-0 shadow-md">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] truncate">
                {user.salonName || "Sem Nome de Salão"}
              </h3>
              <p className="text-xs text-[var(--muted)] truncate">
                Responsável: <span className="font-semibold text-[var(--foreground)]">{user.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badges de Status e Plano */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              user.status === "active"
                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : user.status === "trial"
                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {user.status === "active"
              ? "Assinatura ativa"
              : user.status === "trial"
                ? "Período de teste"
                : "Conta suspensa"}
          </span>

          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPlanBadgeClass(user.plan)}`}>
            Plano {PLANS[user.plan]?.name || "Essencial"}
          </span>

          {user.status === "trial" && (
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                trialInfo.isExpired
                  ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
              }`}
            >
              {trialInfo.label}
            </span>
          )}
        </div>

        {/* Dados Cadastrais & Operacionais */}
        <div className="bg-[var(--surface-hover)]/40 rounded-2xl p-4 border border-[var(--card-border)] space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">E-mail de Acesso</span>
              <span className="font-semibold text-[var(--foreground)] truncate block">{user.email}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">WhatsApp Comercial</span>
              {user.phone ? (
                <button
                  onClick={onOpenWhatsApp}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                >
                  <MessageCircle size={13} />
                  <span>{user.phone}</span>
                </button>
              ) : (
                <span className="text-[var(--muted)] italic">Não informado</span>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Mensalidade</span>
              <span className="font-bold text-[var(--foreground)]">R$ {planPrice.toFixed(2)}/mês</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Capacidade da Equipe</span>
              <span className="font-semibold text-[var(--foreground)]">Até {planLimit} profissionais</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Data de Cadastro</span>
              <span className="font-semibold text-[var(--foreground)]">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">Identificador (UID)</span>
              <span className="font-mono text-[11px] text-[var(--muted)] truncate block">{user.id}</span>
            </div>
          </div>
        </div>

        {/* Suíte de Operações Administrativas */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] block">
            Ações Rápidas de Gestão
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {user.phone && (
              <button
                onClick={onOpenWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Conversar no WhatsApp</span>
              </button>
            )}

            <button
              onClick={onExtendTrial}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#c59b27] hover:bg-amber-100 text-xs font-bold flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
            >
              <Calendar size={15} />
              <span>Conceder +7 Dias de Teste</span>
            </button>

            <button
              onClick={onToggleSuspend}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                isSuspended
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                  : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 border-red-200 dark:border-red-900/40"
              }`}
            >
              {isSuspended ? (
                <>
                  <RotateCcw size={15} />
                  <span>Reativar Conta do Salão</span>
                </>
              ) : (
                <>
                  <Ban size={15} />
                  <span>Suspender Conta</span>
                </>
              )}
            </button>

            <button
              onClick={onEdit}
              className="w-full py-2.5 px-3 rounded-xl bg-[#7E1639] hover:bg-[#64112E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Edit size={15} />
              <span>Editar Cadastro</span>
            </button>
          </div>

          <div className="pt-2 border-t border-[var(--card-border)] flex items-center justify-between">
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Excluir este salão permanentemente</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--muted)] hover:bg-[var(--surface-hover)] cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
