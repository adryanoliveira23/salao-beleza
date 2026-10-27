"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  RefreshCw,
  Send,
  Zap,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  Mic,
  Paperclip,
  Image,
  Smile,
  ExternalLink,
  MoreVertical,
  Star,
  Phone,
  CheckCheck,
  Check,
  User,
  Scissors,
  Gift,
  HeartHandshake,
  ArrowUpRight,
  Sparkles,
  Settings,
  QrCode,
  Smartphone,
  LogOut,
  Bot,
  BellRing,
  UserCheck,
  TrendingUp,
  SlidersHorizontal,
  Forward,
  X,
  ArrowLeft,
  PanelLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData, Appointment } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";
import { formatBRL } from "@/lib/formatters";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AutomationRule {
  id: "confirm_24h" | "reminder_2h" | "instant_booking" | "post_review";
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: "rose" | "emerald" | "amber" | "purple";
  scheduleInfo: string;
  enabled: boolean;
  template: string;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "salon" | "client";
  time: string;
  read?: boolean;
}

interface ConversationPreview {
  id: string;
  clientName: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  status: "pending" | "confirmed" | "resolved" | "awaiting";
  statusLabel: string;
  isOnline?: boolean;
  isVip?: boolean;
  subtitle?: string;
  clientPhone?: string;
  price?: number;
  date?: string;
  timeValue?: string;
  professionalName?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "instant_booking",
    title: "Confirmação Imediata de Agendamento",
    subtitle: "Disparada no exato segundo em que a cliente agenda pelo link online",
    badge: "Instantâneo",
    badgeColor: "emerald",
    scheduleInfo: "Automático no agendamento",
    enabled: true,
    template:
      "Olá [Nome da Cliente]! Seu agendamento foi realizado com sucesso!\n\nProcedimento: [Procedimento]\nData: [Data] às [Horário]\nEspecialista: [Profissional]\nSalão: [Nome do Salão]\n\nEstamos ansiosas para cuidar de você!",
  },
  {
    id: "confirm_24h",
    title: "Lembrete de Véspera (24 Horas Antes)",
    subtitle: "Pede confirmação ativa da cliente e reconhece a resposta SIM ou 1",
    badge: "Evita 80% das faltas",
    badgeColor: "rose",
    scheduleInfo: "Disparo automático às 08:00 na véspera",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! Passando para confirmar seu horário amanhã ([Data]) às [Horário] para [Procedimento] no [Nome do Salão].\n\nPodemos confirmar sua presença?\nResponda SIM para confirmar ou NÃO para reagendar.",
  },
  {
    id: "reminder_2h",
    title: "Lembrete 2 Horas Antes",
    subtitle: "Avisa que a equipe está pronta e mantém a agenda pontual",
    badge: "Pontualidade",
    badgeColor: "amber",
    scheduleInfo: "Disparo 2h antes de cada horário",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! Sua bancada está pronta te esperando!\n\nLembrando que seu horário de [Procedimento] é hoje às [Horário]. Até logo no [Nome do Salão]!",
  },
  {
    id: "post_review",
    title: "Agradecimento & Avaliação 5 Estrelas",
    subtitle: "Disparada após o atendimento para atrair novas clientes pelo Google",
    badge: "Fidelização & Google",
    badgeColor: "purple",
    scheduleInfo: "Disparo 30 minutos pós-serviço",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! Foi um prazer cuidar de você hoje no [Nome do Salão]!\n\nSe você amou seu novo visual, deixe 5 estrelas no Google? Seu carinho apoia muito nossa equipe: [Link do Google]",
  },
];

const QUICK_REPLIES = [
  "Horários disponíveis amanhã",
  "Localização e estacionamento",
  "Chave Pix / Pagamentos",
  "Cuidados pós-química",
  "Tabela de Preços",
  "Política de cancelamento",
];

