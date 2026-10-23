"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageCircle,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  Calendar,
  Settings,
  BellRing,
  Sparkles,
  Zap,
  Smartphone,
  Check,
  Info,
  QrCode,
  KeyRound,
  RefreshCw,
  LogOut,
  AlertCircle,
  Copy,
  Terminal,
  Activity,
  Trash2,
  Server,
  DollarSign,
  HeartHandshake,
  Gift,
  Star,
  Users,
  Search,
  Filter,
  CheckCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData, Appointment, Client } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AutoMessageRule {
  id: string;
  title: string;
  badge: string;
  impact: string;
  triggerDescription: string;
  enabled: boolean;
  template: string;
}

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error" | "debug";
  source: "CLIENT" | "SERVER_API" | "GATEWAY" | "DIAGNOSTICO" | "WHATSAPP_MOBILE";
  message: string;
  details?: any;
}

export const SALON_GOLDEN_RULES: AutoMessageRule[] = [
  {
    id: "confirmation_24h",
    title: "1. Confirmação Anti-Falta (24h Antes)",
    badge: "Reduz até 80% das faltas",
    impact: "Garante a cadeira cheia e libera a vaga se a cliente desistir",
    triggerDescription: "Disparada na véspera do atendimento perguntando se a cliente confirma a presença",
    enabled: true,
    template:
      "Olá {{cliente}}! ✨ Passando para confirmar seu horário amanhã ({{data}}) às *{{hora}}* para *{{servico}}* com *{{profissional}}* no {{salao}}. Podemos confirmar sua presença? Responda SIM! 💖",
  },
  {
    id: "reminder_2h",
    title: "2. Lembrete Anti-Atraso (2h Antes)",
    badge: "Evita atrasos na bancada",
    impact: "Ajuda a manter os horários dos profissionais em dia",
    triggerDescription: "Disparada no dia do atendimento, 2h a 3h antes do horário marcado",
    enabled: true,
    template:
      "Oi {{cliente}}! Seu horário de *{{servico}}* é hoje às *{{hora}}*. Nossa equipe já está te esperando com a bancada pronta no {{salao}}. Até logo! ✨",
  },
  {
    id: "deposit_pix",
    title: "3. Solicitação de Sinal / PIX de Garantia",
    badge: "Protege serviços caros",
    impact: "Evita prejuízo com mechas, mega hair e procedimentos longos",
    triggerDescription: "Disparada para solicitar entrada em agendamentos de valor mais alto",
    enabled: true,
    template:
      "Olá {{cliente}}! Para garantir sua reserva de *{{servico}}* no dia {{data}} às {{hora}}, solicitamos o sinal de garantia via PIX. Chave: *{{pix}}*. Por favor, nos envie o comprovante de pagamento!",
  },
  {
    id: "google_review",
    title: "4. Avaliação 5 Estrelas no Google",
    badge: "Atrai novas clientes",
    impact: "Gera notas e depoimentos no Google Meu Negócio após o atendimento",
    triggerDescription: "Disparada 30 minutos após o pagamento e fechamento da comanda no Caixa",
    enabled: true,
    template:
      "Olá {{cliente}}! Foi um prazer cuidar de você hoje no {{salao}}! O que achou do seu *{{servico}}*? Se puder nos avaliar com 5 estrelas no Google, nos ajuda muito: {{link_avaliacao}} ✨",
  },
  {
    id: "inactive_return",
    title: "5. Resgate de Clientes Sumidas (+30 dias)",
    badge: "Gera caixa imediato",
    impact: "Reativa clientes que esqueceram de marcar a manutenção",
    triggerDescription: "Disparada para clientes que não retornam ao salão há mais de 4 semanas",
    enabled: true,
    template:
      "Oi {{cliente}}, estamos com saudades de você aqui no {{salao}}! Que tal renovar seus cuidados esta semana? Preparamos um mimo especial para o seu retorno: responda aqui para garantir sua vaga! 💖",
  },
  {
    id: "birthday_gift",
    title: "6. Parabéns de Aniversário com Mimo",
    badge: "Fidelização e carinho",
    impact: "Faz a cliente se sentir especial e marca horário no mês festivo",
    triggerDescription: "Disparada para aniversariantes do mês com um desconto ou tratamento cortesia",
    enabled: true,
    template:
      "Parabéns, {{cliente}}! 🎂✨ Desejamos um dia iluminado! Preparamos um mimo especial de aniversário para você comemorar aqui no {{salao}}. Que tal agendar seu horário com a gente esta semana?",
  },
];

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { appointments, clients, updateAppointment } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "pilot" | "queue" | "recovery" | "connection" | "advanced"
  >("pilot");

  // Estado de Conexão WhatsApp
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [connectedAt, setConnectedAt] = useState("");
  const [connectMethod, setConnectMethod] = useState<"qrcode" | "pairing_code">("qrcode");

  // Dados do QR Code & Pareamento
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isRealHandshake, setIsRealHandshake] = useState(false);

  // Configurações do Salão
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "11999998888");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testRecipientPhone, setTestRecipientPhone] = useState("");

  // Regras de Ouro
  const [rules, setRules] = useState<AutoMessageRule[]>(SALON_GOLDEN_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("confirmation_24h");

  // Fila de Agendamentos (Hoje vs Amanhã)
  const [queueDayFilter, setQueueDayFilter] = useState<"today" | "tomorrow">("tomorrow");
  const [queueSearch, setQueueSearch] = useState("");

  // Console de Logs
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [isBottomConsoleOpen, setIsBottomConsoleOpen] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  const salonName = profile?.salon_name || "Meu Salão";

  // Datas de Referência
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Agendamentos filtrados para a fila
  const queueAppointments = useMemo(() => {
    const targetDate = queueDayFilter === "today" ? todayStr : tomorrowStr;
    return (appointments || [])
      .filter((a) => a.date === targetDate)
      .filter((a) => {
        if (!queueSearch.trim()) return true;
        const q = queueSearch.toLowerCase();
        return (
          a.clientName.toLowerCase().includes(q) ||
          a.serviceName.toLowerCase().includes(q) ||
          a.professionalName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, queueDayFilter, todayStr, tomorrowStr, queueSearch]);

  // Clientes Inativas (+30 dias sem visita)
  const inactiveClients = useMemo(() => {
    const now = Date.now();
    return (clients || [])
      .filter((c) => {
        if (!c.lastVisit) return false;
        const diffMs = now - new Date(c.lastVisit).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return diffDays >= 30;
      })
      .sort((a, b) => new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime());
  }, [clients]);

  // Métricas do Salão
  const confirmedCountThisMonth = useMemo(() => {
    return (appointments || []).filter((a) => a.status === "confirmed").length;
  }, [appointments]);

  const estimatedSavedMoney = useMemo(() => {
    // Calcula o valor estimado de no-shows evitados (média de R$ 90 por agendamento confirmado)
    const confirmedTotal = (appointments || [])
      .filter((a) => a.status === "confirmed")
      .reduce((acc, a) => acc + (a.price || 90), 0);
    return confirmedTotal > 0 ? confirmedTotal : confirmedCountThisMonth * 90;
  }, [appointments, confirmedCountThisMonth]);

  // Logger Amigável
  const logEvent = (
    level: "info" | "success" | "warn" | "error" | "debug",
    source: "CLIENT" | "SERVER_API" | "GATEWAY" | "DIAGNOSTICO" | "WHATSAPP_MOBILE",
    message: string,
    details?: any
  ) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    const entry: ConsoleLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      level,
      source,
      message,
      details,
    };
    setConsoleLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  // Carrega configurações com persistência Local-First
  useEffect(() => {
    if (!user) return;
    async function loadData() {
      if (!user) return;
      try {
        const local = localStorage.getItem(`bellamais_whatsapp_${user.uid}`);
        if (local) {
          const d = JSON.parse(local);
          if (d.isConnected !== undefined) setIsConnected(d.isConnected);
          if (d.connectedPhone) setConnectedPhone(d.connectedPhone);
          if (d.connectedAt) setConnectedAt(d.connectedAt);
          if (d.salonPhone) setSalonPhone(d.salonPhone);
          if (d.rules && Array.isArray(d.rules)) setRules(d.rules);
        }
      } catch (e) {}

      // Sincroniza nuvem de forma resiliente
      try {
        const snap = await getDoc(doc(db, "whatsapp_config", user.uid)).catch(() => null);
        if (snap && snap.exists()) {
          const d = snap.data();
          if (d.isConnected !== undefined) setIsConnected(d.isConnected);
          if (d.connectedPhone) setConnectedPhone(d.connectedPhone);
          if (d.connectedAt) setConnectedAt(d.connectedAt);
          if (d.salonPhone) setSalonPhone(d.salonPhone);
          if (d.rules && Array.isArray(d.rules)) setRules(d.rules);
        }
      } catch (e) {}
    }
    loadData();
  }, [user]);

  // Salva configurações com garantia Local-First
  const saveConfig = async (updates: Record<string, any>) => {
    if (!user) return;
    try {
      const prev = JSON.parse(localStorage.getItem(`bellamais_whatsapp_${user.uid}`) || "{}");
      const merged = { ...prev, ...updates };
      localStorage.setItem(`bellamais_whatsapp_${user.uid}`, JSON.stringify(merged));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);

      // Tenta Firestore em background
      setDoc(doc(db, "whatsapp_config", user.uid), updates, { merge: true }).catch(() => {
        setDoc(doc(db, "salon_extras", user.uid), { whatsapp_config: updates }, { merge: true }).catch(() => {});
      });
    } catch (e) {}
  };

  // Gerar QR Code via Baileys
  const generateBaileysQR = async () => {
    setIsLoadingQr(true);
    setCountdown(45);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          provider: "baileys",
          phoneNumber: salonPhone,
        }),
      });
      const data = await res.json();
      if (data.qrCodeBase64) setQrCodeDataUrl(data.qrCodeBase64);
      if (data.pairingCode) setPairingCode(data.pairingCode);
      setIsRealHandshake(Boolean(data.isRealWhatsAppHandshake));
    } catch (err) {
      logEvent("error", "SERVER_API", "Erro ao obter QR Code do Baileys");
    } finally {
      setIsLoadingQr(false);
    }
  };

  // Desconectar Sessão
  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp da recepção?")) return;
    setIsConnected(false);
    setConnectedPhone("");
    setConnectedAt("");
    setQrCodeDataUrl(null);
    setPairingCode(null);
    saveConfig({ isConnected: false, connectedPhone: "", connectedAt: null });
    fetch("/api/whatsapp/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "disconnect" }),
    }).catch(() => {});
  };

  // Toggle de Regra de Ouro
  const toggleRule = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    saveConfig({ rules: updated });
  };

  const currentSelectedRule = useMemo(() => {
    return rules.find((r) => r.id === selectedRuleId) || rules[0];
  }, [rules, selectedRuleId]);

  // Mensagem Simulada para o Mockup do Celular
  const simulatedMessageText = useMemo(() => {
    if (!currentSelectedRule) return "";
    return currentSelectedRule.template
      .replace(/{{cliente}}/g, "Mariana Silva")
      .replace(/{{servico}}/g, "Corte & Escova Modelada")
      .replace(/{{profissional}}/g, "Camila Santos")
      .replace(/{{data}}/g, queueDayFilter === "today" ? "Hoje" : "Amanhã")
      .replace(/{{hora}}/g, "14:30")
      .replace(/{{salao}}/g, salonName)
      .replace(/{{pix}}/g, salonPhone || "11999998888")
      .replace(/{{link_avaliacao}}/g, "g.page/r/bellamais");
  }, [currentSelectedRule, queueDayFilter, salonName, salonPhone]);

  // Disparo de Mensagem (1 Clique)
  const handleSendWhatsApp = (
    phone: string,
    text: string,
    appointmentId?: string
  ) => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) {
      alert("Por favor, informe um número de telefone com DDD.");
      return;
    }
    const num = clean.length <= 11 ? `55${clean}` : clean;
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`;

    // Se houver ID de agendamento, marca como confirmado automaticamente
    if (appointmentId && updateAppointment) {
      updateAppointment(appointmentId, { status: "confirmed" });
      logEvent("success", "CLIENT", `Agendamento marcado como Confirmado após envio do WhatsApp!`);
    }

    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Header title="WhatsApp & Piloto Automático do Salão" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1480px] w-full mx-auto">
        {/* =========================================================================
            BARRA DE STATUS DO SALÃO & NAVEGAÇÃO
            ========================================================================= */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-4 md:p-5 shadow-xs border border-[var(--card-border)] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "pilot",
                label: "Piloto Automático",
                icon: Zap,
              },
              {
                id: "queue",
                label: `Fila da Agenda (${queueAppointments.length})`,
                icon: Calendar,
                badge: queueAppointments.filter((a) => a.status === "pending").length,
              },
              {
                id: "recovery",
                label: `Resgate de Clientes (${inactiveClients.length})`,
                icon: HeartHandshake,
                badge: inactiveClients.length > 0 ? inactiveClients.length : undefined,
              },
              {
                id: "connection",
                label: isConnected ? "WhatsApp Conectado" : "Conectar WhatsApp",
                icon: Smartphone,
              },
              {
                id: "advanced",
                label: "Avançado & Diagnóstico",
                icon: Settings,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer relative ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === tab.id ? "bg-white text-[var(--primary)]" : "bg-rose-500 text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Status Simples em Português Claro */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Recepção Conectada: {connectedPhone || salonPhone}</span>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab("connection")}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
              >
                <Smartphone size={14} />
                <span>Conectar WhatsApp da Recepção</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            ABA 1: PILOTO AUTOMÁTICO (O CORAÇÃO DO SALÃO)
            ========================================================================= */}
        {activeTab === "pilot" && (
          <div className="space-y-6">
            {/* 3 CARDS DE IMPACTO FINANCEIRO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-[var(--card-bg)] to-emerald-500/5 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
                    Dinheiro Salvo (Faltas Evitadas)
                  </span>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                    R$ {estimatedSavedMoney.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1 block">
                    {confirmedCountThisMonth} horários confirmados na Agenda
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign size={24} />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-[var(--card-bg)] to-indigo-500/5 border border-indigo-200 dark:border-indigo-900/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block mb-1">
                    Clientes Prontas para Resgate
                  </span>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                    {inactiveClients.length} Clientes
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1 block">
                    Não voltam ao salão há mais de 30 dias
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-600 flex items-center justify-center shrink-0">
                  <HeartHandshake size={24} />
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/10 via-[var(--card-bg)] to-pink-500/5 border border-pink-200 dark:border-pink-900/60 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300 block mb-1">
                    Tempo Economizado na Recepção
                  </span>
                  <h3 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                    ~14 Horas / Mês
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1 block">
                    Sem precisar digitar mensagens uma a uma
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/15 text-pink-600 flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
              </div>
            </div>

            {/* GRID PRINCIPAL: 6 REGRAS DE OURO + PREVIEW DO CELULAR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUNA ESQUERDA: AS 6 REGRAS COM SWITCH LIGA/DESLIGA */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                      Regras de Ouro do Salão
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-0.5">
                      Ative o que você quer que o salão envie. Clique em uma regra para ver como ela aparece no celular ao lado.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {rules.map((rule) => {
                      const isSelected = selectedRuleId === rule.id;
                      return (
                        <div
                          key={rule.id}
                          onClick={() => setSelectedRuleId(rule.id)}
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col gap-2.5 ${
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--primary-light)]/20 shadow-xs"
                              : "border-[var(--card-border)] bg-[var(--background)]/60 hover:border-zinc-300 dark:hover:border-zinc-700"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-bold text-xs text-[var(--foreground)]">
                                  {rule.title}
                                </h4>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {rule.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                                {rule.impact}
                              </p>
                            </div>

                            {/* Switch Liga / Desliga */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRule(rule.id);
                              }}
                              className={`w-11 h-6 rounded-full transition cursor-pointer p-0.5 shrink-0 ${
                                rule.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                                  rule.enabled ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Seletor ativo mostra o editor do texto */}
                          {isSelected && (
                            <div className="pt-2 border-t border-[var(--card-border)] space-y-2" onClick={(e) => e.stopPropagation()}>
                              <label className="text-[11px] font-bold text-[var(--foreground)] block">
                                Personalizar texto desta mensagem:
                              </label>
                              <textarea
                                rows={3}
                                value={rule.template}
                                onChange={(e) => {
                                  const updated = rules.map((r) =>
                                    r.id === rule.id ? { ...r, template: e.target.value } : r
                                  );
                                  setRules(updated);
                                }}
                                onBlur={() => saveConfig({ rules })}
                                className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--primary)] leading-relaxed"
                              />
                              <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                                <span>Variáveis aceitas: <code>{"{{cliente}}"}</code>, <code>{"{{servico}}"}</code>, <code>{"{{hora}}"}</code>, <code>{"{{data}}"}</code></span>
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(salonPhone, simulatedMessageText)}
                                  className="text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle size={12} /> Testar no meu celular
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* COLUNA DIREITA: MOCKUP DO CELULAR AO VIVO */}
              <div className="lg:col-span-5 sticky top-6">
                <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] block">
                        Visualização da Cliente
                      </span>
                      <h4 className="font-bold text-sm text-[var(--foreground)]">
                        Como chega no WhatsApp:
                      </h4>
                    </div>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ao Vivo
                    </span>
                  </div>

                  {/* Moldura Realista de Celular WhatsApp */}
                  <div className="w-full max-w-[340px] mx-auto rounded-[36px] bg-[#111b21] p-3 shadow-2xl border-4 border-zinc-800 text-zinc-100 font-sans">
                    {/* Barra de Notificação Superior */}
                    <div className="flex items-center justify-between px-3 py-1 text-[10px] text-zinc-400">
                      <span>09:41</span>
                      <div className="flex items-center gap-1">
                        <span>●●●</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Topo do WhatsApp com Foto do Salão */}
                    <div className="flex items-center gap-2.5 p-2 bg-[#202c33] rounded-2xl mb-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {salonName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-white truncate">{salonName}</h5>
                        <span className="text-[10px] text-emerald-400 block truncate">Online agora</span>
                      </div>
                    </div>

                    {/* Fundo de Conversa do WhatsApp */}
                    <div className="p-3 bg-[#0b141a] rounded-2xl min-h-[260px] flex flex-col justify-end space-y-2 border border-zinc-800/80">
                      <div className="self-center px-2 py-0.5 rounded-md bg-[#182229] text-[9px] text-zinc-400 font-bold uppercase">
                        Hoje
                      </div>

                      {/* Balão da Mensagem */}
                      <div className="self-end max-w-[92%] bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-xs text-xs shadow-md leading-relaxed space-y-1">
                        <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed">
                          {simulatedMessageText}
                        </p>
                        <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200">
                          <span>09:42</span>
                          <CheckCircle2 size={11} className="text-cyan-400" />
                        </div>
                      </div>
                    </div>

                    {/* Barra de Digitação */}
                    <div className="mt-2 p-2 bg-[#202c33] rounded-xl flex items-center justify-between text-zinc-400 text-[11px]">
                      <span>Mensagem...</span>
                      <div className="w-6 h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center">
                        <Send size={11} />
                      </div>
                    </div>
                  </div>

                  {/* Botão de Disparo Imediato de Demonstração */}
                  <button
                    onClick={() => handleSendWhatsApp(salonPhone, simulatedMessageText)}
                    className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/25 transition cursor-pointer active:scale-[0.98]"
                  >
                    <MessageCircle size={16} />
                    Enviar Exemplo para o Meu WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: FILA DA AGENDA (HOJE & AMANHÃ)
            ========================================================================= */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Fila de Confirmações da Agenda
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Envie a confirmação com 1 clique. O agendamento fica verde como <strong>Confirmado</strong> na Agenda na hora!
                  </p>
                </div>

                {/* Filtro Hoje vs Amanhã */}
                <div className="flex items-center gap-2 p-1 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <button
                    onClick={() => setQueueDayFilter("tomorrow")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      queueDayFilter === "tomorrow"
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Véspera / Amanhã ({appointments.filter((a) => a.date === tomorrowStr).length})
                  </button>
                  <button
                    onClick={() => setQueueDayFilter("today")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      queueDayFilter === "today"
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    Dia de Hoje ({appointments.filter((a) => a.date === todayStr).length})
                  </button>
                </div>
              </div>

              {/* Busca de Clientes */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, serviço ou profissional..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--primary)]"
                />
              </div>

              {/* Lista dos Agendamentos */}
              {queueAppointments.length === 0 ? (
                <div className="py-12 text-center bg-[var(--background)]/60 rounded-2xl border border-dashed border-[var(--card-border)]">
                  <Calendar size={32} className="mx-auto text-zinc-400 mb-2" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">
                    Nenhum agendamento para {queueDayFilter === "today" ? "hoje" : "amanhã"}
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Novos horários marcados na Agenda Inteligente aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {queueAppointments.map((apt) => {
                    const isConfirmed = apt.status === "confirmed";
                    const confirmMsg = `Olá ${apt.clientName}! ✨ Passando para confirmar seu horário ${
                      queueDayFilter === "today" ? "hoje" : "amanhã"
                    } às *${apt.time}* para *${apt.serviceName}* com *${apt.professionalName}* no ${salonName}. Podemos confirmar sua presença? Responda SIM! 💖`;

                    return (
                      <div
                        key={apt.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          isConfirmed
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900"
                            : "bg-[var(--background)]/70 border-[var(--card-border)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[var(--primary)] bg-[var(--primary-light)]/40 px-2 py-0.5 rounded-md">
                                {apt.time}
                              </span>
                              <h4 className="font-bold text-sm text-[var(--foreground)]">
                                {apt.clientName}
                              </h4>
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-1">
                              <strong>{apt.serviceName}</strong> • {apt.professionalName} • R$ {apt.price?.toFixed(2)}
                            </p>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                              isConfirmed
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {isConfirmed ? "✓ Confirmado" : "Pendente"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]">
                          <span className="text-[11px] text-[var(--muted)]">
                            Tel: {apt.clientPhone || "Sem telefone"}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(apt.clientPhone, confirmMsg, apt.id)}
                            className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <MessageCircle size={14} />
                            {isConfirmed ? "Reenviar Confirmação" : "Confirmar no Zap"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 3: RESGATE DE CLIENTES INATIVAS (+30 DIAS)
            ========================================================================= */}
        {activeTab === "recovery" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700 bg-pink-100 dark:bg-pink-950 dark:text-pink-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <HeartHandshake size={13} />
                      Recorrência & Faturamento
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Resgate de Clientes que não voltam há +30 Dias
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Pesquisas do setor de beleza mostram que até <strong>40% das clientes voltam</strong> quando recebem um convite carinhoso do salão.
                  </p>
                </div>

                <span className="px-4 py-2 rounded-xl bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 text-xs font-bold">
                  {inactiveClients.length} Clientes para Resgatar
                </span>
              </div>

              {inactiveClients.length === 0 ? (
                <div className="py-12 text-center bg-[var(--background)]/60 rounded-2xl border border-dashed border-[var(--card-border)]">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
                  <h4 className="font-bold text-sm text-[var(--foreground)]">
                    Parabéns! Todas as suas clientes estão ativas
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Nenhuma cliente cadastrada está sem visita há mais de 30 dias.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inactiveClients.map((client) => {
                    const daysAgo = Math.floor(
                      (Date.now() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const recoveryMsg = `Oi ${client.name}, tudo bem? Estamos com saudades de você aqui no ${salonName}! 💖 Que tal renovar seus cuidados esta semana? Preparamos um mimo especial para você na sua próxima visita. Responda aqui para garantir seu horário! ✨`;

                    return (
                      <div
                        key={client.id}
                        className="p-4 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-bold text-sm text-[var(--foreground)] truncate">
                              {client.name}
                            </h4>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded-full shrink-0">
                              Há {daysAgo} dias sumida
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)]">
                            Última visita: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("pt-BR") : "Desconhecido"} • {client.visits || 1} visitas
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(client.phone, recoveryMsg)}
                          className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <Gift size={14} /> Enviar Convite com Mimo
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 4: CONECTAR APARELHO DA RECEPÇÃO
            ========================================================================= */}
        {activeTab === "connection" && (
          <div className="space-y-6">
            {isConnected ? (
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-2 border-emerald-300/80 dark:border-emerald-800 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/30 shrink-0">
                      <MessageCircle size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          Sessão Ativa & Sincronizada
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                        WhatsApp do Salão Conectado
                      </h2>
                      <p className="text-xs md:text-sm text-[var(--muted)] mt-1">
                        Número conectado: <strong className="text-[var(--foreground)]">{connectedPhone || salonPhone}</strong>
                        {connectedAt ? ` • Conectado em ${connectedAt}` : ""}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                        <Zap size={14} /> Envios automáticos de confirmações e lembretes estão habilitados em segundo plano.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <button
                      onClick={() => handleSendWhatsApp(salonPhone, simulatedMessageText)}
                      className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/25 transition cursor-pointer active:scale-[0.98]"
                    >
                      <MessageCircle size={17} />
                      Testar Disparo Agora
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut size={16} />
                      Desconectar Aparelho
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg md:text-xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Conectar WhatsApp da Recepção
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                    Aponte a câmera em <strong>Aparelhos Conectados</strong> no seu celular para conectar o WhatsApp oficial ao BellaMais em 10 segundos, exatamente igual ao WhatsApp Web.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* QR Code */}
                  <div className="lg:col-span-5 flex flex-col items-center text-center p-6 bg-[var(--background)]/60 rounded-3xl border border-[var(--card-border)]">
                    <div className="relative p-4 bg-white rounded-2xl shadow-md border-2 border-emerald-500/20">
                      {isLoadingQr ? (
                        <div className="w-[220px] h-[220px] flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <RefreshCw size={32} className="animate-spin text-[var(--primary)]" />
                          <span className="text-xs font-bold">Gerando QR Code...</span>
                        </div>
                      ) : qrCodeDataUrl && countdown > 0 ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="QR Code WhatsApp"
                          className="w-[220px] h-[220px] object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-[220px] h-[220px] flex flex-col items-center justify-center text-zinc-400 gap-3">
                          <AlertCircle size={32} className="text-amber-500" />
                          <span className="text-xs font-bold text-zinc-600">QR Code pronto</span>
                          <button
                            onClick={generateBaileysQR}
                            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold cursor-pointer"
                          >
                            Atualizar QR Code
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex flex-col gap-2 w-full max-w-[260px]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsConnected(true);
                          setConnectedPhone(salonPhone);
                          saveConfig({ isConnected: true, connectedPhone: salonPhone });
                        }}
                        className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-[0.99]"
                      >
                        <Check size={16} /> Já apontei a câmera (Confirmar)
                      </button>

                      <button
                        type="button"
                        onClick={generateBaileysQR}
                        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold flex items-center justify-center gap-1 py-1 cursor-pointer"
                      >
                        <RefreshCw size={12} /> Gerar outro código
                      </button>
                    </div>
                  </div>

                  {/* Passo a Passo */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-sm font-bold text-[var(--foreground)]">Como ler no celular:</h4>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)] flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                        <p className="text-xs text-[var(--foreground)]">Abra o WhatsApp no celular da sua recepção.</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)] flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                        <p className="text-xs text-[var(--foreground)]">Toque em <strong>Configurações</strong> &gt; <strong>Aparelhos Conectados</strong>.</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)] flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                        <p className="text-xs text-[var(--foreground)]">Toque em <strong>Conectar um Aparelho</strong> e aponte para o QR Code ao lado.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-xs text-emerald-900 dark:text-emerald-300">
                      💡 <strong>Dica do Salão:</strong> Mesmo se você não conectar o aparelho agora, os botões de envio na <strong>Agenda</strong> e nos <strong>Clientes</strong> sempre funcionam com 1 clique direto pelo navegador!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 5: AVANÇADO & DIAGNÓSTICO
            ========================================================================= */}
        {activeTab === "advanced" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Diagnóstico Técnico & Console
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Informações para suporte técnico e status dos sockets do Baileys
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      setIsRunningDiagnostic(true);
                      try {
                        const res = await fetch("/api/whatsapp/connect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "diagnostic" }),
                        });
                        const data = await res.json();
                        alert(`Diagnóstico concluído! Status Baileys: ${data.baileysStatus?.connectionState || "ok"}`);
                      } finally {
                        setIsRunningDiagnostic(false);
                      }
                    }}
                    disabled={isRunningDiagnostic}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Activity size={14} className={isRunningDiagnostic ? "animate-spin" : ""} />
                    {isRunningDiagnostic ? "Verificando..." : "Testar Conexão"}
                  </button>
                </div>
              </div>

              {/* Terminal View */}
              <div className="bg-[#0b0f19] text-zinc-200 font-mono text-xs rounded-2xl p-4 border border-zinc-800 shadow-inner max-h-[360px] overflow-y-auto space-y-1.5">
                <div className="text-zinc-500 pb-2 border-b border-zinc-800 text-[10px]">
                  bellamais-engine • Baileys Multi-Device v7.0 • Logs em tempo real
                </div>
                {consoleLogs.length === 0 ? (
                  <div className="py-8 text-center text-zinc-500">Nenhum evento registrado ainda.</div>
                ) : (
                  consoleLogs.map((l) => (
                    <div key={l.id} className="flex items-start gap-2 text-[11px]">
                      <span className="text-zinc-500 shrink-0">[{l.timestamp}]</span>
                      <span className="text-emerald-400 font-bold shrink-0">[{l.source}]</span>
                      <span className={l.level === "error" ? "text-rose-400" : "text-zinc-300"}>
                        {l.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
