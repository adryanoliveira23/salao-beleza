"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSalonData, Client } from "@/contexts/SalonDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";
import { CurrencyInput } from "@/components/CurrencyInput";
import {
  Gift,
  Ticket,
  Award,
  Sparkles,
  Clock,
  Star,
  Plus,
  Trash2,
  Calendar,
  ExternalLink,
  Search,
  MessageCircle,
  Copy,
  Check,
  Flame,
  CheckCircle2,
  Phone,
  Heart,
  Smile,
  Send,
  Zap,
  Tag,
  ChevronRight,
  Filter,
} from "lucide-react";

interface PresetCampaign {
  id: string;
  tag: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  defaultTemplate: string;
}

const PRESET_CAMPAIGNS: PresetCampaign[] = [
  {
    id: "inactive_30",
    tag: "Resgate",
    title: "💖 Saudades de Você (+30 dias sem visita)",
    description:
      "Reative clientes que costumam frequentar o salão mas sumiram há mais de 30 dias.",
    badge: "Alta Conversão",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    defaultTemplate:
      "Oi {nome}! ✨ Sentimos muito a sua falta aqui no {salao}! Que tal tirar um momento relaxante para cuidar de você essa semana? Preparamos um mimo super especial para o seu retorno. Vamos agendar seu horário?",
  },
  {
    id: "tuesday_wednesday",
    tag: "Dias Calmos",
    title: "⚡ Terça & Quarta Glam (Lotar Início da Semana)",
    description:
      "Lote a agenda nos dias que costumam ter menor movimento com uma condição atrativa.",
    badge: "Mais Faturamento",
    badgeColor:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    defaultTemplate:
      "Oi {nome}! ✨ Liberamos uma condição super especial para atendimentos nesta terça e quarta aqui no {salao}! Que tal renovar seu visual com calma e atendimento VIP? Restam pouquíssimos horários, me avise se quiser garantir o seu!",
  },
  {
    id: "birthday_month",
    tag: "Aniversário",
    title: "🎂 Mimo para Aniversariante do Mês",
    description:
      "Celebre o aniversário da cliente e convide-a para comemorar ficando ainda mais radiante.",
    badge: "Fidelização 100%",
    badgeColor:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
    defaultTemplate:
      "Parabéns pelo seu dia, {nome}! 🎂✨ Toda a equipe do {salao} deseja muitas felicidades e um novo ciclo maravilhoso! Preparamos um presente especial para você comemorar ficando ainda mais linda este mês. Vamos agendar seu momento de cuidado?",
  },
  {
    id: "post_service_review",
    tag: "Avaliação",
    title: "⭐ Pós-Atendimento & Avaliação Carinhosa",
    description:
      "Fortaleça a relação após o atendimento e receba avaliações sinceras 5 estrelas.",
    badge: "Reputação",
    badgeColor:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    defaultTemplate:
      "Oi {nome}! 💖 Passando para saber como ficou o resultado do seu atendimento no {salao}! Sua satisfação é tudo para nós. Se puder deixar sua avaliação, deixará nossa equipe radiante!",
  },
];