// ─── Component ─────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { isDesktopOpen, openDesktop } = useSidebar();
  const { appointments, updateAppointment } = useSalonData();
  const toast = useToast();

  // ── Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "");
  const [pixKey, setPixKey] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);

  // ── UI state
  const [activeTab, setActiveTab] = useState<"chat" | "automation" | "connection">("chat");
  const [chatFilter, setChatFilter] = useState<"all" | "unread" | "awaiting" | "resolved">("all");
  const [chatSearch, setChatSearch] = useState("");
  const [activeConvId, setActiveConvId] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat" | "profile">("list");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const salonName = useMemo(() => {
    const s = profile?.salon_name?.trim();
    if (s && s.toLowerCase() !== "studio glow") return s;
    return profile?.name?.trim() || "Nosso Salão";
  }, [profile]);

  // ── Dates
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // ── Real data
  const todayApts = useMemo(
    () => (appointments || []).filter((a) => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, todayStr],
  );
  const tomorrowApts = useMemo(
    () => (appointments || []).filter((a) => a.date === tomorrowStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, tomorrowStr],
  );
  const pendingTomorrow = useMemo(() => tomorrowApts.filter((a) => a.status === "pending").length, [tomorrowApts]);
  const confirmedToday = useMemo(() => todayApts.filter((a) => a.status === "confirmed").length, [todayApts]);
  const savedRevenue = useMemo(
    () => (appointments || []).filter((a) => a.status === "confirmed").reduce((acc, a) => acc + (a.price || 95), 0),
    [appointments],
  );

  // ── Conversations built strictly from real salon appointments
  const conversations = useMemo<ConversationPreview[]>(() => {
    const convs: ConversationPreview[] = [];
    const used = new Set<string>();
    const all = [...todayApts, ...tomorrowApts];

    all.forEach((apt, i) => {
      const key = apt.clientPhone || apt.clientName;
      if (!key || used.has(key)) return;
      used.add(key);
      const parts = (apt.clientName || "Cliente").trim().split(" ");
      const initials = ((parts[0]?.[0] || "") + (parts[1]?.[0] || parts[0]?.[1] || "")).toUpperCase();
      const isPending = apt.status === "pending";
      const isConfirmed = apt.status === "confirmed";
      const timeLabel = apt.date === todayStr ? apt.time : "Amanhã";
      convs.push({
        id: apt.id || `conv-${i}`,
        clientName: apt.clientName || "Cliente",
        initials: initials || "CL",
        lastMessage: isPending
          ? `Gostaria de confirmar meu horário de ${apt.serviceName}`
          : isConfirmed
            ? `Confirmado! Estarei aí às ${apt.time}.`
            : `Agendamento de ${apt.serviceName}`,
        time: timeLabel,
        unread: isPending ? 1 : 0,
        status: isPending ? "pending" : isConfirmed ? "confirmed" : "awaiting",
        statusLabel: isPending
          ? "Pendente de confirmação"
          : isConfirmed
            ? "Agendamento Confirmado"
            : "Aguardando resposta",
        isOnline: isConfirmed,
        isVip: (apt.price || 0) >= 120,
        subtitle: apt.serviceName,
        clientPhone: apt.clientPhone,
        price: apt.price,
        date: apt.date,
        timeValue: apt.time,
        professionalName: apt.professionalName,
      });
    });

    return convs;
  }, [todayApts, tomorrowApts, todayStr]);

  const activeConv = useMemo(
    () => (activeConvId ? conversations.find((c) => c.id === activeConvId) : null) || conversations[0] || null,
    [conversations, activeConvId],
  );

  // ── Chat messages per conversation (iniciadas vazias, alimentadas por conversas reais)
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});

  const activeMessages = useMemo(() => {
    if (!activeConv) return [];
    if (chatMessages[activeConv.id]) return chatMessages[activeConv.id];
    // Mensagem contextual inicial gerada dinamicamente a partir do agendamento real
    return [
      {
        id: `init-${activeConv.id}`,
        text: activeConv.status === "pending"
          ? `Olá, gostaria de confirmar meu agendamento de ${activeConv.subtitle} para ${activeConv.time === "Amanhã" ? "amanhã" : `hoje às ${activeConv.timeValue || activeConv.time}`}.`
          : `Olá! Confirmado meu agendamento de ${activeConv.subtitle}${activeConv.timeValue ? ` às ${activeConv.timeValue}` : ""}.`,
        sender: "client" as const,
        time: activeConv.timeValue || activeConv.time || "Hoje",
      },
    ];
  }, [chatMessages, activeConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // ── Send message
  const handleSend = () => {
    if (!messageInput.trim() || !activeConv) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: messageInput.trim(),
      sender: "salon",
      time: timeStr,
      read: true,
    };
    setChatMessages((prev) => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), newMsg],
    }));
    setMessageInput("");
    soundEffects.playClick();
  };

  // ── Load saved settings
  useEffect(() => {
    if (!user) return;
    try {
      const local = localStorage.getItem(`bellamais_wa_${user.uid}`);
      if (local) {
        const d = JSON.parse(local);
        if (d.rules) setRules(d.rules);
        if (d.pixKey) setPixKey(d.pixKey);
        if (d.googleReviewLink) setGoogleReviewLink(d.googleReviewLink);
      }
    } catch {}
  }, [user]);

  const saveSettings = (updates: Record<string, any>) => {
    if (!user) return;
    try {
      const prev = JSON.parse(localStorage.getItem(`bellamais_wa_${user.uid}`) || "{}");
      localStorage.setItem(`bellamais_wa_${user.uid}`, JSON.stringify({ ...prev, ...updates }));
      setDoc(doc(db, "whatsapp_config", user.uid), updates, { merge: true }).catch(() => {});
    } catch {}
  };

  // ── Check connection status
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch("/api/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setIsConnected(Boolean(data.connected));
            setConnectedPhone(data.phoneNumber || "");
          }
        }
      } catch {}
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── QR Code
  const fetchQrCode = async () => {
    setIsLoadingQr(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", provider: "baileys", phoneNumber: salonPhone }),
      });
      const data = await res.json();
      if (data.qrCodeBase64) setQrCodeDataUrl(data.qrCodeBase64);
    } catch {} finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    if (activeTab === "connection" && !isConnected && !qrCodeDataUrl) fetchQrCode();
  }, [activeTab, isConnected]);

  const handleVerify = async () => {
    setIsVerifyingConnection(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        setConnectedPhone(data.phoneNumber || salonPhone || "WhatsApp Ativo");
        toast.success("WhatsApp conectado! O robô está ativo.", "Conectado");
      } else {
        toast.warning(data.message || "Aponte a câmera para o QR Code.", "Aguardando");
      }
    } finally {
      setIsVerifyingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    setConnectedPhone("");
    setQrCodeDataUrl(null);
    toast.info("WhatsApp desconectado.", "Desconectado");
    try {
      await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    } catch {}
  };

  // ── Run automation
  const handleRunAutomation = async () => {
    setIsProcessing(true);
    soundEffects.playClick();
    try {
      const res = await fetch("/api/whatsapp/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointments: (appointments || []).map((a) => ({
            id: a.id, clientName: a.clientName, clientPhone: a.clientPhone,
            serviceName: a.serviceName, date: a.date, time: a.time,
            price: a.price, status: a.status, professionalName: a.professionalName,
          })),
          salonName, salonPhone, pixKey,
          rulesConfig: {
            confirm24h: rules.find((r) => r.id === "confirm_24h")?.enabled,
            reminder2h: rules.find((r) => r.id === "reminder_2h")?.enabled,
            postCare: rules.find((r) => r.id === "post_review")?.enabled,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message || "Mensagens disparadas com sucesso!", "Automação Executada");
      } else {
        toast.warning(data.message || "Conecte o WhatsApp primeiro.", "WhatsApp Não Conectado");
      }
    } catch {
      toast.error("Erro ao acionar o robô.", "Falha no Envio");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Badge color helper
  const badgeColorMap: Record<string, string> = {
    rose: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40",
    amber: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40",
    purple: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40",
  };

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (chatSearch) {
      list = list.filter((c) => c.clientName.toLowerCase().includes(chatSearch.toLowerCase()));
    }
    if (chatFilter === "unread") list = list.filter((c) => c.unread > 0);
    if (chatFilter === "awaiting") list = list.filter((c) => c.status === "awaiting" || c.status === "pending");
    if (chatFilter === "resolved") list = list.filter((c) => c.status === "resolved");
    return list;
  }, [conversations, chatSearch, chatFilter]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F5] dark:bg-[#151419] text-[#221A1D] dark:text-[#F4EEF1] transition-colors duration-200 font-sans">
      <Header title="WhatsApp Salão" />

      {/* ─── HEADER SUPERIOR ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1C1A22] border-b border-[#EDE6E1] dark:border-white/[0.08] px-3.5 sm:px-6 md:px-8 py-3.5 sm:py-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-3">

          {/* Título + Status + Ações */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                {!isDesktopOpen && (
                  <button
                    type="button"
                    onClick={openDesktop}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#25222E] border border-[#EDE6E1] dark:border-white/[0.12] hover:bg-[#7E1639] hover:text-white hover:border-[#7E1639] dark:hover:bg-[#7E1639] dark:hover:text-white text-[#7E1639] dark:text-[#E27D9A] text-xs font-semibold shadow-xs transition-all cursor-pointer group shrink-0"
                    title="Abrir menu lateral"
                    aria-label="Abrir menu lateral"
                  >
                    <PanelLeft size={16} className="group-hover:scale-105 transition-transform" />
                    <span>Menu</span>
                  </button>
                )}
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#221A1D] dark:text-[#F4EEF1]">
                  Central de Atendimento WhatsApp
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isConnected
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-[#15803D] dark:text-[#34D399] border-emerald-200/60 dark:border-emerald-800/40"
                    : "bg-[#FEF6EE] dark:bg-amber-950/30 text-[#B45309] dark:text-[#FBBF24] border-amber-200/60 dark:border-amber-800/40"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#15803D] dark:bg-[#34D399] animate-pulse" : "bg-[#B45309] dark:bg-[#FBBF24]"}`} />
                  {isConnected ? `Conectado${connectedPhone ? ` · ${connectedPhone}` : ""}` : "Desconectado"}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("connection")}
                  className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-stone-500 hover:text-[#7E1639] flex items-center justify-center transition-colors cursor-pointer"
                  title="Configurar conexão"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-[#A0949C] mt-0.5">
                Converse, organize pendências e converta mensagens em agendamentos sem sair daqui.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="h-9 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>Respostas Rápidas</span>
              </button>
              <button
                type="button"
                onClick={handleRunAutomation}
                disabled={isProcessing}
                className="h-9 px-4 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Zap size={14} className={isProcessing ? "animate-spin" : ""} />
                <span>
                  {isProcessing ? "Processando..." : `Enviar Lembretes${pendingTomorrow > 0 ? ` (${pendingTomorrow} clientes)` : ""}`}
                </span>
              </button>
            </div>
          </div>

          {/* Pílulas de Resumo Operacional */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FBF0F4] dark:bg-white/[0.04] border border-[#EDE6E1] dark:border-white/[0.08] text-xs">
                <MessageCircle size={13} className="text-[#7E1639] dark:text-[#E27D9A]" />
                <span className="text-stone-600 dark:text-[#A0949C] font-medium">Não lidas:</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#7E1639] dark:bg-[#E27D9A] text-white dark:text-[#151419] text-[10px] font-bold">
                  {conversations.filter((c) => c.unread > 0).length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF6EE] dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs">
                <Clock size={13} className="text-[#B45309] dark:text-[#FBBF24]" />
                <span className="text-stone-600 dark:text-[#A0949C] font-medium">Agendamentos solicitados:</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#B45309] dark:bg-[#FBBF24] text-white dark:text-[#151419] text-[10px] font-bold">
                  {conversations.filter((c) => c.status === "pending").length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-white/[0.04] border border-stone-200/70 dark:border-white/[0.08] text-xs">
                <AlertCircle size={13} className="text-stone-500" />
                <span className="text-stone-600 dark:text-[#A0949C] font-medium">Pendentes:</span>
                <span className="px-1.5 py-0.5 rounded-full bg-stone-400 text-white text-[10px] font-bold">
                  {conversations.filter((c) => c.status === "awaiting").length}
                </span>
              </div>
            </div>

            {/* Abas no lado direito dos pills */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-100 dark:bg-white/[0.06]">
              {(["chat", "automation", "connection"] as const).map((tab) => {
                const labels = { chat: "Conversas", automation: "Automação", connection: "Conexão" };
                const icons = { chat: MessageCircle, automation: Bot, connection: Smartphone };
                const Icon = icons[tab];
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab
                        ? "bg-[#7E1639] text-white shadow-xs"
                        : "text-stone-600 dark:text-[#A0949C] hover:text-[#221A1D] dark:hover:text-[#F4EEF1]"
                    }`}
                  >
                    <Icon size={13} />
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONTEÚDO PRINCIPAL ───────────────────────────────────────────── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-4">

        {/* ═══ ABA: CHAT ══════════════════════════════════════════════════════ */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100dvh-185px)] sm:h-[calc(100vh-220px)] min-h-[520px]">

            {/* ── COLUNA ESQUERDA: Lista de Conversas ─────────────────────── */}
            <aside className={`${mobileView === "list" ? "flex" : "hidden"} lg:flex lg:col-span-3 bg-white dark:bg-[#1C1A22] rounded-2xl border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-col overflow-hidden`}>

              {/* Search */}
              <div className="p-3 border-b border-stone-100 dark:border-white/[0.06]">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente, serviço..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-xs text-[#221A1D] dark:text-[#F4EEF1] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7E1639] transition-all"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5">
                  {(["all", "unread", "awaiting", "resolved"] as const).map((f) => {
                    const labels = { all: "Todas", unread: "Não lidas", awaiting: "Aguardando", resolved: "Resolvidas" };
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setChatFilter(f)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                          chatFilter === f
                            ? "bg-[#7E1639] text-white"
                            : "bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-[#A0949C] hover:bg-stone-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {labels[f]}
                        {f === "unread" && conversations.filter((c) => c.unread > 0).length > 0 && (
                          <span className="ml-1 inline-flex w-4 h-4 rounded-full bg-[#7E1639] dark:bg-[#E27D9A] text-white dark:text-[#151419] text-[9px] items-center justify-center font-bold">
                            {conversations.filter((c) => c.unread > 0).length}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="py-10 text-center text-xs text-stone-400">
                    Nenhuma conversa encontrada.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isActive = conv.id === activeConv?.id;
                    const statusColors: Record<string, string> = {
                      pending: "text-[#7E1639] dark:text-[#E27D9A] bg-[#FBF0F4] dark:bg-white/[0.04]",
                      confirmed: "text-[#15803D] dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/20",
                      resolved: "text-stone-500 bg-stone-100 dark:bg-white/[0.06]",
                      awaiting: "text-[#B45309] dark:text-[#FBBF24] bg-[#FEF6EE] dark:bg-amber-950/20",
                    };
                    return (
                      <article
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setMobileView("chat");
                        }}
                        className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 relative ${
                          isActive
                            ? "bg-[#FBF0F4] dark:bg-white/[0.06] border border-[#EDE6E1] dark:border-white/[0.08] shadow-2xs"
                            : "hover:bg-stone-50 dark:hover:bg-white/[0.03] border border-transparent"
                        }`}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#7E1639] dark:bg-[#E27D9A] rounded-r-full" />
                        )}
                        <div className="flex items-start justify-between gap-2 pl-1">
                          <div className="flex items-center gap-2">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center text-xs font-bold">
                                {conv.initials}
                              </div>
                              {conv.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#15803D] dark:bg-[#34D399] ring-2 ring-white dark:ring-[#1C1A22]" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-semibold text-[#221A1D] dark:text-[#F4EEF1] truncate">
                                  {conv.clientName}
                                </span>
                                {conv.isVip && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                              </div>
                              {conv.subtitle && (
                                <span className="text-[10px] text-stone-400 truncate">{conv.subtitle}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] text-stone-400">{conv.time}</span>
                            {conv.unread > 0 && (
                              <span className="w-4 h-4 rounded-full bg-[#7E1639] dark:bg-[#E27D9A] text-white dark:text-[#151419] text-[9px] flex items-center justify-center font-bold">
                                {conv.unread}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-[#A0949C] line-clamp-1 pl-1">
                          {conv.lastMessage}
                        </p>
                        <div className="flex items-center justify-between pl-1">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${statusColors[conv.status] || statusColors.resolved}`}>
                            {conv.statusLabel}
                          </span>
                          {conv.status === "confirmed" && (
                            <CheckCheck size={12} className="text-[#15803D] dark:text-[#34D399]" />
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </aside>

            {/* ── COLUNA CENTRO: Chat Ativo ────────────────────────────────── */}
            <main className={`${mobileView === "chat" ? "flex" : "hidden"} lg:flex lg:col-span-6 bg-white dark:bg-[#1C1A22] rounded-2xl border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-col overflow-hidden`}>
              {activeConv ? (
                <>
                  {/* Chat header */}
                  <div className="h-14 px-4 flex items-center justify-between border-b border-stone-100 dark:border-white/[0.06] shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Botão Voltar para Lista no Mobile */}
                      <button
                        type="button"
                        onClick={() => setMobileView("list")}
                        className="lg:hidden p-1.5 -ml-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                        title="Voltar às conversas"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center text-xs font-bold">
                          {activeConv.initials}
                        </div>
                        {activeConv.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#15803D] dark:bg-[#34D399] ring-1 ring-white dark:ring-[#1C1A22]" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1] truncate">
                            {activeConv.clientName}
                          </span>
                          {activeConv.isVip && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] text-[10px] font-bold">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {activeConv.isOnline ? "Online agora" : activeConv.subtitle || "Offline"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setMobileView("profile")}
                        className="lg:hidden h-7 px-2.5 rounded-lg bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <User size={12} />
                        <span>Ficha</span>
                      </button>
                      <button
                        type="button"
                        className="h-7 px-2.5 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-[#A0949C] hover:text-[#7E1639] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={13} />
                        <span className="hidden sm:inline">Resolver</span>
                      </button>
                      <button type="button" className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer">
                        <Forward size={14} />
                      </button>
                      <button type="button" className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer">
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto flex flex-col gap-3 bg-[#FAF7F5] dark:bg-[#151419]">
                    {/* Date divider */}
                    <div className="flex justify-center my-1">
                      <span className="px-3 py-0.5 rounded-full bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.06] text-stone-500 dark:text-[#A0949C] text-[10px] font-semibold">
                        Hoje
                      </span>
                    </div>

                    {/* System card */}
                    {isConnected && (
                      <div className="self-center w-full max-w-sm px-3 py-2 rounded-xl bg-white dark:bg-[#1C1A22] border border-[#EDE6E1] dark:border-white/[0.06] text-center flex items-center justify-center gap-2">
                        <Sparkles size={13} className="text-[#7E1639] dark:text-[#E27D9A] shrink-0" />
                        <span className="text-[11px] text-stone-500 dark:text-[#A0949C]">
                          Robô ativo — lembrete programado automaticamente
                        </span>
                      </div>
                    )}

                    {/* Messages */}
                    {activeMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${msg.sender === "salon" ? "self-end items-end" : "self-start items-start"}`}
                      >
                        <div
                          className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            msg.sender === "salon"
                              ? "bg-[#FBF0F4] dark:bg-[#2A2027] text-[#221A1D] dark:text-[#F4EEF1] border border-[#F2DCE5] dark:border-white/[0.06] rounded-tr-xs"
                              : "bg-white dark:bg-[#1C1A22] text-[#221A1D] dark:text-[#F4EEF1] border border-[#EDE6E1] dark:border-white/[0.06] rounded-tl-xs shadow-2xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="flex items-center gap-1 px-1">
                          <span className="text-[10px] text-stone-400">{msg.time}</span>
                          {msg.sender === "salon" && (
                            <CheckCheck size={11} className="text-[#15803D] dark:text-[#34D399]" />
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Intelligent suggestion card */}
                    {activeConv.status === "pending" && (
                      <div className="self-center w-full max-w-md bg-white dark:bg-[#1C1A22] rounded-2xl p-3 shadow-2xs border border-[#EDE6E1] dark:border-white/[0.08] flex flex-col gap-2.5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7E1639] dark:bg-[#E27D9A] rounded-r-full" />
                        <div className="flex items-start gap-2 pl-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center shrink-0">
                            <Sparkles size={14} />
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A]">Sugestão Inteligente</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-[#15803D] dark:text-[#34D399] font-semibold">Horário Livre</span>
                            </div>
                            <p className="text-xs text-stone-600 dark:text-[#A0949C] mt-1">
                              Horário disponível amanhã para <strong>{activeConv.subtitle || "atendimento"}</strong>. Clique para confirmar.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pl-2">
                          <button
                            type="button"
                            onClick={() => setMessageInput(`${activeConv.clientName}, temos um horário disponível amanhã. Posso confirmar para você?`)}
                            className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Copiar proposta
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                          >
                            <Calendar size={12} />
                            Inserir no Agendamento
                          </button>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick replies */}
                  <div className="px-3 sm:px-4 py-2 border-t border-stone-100 dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[10px] font-semibold text-stone-400 uppercase shrink-0 mr-1">Atalhos:</span>
                    {QUICK_REPLIES.map((qr) => (
                      <button
                        key={qr}
                        type="button"
                        onClick={() => setMessageInput(qr)}
                        className="px-2.5 py-1 rounded-full bg-[#FBF0F4] hover:bg-[#F5DFE7] dark:bg-white/[0.06] dark:hover:bg-white/10 text-[#7E1639] dark:text-[#E27D9A] text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>

                  {/* Message input */}
                  <div className="p-2.5 sm:p-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-[#1C1A22] shrink-0">
                    <div className="flex items-center gap-0.5">
                      <button type="button" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center justify-center transition-colors cursor-pointer">
                        <Image size={15} />
                      </button>
                      <button type="button" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 flex items-center justify-center transition-colors cursor-pointer">
                        <Paperclip size={15} />
                      </button>
                      <button type="button" className="hidden sm:flex w-8 h-8 rounded-full hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 items-center justify-center transition-colors cursor-pointer">
                        <Smile size={15} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <textarea
                        rows={1}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={`Mensagem para ${activeConv.clientName}...`}
                        className="w-full py-1.5 sm:py-2 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-xs sm:text-sm text-[#221A1D] dark:text-[#F4EEF1] placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7E1639] resize-none transition-all leading-normal"
                      />
                    </div>
                    <button type="button" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-400 hover:text-[#7E1639] flex items-center justify-center transition-colors cursor-pointer">
                      <Mic size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      className="h-8 sm:h-9 px-3 sm:px-4 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <span>Enviar</span>
                      <Send size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageCircle size={32} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                    <p className="text-sm font-semibold text-stone-500 dark:text-[#A0949C]">Selecione uma conversa</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">As conversas da sua agenda aparecem aqui automaticamente.</p>
                  </div>
                </div>
              )}
            </main>

            {/* ── COLUNA DIREITA: Painel da Cliente ───────────────────────── */}
            <aside className={`${mobileView === "profile" ? "flex" : "hidden"} lg:flex lg:col-span-3 bg-white dark:bg-[#1C1A22] rounded-2xl border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.03)] flex-col p-4 overflow-y-auto gap-4`}>

              {activeConv ? (
                <>
                  {/* Profile header */}
                  <div className="flex flex-col gap-3 pb-3 border-b border-stone-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMobileView("chat")}
                          className="lg:hidden p-1 -ml-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
                          title="Voltar ao chat"
                        >
                          <ArrowLeft size={15} />
                        </button>
                        <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">Ficha Expresso</span>
                      </div>
                      <button type="button" className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-400 flex items-center justify-center transition-colors cursor-pointer">
                        <MoreVertical size={13} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center text-base font-bold shadow-2xs">
                          {activeConv.initials}
                        </div>
                        {activeConv.isVip && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1] truncate">{activeConv.clientName}</span>
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Phone size={10} /> {activeConv.clientPhone || "Sem telefone"}
                        </span>
                        {activeConv.isVip && (
                          <span className="text-[10px] text-[#7E1639] dark:text-[#E27D9A] font-semibold mt-0.5">Cliente Frequente</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessageInput(`Olá ${activeConv.clientName}! Passando para confirmar se você deseja marcar um novo horário conosco no ${salonName}.`)}
                      className="w-full h-9 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Calendar size={14} />
                      Propor Horário
                    </button>
                  </div>

                  {/* Booking widget */}
                  <section className="bg-stone-50 dark:bg-white/[0.02] rounded-2xl p-3 flex flex-col gap-3 border border-stone-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] flex items-center gap-1.5">
                        <Calendar size={14} /> Agendamento Atual
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        activeConv.status === "confirmed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-[#15803D] dark:text-[#34D399]"
                          : "bg-amber-50 dark:bg-amber-950/30 text-[#B45309] dark:text-[#FBBF24]"
                      }`}>
                        {activeConv.statusLabel}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-stone-400 font-medium">Procedimento</label>
                      <div className="px-2.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] text-stone-800 dark:text-stone-200 text-xs flex items-center justify-between border border-stone-100 dark:border-white/[0.06]">
                        <div className="flex flex-col">
                          <span className="font-semibold">{activeConv.subtitle || "Atendimento"}</span>
                          {activeConv.professionalName && (
                            <span className="text-[10px] text-stone-400">Com: {activeConv.professionalName}</span>
                          )}
                        </div>
                        {activeConv.price ? (
                          <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A]">{formatBRL(activeConv.price)}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-stone-400 font-medium">Data</label>
                        <div className="px-2 py-2 rounded-xl bg-white dark:bg-white/[0.06] text-xs font-semibold text-stone-800 dark:text-stone-200 text-center border border-stone-100 dark:border-white/[0.06]">
                          {activeConv.time === "Amanhã" ? "Amanhã" : activeConv.date || "Hoje"}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-stone-400 font-medium">Horário</label>
                        <div className="px-2 py-2 rounded-xl bg-white dark:bg-white/[0.06] text-xs font-bold text-[#7E1639] dark:text-[#E27D9A] text-center border border-stone-100 dark:border-white/[0.06]">
                          {activeConv.timeValue || activeConv.time || "--:--"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMessageInput(`Olá ${activeConv.clientName}! Seu agendamento de ${activeConv.subtitle} está confirmado para ${activeConv.time === "Amanhã" ? "amanhã" : "hoje"} às ${activeConv.timeValue || activeConv.time}. Te esperamos!`)}
                      className="w-full h-9 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Send size={13} />
                      Enviar Confirmação no Chat
                    </button>
                  </section>

                  {/* Quick actions for client */}
                  <section className="mt-auto p-3 rounded-2xl bg-[#FBF0F4] dark:bg-white/[0.02] border border-[#EDE6E1] dark:border-white/[0.06] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <HeartHandshake size={14} className="text-[#7E1639] dark:text-[#E27D9A]" />
                        <span className="text-xs font-bold text-[#7E1639] dark:text-[#E27D9A]">Ações com a Cliente</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-[#A0949C]">
                      Envie mensagens rápidas de pós-venda ou cobrança de chave Pix diretamente pelo WhatsApp.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMessageInput(`Oi ${activeConv.clientName}! Foi um prazer atender você hoje no ${salonName}. O que achou do resultado?`)}
                      className="w-full h-8 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-stone-50 dark:hover:bg-white/10 text-[#7E1639] dark:text-[#E27D9A] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[#EDE6E1] dark:border-white/[0.08] cursor-pointer"
                    >
                      <Gift size={13} />
                      Mensagem de Agradecimento
                    </button>
                  </section>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-6">
                  <div>
                    <User size={28} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
                    <p className="text-xs text-stone-400">Selecione uma conversa para ver a ficha da cliente.</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ═══ ABA: AUTOMAÇÃO ═════════════════════════════════════════════════ */}
        {activeTab === "automation" && (
          <div className="max-w-3xl mx-auto space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#221A1D] dark:text-[#F4EEF1]">Piloto Automático de Mensagens</h2>
                <p className="text-xs text-stone-500 dark:text-[#A0949C] mt-0.5">Disparos programados para confirmação, lembretes e fidelização.</p>
              </div>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleRunAutomation}
                  disabled={isProcessing}
                  className="h-9 px-4 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  <Zap size={13} className={isProcessing ? "animate-spin" : ""} />
                  {isProcessing ? "Processando..." : "Executar Agora"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("connection")}
                  className="h-9 px-4 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-stone-600 dark:text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Smartphone size={13} />
                  Conectar WhatsApp
                </button>
              )}
            </div>

            {rules.map((rule) => (
              <div key={rule.id} className="bg-white dark:bg-[#1C1A22] rounded-2xl p-4 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center shrink-0">
                      <Bot size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">{rule.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeColorMap[rule.badgeColor]}`}>
                          {rule.badge}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-[#A0949C] mt-0.5">{rule.subtitle}</p>
                      <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                        <Clock size={10} /> {rule.scheduleInfo}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = rules.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r);
                      setRules(updated);
                      saveSettings({ rules: updated });
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${rule.enabled ? "bg-[#15803D]" : "bg-stone-300 dark:bg-white/20"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${rule.enabled ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {rule.enabled && (
                  <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/[0.06]">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Mensagem modelo</p>
                    <p className="text-xs text-stone-600 dark:text-[#A0949C] whitespace-pre-wrap leading-relaxed">{rule.template}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ ABA: CONEXÃO ═══════════════════════════════════════════════════ */}
        {activeTab === "connection" && (
          <div className="max-w-lg mx-auto py-4">
            <div className="bg-white dark:bg-[#1C1A22] rounded-2xl p-6 border border-[#EDE6E1] dark:border-white/[0.08] shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF0F4] dark:bg-white/[0.06] text-[#7E1639] dark:text-[#E27D9A] flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#221A1D] dark:text-[#F4EEF1]">Conexão WhatsApp</h2>
                  <p className="text-xs text-stone-500 dark:text-[#A0949C]">Conecte seu número via QR Code</p>
                </div>
              </div>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-[#15803D] dark:text-[#34D399] shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#15803D] dark:text-[#34D399]">WhatsApp Conectado</p>
                      {connectedPhone && <p className="text-xs text-stone-500 mt-0.5">{connectedPhone}</p>}
                    </div>
                  </div>
                  <button type="button" onClick={handleDisconnect} className="w-full h-10 rounded-xl border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                    <LogOut size={16} />
                    Desconectar WhatsApp
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-stone-500">Número do salão (com DDD)</label>
                    <input
                      type="tel"
                      value={salonPhone}
                      onChange={(e) => setSalonPhone(e.target.value)}
                      placeholder="Ex: 11987654321"
                      className="h-10 px-3 rounded-xl bg-stone-100 dark:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08] text-sm text-[#221A1D] dark:text-[#F4EEF1] focus:outline-none focus:ring-1 focus:ring-[#7E1639]"
                    />
                  </div>

                  <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-dashed border-stone-200 dark:border-white/[0.10]">
                    {isLoadingQr ? (
                      <div className="w-32 h-32 flex items-center justify-center">
                        <RefreshCw size={24} className="animate-spin text-stone-400" />
                      </div>
                    ) : qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR Code WhatsApp" className="w-44 h-44 rounded-xl" />
                    ) : (
                      <div className="w-32 h-32 flex items-center justify-center">
                        <QrCode size={48} className="text-stone-300 dark:text-stone-600" />
                      </div>
                    )}
                    <p className="text-xs text-stone-500 dark:text-[#A0949C] text-center">
                      Abra o WhatsApp no celular → Dispositivos Conectados → Conectar Dispositivo
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={fetchQrCode} className="flex-1 h-10 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-white/10 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                      <RefreshCw size={15} className={isLoadingQr ? "animate-spin" : ""} />
                      Novo QR
                    </button>
                    <button type="button" onClick={handleVerify} disabled={isVerifyingConnection} className="flex-1 h-10 rounded-xl bg-[#7E1639] hover:bg-[#68112E] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-60 cursor-pointer">
                      <CheckCircle2 size={15} className={isVerifyingConnection ? "animate-spin" : ""} />
                      {isVerifyingConnection ? "Verificando..." : "Já escaniei"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
const badgeColorMap: Record<string, string> = {
  rose: "bg-[#FBF0F4] text-[#7E1639] border-[#EDE6E1] dark:bg-white/[0.06] dark:text-[#E27D9A] dark:border-white/[0.08]",
  emerald: "bg-emerald-50 text-[#15803D] border-emerald-200/60 dark:bg-emerald-950/30 dark:text-[#34D399] dark:border-emerald-800/40",
  amber: "bg-[#FEF6EE] text-[#B45309] border-amber-200/60 dark:bg-amber-950/30 dark:text-[#FBBF24] dark:border-amber-800/40",
  purple: "bg-[#F5F3FF] text-[#7C3AED] border-purple-200/60 dark:bg-purple-950/30 dark:text-[#C084FC] dark:border-purple-800/40",
};
