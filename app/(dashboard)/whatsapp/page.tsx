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
  UserCheck,
  Radio,
  FileText,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData, Appointment } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";

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
      "Olá [Nome da Cliente]! 💕 Seu agendamento foi realizado com sucesso!\n\n💅 Procedimento: *[Procedimento]*\n📅 Data: *[Data]* às *[Horário]*\n👤 Especialista: *[Profissional]*\n📍 Salão: *[Nome do Salão]*\n\nEstamos ansiosas para cuidar de você! ✨",
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
      "Oi, [Nome da Cliente]! Passando com carinho para confirmar seu horário amanhã ([Data]) às *[Horário]* para *[Procedimento]* aqui no [Nome do Salão].\n\nPodemos confirmar sua presença?\n👉 Responda *SIM* para confirmar ou *NÃO* para reagendar.",
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
      "Oi, [Nome da Cliente]! 🌸 Sua bancada já está higienizada e seu cafezinho te esperando!\n\nLembrando que seu horário de *[Procedimento]* é hoje às *[Horário]*. Até daqui a pouco no [Nome do Salão]!",
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

function fillTemplate(
  tpl: string,
  data: {
    clientName?: string;
    serviceName?: string;
    professionalName?: string;
    date?: string;
    time?: string;
    salonName?: string;
    reviewLink?: string;
    pixKey?: string;
  }
): string {
  if (!tpl) return "";
  return tpl
    .replace(/\[Nome da Cliente\]|\[cliente\]|\{\{cliente\}\}/gi, data.clientName || "Maria")
    .replace(/\[Procedimento\]|\[serviço\]|\[servico\]|\{\{servico\}\}/gi, data.serviceName || "Corte & Escova")
    .replace(/\[Profissional\]|\{\{profissional\}\}/gi, data.professionalName || "Camila")
    .replace(/\[Data\]|\{\{data\}\}/gi, data.date || "Hoje")
    .replace(/\[Horário\]|\[hora\]|\{\{horario\}\}/gi, data.time || "14:00")
    .replace(/\[Nome do Salão\]|\[Salão\]|\{\{salao\}\}/gi, data.salonName || "Studio de Beleza")
    .replace(/\[Link do Google\]|\{\{link_avaliacao\}\}/gi, data.reviewLink || "g.page/r/seusalao")
    .replace(/\[Chave PIX\]|\{\{pix\}\}/gi, data.pixKey || "(Chave PIX)");
}

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { appointments, updateAppointment } = useSalonData();
  const toast = useToast();

  // Abas Simplificadas e Objetivas (Apenas 3)
  const [activeTab, setActiveTab] = useState<"timeline" | "rules" | "connection">("timeline");

  // Estado da Conexão
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [connectedAt, setConnectedAt] = useState("");

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

  // Feed de Atividades do Robô (Timeline ao Vivo)
  const [robotEvents, setRobotEvents] = useState<
    Array<{
      id: string;
      time: string;
      type: "send" | "confirm" | "cancel" | "scheduled";
      clientName: string;
      service: string;
      message: string;
    }>
  >([]);

  const salonName = profile?.salon_name || "Meu Salão";

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

  // Estatísticas Reais de Impacto
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
          "Conectado com Sucesso"
        );
      } else {
        toast.warning(
          data.message || "Aparelho ainda não detectado. Aponte a câmera para o QR Code.",
          "Aguardando Conexão"
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

  // =========================================================================
  // EXECUÇÃO IMEDIATA DO PILOTO AUTOMÁTICO (EM SEGUNDO PLANO)
  // =========================================================================
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
        // Atualiza appointments confirmados
        if (data.dispatched && Array.isArray(data.dispatched)) {
          for (const item of data.dispatched) {
            updateAppointment(item.appointmentId, {
              status: item.type === "24h_confirmation" ? "confirmed" : undefined,
            });
          }
        }
        toast.success(
          data.message || "O robô processou a agenda e disparou as mensagens pendentes!",
          "Automação Executada"
        );
      } else {
        toast.warning(
          data.message || "Conecte o WhatsApp na aba 'Conexão' para que o robô envie automaticamente.",
          "WhatsApp Não Conectado"
        );
      }
    } catch (e) {
      toast.error("Erro ao acionar o robô de automação.", "Falha no Envio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-br from-[#fff7f9] via-[#fdf5f8] to-[#faf0f5] dark:from-[#090a0f] dark:via-[#0e1017] dark:to-[#12141c] font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header title="Automação do WhatsApp" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* =========================================================================
            HERO VIBRANTE: STATUS DO PILOTO AUTOMÁTICO (O CENTRO DE COMANDO)
            ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white p-6 sm:p-8 shadow-[0_16px_36px_-6px_rgba(244,63,94,0.35)]">
          {/* Luzes decorativas */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/15 blur-2xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-10 w-44 h-44 rounded-full bg-rose-400/20 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold uppercase tracking-wider">
                  <Bot size={13} className="animate-pulse" />
                  <span>Piloto Automático WhatsApp</span>
                </span>

                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-300/40 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                    Robô Online & Operando 24h
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/30 text-amber-100 border border-amber-300/40 text-[11px] font-bold">
                    <AlertCircle size={12} />
                    WhatsApp Desconectado
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {isConnected
                  ? "Sua Agenda Está no Piloto Automático"
                  : "Conecte seu WhatsApp para Automatizar Tudo"}
              </h1>

              <p className="text-xs sm:text-sm text-rose-100 leading-relaxed font-medium">
                {isConnected
                  ? "O robô cuida de tudo sozinho nos bastidores: confirmações 24h na véspera, lembretes de bancada pronta e cancelamentos automáticos caso a cliente desmarque."
                  : "Sem precisar ficar digitando mensagem por mensagem. O robô dispara as confirmações sozinho e atualiza os horários na agenda para você faturar mais."}
              </p>
            </div>

            {/* Ações do Hero */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
              {isConnected ? (
                <>
                  <button
                    type="button"
                    onClick={handleRunAutomation}
                    disabled={isProcessing}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-rose-50 text-rose-600 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-black/10 transition cursor-pointer active:scale-95 disabled:opacity-60"
                  >
                    <Zap size={16} className={isProcessing ? "animate-spin" : "fill-rose-600"} />
                    <span>{isProcessing ? "Robô Processando..." : "⚡ Rodar Automação Agora"}</span>
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/20 text-rose-100 text-xs font-semibold">
                    <Smartphone size={14} />
                    <span>{connectedPhone || "Conectado"}</span>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playPop();
                    setActiveTab("connection");
                  }}
                  className="px-6 py-4 rounded-2xl bg-white hover:bg-rose-50 text-rose-700 font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition cursor-pointer active:scale-95"
                >
                  <QrCode size={18} />
                  <span>Escanear QR Code para Ativar Robô</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3 CARDS VIBRANTES DE IMPACTO (SEM CARDS INÚTEIS)
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Faturamento Protegido */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-rose-200/80 dark:border-white/[0.08] shadow-[0_8px_24px_-4px_rgba(244,63,94,0.12)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                Faturamento Salvo do Salão
              </span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                R$ {savedRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Em horários confirmados automaticamente
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
              <Crown size={24} />
            </div>
          </div>

          {/* Card 2: Horários de Hoje */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-emerald-200/80 dark:border-white/[0.08] shadow-[0_8px_24px_-4px_rgba(16,185,129,0.12)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Confirmados Hoje
              </span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {confirmedToday} / {todayAppointments.length}
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                {todayAppointments.length === 0
                  ? "Nenhum horário hoje"
                  : `${Math.round((confirmedToday / (todayAppointments.length || 1)) * 100)}% de comparecimento`}
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <CheckCircle2 size={24} />
            </div>
          </div>

          {/* Card 3: Lembretes de Véspera */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-purple-200/80 dark:border-white/[0.08] shadow-[0_8px_24px_-4px_rgba(168,85,247,0.12)] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
                Fila de Véspera (Amanhã)
              </span>
              <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                {pendingTomorrow} Lembretes
              </h3>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Programados para envio automático às 08:00
              </span>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <Bot size={24} />
            </div>
          </div>
        </div>

        {/* =========================================================================
            MENU DE NAVEGAÇÃO: 3 ABAS OBJETIVAS
            ========================================================================= */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#12141c] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs max-w-xl">
          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("timeline");
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "timeline"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
          >
            <Activity size={15} />
            <span>Linha do Tempo do Robô</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("rules");
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "rules"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
          >
            <Settings size={15} />
            <span>Regras & Textos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEffects.playPop();
              setActiveTab("connection");
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "connection"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5"
            }`}
          >
            <Smartphone size={15} />
            <span>Conexão WhatsApp</span>
          </button>
        </div>

        {/* =========================================================================
            ABA 1: LINHA DO TEMPO DA AUTOMAÇÃO (O FEED DO ROBÔ)
            ========================================================================= */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            {/* Bloco de Agendamentos do Dia com Status Semafórico */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-rose-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-white/10">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                    <Calendar size={18} className="text-rose-600" />
                    <span>Monitoramento da Agenda de Hoje</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    O robô acompanha cada cliente e envia lembrete 2h antes de cada procedimento.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRunAutomation}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw size={13} className={isProcessing ? "animate-spin" : ""} />
                  <span>Sincronizar e Disparar Pendentes</span>
                </button>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  Nenhum horário marcado para hoje. Quando clientes agendarem, eles aparecerão aqui vigiados pelo robô.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {todayAppointments.map((apt) => {
                    const isConfirmed = apt.status === "confirmed";
                    return (
                      <div
                        key={apt.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          isConfirmed
                            ? "bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200 dark:border-emerald-500/20"
                            : "bg-zinc-50/60 dark:bg-white/[0.02] border-zinc-200/80 dark:border-white/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-zinc-200">
                                {apt.time}
                              </span>
                              <strong className="text-sm font-extrabold text-zinc-900 dark:text-white">
                                {apt.clientName}
                              </strong>
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              {apt.serviceName} • R$ {apt.price?.toFixed(2)}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                              isConfirmed
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {isConfirmed ? "Confirmado" : "Aguardando"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200/50 dark:border-white/5">
                          <span className="flex items-center gap-1">
                            <Bot size={12} className="text-rose-500" />
                            {isConfirmed ? "Presença confirmada" : "Lembrete 2h programado"}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const clean = (apt.clientPhone || "").replace(/\D/g, "");
                              const num = clean.length <= 11 ? `55${clean}` : clean;
                              const text = `Oi, ${apt.clientName}! Passando para lembrar do seu horário hoje às ${apt.time} para ${apt.serviceName}!`;
                              window.open(
                                `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`,
                                "_blank"
                              );
                            }}
                            className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            Abrir Chat <ExternalLink size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Agendamentos de Amanhã (Fila de 24h) */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#12141c] border border-rose-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-purple-600" />
                    <span>Fila de Véspera (Disparo Automático Amanhã)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Clientes agendadas para amanhã que receberão a mensagem de confirmação 24h.
                  </p>
                </div>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full">
                  {tomorrowAppointments.length} horários amanhã
                </span>
              </div>

              {tomorrowAppointments.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  Nenhum horário marcado para amanhã até o momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {tomorrowAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3.5 rounded-2xl bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-zinc-700 dark:text-zinc-300">
                          {apt.time}
                        </span>
                        <div>
                          <strong className="text-zinc-900 dark:text-white block font-bold">
                            {apt.clientName}
                          </strong>
                          <span className="text-zinc-500">{apt.serviceName}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                          Robô cuidará às 08:00
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: REGRAS & TEXTOS DAS MENSAGENS (LIMPO, COMPACTO E SEM POLUIÇÃO)
            ========================================================================= */}
        {activeTab === "rules" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#12141c] border border-rose-200/80 dark:border-white/[0.08] shadow-xs space-y-6">
              <div>
                <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
                  Regras do Piloto Automático
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Ative ou desative as mensagens e personalize o texto que a cliente recebe. O robô preenche o nome, horário e serviço sozinho.
                </p>
              </div>

              {/* Grid das 4 Regras Essenciais */}
              <div className="space-y-4">
                {rules.map((rule) => {
                  const isEditing = editingRuleId === rule.id;
                  return (
                    <div
                      key={rule.id}
                      className={`p-5 rounded-2xl border transition space-y-3 ${
                        rule.enabled
                          ? "bg-white dark:bg-[#181b26] border-rose-200/80 dark:border-white/10 shadow-xs"
                          : "bg-zinc-50/50 dark:bg-white/[0.01] border-zinc-200/60 dark:border-white/5 opacity-70"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                              {rule.title}
                            </h4>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300">
                              {rule.badge}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{rule.subtitle}</p>
                        </div>

                        {/* Switch Liga/Desliga */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playPop();
                              const updated = rules.map((r) =>
                                r.id === rule.id ? { ...r, enabled: !r.enabled } : r
                              );
                              setRules(updated);
                              saveSettings({ rules: updated });
                            }}
                            className={`w-12 h-6.5 rounded-full transition cursor-pointer p-0.5 shrink-0 ${
                              rule.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                          >
                            <div
                              className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition ${
                                rule.enabled ? "translate-x-5.5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Caixa de Texto do Modelo */}
                      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-600 dark:text-zinc-300">
                            Texto enviado pelo robô:
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingRuleId(isEditing ? null : rule.id)}
                            className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                          >
                            {isEditing ? "Concluir Edição" : "Editar Texto"}
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              rows={4}
                              value={rule.template}
                              onChange={(e) => {
                                const updated = rules.map((r) =>
                                  r.id === rule.id ? { ...r, template: e.target.value } : r
                                );
                                setRules(updated);
                              }}
                              onBlur={() => saveSettings({ rules })}
                              className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#12141c] border border-zinc-200 dark:border-white/15 text-xs text-zinc-900 dark:text-white outline-none focus:border-rose-500 font-mono leading-relaxed"
                            />
                            <div className="flex flex-wrap gap-1 text-[11px] text-zinc-500">
                              <span>Tags automáticas:</span>
                              <strong className="text-rose-600">[Nome da Cliente]</strong>,{" "}
                              <strong className="text-rose-600">[Procedimento]</strong>,{" "}
                              <strong className="text-rose-600">[Horário]</strong>,{" "}
                              <strong className="text-rose-600">[Data]</strong>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#12141c] border border-zinc-100 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed font-sans">
                            {rule.template}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Configurações de Apoio (Chave PIX e Link do Google) */}
              <div className="pt-4 border-t border-zinc-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Chave PIX do Salão (para sinal de garantia):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Celular, CNPJ ou e-mail"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    onBlur={() => saveSettings({ pixKey })}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#12141c] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Link do Google Meu Negócio (para avaliações 5 estrelas):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: g.page/r/seusalao"
                    value={googleReviewLink}
                    onChange={(e) => setGoogleReviewLink(e.target.value)}
                    onBlur={() => saveSettings({ googleReviewLink })}
                    className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-[#12141c] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 3: CONEXÃO DO WHATSAPP (DIRETO E SEM ENROLAÇÃO)
            ========================================================================= */}
        {activeTab === "connection" && (
          <div className="space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#12141c] border border-rose-200/80 dark:border-white/[0.08] shadow-xs space-y-6">
              {isConnected ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-md">
                      <MessageCircle size={26} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-zinc-900 dark:text-white">
                        WhatsApp da Recepção Conectado
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Número ativo: <strong className="text-emerald-700 dark:text-emerald-400">{connectedPhone}</strong>
                      </p>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                        ● Robô do Piloto Automático operando normalmente
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 hover:bg-rose-50 text-rose-600 dark:text-rose-400 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                  >
                    Desconectar Aparelho
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* QR Code */}
                  <div className="lg:col-span-5 flex flex-col items-center text-center p-6 bg-zinc-50 dark:bg-[#181b26] rounded-3xl border border-zinc-200 dark:border-white/10">
                    <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-rose-200">
                      {isLoadingQr ? (
                        <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-rose-500 gap-2">
                          <RefreshCw size={28} className="animate-spin text-rose-600" />
                          <span className="text-xs font-bold text-zinc-700">Gerando QR Code...</span>
                        </div>
                      ) : qrCodeDataUrl ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code WhatsApp"
                            className="w-[200px] h-[200px] object-contain rounded-lg"
                          />
                          <span className="text-[11px] font-semibold text-rose-600 mt-2">
                            Atualiza em {countdown}s
                          </span>
                        </div>
                      ) : (
                        <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <button
                            type="button"
                            onClick={fetchQrCode}
                            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
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
                      className="mt-4 w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-60"
                    >
                      {isVerifyingConnection ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Verificando Leitura...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Já Apontei a Câmera (Confirmar)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3 Passos */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="font-extrabold text-xl text-zinc-900 dark:text-white">
                      Conectar o WhatsApp da Recepção
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Conecte o número de WhatsApp que atende suas clientes para que o robô envie lembretes e confirme horários de forma 100% autônoma.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 flex items-center gap-3 text-xs">
                        <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <span>Abra o <strong>WhatsApp</strong> no celular da recepção.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 flex items-center gap-3 text-xs">
                        <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <span>Toque em <strong>Aparelhos Conectados</strong> e selecione <strong>Conectar um Aparelho</strong>.</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 flex items-center gap-3 text-xs">
                        <span className="w-7 h-7 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <span>Aponte a câmera para o QR Code ao lado. Pronto! O robô assume os disparos.</span>
                      </div>
                    </div>
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
