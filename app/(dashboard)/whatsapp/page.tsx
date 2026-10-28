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
  ExternalLink,
  Phone,
  CheckCheck,
  Check,
  User,
  Scissors,
  Gift,
  HeartHandshake,
  Sparkles,
  Smartphone,
  LogOut,
  Bot,
  SlidersHorizontal,
  ArrowRight,
  ShieldCheck,
  Copy,
  Plus,
  Users,
  PanelLeft,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData, Client, Appointment } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { soundEffects } from "@/lib/soundEffects";
import { useToast } from "@/contexts/ToastContext";
import { formatBRL } from "@/lib/formatters";

// ─── Interfaces ────────────────────────────────────────────────────────────────

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

interface MessageLogItem {
  id: string;
  clientName: string;
  clientPhone: string;
  message: string;
  type: "confirm_24h" | "reminder_2h" | "instant_booking" | "post_review" | "manual";
  timestamp: string;
  status: "sent" | "delivered";
}

// ─── Default Automation Rules ──────────────────────────────────────────────────

const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "instant_booking",
    title: "Confirmação Imediata de Agendamento",
    subtitle: "Disparada no instante em que a cliente conclui a reserva pelo link online",
    badge: "Instantâneo",
    badgeColor: "emerald",
    scheduleInfo: "Automático no agendamento",
    enabled: true,
    template:
      "Olá, [Nome da Cliente]! ✨ Seu agendamento foi realizado com sucesso!\n\nProcedimento: [Procedimento]\nData: [Data] às [Horário]\nEspecialista: [Profissional]\nSalão: [Nome do Salão]\n\nEstamos ansiosas para cuidar de você!",
  },
  {
    id: "confirm_24h",
    title: "Lembrete de Véspera (24h Antes)",
    subtitle: "Pede confirmação ativa da cliente e reconhece respostas SIM para atualizar a agenda",
    badge: "Evita 80% das faltas",
    badgeColor: "rose",
    scheduleInfo: "Disparo automático às 08:00 na véspera",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! ✨ Passando para confirmar seu horário amanhã ([Data]) às [Horário] para [Procedimento] no [Nome do Salão].\n\nPodemos confirmar sua presença?\nResponda *SIM* para confirmar ou *NÃO* para reagendar.",
  },
  {
    id: "reminder_2h",
    title: "Lembrete 2 Horas Antes",
    subtitle: "Avisa que a bancada está pronta e incentiva pontualidade no atendimento",
    badge: "Pontualidade",
    badgeColor: "amber",
    scheduleInfo: "Disparo 2h antes do atendimento",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! Sua bancada já está pronta te esperando! 💖\n\nLembrando que seu horário de [Procedimento] é hoje às [Horário]. Até logo no [Nome do Salão]!",
  },
  {
    id: "post_review",
    title: "Pós-Atendimento & Avaliação 5 Estrelas",
    subtitle: "Enviada após o serviço para atrair novas clientes organicamente pelo Google",
    badge: "Fidelização & Google",
    badgeColor: "purple",
    scheduleInfo: "Disparo 30 minutos pós-serviço",
    enabled: true,
    template:
      "Oi, [Nome da Cliente]! 💖 Foi um enorme prazer cuidar de você hoje no [Nome do Salão]!\n\nSe você amou seu novo visual, deixe 5 estrelas no Google? Seu carinho apoia muito nossa equipe: [Link do Google]",
  },
];

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { isDesktopOpen, openDesktop } = useSidebar();
  const { appointments, clients, updateAppointment } = useSalonData();
  const toast = useToast();

  // ── Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "");
  const [pixKey, setPixKey] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_AUTOMATION_RULES);

  // ── Active View & Tabs (when connected)
  const [activeTab, setActiveTab] = useState<"automations" | "clients" | "history">("automations");
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Client Queue & Dispatch State
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<"all" | "today_tomorrow" | "pending">("today_tomorrow");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // ── Sent logs
  const [sentLogs, setSentLogs] = useState<MessageLogItem[]>([]);

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

  // ── Appointments data
  const todayApts = useMemo(
    () => (appointments || []).filter((a) => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, todayStr],
  );
  const tomorrowApts = useMemo(
    () => (appointments || []).filter((a) => a.date === tomorrowStr).sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, tomorrowStr],
  );

  const pendingTomorrow = useMemo(
    () => tomorrowApts.filter((a) => a.status === "pending").length,
    [tomorrowApts],
  );
  const confirmedToday = useMemo(
    () => todayApts.filter((a) => a.status === "confirmed").length,
    [todayApts],
  );
  const savedRevenue = useMemo(
    () => (appointments || []).filter((a) => a.status === "confirmed").reduce((acc, a) => acc + (a.price || 95), 0),
    [appointments],
  );

  // ── Enrich all clients with their next or recent appointment
  const enrichedClients = useMemo(() => {
    return (clients || []).map((c) => {
      const clientAppts = (appointments || [])
        .filter((a) => a.clientId === c.id || a.clientPhone === c.phone || a.clientName.toLowerCase() === c.name.toLowerCase())
        .sort((a, b) => b.date.localeCompare(a.date));

      const nextAppt = clientAppts.find((a) => a.date >= todayStr);
      const recentAppt = clientAppts[0];

      return {
        ...c,
        upcomingAppointment: nextAppt || null,
        mostRecentAppointment: recentAppt || null,
      };
    });
  }, [clients, appointments, todayStr]);

  // ── Filtered clients list
  const filteredClients = useMemo(() => {
    return enrichedClients.filter((c) => {
      const q = clientSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.upcomingAppointment?.serviceName && c.upcomingAppointment.serviceName.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (clientFilter === "today_tomorrow") {
        const apptDate = c.upcomingAppointment?.date;
        return apptDate === todayStr || apptDate === tomorrowStr;
      }

      if (clientFilter === "pending") {
        return c.upcomingAppointment?.status === "pending";
      }

      return true;
    });
  }, [enrichedClients, clientSearch, clientFilter, todayStr, tomorrowStr]);

  const activeClient = useMemo(() => {
    if (selectedClientId) {
      return enrichedClients.find((c) => c.id === selectedClientId) || null;
    }
    return filteredClients[0] || enrichedClients[0] || null;
  }, [enrichedClients, filteredClients, selectedClientId]);

  // ── Load saved settings & logs
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
      const logsLocal = localStorage.getItem(`bellamais_wa_logs_${user.uid}`);
      if (logsLocal) {
        setSentLogs(JSON.parse(logsLocal));
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

  const addSentLog = (log: Omit<MessageLogItem, "id" | "timestamp">) => {
    const newLog: MessageLogItem = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
    const updated = [newLog, ...sentLogs.slice(0, 49)];
    setSentLogs(updated);
    if (user) {
      try {
        localStorage.setItem(`bellamais_wa_logs_${user.uid}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // ── Check connection status periodically
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
            if (data.phoneNumber) setConnectedPhone(data.phoneNumber);
          }
        }
      } catch {}
    };
    check();
  }, []);

  // ── Fetch QR Code when disconnected
  const fetchQrCode = async () => {
    setIsLoadingQr(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", provider: "baileys", phoneNumber: salonPhone }),
      });
      const data = await res.json();
      if (data.qrCodeBase64) {
        setQrCodeDataUrl(data.qrCodeBase64);
      }
      if (data.connected) {
        setIsConnected(true);
        setConnectedPhone(data.phoneNumber || "WhatsApp Conectado");
      }
    } catch {} finally {
      setIsLoadingQr(false);
    }
  };

  // Auto-fetch QR code if disconnected on page load
  useEffect(() => {
    if (!isConnected && !qrCodeDataUrl) {
      fetchQrCode();
    }
  }, [isConnected]);

  // ── AUTO-RECOGNITION POLLING (O usuário não precisa clicar em "Já escaneei")
  useEffect(() => {
    if (isConnected) return;

    const autoPoll = setInterval(async () => {
      try {
        const res = await fetch("/api/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setIsConnected(true);
            setConnectedPhone(data.phoneNumber || salonPhone || "WhatsApp Conectado");
            setQrCodeDataUrl(null);
            soundEffects.playSuccess();
            toast.success("WhatsApp conectado com sucesso! O robô de automação está pronto.", "Conexão Estabelecida");
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(autoPoll);
  }, [isConnected, salonPhone]);

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
      fetchQrCode();
    } catch {}
  };

  // ── Executar Automação em Massa (Lembretes)
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
        soundEffects.playSuccess();
        toast.success(data.message || "Lembretes disparados com sucesso pelo robô!", "Automação Concluída");
        addSentLog({
          clientName: `${pendingTomorrow || todayApts.length} Clientes (Lote)`,
          clientPhone: "Múltiplos",
          message: "Lembretes de confirmação de agendamento disparados via piloto automático.",
          type: "confirm_24h",
          status: "sent",
        });
      } else {
        toast.warning(data.message || "Verifique a conexão do WhatsApp.", "Aviso");
      }
    } catch {
      toast.error("Erro ao disparar mensagens de automação.", "Falha no Envio");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Disparo individual para uma cliente específica
  const handleSendToClient = async (textToSend?: string) => {
    const text = textToSend || customMessage;
    if (!text.trim() || !activeClient) return;

    setIsSendingMessage(true);
    soundEffects.playClick();
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: activeClient.phone,
          messageText: text,
        }),
      });
      const data = await res.json();
      if (data.sent) {
        soundEffects.playSuccess();
        toast.success(`Mensagem enviada com sucesso para ${activeClient.name}!`, "Enviado");
        setCustomMessage("");
        addSentLog({
          clientName: activeClient.name,
          clientPhone: activeClient.phone,
          message: text,
          type: "manual",
          status: "delivered",
        });
      } else {
        toast.warning(data.message || "Falha ao enviar pelo robô. Verifique se o WhatsApp está conectado.", "Erro no Envio");
      }
    } catch {
      toast.error("Erro de comunicação com o servidor WhatsApp.", "Falha no Envio");
    } finally {
      setIsSendingMessage(false);
    }
  };

  // ── Abrir conversa nativa no WhatsApp Web
  const openDirectWhatsApp = (phone: string, text?: string) => {
    const cleanPhone = (phone || "").replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `https://web.whatsapp.com/send?phone=${fullPhone}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO 1: ESTADO DESCONECTADO (TELA DE CONEXÃO EM DESTAQUE)
  // Se o WhatsApp NÃO está conectado, NÃO exibe telas de chat vazias!
  // Apresenta o QR Code grande, nítido e com auto-carregamento imediato.
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
        <Header title="Conectar WhatsApp" />

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 sm:p-10 shadow-xl max-w-xl w-full text-center relative overflow-hidden">
            {/* Aura sutil decorativa */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7e1639]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <Smartphone size={28} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Conecte o WhatsApp do seu Salão
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 max-w-md mx-auto leading-relaxed">
              Aponte a câmera do WhatsApp para o QR Code abaixo. Ao escanear, o sistema
              reconhecerá <strong>automaticamente</strong> e ativará os lembretes do seu salão.
            </p>

            {/* QR CODE GRANDE (270px) EM DESTAQUE COM AUTO-POLLING */}
            <div className="my-6 p-6 rounded-2xl bg-white dark:bg-stone-900 border border-[var(--card-border)] inline-flex flex-col items-center justify-center shadow-md relative mx-auto">
              {isLoadingQr ? (
                <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                  <RefreshCw size={36} className="animate-spin text-[#7e1639] dark:text-[#e27d9a]" />
                  <span className="text-xs font-semibold text-stone-500">Gerando QR Code Oficial...</span>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="relative">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-xl"
                  />
                  {/* Selo Central Discreto */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 rounded-full bg-white shadow-md border border-stone-200 flex items-center justify-center text-[#7e1639]">
                      <Scissors size={20} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                  <AlertCircle size={36} className="text-amber-500" />
                  <span className="text-xs font-semibold text-stone-500">Clique abaixo para gerar o código</span>
                </div>
              )}

              {/* Status de Escaneamento Automático em Tempo Real */}
              <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aguardando leitura no celular... (Auto-conexão ativa)</span>
              </div>
            </div>

            {/* 3 Passos Simples */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left my-4 pt-2 border-t border-[var(--card-border)] text-xs">
              <div className="p-3 rounded-xl bg-[var(--surface-hover)]">
                <span className="w-5 h-5 rounded-full bg-[#7e1639] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">1</span>
                <p className="font-semibold text-[var(--foreground)]">Abra o WhatsApp</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">No celular que o salão usa para atender.</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-hover)]">
                <span className="w-5 h-5 rounded-full bg-[#7e1639] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">2</span>
                <p className="font-semibold text-[var(--foreground)]">Aparelhos Conectados</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">Toque em Ajustes/Menu e selecione a opção.</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--surface-hover)]">
                <span className="w-5 h-5 rounded-full bg-[#7e1639] text-white flex items-center justify-center text-[10px] font-bold mb-1.5">3</span>
                <p className="font-semibold text-[var(--foreground)]">Aponte a Câmera</p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">Pronto! A tela conectará sozinha na hora.</p>
              </div>
            </div>

            {/* Botão de Atualizar QR Code */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={fetchQrCode}
                disabled={isLoadingQr}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--card-border)] text-xs font-bold text-[var(--foreground)] transition cursor-pointer border border-[var(--card-border)]"
              >
                <RefreshCw size={14} className={isLoadingQr ? "animate-spin" : ""} />
                <span>Atualizar QR Code</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERIZAÇÃO 2: ESTADO CONECTADO (CENTRAL COMPLETA DE AUTOMAÇÕES & CONTATOS)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] text-[var(--foreground)] font-sans">
      <Header title="Central de WhatsApp do Salão" />

      {/* ─── TOPO DE COMANDO & STATUS ATIVO ─────────────────────────────────── */}
      <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 sm:px-6 md:px-8 py-4 shadow-xs">
        <div className="max-w-[1440px] mx-auto flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {!isDesktopOpen && (
                <button
                  type="button"
                  onClick={openDesktop}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[#7e1639] hover:text-white text-[#7e1639] dark:text-[#e27d9a] text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                  title="Abrir menu lateral"
                >
                  <PanelLeft size={16} />
                  <span>Menu</span>
                </button>
              )}

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]">
                    Central de WhatsApp & Automações
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Conectado · {connectedPhone || "WhatsApp Ativo"}</span>
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Lembretes automáticos, confirmações e contato rápido com todas as clientes do salão.
                </p>
              </div>
            </div>

            {/* Ações Globais */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="https://web.whatsapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3.5 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs font-semibold flex items-center gap-1.5 text-[var(--foreground)] hover:border-[#25d366] hover:text-[#25d366] transition cursor-pointer"
                title="Abrir o WhatsApp Web oficial para conversas gerais"
              >
                <ExternalLink size={14} className="text-[#25d366]" />
                <span>Abrir WhatsApp Web Oficial</span>
              </a>

              <button
                type="button"
                onClick={handleRunAutomation}
                disabled={isProcessing}
                className="h-9 px-4 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Zap size={14} className={isProcessing ? "animate-spin" : ""} />
                <span>
                  {isProcessing ? "Disparando..." : `Disparar Lembretes (${pendingTomorrow || todayApts.length} clientes)`}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDisconnect}
                className="h-9 px-3 rounded-xl border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Desconectar este aparelho"
              >
                <LogOut size={14} />
                <span>Desconectar</span>
              </button>
            </div>
          </div>

          {/* Abas e Resumo Operacional */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--card-border)]">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-hover)]">
              <button
                type="button"
                onClick={() => setActiveTab("automations")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "automations"
                    ? "bg-[#7e1639] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Bot size={14} />
                <span>Automações & Lembretes</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("clients")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "clients"
                    ? "bg-[#7e1639] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Users size={14} />
                <span>Fila de Clientes ({filteredClients.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === "history"
                    ? "bg-[#7e1639] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <Clock size={14} />
                <span>Histórico de Disparos ({sentLogs.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <span>Hoje: <strong className="text-emerald-600 dark:text-emerald-400">{confirmedToday} confirmados</strong></span>
              <span>•</span>
              <span>Véspera: <strong className="text-amber-600 dark:text-amber-400">{pendingTomorrow} pendentes</strong></span>
              <span>•</span>
              <span>Protegido: <strong className="text-[#7e1639] dark:text-[#e27d9a]">{formatBRL(savedRevenue)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CORPO PRINCIPAL COM AS ABAS ────────────────────────────────────── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* ═════════════════════════════════════════════════════════════════════
            ABA 1: AUTOMAÇÕES & LEMBRETES INTELIGENTES (EM GRADE HARMONIOSA)
            ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "automations" && (
          <div className="max-w-[1400px] mx-auto space-y-4">
            {/* Banner Compacto de Boas Práticas */}
            <div className="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Piloto Automático de Redução de Faltas
                </span>
                <span className="text-xs text-emerald-900/80 dark:text-emerald-200/80 hidden sm:inline">
                  — Mensagens automáticas com nome da cliente, data e horário para manter a agenda cheia.
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{rules.filter((r) => r.enabled).length} de 4 regras ativas</span>
              </div>
            </div>

            {/* GRADE DE LAYOUT 2x2 ALINHADA COM CARDS COMPACTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              {rules.map((rule) => {
                const badgeClasses = {
                  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
                  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
                  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
                };

                return (
                  <div
                    key={rule.id}
                    className="bg-[var(--card-bg)] rounded-2xl p-4 sm:p-5 border border-[var(--card-border)] shadow-xs transition hover:border-[#7e1639]/40 flex flex-col justify-between h-full group"
                  >
                    <div>
                      {/* Top Header do Card: Ícone + Título + Badge + Switch */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[#7e1639] dark:text-[#e27d9a] flex items-center justify-center shrink-0 shadow-2xs">
                            <Bot size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-[var(--foreground)] tracking-tight">
                                {rule.title}
                              </h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses[rule.badgeColor]}`}>
                                {rule.badge}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-1">
                              {rule.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Switch Liga / Desliga */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = rules.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                            setRules(updated);
                            saveSettings({ rules: updated });
                            soundEffects.playClick();
                            toast.info(`Regra "${rule.title}" ${!rule.enabled ? "ativada" : "pausada"}.`, "Atualizado");
                          }}
                          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                            rule.enabled ? "bg-emerald-600" : "bg-stone-300 dark:bg-stone-700"
                          }`}
                          title={rule.enabled ? "Desativar regra" : "Ativar regra"}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                              rule.enabled ? "left-5" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Pill de Agendamento/Timing */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                        <Clock size={12} className="text-[#7e1639] dark:text-[#e27d9a]" />
                        <span>{rule.scheduleInfo}</span>
                      </div>
                    </div>

                    {/* Balão WhatsApp Compacto */}
                    <div className="mt-3.5 pt-3 border-t border-[var(--card-border)]">
                      <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                        <span>Modelo no WhatsApp:</span>
                        <span className={rule.enabled ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-[var(--muted)]"}>
                          {rule.enabled ? "Ativo" : "Pausado"}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] text-xs text-[var(--foreground)] font-mono leading-relaxed max-h-36 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                        {rule.template}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            ABA 2: FILA DE CLIENTES DO SALÃO & DISPAROS RÁPIDOS
            ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "clients" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna da Esquerda: Lista de Clientes (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Filtros e Busca */}
              <div className="bg-[var(--card-bg)] p-3.5 rounded-2xl border border-[var(--card-border)] shadow-xs space-y-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Pesquisar cliente por nome ou WhatsApp..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] outline-none focus:border-[#7e1639]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setClientFilter("today_tomorrow")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                      clientFilter === "today_tomorrow"
                        ? "bg-[#7e1639] text-white"
                        : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Hoje & Amanhã
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientFilter("pending")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                      clientFilter === "pending"
                        ? "bg-amber-600 text-white"
                        : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Pendentes
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                      clientFilter === "all"
                        ? "bg-[#7e1639] text-white"
                        : "bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Todas ({clients.length})
                  </button>
                </div>
              </div>

              {/* Lista Scrollável de Clientes */}
              <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xs divide-y divide-[var(--card-border)] overflow-y-auto max-h-[560px]">
                {filteredClients.map((c) => {
                  const isSelected = activeClient?.id === c.id;
                  const hasUpcoming = Boolean(c.upcomingAppointment);

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClientId(c.id);
                        soundEffects.playClick();
                      }}
                      className={`p-3.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary-light)] border-l-4 border-[#7e1639]"
                          : "hover:bg-[var(--surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#7e1639] text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {c.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-[var(--foreground)] truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--muted)] truncate">{c.phone}</p>
                          {c.upcomingAppointment ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                              <Calendar size={10} />
                              {c.upcomingAppointment.date === todayStr ? "Hoje" : "Amanhã"} às {c.upcomingAppointment.time} · {c.upcomingAppointment.serviceName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[var(--muted)]">Sem agendamento ativo</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight size={15} className="text-[var(--muted)] shrink-0" />
                    </div>
                  );
                })}

                {filteredClients.length === 0 && (
                  <div className="p-8 text-center text-xs text-[var(--muted)]">
                    Nenhuma cliente encontrada neste filtro.
                  </div>
                )}
              </div>
            </div>

            {/* Coluna da Direita: Ficha da Cliente & Disparos Rápidos (7 cols) */}
            <div className="lg:col-span-7">
              {activeClient ? (
                <div className="bg-[var(--card-bg)] rounded-2xl p-5 border border-[var(--card-border)] shadow-xs space-y-5">
                  {/* Cabeçalho da Cliente */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
                    <div>
                      <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">
                        {activeClient.name}
                      </h2>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        WhatsApp: <strong className="text-[var(--foreground)]">{activeClient.phone}</strong> • {activeClient.visits || 0} visitas registradas
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openDirectWhatsApp(activeClient.phone)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink size={13} />
                      <span>Abrir no WhatsApp</span>
                    </button>
                  </div>

                  {/* Agendamento Atual da Cliente (se houver) */}
                  {activeClient.upcomingAppointment && (
                    <div className="p-4 rounded-xl bg-[var(--surface-hover)] border border-[var(--card-border)] flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">
                          Agendamento Vinculado
                        </span>
                        <p className="text-xs font-bold text-[var(--foreground)] mt-0.5">
                          {activeClient.upcomingAppointment.serviceName} — {activeClient.upcomingAppointment.date.split("-").reverse().join("/")} às {activeClient.upcomingAppointment.time}
                        </p>
                        <p className="text-[11px] text-[var(--muted)]">
                          Profissional: {activeClient.upcomingAppointment.professionalName || "Salão"} • Valor: {formatBRL(activeClient.upcomingAppointment.price || 0)}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        activeClient.upcomingAppointment.status === "confirmed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}>
                        {activeClient.upcomingAppointment.status === "confirmed" ? "Confirmado" : "Pendente"}
                      </span>
                    </div>
                  )}

                  {/* Botões de Ação Rápida com Modelos Prontos */}
                  <div>
                    <label className="text-xs font-bold text-[var(--foreground)] block mb-2">
                      Enviar Modelo Rápido de 1 Clique:
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Olá, ${activeClient.name.split(" ")[0]}! ✨ Passando para confirmar seu horário ${
                            activeClient.upcomingAppointment ? `no dia ${activeClient.upcomingAppointment.date.split("-").reverse().join("/")} às ${activeClient.upcomingAppointment.time}` : "em nosso salão"
                          } para ${activeClient.upcomingAppointment?.serviceName || "seu procedimento"}. Podemos confirmar sua presença?`;
                          handleSendToClient(msg);
                        }}
                        disabled={isSendingMessage}
                        className="p-3 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary-light)] text-[var(--foreground)] hover:text-[#7e1639] border border-[var(--card-border)] text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-bold">Confirmação de Horário</p>
                          <p className="text-[11px] text-[var(--muted)]">Pede confirmação ativa (Sim/Não)</p>
                        </div>
                        <Send size={14} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Oi, ${activeClient.name.split(" ")[0]}! 💖 Sentimos muito sua falta aqui no ${salonName}! Que tal agendar um momento relaxante para cuidar de você esta semana?`;
                          handleSendToClient(msg);
                        }}
                        disabled={isSendingMessage}
                        className="p-3 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary-light)] text-[var(--foreground)] hover:text-[#7e1639] border border-[var(--card-border)] text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-bold">Lembrete de Retorno (+30 dias)</p>
                          <p className="text-[11px] text-[var(--muted)]">Reativar cliente com carinho</p>
                        </div>
                        <HeartHandshake size={14} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
                      </button>

                      {pixKey && (
                        <button
                          type="button"
                          onClick={() => {
                            const msg = `Olá, ${activeClient.name.split(" ")[0]}! Segue a nossa chave Pix do ${salonName} para pagamento:\n\n*Chave Pix:* ${pixKey}\n\nAssim que fizer o envio, nos mande o comprovante por aqui! ✨`;
                            handleSendToClient(msg);
                          }}
                          disabled={isSendingMessage}
                          className="p-3 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary-light)] text-[var(--foreground)] hover:text-[#7e1639] border border-[var(--card-border)] text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-bold">Enviar Chave Pix</p>
                            <p className="text-[11px] text-[var(--muted)]">{pixKey}</p>
                          </div>
                          <Copy size={14} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Oi, ${activeClient.name.split(" ")[0]}! 💖 Foi maravilhoso atender você no ${salonName}! Se puder avaliar nosso salão com 5 estrelas no Google, ficaremos muito felizes!`;
                          handleSendToClient(msg);
                        }}
                        disabled={isSendingMessage}
                        className="p-3 rounded-xl bg-[var(--surface-hover)] hover:bg-[var(--primary-light)] text-[var(--foreground)] hover:text-[#7e1639] border border-[var(--card-border)] text-xs font-semibold text-left transition flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-bold">Pedir Avaliação 5 Estrelas</p>
                          <p className="text-[11px] text-[var(--muted)]">Agradecimento pós-serviço</p>
                        </div>
                        <Gift size={14} className="text-[#7e1639] dark:text-[#e27d9a] shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Campo para Digitar Mensagem Personalizada Avulsa */}
                  <div className="pt-2 border-t border-[var(--card-border)]">
                    <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                      Ou digite uma mensagem personalizada:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendToClient();
                          }
                        }}
                        placeholder={`Digite aqui a mensagem para ${activeClient.name}...`}
                        className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] outline-none focus:border-[#7e1639]"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendToClient()}
                        disabled={!customMessage.trim() || isSendingMessage}
                        className="px-4 py-2.5 rounded-xl bg-[#7e1639] hover:bg-[#64112e] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        <Send size={14} className={isSendingMessage ? "animate-spin" : ""} />
                        <span>Enviar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--card-bg)] rounded-2xl p-12 text-center border border-[var(--card-border)] text-[var(--muted)] text-xs">
                  Selecione uma cliente na coluna ao lado para visualizar os dados e disparar mensagens.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            ABA 3: HISTÓRICO DE DISPAROS DO ROBÔ
            ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Histórico de Mensagens Enviadas</h2>
                <p className="text-xs text-[var(--muted)]">Registro das notificações e lembretes disparados recentemente.</p>
              </div>

              {sentLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSentLogs([]);
                    if (user) localStorage.removeItem(`bellamais_wa_logs_${user.uid}`);
                    toast.info("Histórico limpo.", "Limpeza");
                  }}
                  className="text-xs text-red-500 hover:underline cursor-pointer"
                >
                  Limpar histórico
                </button>
              )}
            </div>

            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-xs divide-y divide-[var(--card-border)] overflow-hidden">
              {sentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--foreground)]">{log.clientName}</span>
                      <span className="text-[11px] text-[var(--muted)]">({log.clientPhone})</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCheck size={12} /> Enviado
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted)] font-mono leading-relaxed">{log.message}</p>
                  </div>
                  <span className="text-[11px] text-[var(--muted)] shrink-0">{log.timestamp}</span>
                </div>
              ))}

              {sentLogs.length === 0 && (
                <div className="p-12 text-center text-xs text-[var(--muted)]">
                  Nenhum disparo registrado ainda. Conforme os lembretes forem enviados, o registro aparecerá aqui.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
