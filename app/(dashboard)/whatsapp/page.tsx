"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Calendar,
  Smartphone,
  QrCode,
  RefreshCw,
  LogOut,
  AlertCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
  CheckCheck,
  Send,
  HeartHandshake,
  MessageCircle,
  ExternalLink,
  Crown,
  Gift,
  Star,
  Settings,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  ArrowRight,
  ArrowUpRight,
  UserCheck,
  Radio,
  FileText,
  RotateCcw,
  MoreVertical,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData, Appointment } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";
import { formatBRL } from "@/lib/formatters";

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

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "instant_booking",
    title: "Confirmação Imediata de Agendamento",
    subtitle: "Disparada no exato segundo em que a cliente agenda pelo seu link online",
    badge: "Instantâneo",
    badgeColor: "emerald",
    scheduleInfo: "Automático no agendamento",
    enabled: true,
    template:
      "Olá [Nome da Cliente]! 💕 Seu agendamento foi realizado com sucesso!\n\n💅 Procedimento: [Procedimento]\n📅 Data: [Data] às [Horário]\n👤 Especialista: [Profissional]\n📍 Salão: [Nome do Salão]\n\nEstamos ansiosas para cuidar de você! ✨",
  },
  {
    id: "confirm_24h",
    title: "Lembrete de Véspera (24 Horas Antes)",
    subtitle: "Pede confirmação ativa da cliente e reconhece a resposta 'SIM' ou '1'",
    badge: "Evita até 80% das faltas",
    badgeColor: "rose",
    scheduleInfo: "Disparo automático às 08:00 na véspera",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! Passando com carinho para confirmar seu horário amanhã ([Data]) às [Horário] para [Procedimento] aqui no [Nome do Salão].\n\nPodemos confirmar sua presença?\n👉 Responda SIM para confirmar ou NÃO para reagendar.",
  },
  {
    id: "reminder_2h",
    title: "Lembrete 'Bancada Pronta' (2 Horas Antes)",
    subtitle: "Avisa que a equipe já está pronta e mantém a agenda pontual sem atrasos",
    badge: "Pontualidade",
    badgeColor: "amber",
    scheduleInfo: "Disparo 2h antes de cada horário",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! 🌸 Sua bancada já está higienizada e seu cafezinho te esperando!\n\nLembrando que seu horário de [Procedimento] é hoje às [Horário]. Até daqui a pouco no [Nome do Salão]!",
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
      "Oi, [Nome da Cliente]! ✨ Foi um prazer cuidar de você hoje no [Nome do Salão]!\n\nSe você amou seu novo visual, deixe 5 estrelas para nós no Google? Seu carinho apoia muito nossa equipe: [Link do Google] 💕",
  },
];

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { appointments, updateAppointment } = useSalonData();
  const toast = useToast();

  // Abas
  const [activeTab, setActiveTab] = useState<"timeline" | "rules" | "connection">("timeline");

  // Estado da Conexão
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");

  // Piloto Automático Ativo
  const [autoPilotEnabled, setAutoPilotEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // QR Code
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isVerifyingConnection, setIsVerifyingConnection] = useState(false);

  // Regras
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "");
  const [pixKey, setPixKey] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const salonName = profile?.salon_name || "Studio Glow";

  // Datas
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  // Agendamentos de Hoje e Amanhã
  const todayAppointments = useMemo(() => {
    return (appointments || [])
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, todayStr]);

  const tomorrowAppointments = useMemo(() => {
    return (appointments || [])
      .filter((a) => a.date === tomorrowStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, tomorrowStr]);

  // Estatísticas Reais
  const confirmedToday = useMemo(() => {
    return todayAppointments.filter((a) => a.status === "confirmed").length;
  }, [todayAppointments]);

  const savedRevenue = useMemo(() => {
    return (appointments || [])
      .filter((a) => a.status === "confirmed")
      .reduce((acc, a) => acc + (a.price || 95), 0);
  }, [appointments]);

  const pendingTomorrow = useMemo(() => {
    return tomorrowAppointments.filter((a) => a.status === "pending").length;
  }, [tomorrowAppointments]);

  // Carrega status da conexão
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch("/api/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsConnected(Boolean(data.connected));
            setConnectedPhone(data.phoneNumber || "");
          }
        }
      } catch (e) {}
    }

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Carrega configurações salvas
  useEffect(() => {
    if (!user) return;
    try {
      const local = localStorage.getItem(`bellamais_wa_${user.uid}`);
      if (local) {
        const d = JSON.parse(local);
        if (d.rules) setRules(d.rules);
        if (d.pixKey) setPixKey(d.pixKey);
        if (d.googleReviewLink) setGoogleReviewLink(d.googleReviewLink);
        if (d.autoPilotEnabled !== undefined) setAutoPilotEnabled(d.autoPilotEnabled);
      }
    } catch (e) {}
  }, [user]);

  const saveSettings = (updates: Record<string, any>) => {
    if (!user) return;
    try {
      const prev = JSON.parse(localStorage.getItem(`bellamais_wa_${user.uid}`) || "{}");
      localStorage.setItem(`bellamais_wa_${user.uid}`, JSON.stringify({ ...prev, ...updates }));
      setDoc(doc(db, "whatsapp_config", user.uid), updates, { merge: true }).catch(() => {});
    } catch (e) {}
  };

  // Gerar QR Code
  const fetchQrCode = async () => {
    setIsLoadingQr(true);
    setCountdown(45);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", provider: "baileys", phoneNumber: salonPhone }),
      });
      const data = await res.json();
      if (data.qrCodeBase64) setQrCodeDataUrl(data.qrCodeBase64);
    } catch (e) {
    } finally {
      setIsLoadingQr(false);
    }
  };

  useEffect(() => {
    if (activeTab === "connection" && !isConnected && !qrCodeDataUrl) {
      fetchQrCode();
    }
  }, [activeTab, isConnected]);

  // Confirmar conexão do QR Code
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
        toast.success(
          "WhatsApp conectado com sucesso! O robô agora está ativo e disparando sozinho.",
          "Conectado com Sucesso",
        );
      } else {
        toast.warning(
          data.message || "Aparelho ainda não detectado. Aponte a câmera para o QR Code.",
          "Aguardando Conexão",
        );
      }
    } finally {
      setIsVerifyingConnection(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    setIsConnected(false);
    setConnectedPhone("");
    setQrCodeDataUrl(null);
    toast.info("WhatsApp desconectado. O robô pausará os disparos automáticos.", "Desconectado");
    try {
      await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    } catch (e) {}
  };

  // Executar automação
  const handleRunAutomation = async () => {
    setIsProcessing(true);
    soundEffects.playClick();

    try {
      const res = await fetch("/api/whatsapp/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointments: (appointments || []).map((a) => ({
            id: a.id,
            clientName: a.clientName,
            clientPhone: a.clientPhone,
            serviceName: a.serviceName,
            date: a.date,
            time: a.time,
            price: a.price,
            status: a.status,
            professionalName: a.professionalName,
          })),
          salonName,
          salonPhone,
          pixKey,
          rulesConfig: {
            confirm24h: rules.find((r) => r.id === "confirm_24h")?.enabled,
            reminder2h: rules.find((r) => r.id === "reminder_2h")?.enabled,
            postCare: rules.find((r) => r.id === "post_review")?.enabled,
          },
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (data.dispatched && Array.isArray(data.dispatched)) {
          for (const item of data.dispatched) {
            updateAppointment(item.appointmentId, {
              status: item.type === "24h_confirmation" ? "confirmed" : undefined,
            });
          }
        }
        toast.success(
          data.message || "O robô processou a agenda e disparou as mensagens pendentes!",
          "Automação Executada",
        );
      } else {
        toast.warning(
          data.message || "Conecte o WhatsApp na aba 'Conexão' para que o robô envie automaticamente.",
          "WhatsApp Não Conectado",
        );
      }
    } catch (e) {
      toast.error("Erro ao acionar o robô de automação.", "Falha no Envio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#FAF5F2] dark:bg-[#0E0C10] text-[#20181B] dark:text-[#F6EEF2] transition-colors duration-200 font-sans">
      <Header title="Automação do WhatsApp" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-[1440px] w-full mx-auto">
        {/* =========================================================================
            1. BARRA SUPERIOR EDITORIAL: STATUS DO ROBÔ & AÇÃO RÁPIDA
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#16131A] border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)]">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#4ADE80] border border-emerald-200/60 dark:border-emerald-800/40 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#15803D] dark:bg-[#4ADE80] animate-pulse" />
                  Robô Conectado & Ativo 24h
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-[#B45309] dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 text-xs font-bold">
                  <AlertCircle size={13} />
                  WhatsApp Desconectado
                </span>
              )}
              {connectedPhone && (
                <span className="text-xs text-stone-500 font-medium">
                  • {connectedPhone}
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 mt-1">
              Piloto Automático de Mensagens & Confirmações
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Disparos programados para confirmação 24h na véspera, lembretes de bancada e fidelização.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <button
                type="button"
                onClick={handleRunAutomation}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B1832] hover:bg-[#621327] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(123,24,50,0.25)] active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <Zap size={14} className={isProcessing ? "animate-spin" : "fill-white"} />
                <span>{isProcessing ? "Processando..." : "Sincronizar e Disparar"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundEffects.playPop();
                  setActiveTab("connection");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#7B1832] hover:bg-[#621327] text-white text-xs font-bold transition shadow-[0_2px_8px_rgba(123,24,50,0.25)] active:scale-95 cursor-pointer"
              >
                <QrCode size={14} />
                <span>Conectar WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. OS 3 CARDS DE IMPACTO COM PROPORÇÃO HARMONIOSA & GLOW SUTIL
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Faturamento Protegido */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#16131A] border border-[#F0E6E8] dark:border-white/[0.06] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-pink-100/70 to-rose-200/30 dark:from-pink-900/20 dark:to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-pink-100/80 dark:bg-pink-950/60 text-[#BE185D] dark:text-pink-400 flex items-center justify-center">
                  <DollarSign size={16} />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#4ADE80] border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold">
                  <ArrowUpRight size={11} /> Protegido
                </span>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
                Faturamento Salvo do Salão
              </span>

              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                {formatBRL(savedRevenue)}
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06]">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Em horários confirmados automaticamente pelo robô
              </span>
            </div>
          </div>

          {/* Card 2: Confirmados Hoje */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#16131A] border border-[#E2EBE5] dark:border-white/[0.06] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-emerald-100/70 to-teal-200/30 dark:from-emerald-900/20 dark:to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-[#0F766E] dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={16} />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#15803D] dark:text-[#4ADE80] border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] font-semibold">
                  {todayAppointments.length > 0
                    ? `${Math.round((confirmedToday / todayAppointments.length) * 100)}% presenças`
                    : "100% presenças"}
                </span>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
                Confirmados Hoje
              </span>

              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                {confirmedToday} de {todayAppointments.length}
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06]">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Clientes que já confirmaram presença para hoje
              </span>
            </div>
          </div>

          {/* Card 3: Fila de Véspera */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#16131A] border border-[#F4EBE1] dark:border-white/[0.06] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-amber-100/70 to-amber-200/30 dark:from-amber-900/20 dark:to-transparent blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                  Amanhã
                </span>
              </div>

              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-1">
                Fila de Véspera (Amanhã)
              </span>

              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 tabular-nums">
                {pendingTomorrow} Lembretes
              </div>
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-stone-100 dark:border-white/[0.06]">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Disparos programados para amanhã às 08:00
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SELETOR DE ABAS TIPO PÍLULA (COMPACTO E ELEGANTE)
            ========================================================================= */}
        <div className="flex items-center p-1 rounded-full bg-stone-100 dark:bg-[#201822] text-xs max-w-md">
          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("timeline");
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "timeline"
                ? "bg-[#7B1832] text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            <Activity size={14} />
            <span>Fila & Monitoramento</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("rules");
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "rules"
                ? "bg-[#7B1832] text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            <Settings size={14} />
            <span>Mensagens & Textos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("connection");
            }}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "connection"
                ? "bg-[#7B1832] text-white shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900"
            }`}
          >
            <Smartphone size={14} />
            <span>Conexão WhatsApp</span>
          </button>
        </div>

        {/* =========================================================================
            ABA 1: FILA DE ATENDIMENTOS & MONITORAMENTO
            ========================================================================= */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            {/* Bloco de Atendimentos de Hoje com barra lateral de status */}
            <div className="bg-white dark:bg-[#16131A] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-100/80 dark:bg-pink-950/60 text-[#BE185D] dark:text-pink-400 flex items-center justify-center">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      Monitoramento da Agenda de Hoje
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      O robô acompanha cada cliente e envia lembrete 2h antes do procedimento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunAutomation}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded-full bg-stone-100 dark:bg-white/10 hover:bg-stone-200 text-stone-700 dark:text-stone-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
                  <span>Sincronizar Pendentes</span>
                </button>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  Nenhum horário marcado para hoje até o momento. Quando clientes agendarem, eles aparecerão aqui monitorados pelo robô.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayAppointments.map((apt) => {
                    const isConfirmed = apt.status === "confirmed";
                    return (
                      <div
                        key={apt.id}
                        className="p-3 rounded-xl bg-[#FAF5F2]/50 dark:bg-white/[0.02] border border-[#EAE2DC]/60 dark:border-white/[0.04] hover:bg-white dark:hover:bg-[#1C1822] transition flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-1 h-8 rounded-full ${
                              isConfirmed ? "bg-[#15803D]" : "bg-[#D97706]"
                            } shrink-0`}
                          />

                          <div className="min-w-[50px] shrink-0">
                            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 block">
                              {apt.time}
                            </span>
                          </div>

                          <div className="truncate">
                            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              {apt.clientName}
                            </h4>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                              {apt.serviceName} • {formatBRL(apt.price || 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isConfirmed
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                : "bg-amber-50 text-amber-700 border-amber-200/50"
                            }`}
                          >
                            {isConfirmed ? "Confirmado" : "Aguardando"}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const clean = (apt.clientPhone || "").replace(/\D/g, "");
                              const num = clean.length <= 11 ? `55${clean}` : clean;
                              const text = `Oi, ${apt.clientName}! Passando para confirmar seu horário hoje às ${apt.time} para ${apt.serviceName}!`;
                              window.open(
                                `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`,
                                "_blank",
                              );
                            }}
                            className="p-1.5 rounded-lg text-[#15803D] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Agendamentos de Amanhã (Fila de 24h) */}
            <div className="bg-white dark:bg-[#16131A] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-[#B45309] dark:text-amber-400 flex items-center justify-center">
                    <Clock size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                      Fila de Véspera (Disparo Automático Amanhã)
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      Clientes agendadas para amanhã que receberão a confirmação de 24h.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200/50">
                  {tomorrowAppointments.length} horários amanhã
                </span>
              </div>

              {tomorrowAppointments.length === 0 ? (
                <div className="py-6 text-center text-stone-400 text-xs">
                  Nenhum horário marcado para amanhã até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {tomorrowAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-xl bg-[#FAF5F2]/50 dark:bg-white/[0.02] border border-[#EAE2DC]/60 dark:border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {apt.time}
                        </span>
                        <div>
                          <strong className="text-stone-900 dark:text-stone-100 block font-bold">
                            {apt.clientName}
                          </strong>
                          <span className="text-stone-500">{apt.serviceName}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-[#15803D] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50">
                        Robô enviará às 08:00
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: REGRAS & TEXTOS DAS MENSAGENS (LIMPO E SEM POLUIÇÃO)
            ========================================================================= */}
        {activeTab === "rules" && (
          <div className="bg-white dark:bg-[#16131A] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] space-y-6">
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                Regras do Piloto Automático
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Ative ou desative as mensagens e edite o texto como preferir. O robô preenche o nome e horário sozinho.
              </p>
            </div>

            <div className="space-y-4">
              {rules.map((rule) => {
                const isEditing = editingRuleId === rule.id;
                return (
                  <div
                    key={rule.id}
                    className="p-4 rounded-xl border border-[#EAE2DC] dark:border-white/[0.08] bg-[#FAF5F2]/40 dark:bg-white/[0.02] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                            {rule.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-white/10 text-stone-700 dark:text-stone-300">
                            {rule.badge}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{rule.subtitle}</p>
                      </div>

                      {/* Switch Liga/Desliga */}
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playPop();
                          const updated = rules.map((r) =>
                            r.id === rule.id ? { ...r, enabled: !r.enabled } : r,
                          );
                          setRules(updated);
                          saveSettings({ rules: updated });
                        }}
                        className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 shrink-0 ${
                          rule.enabled ? "bg-[#15803D]" : "bg-stone-300 dark:bg-stone-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-xs transform transition ${
                            rule.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Caixa de Texto */}
                    <div className="pt-2 border-t border-stone-200/60 dark:border-white/[0.06] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-600 dark:text-stone-300">
                          Mensagem que a cliente recebe:
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                          className="text-[#BE185D] dark:text-rose-400 font-bold hover:underline cursor-pointer"
                        >
                          {isEditing ? "Salvar Texto" : "Editar Texto"}
                        </button>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={4}
                            value={rule.template}
                            onChange={(e) => {
                              const updated = rules.map((r) =>
                                r.id === rule.id ? { ...r, template: e.target.value } : r,
                              );
                              setRules(updated);
                            }}
                            onBlur={() => saveSettings({ rules })}
                            className="w-full p-3 rounded-xl bg-white dark:bg-[#12141c] border border-stone-300 dark:border-white/15 text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#BE185D] leading-relaxed"
                          />
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-white dark:bg-[#12141c] border border-stone-200/60 dark:border-white/[0.04] text-xs text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed">
                          {rule.template}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Configurações Chave PIX e Google */}
            <div className="pt-4 border-t border-stone-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Chave PIX do Salão (para sinal de garantia):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Celular, CNPJ ou e-mail"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  onBlur={() => saveSettings({ pixKey })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#BE185D]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  Link de Avaliações do Google:
                </label>
                <input
                  type="text"
                  placeholder="Ex: g.page/r/seusalao"
                  value={googleReviewLink}
                  onChange={(e) => setGoogleReviewLink(e.target.value)}
                  onBlur={() => saveSettings({ googleReviewLink })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-stone-100 outline-none focus:ring-1 focus:ring-[#BE185D]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 3: CONEXÃO DO WHATSAPP (QR CODE LIMPO)
            ========================================================================= */}
        {activeTab === "connection" && (
          <div className="bg-white dark:bg-[#16131A] rounded-2xl p-5 sm:p-6 border border-[#EAE2DC] dark:border-white/[0.08] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] space-y-6">
            {isConnected ? (
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0">
                    <MessageCircle size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      WhatsApp Conectado com Sucesso
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Número ativo: <strong className="text-emerald-700 dark:text-emerald-400">{connectedPhone}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-1.5 rounded-full bg-white dark:bg-white/10 border border-stone-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition cursor-pointer self-start sm:self-auto"
                >
                  Desconectar Aparelho
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* QR Code */}
                <div className="lg:col-span-5 flex flex-col items-center text-center p-6 bg-[#FAF5F2] dark:bg-[#181b26] rounded-2xl border border-stone-200 dark:border-white/10">
                  <div className="p-4 bg-white rounded-2xl shadow-xs border border-stone-200">
                    {isLoadingQr ? (
                      <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-stone-400 gap-2">
                        <RefreshCw size={24} className="animate-spin text-[#BE185D]" />
                        <span className="text-xs font-bold text-stone-600">Gerando QR Code...</span>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code WhatsApp"
                          className="w-[180px] h-[180px] object-contain rounded-lg"
                        />
                        <span className="text-[11px] font-semibold text-[#BE185D] mt-2">
                          Atualiza em {countdown}s
                        </span>
                      </div>
                    ) : (
                      <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-stone-400 gap-2">
                        <button
                          type="button"
                          onClick={fetchQrCode}
                          className="px-4 py-2 rounded-full bg-[#7B1832] text-white text-xs font-bold cursor-pointer"
                        >
                          Carregar QR Code
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifyingConnection || isLoadingQr}
                    className="mt-4 w-full py-2.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    {isVerifyingConnection ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Já Apontei a Câmera (Confirmar)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3 Passos */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                    Como conectar o WhatsApp da recepção
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Conecte o WhatsApp do salão para que o robô envie lembretes e confirme horários de forma automática.
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="p-3 rounded-xl bg-[#FAF5F2] dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/10 flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-lg bg-[#7B1832] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        1
                      </span>
                      <span>Abra o <strong>WhatsApp</strong> no celular do salão.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF5F2] dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/10 flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-lg bg-[#7B1832] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        2
                      </span>
                      <span>Toque em <strong>Aparelhos Conectados</strong> e selecione <strong>Conectar um Aparelho</strong>.</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF5F2] dark:bg-white/[0.02] border border-stone-200/80 dark:border-white/10 flex items-center gap-3 text-xs">
                      <span className="w-6 h-6 rounded-lg bg-[#7B1832] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                        3
                      </span>
                      <span>Aponte a câmera para o QR Code ao lado. Pronto! O robô assume os disparos.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