export default function MarketingPage() {
  const { profile } = useAuth();
  const { clients, coupons, addCoupon, deleteCoupon, updateClient } =
    useSalonData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<
    "return_list" | "campaigns" | "loyalty" | "coupons"
  >("return_list");

  // Filter & Search States
  const [returnSearch, setReturnSearch] = useState("");
  const [loyaltySearch, setLoyaltySearch] = useState("");
  const [loyaltyFilter, setLoyaltyFilter] = useState<"all" | "near" | "completed">("all");

  // Selected Campaign State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("inactive_30");
  const [customMessages, setCustomMessages] = useState<Record<string, string>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loyalty Reward Config
  const [loyaltyReward, setLoyaltyReward] = useState("Hidratação Especial ou 20% OFF");
  const [editingReward, setEditingReward] = useState(false);

  // Coupon Creation Form
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(15);
  const [couponType, setCouponType] = useState<"percent" | "fixed">("percent");
  const [couponValidUntil, setCouponValidUntil] = useState("");

  const salonName = profile?.salon_name || "nosso salão";

  // Helper to format text replacing human variables without confusing user
  const formatMessage = (template: string, clientName?: string) => {
    const firstName = (clientName || "Cliente").trim().split(" ")[0];
    return template
      .replace(/\{nome\}|\{cliente\}|\[Nome da Cliente\]/gi, firstName)
      .replace(/\{salao\}|\[Nome do Salão\]/gi, salonName);
  };

  // One-click WhatsApp opener with personalized message
  const openWhatsApp = (phone: string, clientName: string, template: string) => {
    soundEffects.playClick();
    const cleanPhone = (phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      toast.warning(
        "Esta cliente não possui número de telefone válido cadastrado.",
        "Telefone Não Encontrado"
      );
      return;
    }
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const formattedText = formatMessage(template, clientName);
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(formattedText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  // Copy helper
  const copyText = (text: string, key: string) => {
    soundEffects.playPop();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Clients needing return (> 30 days without visits)
  const returnList = useMemo(() => {
    const today = new Date();
    return clients.filter((c) => {
      if (c.marketingConsent === false) return false;
      if (c.nextReturnDate) {
        const nextDate = new Date(c.nextReturnDate + "T12:00:00");
        if (!isNaN(nextDate.getTime()) && nextDate <= today) return true;
      }
      if (!c.lastVisit || c.lastVisit === "Nunca") return false;
      const last = new Date(
        c.lastVisit.includes("/")
          ? c.lastVisit.split("/").reverse().join("-") + "T12:00:00"
          : c.lastVisit + "T12:00:00"
      );
      if (isNaN(last.getTime())) return false;
      const diffDays = Math.floor(
        (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
      );
      return diffDays >= 30;
    });
  }, [clients]);

  // Birthday clients this month
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthName = new Date().toLocaleDateString("pt-BR", {
    month: "long",
  });
  const birthdayClients = useMemo(() => {
    return clients.filter((c) => {
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
  }, [clients, currentMonth]);

  // Filtered return list by search
  const filteredReturnList = useMemo(() => {
    if (!returnSearch.trim()) return returnList;
    const q = returnSearch.toLowerCase();
    return returnList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [returnList, returnSearch]);

  // Loyalty calculations
  const loyaltyClients = useMemo(() => {
    return clients
      .map((c) => {
        const visits = c.visits || 0;
        const stamps = visits % 10;
        const isCompleted = visits > 0 && stamps === 0;
        const currentStamps = isCompleted ? 10 : stamps;
        return {
          ...c,
          currentStamps,
          isCompleted,
        };
      })
      .filter((c) => {
        if (loyaltyFilter === "near") return c.currentStamps >= 7 && !c.isCompleted;
        if (loyaltyFilter === "completed") return c.isCompleted;
        return true;
      })
      .filter((c) => {
        if (!loyaltySearch.trim()) return true;
        const q = loyaltySearch.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
        );
      });
  }, [clients, loyaltyFilter, loyaltySearch]);

  // Active Preset Campaign Object
  const currentCampaign = useMemo(() => {
    return (
      PRESET_CAMPAIGNS.find((c) => c.id === selectedCampaignId) ||
      PRESET_CAMPAIGNS[0]
    );
  }, [selectedCampaignId]);

  const activeMessage =
    customMessages[currentCampaign.id] !== undefined
      ? customMessages[currentCampaign.id]
      : currentCampaign.defaultTemplate;

  // Add stamp handler
  const handleAddStamp = async (client: Client) => {
    soundEffects.playSparkle();
    const currentVisits = client.visits || 0;
    const newVisits = currentVisits + 1;
    const newPoints = (client.loyaltyPoints || 0) + 10;
    await updateClient(client.id, {
      visits: newVisits,
      loyaltyPoints: newPoints,
      lastVisit: new Date().toISOString().split("T")[0],
    });
    if (newVisits % 10 === 0) {
      soundEffects.playSuccess();
    }
  };

  // Remove stamp handler (undo)
  const handleRemoveStamp = async (client: Client) => {
    soundEffects.playPop();
    const currentVisits = client.visits || 0;
    if (currentVisits <= 0) return;
    const newVisits = currentVisits - 1;
    const newPoints = Math.max(0, (client.loyaltyPoints || 0) - 10);
    await updateClient(client.id, {
      visits: newVisits,
      loyaltyPoints: newPoints,
    });
  };

  // Coupon Creation
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    soundEffects.playSuccess();
    await addCoupon({
      code: couponCode.toUpperCase().replace(/\s+/g, ""),
      discountType: couponType,
      discountValue: Number(couponDiscount),
      validUntil:
        couponValidUntil ||
        new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      active: true,
    });
    setCouponCode("");
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Marketing, Fidelidade & Retorno" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* HERO INTRO BAR */}
        <div className="bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 border border-rose-200/60 dark:border-rose-900/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                Central de Encantamento & Retorno de Clientes
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Mensagens prontas e calorosas para você resgatar clientes ausentes, parabenizar aniversariantes e preencher a agenda sem complicação técnica.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
              <span className="block text-xs font-black text-rose-600 dark:text-rose-400">
                {returnList.length}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium">
                P/ Retornar
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
              <span className="block text-xs font-black text-purple-600 dark:text-purple-400">
                {birthdayClients.length}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium">
                Niver {currentMonthName.slice(0, 3)}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-center">
              <span className="block text-xs font-black text-emerald-600 dark:text-emerald-400">
                {coupons.filter((c) => c.active).length}
              </span>
              <span className="text-[10px] text-[var(--muted)] font-medium">
                Cupons Ativos
              </span>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex overflow-x-auto bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] w-full md:w-fit gap-1 no-scrollbar shadow-xs">
          {[
            {
              id: "return_list",
              label: "💖 Resgate & Aniversários",
              badge: returnList.length + birthdayClients.length,
            },
            {
              id: "campaigns",
              label: "⚡ Campanhas Prontas (1-Clique)",
              badge: "Novo",
            },
            {
              id: "loyalty",
              label: "⭐ Cartão Fidelidade (10 Selos)",
              badge: clients.length,
            },
            {
              id: "coupons",
              label: "🎟️ Cupons de Desconto",
              badge: coupons.length,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                soundEffects.playClick();
                setActiveTab(t.id as typeof activeTab);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span>{t.label}</span>
              {t.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === t.id
                      ? "bg-white/25 text-white"
                      : "bg-[var(--card-border)] text-[var(--muted)]"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: RESGATE & ANIVERSÁRIOS                            */}
        {/* ======================================================== */}
        {activeTab === "return_list" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: CLIENTES PARA RESGATE */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] flex items-center gap-2">
                    <Clock size={18} className="text-rose-500" />
                    Clientes que Precisam Retornar (+30 dias)
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Clientes sem visita há mais de um mês. Uma mensagem carinhosa reativa até 60% delas.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                  {returnList.length} ausentes
                </span>
              </div>

              {/* Search in return list */}
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  type="text"
                  value={returnSearch}
                  onChange={(e) => setReturnSearch(e.target.value)}
                  placeholder="Buscar cliente ausente..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--card-border)] bg-[var(--background)] outline-none focus:border-rose-500"
                />
              </div>

              {filteredReturnList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--muted)]">
                  <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Nenhuma cliente ausente no momento!
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Todas as suas clientes ativas estão em dia com as visitas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filteredReturnList.map((client) => {
                    const templateMsg =
                      "Oi {nome}! ✨ Sentimos muito a sua falta aqui no {salao}! Que tal tirar um momento relaxante para cuidar de você essa semana? Reservamos um mimo especial para o seu retorno. Vamos marcar seu horário?";
                    return (
                      <div
                        key={client.id}
                        className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] hover:border-rose-200 dark:hover:border-rose-900/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                              {client.name}
                            </p>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              +30 dias
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            Última visita: {client.lastVisit || "Não registrada"} •{" "}
                            {client.phone || "Sem telefone"}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openWhatsApp(client.phone, client.name, templateMsg)
                          }
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer"
                        >
                          <MessageCircle size={14} />
                          Chamar no WhatsApp
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CARD 2: ANIVERSARIANTES DO MÊS */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] flex items-center gap-2">
                    <Gift size={18} className="text-purple-500" />
                    Aniversariantes de {currentMonthName}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Surpreenda com um mimo no mês de aniversário e garanta um agendamento comemorativo.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                  {birthdayClients.length} neste mês
                </span>
              </div>

              {birthdayClients.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--muted)]">
                  <Gift size={32} className="text-purple-400 mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Nenhuma aniversariante cadastrada para {currentMonthName}.
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Preencha a data de nascimento no cadastro das clientes para receber alertas aqui.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {birthdayClients.map((client) => {
                    const templateMsg =
                      "Parabéns pelo seu dia, {nome}! 🎂✨ Toda a equipe do {salao} deseja muitas felicidades! Preparamos um presente especial para você comemorar ficando ainda mais linda este mês. Vamos agendar seu horário?";
                    return (
                      <div
                        key={client.id}
                        className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] hover:border-purple-200 dark:hover:border-purple-900/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base">🎂</span>
                            <p className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                              {client.name}
                            </p>
                          </div>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            Data: {client.birthDate} • {client.phone || "Sem telefone"}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            openWhatsApp(client.phone, client.name, templateMsg)
                          }
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition-all cursor-pointer"
                        >
                          <Gift size={14} />
                          Enviar Mimo no WhatsApp
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CAMPANHAS PRONTAS (1-CLIQUE)                       */}
        {/* ======================================================== */}
        {activeTab === "campaigns" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: PRESET SELECTOR CARDS */}
            <div className="lg:col-span-5 space-y-3">
              <div className="mb-2">
                <h3 className="font-bold text-sm text-[var(--foreground)]">
                  Escolha uma Campanha Pronta
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Textos já testados e comprovados para aumentar o movimento no salão:
                </p>
              </div>

              {PRESET_CAMPAIGNS.map((camp) => {
                const isSelected = selectedCampaignId === camp.id;
                return (
                  <button
                    key={camp.id}
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedCampaignId(camp.id);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-rose-50/70 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 shadow-sm ring-1 ring-rose-400/30"
                        : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-rose-200 dark:hover:border-rose-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        {camp.tag}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${camp.badgeColor}`}
                      >
                        {camp.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[var(--foreground)] mb-1">
                      {camp.title}
                    </h4>
                    <p className="text-xs text-[var(--muted)] line-clamp-2">
                      {camp.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: INTERACTIVE PREVIEW & DISPATCH */}
            <div className="lg:col-span-7 bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs flex flex-col justify-between space-y-5">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      Campanha Selecionada
                    </span>
                    <h3 className="font-bold text-base text-[var(--foreground)]">
                      {currentCampaign.title}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentCampaign.badgeColor}`}
                  >
                    {currentCampaign.badge}
                  </span>
                </div>

                {/* WHATSAPP REALISTIC LIVE PREVIEW */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase text-[var(--muted)] flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-emerald-500" />
                      Como a sua cliente recebe no WhatsApp
                    </label>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Prévia Real
                    </span>
                  </div>

                  {/* WhatsApp Balloon */}
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 relative">
                    <div className="bg-[#DCF8C6] dark:bg-[#054740] text-gray-900 dark:text-emerald-50 p-3.5 rounded-2xl rounded-tl-none max-w-[92%] shadow-sm text-xs sm:text-sm leading-relaxed">
                      {formatMessage(activeMessage, clients[0]?.name || "Cliente")}
                      <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-gray-500 dark:text-emerald-200/70">
                        <span>14:35</span>
                        <Check size={12} className="text-blue-500" />
                      </div>
                    </div>
                  </div>

                  {/* Transparency Helper Note (No {nome} confusion!) */}
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-200 flex items-start gap-2">
                    <Sparkles size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>100% Automático e Sem Código:</strong> O Bella substitui
                      o nome da cliente e do seu salão sozinho na hora do envio.
                      Sua cliente sempre recebe personalizada com o nome real dela no WhatsApp.
                    </div>
                  </div>
                </div>

                {/* TEXT EDITOR WITH CLICKABLE INSERT CHIPS */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase text-[var(--muted)]">
                      Deseja ajustar as palavras? (Opcional)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = `${activeMessage} {nome}`;
                          setCustomMessages({
                            ...customMessages,
                            [currentCampaign.id]: updated,
                          });
                        }}
                        className="px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--card-border)] hover:border-rose-400 text-[10px] font-bold text-[var(--foreground)] transition-all cursor-pointer"
                        title="Adiciona o nome da cliente automaticamente"
                      >
                        + Nome da Cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = `${activeMessage} {salao}`;
                          setCustomMessages({
                            ...customMessages,
                            [currentCampaign.id]: updated,
                          });
                        }}
                        className="px-2 py-0.5 rounded-md bg-[var(--background)] border border-[var(--card-border)] hover:border-rose-400 text-[10px] font-bold text-[var(--foreground)] transition-all cursor-pointer"
                        title="Adiciona o nome do seu salão automaticamente"
                      >
                        + Nome do Salão
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={activeMessage}
                    onChange={(e) =>
                      setCustomMessages({
                        ...customMessages,
                        [currentCampaign.id]: e.target.value,
                      })
                    }
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] outline-none focus:border-rose-500 transition-all"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 border-t border-[var(--card-border)] flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => copyText(formatMessage(activeMessage), currentCampaign.id)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--card-border)] hover:border-rose-300 bg-[var(--background)] text-xs font-bold text-[var(--foreground)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedKey === currentCampaign.id ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      Copiar Mensagem
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstTarget =
                      selectedCampaignId === "inactive_30"
                        ? returnList[0]
                        : selectedCampaignId === "birthday_month"
                        ? birthdayClients[0]
                        : clients[0];

                    if (firstTarget) {
                      openWhatsApp(firstTarget.phone, firstTarget.name, activeMessage);
                    } else {
                      toast.info(
                        "Nenhuma cliente elegível encontrada para esta ação no momento.",
                        "Sem Destinatários"
                      );
                    }
                  }}
                  className="w-full sm:flex-1 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <MessageCircle size={16} />
                  Enviar Pelo WhatsApp para Clientes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CARTÃO FIDELIDADE (10 SELOS)                       */}
        {/* ======================================================== */}
        {activeTab === "loyalty" && (
          <div className="space-y-6">
            {/* REWARD BANNER & CONFIG */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] flex items-center gap-2">
                    Regra de Fidelidade do Salão (10 Visitas = 1 Prêmio)
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    A cada atendimento, marque 1 selo. Ao completar 10 selos, a cliente desbloqueia o mimo abaixo:
                  </p>
                </div>
              </div>

              {/* Editable Reward */}
              <div className="flex items-center gap-2">
                {editingReward ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={loyaltyReward}
                      onChange={(e) => setLoyaltyReward(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-rose-300 bg-[var(--background)] outline-none"
                    />
                    <button
                      onClick={() => setEditingReward(false)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs font-bold">
                      🎁 Prêmio: {loyaltyReward}
                    </div>
                    <button
                      onClick={() => setEditingReward(true)}
                      className="text-xs text-[var(--muted)] hover:text-rose-500 font-semibold underline cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />
                <input
                  type="text"
                  value={loyaltySearch}
                  onChange={(e) => setLoyaltySearch(e.target.value)}
                  placeholder="Buscar cliente no fidelidade..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: "all", label: `Todas (${clients.length})` },
                  { id: "near", label: "Perto de Ganhar (7+ selos)" },
                  { id: "completed", label: "Prêmio Liberado (10 selos)" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLoyaltyFilter(f.id as typeof loyaltyFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      loyaltyFilter === f.id
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-[var(--card-bg)] text-[var(--muted)] border border-[var(--card-border)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CLIENT LOYALTY CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loyaltyClients.map((client) => {
                const isWinner = client.isCompleted;
                const stamps = client.currentStamps;

                return (
                  <div
                    key={client.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isWinner
                        ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-sm"
                        : "bg-[var(--card-bg)] border-[var(--card-border)]"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--foreground)]">
                          {client.name}
                        </h4>
                        <p className="text-[11px] text-[var(--muted)]">
                          {client.visits || 0} visitas registradas
                        </p>
                      </div>

                      {isWinner ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                          🏆 Prêmio Liberado!
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          {stamps} / 10 selos
                        </span>
                      )}
                    </div>

                    {/* 10 STAMPS VISUAL REPRESENTATION */}
                    <div className="grid grid-cols-5 gap-1.5 py-3 px-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] mb-3.5">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const hasStamp = i < stamps;
                        return (
                          <div
                            key={i}
                            className={`h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                              hasStamp
                                ? isWinner
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-rose-500 text-white shadow-xs"
                                : "bg-[var(--card-bg)] text-[var(--muted)]/40 border border-dashed border-[var(--card-border)]"
                            }`}
                          >
                            {hasStamp ? "★" : i + 1}
                          </div>
                        );
                      })}
                    </div>

                    {/* Helper Subtitle */}
                    <p className="text-[11px] text-[var(--muted)] text-center mb-3.5">
                      {isWinner
                        ? `🎉 Ganhou: ${loyaltyReward}`
                        : `Faltam ${10 - stamps} visitas para ganhar o prêmio`}
                    </p>

                    {/* Actions: +1 Stamp, -1 Stamp, Notify WhatsApp */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddStamp(client)}
                        className="flex-1 py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Adicionar 1 selo de visita para a cliente"
                      >
                        <Plus size={14} />
                        +1 Selo
                      </button>

                      <button
                        onClick={() => handleRemoveStamp(client)}
                        className="p-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--background)] text-[var(--muted)] hover:text-rose-500 text-xs transition-all cursor-pointer"
                        title="Desfazer 1 selo"
                      >
                        -1
                      </button>

                      <button
                        onClick={() => {
                          const message = isWinner
                            ? `Parabéns, {nome}! 🏆✨ Você completou os 10 selos do seu Cartão Fidelidade no {salao}! Seu prêmio especial (${loyaltyReward}) já está liberado para retirar no seu próximo agendamento. Vamos marcar? 💖`
                            : `Oi {nome}! 🎉 Você acabou de ganhar +1 selo no seu Cartão Fidelidade do {salao}! Você já tem ${stamps} de 10 selos (faltam só ${10 - stamps} para o prêmio!). Muito obrigada pela preferência! ✨`;
                          openWhatsApp(client.phone, client.name, message);
                        }}
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer"
                        title="Avisar a cliente no WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CUPONS DE DESCONTO                                 */}
        {/* ======================================================== */}
        {activeTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CREATE COUPON FORM */}
            <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] mb-1 flex items-center gap-2">
                <Ticket size={18} className="text-rose-500" />
                Criar Novo Cupom
              </h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                Crie cupons fáceis para divulgar nos stories do Instagram ou enviar pelo WhatsApp.
              </p>

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Código do Cupom *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: GLOW15, NIVER20, BEMVINDA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm font-bold uppercase tracking-wider outline-none focus:border-rose-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Tipo
                    </label>
                    <select
                      value={couponType}
                      onChange={(e) =>
                        setCouponType(e.target.value as "percent" | "fixed")
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs font-bold outline-none"
                    >
                      <option value="percent">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      {couponType === "fixed" ? "Desconto (R$)" : "Desconto (%)"}
                    </label>
                    {couponType === "fixed" ? (
                      <CurrencyInput
                        value={couponDiscount}
                        onChangeValue={setCouponDiscount}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm font-bold outline-none"
                      />
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={couponDiscount}
                        onChange={(e) => setCouponDiscount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm font-bold outline-none"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Válido Até (Opcional)
                  </label>
                  <input
                    type="date"
                    value={couponValidUntil}
                    onChange={(e) => setCouponValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  Criar Cupom de Desconto
                </button>
              </form>
            </div>

            {/* ACTIVE COUPONS LIST */}
            <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
              <h3 className="font-bold text-sm sm:text-base text-[var(--foreground)] mb-1">
                Cupons Ativos no Salão
              </h3>
              <p className="text-xs text-[var(--muted)] mb-4">
                Copie o código para colocar nos stories ou compartilhe no WhatsApp das clientes.
              </p>

              {coupons.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--muted)]">
                  <Ticket size={32} className="text-rose-400 mb-2 opacity-50" />
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Nenhum cupom ativo no momento.
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Crie seu primeiro cupom ao lado para atrair novos agendamentos!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coupons.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-rose-500/5 to-purple-500/5 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono tracking-wider">
                            {c.code}
                          </span>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                            title="Excluir cupom"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs font-bold text-[var(--foreground)] mt-0.5">
                          {c.discountType === "fixed"
                            ? `R$ ${c.discountValue.toFixed(2)} OFF`
                            : `${c.discountValue}% de desconto`}
                        </p>
                        <p className="text-[11px] text-[var(--muted)] flex items-center gap-1 mt-1">
                          <Calendar size={11} /> Válido até {c.validUntil || "Sem prazo"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--card-border)]">
                        <button
                          type="button"
                          onClick={() => copyText(c.code, c.id)}
                          className="flex-1 py-1.5 px-2.5 rounded-lg border border-[var(--card-border)] hover:border-rose-300 bg-[var(--background)] text-[11px] font-bold text-[var(--foreground)] flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedKey === c.id ? (
                            <>
                              <Check size={12} className="text-emerald-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              Copiar
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const discountStr =
                              c.discountType === "fixed"
                                ? `R$ ${c.discountValue.toFixed(2)} OFF`
                                : `${c.discountValue}% OFF`;
                            const message = `Oi {nome}! ✨ Preparamos um presente especial para você cuidar de você no ${salonName}: use o cupom *${c.code}* e ganhe *${discountStr}* no seu próximo agendamento! Vamos marcar? 💖`;
                            const firstClient = clients[0];
                            if (firstClient) {
                              openWhatsApp(firstClient.phone, firstClient.name, message);
                            } else {
                              copyText(message, c.id);
                              toast.success("Mensagem do cupom copiada com sucesso!", "Copiado");
                            }
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <MessageCircle size={12} />
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
