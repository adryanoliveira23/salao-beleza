"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import {
  MessageCircle,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  Calendar,
  Settings,
  Sparkles,
  Zap,
  Smartphone,
  Check,
  CheckCheck,
  Info,
  QrCode,
  RefreshCw,
  LogOut,
  AlertCircle,
  Copy,
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
  Crown,
  Heart,
  ChevronDown,
  ChevronUp,
  Activity,
  Phone,
  Cake,
  Lightbulb,
  Signal,
  Wifi,
  Battery,
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
  benefit: string;
  explanation: string;
  enabled: boolean;
  template: string;
  iconType: "clock" | "sparkles" | "shield" | "star" | "gift" | "cake";
}

export interface ConsoleLogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error" | "debug";
  source: "CLIENT" | "SERVER_API" | "GATEWAY" | "DIAGNOSTICO" | "WHATSAPP_MOBILE";
  message: string;
  details?: any;
}

export const SALON_BEAUTY_RULES: AutoMessageRule[] = [
  {
    id: "confirmation_24h",
    title: "1. Confirmação Carinhosa na Véspera (24h Antes)",
    badge: "Evita até 80% das Faltas",
    benefit: "Garante a cadeira cheia e avisa a tempo se a cliente precisar remarcar",
    explanation:
      "Disparada no dia anterior perguntando se a cliente confirma a presença. Se ela desmarcar, você libera a vaga para a lista de espera sem perder faturamento.",
    enabled: true,
    iconType: "clock",
    template:
      "Olá {{cliente}}! Passando com carinho para confirmar seu horário amanhã ({{data}}) às *{{hora}}* para *{{servico}}* com *{{profissional}}* no {{salao}}. Podemos confirmar sua presença? Responda SIM! Mal podemos esperar para cuidar de você.",
  },
  {
    id: "reminder_2h",
    title: "2. Lembrete 'Bancada Pronta' (2h a 3h Antes)",
    badge: "Pontualidade & Sem Atrasos",
    benefit: "Mantém os horários do dia em dia sem virar bola de neve",
    explanation:
      "Disparada no dia do atendimento avisando que a equipe já está com os materiais esterilizados e tudo pronto esperando por ela.",
    enabled: true,
    iconType: "sparkles",
    template:
      "Oi {{cliente}}! Passando para te lembrar que seu horário de *{{servico}}* é hoje às *{{hora}}*. Nossa equipe já está te esperando com a bancada pronta no {{salao}}. Até logo!",
  },
  {
    id: "deposit_pix",
    title: "3. Sinal de Reserva / PIX de Garantia",
    badge: "Segurança para Mechas & Mega Hair",
    benefit: "Protege procedimentos caros contra desistência de última hora",
    explanation:
      "Disparada para solicitar um pequeno sinal para garantir a vaga de procedimentos demorados. O valor é abatido no pagamento final.",
    enabled: true,
    iconType: "shield",
    template:
      "Olá {{cliente}}! Para garantir a reserva exclusiva da sua cadeira para *{{servico}}* no dia {{data}} às {{hora}}, solicitamos o sinal de garantia via PIX. Chave: *{{pix}}*. O valor será abatido no final do seu atendimento. Por favor, nos envie o comprovante!",
  },
  {
    id: "google_review",
    title: "4. Agradecimento & Avaliação 5 Estrelas no Google",
    badge: "Atrai Novas Clientes no Bairro",
    benefit: "Gera notas e depoimentos no Google Meu Negócio após o atendimento",
    explanation:
      "Disparada 30 minutos após o atendimento agradecendo a visita e convidando a cliente a deixar 5 estrelinhas no Google enquanto está feliz com o resultado.",
    enabled: true,
    iconType: "star",
    template:
      "Oi {{cliente}}! Foi um prazer imenso cuidar da sua beleza hoje no {{salao}}! Ficou ainda mais maravilhosa. Se você puder nos presentear com uma avaliação no Google, nos ajuda muito: {{link_avaliacao}}",
  },
  {
    id: "inactive_return",
    title: "5. Resgate Afetuoso de Clientes (+30 dias sem visita)",
    badge: "Gera Caixa Imediato",
    benefit: "Traz de volta clientes que esqueceram de agendar a manutenção",
    explanation:
      "Disparada para clientes queridas que não voltam há mais de 4 semanas, oferecendo um mimo especial (hidratação cortesia ou mimo) no retorno.",
    enabled: true,
    iconType: "gift",
    template:
      "Oi {{cliente}}, estamos com tanta saudade de você aqui no {{salao}}! Que tal tirar um momento só para você esta semana? Preparamos um mimo especial para o seu retorno. Me responda aqui para escolhermos o melhor dia para você!",
  },
  {
    id: "birthday_gift",
    title: "6. Parabéns de Aniversário com Cortesia Especial",
    badge: "Fidelização pelo Coração",
    benefit: "Faz a cliente se sentir única e marca horário na semana festiva",
    explanation:
      "Disparada para as aniversariantes do mês com um desconto ou tratamento cortesia para ela vir se produzir no dia especial dela.",
    enabled: true,
    iconType: "cake",
    template:
      "Parabéns, {{cliente}}! Desejamos que seu novo ciclo seja iluminado e cheio de realizações! Preparamos um presente especial de aniversário para você comemorar aqui no {{salao}}. Que tal agendar seu horário com a gente esta semana?",
  },
];

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { appointments, clients, updateAppointment } = useSalonData();

  // Navegação entre as 5 abas intuitivas
  const [activeTab, setActiveTab] = useState<
    "pilot" | "queue" | "recovery" | "connection" | "messages"
  >("pilot");

  // Estado de Conexão WhatsApp
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [connectedAt, setConnectedAt] = useState("");

  // Dados do QR Code & Pareamento
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [isRealHandshake, setIsRealHandshake] = useState(false);

  // Configurações do Salão
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "");
  const [pixKey, setPixKey] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Regras de Mensagens Encantadoras
  const [rules, setRules] = useState<AutoMessageRule[]>(SALON_BEAUTY_RULES);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("confirmation_24h");

  // Fila de Agendamentos (Hoje vs Amanhã)
  const [queueDayFilter, setQueueDayFilter] = useState<"today" | "tomorrow">("tomorrow");
  const [queueSearch, setQueueSearch] = useState("");

  // Console de Logs & Diagnóstico (colapsado por padrão)
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [showTechnicalDiagnostics, setShowTechnicalDiagnostics] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  const salonName = profile?.salon_name || "Meu Salão de Beleza";

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
    const confirmedTotal = (appointments || [])
      .filter((a) => a.status === "confirmed")
      .reduce((acc, a) => acc + (a.price || 95), 0);
    return confirmedTotal > 0 ? confirmedTotal : confirmedCountThisMonth * 95;
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

  // Carrega configurações com persistência Local-First e higienização de dados mockados
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    async function loadData() {
      if (!user) return;

      let storedPhone = "";
      let storedConnected = false;
      let storedConnectedAt = "";

      // 1. Lê LocalStorage
      try {
        const local = localStorage.getItem(`bellamais_whatsapp_${user.uid}`);
        if (local) {
          const d = JSON.parse(local);
          if (d.salonPhone && !d.salonPhone.includes("999998888") && !d.salonPhone.includes("99999-8888")) {
            setSalonPhone(d.salonPhone);
          }
          if (d.pixKey) setPixKey(d.pixKey);
          if (d.googleReviewLink) setGoogleReviewLink(d.googleReviewLink);
          if (d.rules && Array.isArray(d.rules)) setRules(d.rules);

          const isMock =
            d.connectedPhone === "+55 (11) 99999-8888" ||
            d.connectedPhone?.includes("99999-8888") ||
            d.connectedPhone?.includes("999998888") ||
            d.connectedAt === "22/10, 23:12";

          if (isMock) {
            const prev = JSON.parse(local || "{}");
            localStorage.setItem(
              `bellamais_whatsapp_${user.uid}`,
              JSON.stringify({ ...prev, isConnected: false, connectedPhone: "", connectedAt: null })
            );
          } else if (d.isConnected) {
            storedConnected = true;
            storedPhone = d.connectedPhone || "";
            storedConnectedAt = d.connectedAt || "";
          }
        }
      } catch (e) {}

      // 2. Lê Firestore
      try {
        const snap = await getDoc(doc(db, "whatsapp_config", user.uid)).catch(() => null);
        if (snap && snap.exists()) {
          const d = snap.data();
          if (d.salonPhone && !d.salonPhone.includes("999998888") && !d.salonPhone.includes("99999-8888")) {
            setSalonPhone(d.salonPhone);
          }
          if (d.pixKey) setPixKey(d.pixKey);
          if (d.googleReviewLink) setGoogleReviewLink(d.googleReviewLink);
          if (d.rules && Array.isArray(d.rules)) setRules(d.rules);

          const isMock =
            d.connectedPhone === "+55 (11) 99999-8888" ||
            d.connectedPhone?.includes("99999-8888") ||
            d.connectedPhone?.includes("999998888") ||
            d.connectedAt === "22/10, 23:12";

          if (isMock) {
            storedConnected = false;
            storedPhone = "";
            storedConnectedAt = "";
            setDoc(
              doc(db, "whatsapp_config", user.uid),
              { isConnected: false, connectedPhone: "", connectedAt: null },
              { merge: true }
            ).catch(() => {});
          } else if (d.isConnected !== undefined) {
            storedConnected = Boolean(d.isConnected);
            storedPhone = d.connectedPhone || "";
            storedConnectedAt = d.connectedAt || "";
          }
        }
      } catch (e) {}

      // 3. Validação com status real do Baileys
      try {
        const res = await fetch("/api/whatsapp/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "status" }),
        });
        if (res.ok) {
          const statusData = await res.json();
          if (statusData.connected) {
            storedConnected = true;
            storedPhone = statusData.phoneNumber || storedPhone;
          } else {
            storedConnected = false;
            storedPhone = "";
            storedConnectedAt = "";
            const prev = JSON.parse(localStorage.getItem(`bellamais_whatsapp_${user.uid}`) || "{}");
            localStorage.setItem(
              `bellamais_whatsapp_${user.uid}`,
              JSON.stringify({ ...prev, isConnected: false, connectedPhone: "", connectedAt: null })
            );
          }
        }
      } catch (e) {
        if (storedPhone.includes("99999-8888") || storedPhone.includes("999998888")) {
          storedConnected = false;
          storedPhone = "";
          storedConnectedAt = "";
        }
      }

      if (isMounted) {
        setIsConnected(storedConnected);
        setConnectedPhone(storedPhone);
        setConnectedAt(storedConnectedAt);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Salva configurações com garantia Local-First
  const saveConfig = async (updates: Record<string, any>) => {
    if (!user) return;
    try {
      const prev = JSON.parse(localStorage.getItem(`bellamais_whatsapp_${user.uid}`) || "{}");
      const merged = { ...prev, ...updates };
      localStorage.setItem(`bellamais_whatsapp_${user.uid}`, JSON.stringify(merged));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2200);

      // Sincroniza Firestore
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

  // Auto-gera QR Code ao abrir a aba de Conexão se estiver desconectado
  useEffect(() => {
    if (activeTab === "connection" && !isConnected && !qrCodeDataUrl && !isLoadingQr) {
      generateBaileysQR();
    }
  }, [activeTab, isConnected, qrCodeDataUrl, isLoadingQr]);

  // Timer de atualização do QR Code
  useEffect(() => {
    if (!qrCodeDataUrl || isConnected) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateBaileysQR();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [qrCodeDataUrl, isConnected]);

  // Confirmar conexão após escanear QR Code (Validação Real)
  const handleConfirmConnection = async () => {
    setIsCheckingConnection(true);
    logEvent("info", "CLIENT", "Verificando confirmação de leitura do QR Code no WhatsApp...");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (data.connected) {
        const phone = data.phoneNumber || salonPhone || "WhatsApp Ativo";
        const at =
          data.connectedAt ||
          new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        setIsConnected(true);
        setConnectedPhone(phone);
        setConnectedAt(at);
        saveConfig({ isConnected: true, connectedPhone: phone, connectedAt: at });
        logEvent("success", "CLIENT", `WhatsApp conectado com sucesso para o número ${phone}!`);
        alert(`WhatsApp do salão conectado com sucesso para o número ${phone}!`);
      } else {
        setIsConnected(false);
        logEvent("warn", "CLIENT", data.message || "Aparelho ainda não detectado.");
        alert(
          data.message ||
            "Aparelho ainda não detectado. Abra o WhatsApp no celular > Aparelhos Conectados e aponte para o QR Code."
        );
      }
    } catch (err: any) {
      logEvent("error", "SERVER_API", "Erro ao verificar conexão com o WhatsApp");
      alert("Não foi possível verificar a conexão no momento. Tente novamente.");
    } finally {
      setIsCheckingConnection(false);
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
    setCountdown(45);
    saveConfig({ isConnected: false, connectedPhone: "", connectedAt: null });
    logEvent("info", "CLIENT", "Desconectando WhatsApp e limpando sessão...");

    try {
      await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
    } catch (e) {}

    setTimeout(() => {
      generateBaileysQR();
    }, 400);
  };

  // Toggle de Regra de Mensagem
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
      .replace(/{{pix}}/g, pixKey || salonPhone || "(sua chave PIX)")
      .replace(/{{link_avaliacao}}/g, googleReviewLink || "g.page/r/bellamais");
  }, [currentSelectedRule, queueDayFilter, salonName, pixKey, salonPhone, googleReviewLink]);

  // Disparo de Mensagem (1 Toque Direto)
  const handleSendWhatsApp = (
    phone: string,
    text: string,
    appointmentId?: string
  ) => {
    const clean = phone.replace(/\D/g, "");
    if (!clean) {
      alert("Por favor, cadastre um telefone com DDD para esta cliente.");
      return;
    }
    const num = clean.length <= 11 ? `55${clean}` : clean;
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(text)}`;

    if (appointmentId && updateAppointment) {
      updateAppointment(appointmentId, { status: "confirmed" });
      logEvent("success", "CLIENT", `Agendamento marcado como Confirmado após envio da mensagem!`);
    }

    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-[#faf7f9] via-[var(--background)] to-[#f6f2f5] font-sans text-[var(--foreground)]">
      <Header title="WhatsApp & Secretária Virtual" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1480px] w-full mx-auto">
        {/* =========================================================================
            BANNER PRINCIPAL FEMININO & REFINADO (ESTILO SALÃO CHIC)
            ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#fff5f8] via-[#fdf8f5] to-[#fbf2f6] border border-rose-200/70 p-6 md:p-8 shadow-sm">
          <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-rose-200/30 blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 -bottom-10 w-36 h-36 rounded-full bg-amber-200/25 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100/80 border border-rose-200 text-rose-800 text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                <Sparkles size={13} className="text-rose-600" />
                <span>Encantamento de Clientes & Cadeiras Sempre Cheias</span>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--foreground)]">
                Sua Secretária Virtual no WhatsApp
              </h1>
              <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed font-sans">
                Lembretes carinhosos na véspera para <strong>reduzir até 80% das faltas</strong>, convites com mimos para trazer clientes sumidas de volta e solicitação de sinal no PIX para serviços caros — tudo com um toque e no tom afetuoso do seu salão.
              </p>
            </div>

            {/* Status Simples & Claro */}
            <div className="shrink-0 flex items-center gap-3">
              {isConnected ? (
                <div className="p-3.5 px-4 rounded-2xl bg-white/90 border border-emerald-300 shadow-xs flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Recepção Ativa
                    </span>
                    <strong className="text-xs text-[var(--foreground)] block">
                      {connectedPhone || salonPhone || "WhatsApp do Salão"}
                    </strong>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab("connection")}
                  className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition cursor-pointer active:scale-[0.98]"
                >
                  <Smartphone size={16} />
                  <span>Conectar WhatsApp da Recepção</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            MENU DE NAVEGAÇÃO REFINADO (5 ABAS COM ÍCONES LUCIDE)
            ========================================================================= */}
        <div className="bg-[var(--card-bg)] rounded-2xl p-2 shadow-xs border border-[var(--card-border)] flex flex-wrap gap-1.5">
          {[
            {
              id: "pilot",
              label: "Secretária Virtual",
              description: "Visão Geral",
              icon: Sparkles,
            },
            {
              id: "queue",
              label: "Confirmar Horários",
              description: "Hoje & Amanhã",
              icon: Calendar,
              badge: queueAppointments.filter((a) => a.status === "pending").length,
            },
            {
              id: "recovery",
              label: "Resgate com Mimo",
              description: "Clientes +30d",
              icon: Gift,
              badge: inactiveClients.length > 0 ? inactiveClients.length : undefined,
            },
            {
              id: "connection",
              label: isConnected ? "Aparelho Conectado" : "Conectar Aparelho",
              description: "Câmera do Celular",
              icon: Smartphone,
            },
            {
              id: "messages",
              label: "Personalizar Textos & PIX",
              description: "Tom de Voz & Links",
              icon: HeartHandshake,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[170px] px-4 py-3 rounded-xl transition text-left cursor-pointer relative flex items-center justify-between gap-3 ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white shadow-xs"
                    : "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? "bg-white/20 text-white" : "bg-rose-100/70 text-[var(--primary)]"
                    }`}
                  >
                    <tab.icon size={16} />
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-xs block leading-tight truncate">
                      {tab.label}
                    </span>
                    <span
                      className={`text-[10px] block leading-tight ${
                        isActive ? "text-rose-100" : "text-[var(--muted)]"
                      }`}
                    >
                      {tab.description}
                    </span>
                  </div>
                </div>

                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive ? "bg-white text-[var(--primary)]" : "bg-rose-500 text-white"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            ABA 1: SECRETÁRIA VIRTUAL (VISÃO GERAL + 6 MENSAGENS + IPHONE CHIC)
            ========================================================================= */}
        {activeTab === "pilot" && (
          <div className="space-y-6">
            {/* 3 CARDS DE IMPACTO VISUAL EM FORMATO BOUDOIR / SALÃO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#fff7f9] via-white to-[#fdf2f7] border border-rose-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
                    Cadeiras Salvas & Lucro Garantido
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-[var(--foreground)] tracking-tight">
                    R$ {estimatedSavedMoney.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1.5 block">
                    {confirmedCountThisMonth} atendimentos confirmados este mês
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Crown size={26} />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#fbf8ff] via-white to-[#f6f0fd] border border-purple-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                    Clientes Prontas para Resgate
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-[var(--foreground)] tracking-tight">
                    {inactiveClients.length} Clientes
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1.5 block">
                    Não voltam há +30 dias — prontas para um mimo
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Gift size={26} />
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#fffdf5] via-white to-[#fef8ea] border border-amber-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                    Horas Livres para Você Cuidar
                  </span>
                  <h3 className="font-serif text-3xl font-bold text-[var(--foreground)] tracking-tight">
                    ~15 Horas / Mês
                  </h3>
                  <span className="text-[11px] text-[var(--muted)] mt-1.5 block">
                    Sem parar o secador para digitar mensagem por mensagem
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles size={26} />
                </div>
              </div>
            </div>

            {/* GRID PRINCIPAL: 6 MENSAGENS ENCANTADORAS + IPHONE MOCKUP CHIC */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUNA ESQUERDA: AS 6 REGRAS COM LINGUAGEM DE SALÃO */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] block mb-0.5">
                      Personalização da Secretária
                    </span>
                    <h3 className="font-serif text-xl font-bold tracking-tight text-[var(--foreground)]">
                      Mensagens Automáticas Encantadoras
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Escolha quais mensagens seu salão deve enviar. Clique em qualquer uma para testar e ver a prévia na tela do celular ao lado.
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    {rules.map((rule) => {
                      const isSelected = selectedRuleId === rule.id;
                      const RuleIcon =
                        rule.iconType === "clock"
                          ? Clock
                          : rule.iconType === "sparkles"
                          ? Sparkles
                          : rule.iconType === "shield"
                          ? ShieldCheck
                          : rule.iconType === "star"
                          ? Star
                          : rule.iconType === "gift"
                          ? Gift
                          : Cake;

                      return (
                        <div
                          key={rule.id}
                          onClick={() => setSelectedRuleId(rule.id)}
                          className={`p-4 md:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col gap-3 ${
                            isSelected
                              ? "border-[var(--primary)] bg-gradient-to-r from-rose-50/70 via-white to-pink-50/50 shadow-xs"
                              : "border-[var(--card-border)] bg-[var(--background)]/60 hover:border-rose-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <RuleIcon size={16} className="text-[var(--primary)] shrink-0" />
                                <h4 className="font-bold text-xs md:text-sm text-[var(--foreground)]">
                                  {rule.title}
                                </h4>
                                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200/60">
                                  {rule.badge}
                                </span>
                              </div>
                              <p className="text-xs text-[var(--foreground)]/80 font-medium leading-relaxed">
                                {rule.benefit}
                              </p>
                              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                                {rule.explanation}
                              </p>
                            </div>

                            {/* Switch Liga / Desliga */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRule(rule.id);
                              }}
                              className={`w-12 h-6.5 rounded-full transition cursor-pointer p-0.5 shrink-0 ${
                                rule.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                              }`}
                            >
                              <div
                                className={`w-5.5 h-5.5 rounded-full bg-white transition-transform shadow-xs ${
                                  rule.enabled ? "translate-x-5.5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Seletor ativo mostra o editor do texto */}
                          {isSelected && (
                            <div
                              className="pt-3 border-t border-rose-200/70 space-y-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-[var(--foreground)]">
                                  Texto que a cliente recebe no WhatsApp:
                                </label>
                                <span className="text-[10px] text-rose-600 font-semibold">
                                  Edite livremente abaixo
                                </span>
                              </div>

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
                                className="w-full p-3.5 rounded-xl bg-white border border-rose-200 text-xs outline-none focus:border-[var(--primary)] leading-relaxed shadow-2xs"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                                <span>
                                  Campos mágicos: <code>{"{{cliente}}"}</code>, <code>{"{{servico}}"}</code>, <code>{"{{hora}}"}</code>, <code>{"{{data}}"}</code>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(salonPhone, simulatedMessageText)}
                                  className="text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageCircle size={13} /> Testar no meu celular
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

              {/* COLUNA DIREITA: IPHONE REALISTA ESTILO BEAUTY & VOGUE */}
              <div className="lg:col-span-5 sticky top-6">
                <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] block">
                        Experiência da Cliente
                      </span>
                      <h4 className="font-serif text-base font-bold text-[var(--foreground)]">
                        Como sua cliente enxerga:
                      </h4>
                    </div>
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Visualização Real
                    </span>
                  </div>

                  {/* Moldura Elegante de iPhone com Ícones Lucide */}
                  <div className="w-full max-w-[340px] mx-auto rounded-[42px] bg-[#1a1318] p-3 shadow-2xl border-4 border-rose-200/50 text-zinc-100 font-sans relative">
                    {/* Barra Superior do iPhone com Ícones Lucide */}
                    <div className="flex items-center justify-between px-3 py-1 text-[10px] text-zinc-400 mb-1">
                      <span className="font-semibold">09:41</span>
                      <div className="w-20 h-3.5 bg-black rounded-full mx-auto" />
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Signal size={11} />
                        <Wifi size={11} />
                        <Battery size={13} />
                      </div>
                    </div>

                    {/* Topo do WhatsApp com Foto do Salão */}
                    <div className="flex items-center gap-2.5 p-2.5 bg-[#202c33] rounded-2xl mb-3 border border-zinc-700/50">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--primary)] to-rose-400 text-white font-serif font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {salonName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h5 className="font-bold text-xs text-white truncate">{salonName}</h5>
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                        </div>
                        <span className="text-[10px] text-emerald-400 block truncate">Online • Recepção do Salão</span>
                      </div>
                    </div>

                    {/* Conversa do WhatsApp com Papel de Parede Acolhedor */}
                    <div className="p-3 bg-[#0d1418] rounded-2xl min-h-[290px] flex flex-col justify-end space-y-2 border border-zinc-800">
                      <div className="self-center px-2.5 py-0.5 rounded-md bg-[#182229] text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                        Hoje
                      </div>

                      {/* Balão da Mensagem */}
                      <div className="self-end max-w-[94%] bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-xs text-xs shadow-md leading-relaxed space-y-1.5">
                        <p className="whitespace-pre-wrap text-[11.5px] leading-relaxed">
                          {simulatedMessageText}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 text-[9px] text-emerald-200 pt-0.5">
                          <span>09:42</span>
                          <CheckCheck size={13} className="text-cyan-300" />
                        </div>
                      </div>
                    </div>

                    {/* Barra de Digitação */}
                    <div className="mt-2.5 p-2 bg-[#202c33] rounded-xl flex items-center justify-between text-zinc-400 text-[11px]">
                      <span className="italic text-zinc-500">Mariana está digitando...</span>
                      <div className="w-6 h-6 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-2xs">
                        <Send size={11} />
                      </div>
                    </div>
                  </div>

                  {/* Botão de Disparo para o Próprio Celular */}
                  <button
                    onClick={() => handleSendWhatsApp(salonPhone, simulatedMessageText)}
                    className="w-full py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/20 transition cursor-pointer active:scale-[0.98]"
                  >
                    <MessageCircle size={16} />
                    <span>Enviar Exemplo para o Meu Celular</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: CONFIRMAR HORÁRIOS DA AGENDA (HOJE & AMANHÃ)
            ========================================================================= */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Calendar size={13} />
                    <span>Fila da Agenda do Salão</span>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Confirmação de Horários com 1 Toque
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Ao clicar em <strong>Confirmar no Zap</strong>, a mensagem é enviada e o agendamento já fica marcado como <strong>Confirmado</strong> na Agenda!
                  </p>
                </div>

                {/* Filtro Hoje vs Amanhã */}
                <div className="flex items-center gap-2 p-1.5 bg-rose-50/60 dark:bg-zinc-800/60 rounded-2xl border border-rose-200/60">
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

              {/* Busca por Cliente ou Serviço */}
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, procedimento ou profissional..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-rose-200 text-xs outline-none focus:border-[var(--primary)] shadow-2xs"
                />
              </div>

              {/* Lista dos Agendamentos */}
              {queueAppointments.length === 0 ? (
                <div className="py-16 text-center bg-rose-50/40 rounded-3xl border border-dashed border-rose-200">
                  <Calendar size={36} className="mx-auto text-rose-300 mb-2" />
                  <h4 className="font-serif text-base font-bold text-[var(--foreground)]">
                    Nenhum horário marcado para {queueDayFilter === "today" ? "hoje" : "amanhã"}
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Novos horários cadastrados na Agenda Inteligente aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {queueAppointments.map((apt) => {
                    const isConfirmed = apt.status === "confirmed";
                    const confirmMsg = `Olá ${apt.clientName}! Passando com carinho para confirmar seu horário ${
                      queueDayFilter === "today" ? "hoje" : "amanhã"
                    } às *${apt.time}* para *${apt.serviceName}* com *${apt.professionalName}* no ${salonName}. Podemos confirmar sua presença? Responda SIM!`;

                    return (
                      <div
                        key={apt.id}
                        className={`p-5 rounded-3xl border transition flex flex-col justify-between gap-4 ${
                          isConfirmed
                            ? "bg-emerald-50/40 border-emerald-200"
                            : "bg-white border-rose-100 shadow-xs hover:border-rose-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-lg">
                                {apt.time}
                              </span>
                              <h4 className="font-serif font-bold text-base text-[var(--foreground)]">
                                {apt.clientName}
                              </h4>
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-1.5">
                              <strong>{apt.serviceName}</strong> • {apt.professionalName} • R$ {apt.price?.toFixed(2)}
                            </p>
                          </div>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 flex items-center gap-1 ${
                              isConfirmed
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isConfirmed ? (
                              <>
                                <Check size={12} /> Confirmado
                              </>
                            ) : (
                              <>
                                <Clock size={12} /> Pendente
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-rose-100/80">
                          <span className="text-[11px] text-[var(--muted)]">
                            Tel: {apt.clientPhone || "Sem telefone cadastrado"}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(apt.clientPhone, confirmMsg, apt.id)}
                            className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-[0.98]"
                          >
                            <MessageCircle size={15} />
                            <span>{isConfirmed ? "Reenviar no Zap" : "Confirmar no Zap"}</span>
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
            ABA 3: RESGATE DE CLIENTES COM MIMO (+30 DIAS)
            ========================================================================= */}
        {activeTab === "recovery" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Heart size={13} />
                    <span>Fidelidade & Cuidado às Clientes</span>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Resgate de Clientes Ausentes (+30 Dias)
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                    Clientes de salão muitas vezes esquecem de marcar com a correria da rotina. Um convite carinhoso com mimo tem até <strong>40% de taxa de retorno</strong>!
                  </p>
                </div>

                <span className="px-4 py-2 rounded-2xl bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold shrink-0">
                  {inactiveClients.length} Clientes para Resgatar
                </span>
              </div>

              {inactiveClients.length === 0 ? (
                <div className="py-16 text-center bg-pink-50/40 rounded-3xl border border-dashed border-pink-200">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                  <h4 className="font-serif text-base font-bold text-[var(--foreground)]">
                    Parabéns! Todas as suas clientes estão ativas
                  </h4>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Nenhuma cliente cadastrada no seu salão está sem visita há mais de 30 dias.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inactiveClients.map((client) => {
                    const daysAgo = Math.floor(
                      (Date.now() - new Date(client.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const recoveryMsg = `Oi ${client.name}, tudo bem? Estamos com saudades de você aqui no ${salonName}! Que tal renovar seus cuidados esta semana? Preparamos um mimo especial para você na sua próxima visita. Responda aqui para garantir seu horário!`;

                    return (
                      <div
                        key={client.id}
                        className="p-5 rounded-3xl bg-white border border-rose-100 shadow-xs flex flex-col justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="font-serif font-bold text-base text-[var(--foreground)] truncate">
                              {client.name}
                            </h4>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full shrink-0">
                              Há {daysAgo} dias
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted)]">
                            Última visita: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString("pt-BR") : "Não registrada"} • {client.visits || 1} visitas
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(client.phone, recoveryMsg)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <Gift size={15} />
                          <span>Enviar Convite com Mimo no Zap</span>
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
            ABA 4: CONECTAR O WHATSAPP DO SALÃO (RECEPCIONISTA OFICIAL)
            ========================================================================= */}
        {activeTab === "connection" && (
          <div className="space-y-6">
            {isConnected ? (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-[#25D366]/25 shrink-0">
                      <MessageCircle size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          WhatsApp Conectado & Ativo
                        </span>
                      </div>
                      <h2 className="font-serif text-2xl font-bold tracking-tight text-[var(--foreground)]">
                        Recepção do Salão Sincronizada
                      </h2>
                      <p className="text-xs md:text-sm text-[var(--muted)] mt-1">
                        Número conectado: <strong className="text-[var(--foreground)]">{connectedPhone || salonPhone || "WhatsApp Oficial"}</strong>
                        {connectedAt ? ` • Conectado em ${connectedAt}` : ""}
                      </p>
                      <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                        <Sparkles size={14} /> Envios de confirmações e resgate de clientes habilitados.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                    <button
                      onClick={() => handleSendWhatsApp(salonPhone || profile?.phone || "", simulatedMessageText)}
                      className="px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/20 transition cursor-pointer active:scale-[0.98]"
                    >
                      <MessageCircle size={16} />
                      Testar Disparo Agora
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-3 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
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
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Smartphone size={13} />
                    <span>Conexão em 10 Segundos</span>
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Conectar o WhatsApp da sua Recepção
                  </h3>
                  <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                    Aponte a câmera do celular que sua recepção usa para falar com as clientes. O processo é 100% seguro, oficial e exatamente igual ao WhatsApp Web.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* QR Code com Borda Feminina */}
                  <div className="lg:col-span-5 flex flex-col items-center text-center p-6 bg-gradient-to-b from-rose-50/50 to-white rounded-3xl border border-rose-200">
                    <div className="relative p-4 bg-white rounded-2xl shadow-md border-2 border-rose-200/80">
                      {isLoadingQr ? (
                        <div className="w-[220px] h-[220px] flex flex-col items-center justify-center text-rose-400 gap-2">
                          <RefreshCw size={32} className="animate-spin text-[var(--primary)]" />
                          <span className="text-xs font-bold text-[var(--foreground)]">Gerando QR Code seguro...</span>
                        </div>
                      ) : qrCodeDataUrl && countdown > 0 ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code WhatsApp"
                            className="w-[220px] h-[220px] object-contain rounded-lg"
                          />
                          <span className="text-[11px] font-semibold text-rose-700 mt-2">
                            Atualizando automaticamente em <strong>{countdown}s</strong>
                          </span>
                        </div>
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
                        onClick={handleConfirmConnection}
                        disabled={isCheckingConnection || isLoadingQr}
                        className="w-full py-3 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-[0.99] disabled:opacity-60"
                      >
                        {isCheckingConnection ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>Verificando no WhatsApp...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Já apontei a câmera (Confirmar)</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={generateBaileysQR}
                        disabled={isLoadingQr || isCheckingConnection}
                        className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold flex items-center justify-center gap-1 py-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw size={12} className={isLoadingQr ? "animate-spin" : ""} /> Gerar outro código
                      </button>
                    </div>
                  </div>

                  {/* 3 Passos Simples com Visual Claro */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="font-serif text-base font-bold text-[var(--foreground)]">
                      3 Passos simples no seu celular:
                    </h4>
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          1
                        </span>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed">
                          Abra o <strong>WhatsApp</strong> no celular que atende suas clientes.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          2
                        </span>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed">
                          Toque em <strong>Configurações</strong> (no iPhone) ou nos <strong>3 pontinhos</strong> (no Android) e selecione <strong>Aparelhos Conectados</strong>.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs flex items-center gap-3.5">
                        <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                          3
                        </span>
                        <p className="text-xs text-[var(--foreground)] leading-relaxed">
                          Toque em <strong>Conectar um Aparelho</strong> e aponte a câmera para o QR Code ao lado.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                      <Lightbulb size={16} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Dica de Praticidade:</strong> Mesmo antes de conectar o aparelho, todos os botões de envio na <strong>Agenda</strong> e nos <strong>Clientes</strong> sempre funcionam com 1 toque direto pelo navegador do seu computador ou celular!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            ABA 5: PERSONALIZAR TEXTOS, CHAVE PIX & AVALIAÇÃO GOOGLE
            ========================================================================= */}
        {activeTab === "messages" && (
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <HeartHandshake size={13} />
                  <span>Configurações do Salão</span>
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  Dados do Salão para as Mensagens
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Preencha os dados abaixo para que a secretária virtual preencha sua chave PIX e seu link de avaliação automaticamente nos textos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Telefone WhatsApp da Recepção:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 11999998888"
                    value={salonPhone}
                    onChange={(e) => setSalonPhone(e.target.value)}
                    onBlur={() => saveConfig({ salonPhone })}
                    className="w-full p-3 rounded-xl bg-white border border-rose-200 text-xs outline-none focus:border-[var(--primary)] shadow-2xs"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Com DDD (apenas números)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Chave PIX (para sinal de garantia):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: CNPJ, celular ou e-mail"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    onBlur={() => saveConfig({ pixKey })}
                    className="w-full p-3 rounded-xl bg-white border border-rose-200 text-xs outline-none focus:border-[var(--primary)] shadow-2xs"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Usada na mensagem de sinal</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--foreground)]">
                    Link do Google Meu Negócio:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: g.page/r/seusalao"
                    value={googleReviewLink}
                    onChange={(e) => setGoogleReviewLink(e.target.value)}
                    onBlur={() => saveConfig({ googleReviewLink })}
                    className="w-full p-3 rounded-xl bg-white border border-rose-200 text-xs outline-none focus:border-[var(--primary)] shadow-2xs"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Para avaliação 5 estrelas</span>
                </div>
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check size={16} /> Dados salvos com sucesso!
                </div>
              )}

              {/* Seção Colapsável de Diagnóstico para Suporte Técnico */}
              <div className="pt-6 border-t border-rose-100">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDiagnostics(!showTechnicalDiagnostics)}
                  className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-2 cursor-pointer py-1"
                >
                  <Settings size={14} />
                  <span>{showTechnicalDiagnostics ? "Ocultar Informações Técnicas" : "Ver Informações Técnicas & Suporte"}</span>
                  {showTechnicalDiagnostics ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showTechnicalDiagnostics && (
                  <div className="mt-4 p-5 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <span className="text-zinc-400 text-[11px]">Baileys Multi-Device Engine • Console de Eventos</span>
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
                        className="px-3 py-1 rounded-lg bg-[var(--primary)] text-white text-[11px] font-bold cursor-pointer"
                      >
                        {isRunningDiagnostic ? "Verificando..." : "Testar Sockets"}
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto space-y-1.5 text-[11px]">
                      {consoleLogs.length === 0 ? (
                        <div className="text-zinc-500 py-3 text-center">Nenhum evento registrado ainda.</div>
                      ) : (
                        consoleLogs.map((l) => (
                          <div key={l.id} className="flex items-start gap-2">
                            <span className="text-zinc-500 shrink-0">[{l.timestamp}]</span>
                            <span className="text-emerald-400 shrink-0">[{l.source}]</span>
                            <span className={l.level === "error" ? "text-rose-400" : "text-zinc-300"}>
                              {l.message}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
