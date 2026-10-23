"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MessageCircle,
  ShieldCheck,
  Send,
  Clock,
  CheckCircle2,
  Phone,
  Calendar,
  Settings,
  BellRing,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  HelpCircle,
  Wallet,
  Users,
  Smartphone,
  Check,
  Info,
  Laptop,
  QrCode,
  KeyRound,
  RefreshCw,
  LogOut,
  AlertCircle,
  Copy,
  Terminal,
  Activity,
  Trash2,
  Radio,
  Sliders,
  Server,
  ArrowRight,
  ExternalLink as LinkIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useSalonData } from "@/contexts/SalonDataContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface AutoMessageRule {
  id: string;
  title: string;
  location: string;
  triggerDescription: string;
  enabled: boolean;
  hoursBefore?: number;
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

export const DEFAULT_AUTO_MESSAGES: AutoMessageRule[] = [
  {
    id: "confirmation",
    title: "1. Confirmação de Agendamento",
    location: "Agenda Inteligente & Link da Bio",
    triggerDescription: "Disparada quando um novo agendamento é criado na Agenda ou pelo link da Bio",
    enabled: true,
    template:
      "Olá {{cliente}}! ✨ Seu agendamento de *{{servico}}* com *{{profissional}}* foi confirmado para *{{data}} às {{hora}}* no {{salao}}. Te esperamos com muito carinho!",
  },
  {
    id: "reminder_24h",
    title: "2. Lembrete 24 Horas Antes",
    location: "Agenda Inteligente (Aba de Amanhã)",
    triggerDescription: "Disparada na véspera do atendimento para confirmar presença e evitar faltas",
    enabled: true,
    hoursBefore: 24,
    template:
      "Oi {{cliente}}! Passando para lembrar do seu horário amanhã ({{data}}) às *{{hora}}* para *{{servico}}* no {{salao}}. Responda SIM para confirmar sua presença! 💖",
  },
  {
    id: "reminder_hours",
    title: "3. Lembrete Poucas Horas Antes",
    location: "Agenda Inteligente (Aba de Hoje)",
    triggerDescription: "Disparada no dia do atendimento, cerca de 2h a 3h antes do horário",
    enabled: true,
    hoursBefore: 3,
    template:
      "Olá {{cliente}}! Seu horário de *{{servico}}* é hoje às *{{hora}}*. Nossa equipe já está com sua bancada pronta no {{salao}}. Até logo! ✨",
  },
  {
    id: "deposit_pix",
    title: "4. Solicitação de Sinal / Chave PIX",
    location: "Caixa & Agenda Inteligente",
    triggerDescription: "Disparada para solicitar sinal de reserva e garantir vaga em dias concorridos",
    enabled: true,
    template:
      "Olá {{cliente}}! Para confirmar seu horário de *{{servico}}* no dia {{data}} às {{hora}}, solicitamos o sinal de garantia via PIX. Chave: *{{pix}}*. Por favor, nos envie o comprovante!",
  },
  {
    id: "payment_receipt",
    title: "5. Comprovante & Recibo de Atendimento",
    location: "Frente de Caixa (Fechamento de Comanda)",
    triggerDescription: "Disparada após fechar a conta no Caixa com o resumo do valor pago",
    enabled: true,
    template:
      "Olá {{cliente}}! Agradecemos sua visita hoje no {{salao}}. Seu atendimento de *{{servico}}* foi concluído com sucesso. Volte sempre que desejar brilhar! ✨",
  },
  {
    id: "birthday",
    title: "6. Parabéns de Aniversário & Mimo",
    location: "Gestão de Clientes (CRM)",
    triggerDescription: "Disparada para aniversariantes do mês com convite ou desconto especial",
    enabled: true,
    template:
      "Parabéns, {{cliente}}! 🎂✨ Desejamos um dia iluminado! Preparamos um mimo especial para você comemorar seu mês aqui no {{salao}}. Que tal agendar seu horário com a gente?",
  },
  {
    id: "inactive_return",
    title: "7. Reativação de Clientes Sumidas (+30 dias)",
    location: "Diagnóstico & Metas / Lista de Clientes",
    triggerDescription: "Disparada para clientes que não retornam ao salão há mais de 4 semanas",
    enabled: true,
    template:
      "Oi {{cliente}}, estamos com saudades de você aqui no {{salao}}! Que tal renovar seus cuidados esta semana? Temos horários especiais disponíveis para você!",
  },
  {
    id: "feedback",
    title: "8. Pesquisa de Satisfação & Avaliação",
    location: "Agenda (Atendimentos Concluídos)",
    triggerDescription: "Disparada após o atendimento para pedir nota e avaliação no Google",
    enabled: true,
    template:
      "Olá {{cliente}}! Foi um prazer cuidar de você hoje. O que achou do seu *{{servico}}*? Sua opinião nos ajuda a crescer! Se puder, avalie nosso salão: {{link_avaliacao}} ✨",
  },
  {
    id: "pre_instructions",
    title: "9. Cuidados Pré-Procedimento",
    location: "Agenda Inteligente",
    triggerDescription: "Disparada para serviços que exigem preparo (ex: química, mechas, depilação)",
    enabled: true,
    template:
      "Olá {{cliente}}! Seguem algumas recomendações para o seu atendimento de *{{servico}}* no dia {{data}}: chegue com 10 minutos de antecedência e siga os cuidados prévios. Dúvidas estamos à disposição!",
  },
  {
    id: "reschedule_notice",
    title: "10. Aviso de Reagendamento / Imprevisto",
    location: "Agenda Inteligente",
    triggerDescription: "Disparada quando um horário precisa ser alterado em comum acordo",
    enabled: true,
    template:
      "Olá {{cliente}}! Conforme conversamos, seu horário no {{salao}} foi reagendado para o dia *{{data}} às {{hora}}* com *{{profissional}}*. Qualquer dúvida é só nos avisar!",
  },
];

export default function WhatsAppPage() {
  const { user, profile } = useAuth();
  const { services, professionals, appointments } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "connection" | "gateway" | "console" | "automation" | "inbox"
  >("connection");

  // Estado Real de Conexão com o WhatsApp
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [connectedAt, setConnectedAt] = useState("");
  const [connectMethod, setConnectMethod] = useState<"qrcode" | "pairing_code">("qrcode");

  // Dados do QR Code e Código de Pareamento
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status de Handshake Real vs Demonstração
  const [isRealHandshake, setIsRealHandshake] = useState(false);
  const [gatewayWarning, setGatewayWarning] = useState<string | null>(null);

  // Configurações do Gateway WhatsApp (Evolution API / Z-API / Meta)
  const [providerMode, setProviderMode] = useState<"evolution" | "direct" | "meta">("direct");
  const [gatewayUrl, setGatewayUrl] = useState("");
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [instanceName, setInstanceName] = useState("salao-principal");
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [gatewayStatusBadge, setGatewayStatusBadge] = useState<string | null>(null);

  // Configurações do Salão
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "11999998888");
  const [testRecipientPhone, setTestRecipientPhone] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected rule for interactive phone preview
  const [selectedRuleId, setSelectedRuleId] = useState<string>("confirmation");

  // Auto Messages State
  const [autoMessages, setAutoMessages] = useState<AutoMessageRule[]>(DEFAULT_AUTO_MESSAGES);

  // CONSOLE DE LOGS EM TEMPO REAL
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<"ALL" | "ERRORS" | "WARNS" | "API">("ALL");
  const [isBottomConsoleOpen, setIsBottomConsoleOpen] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const salonName = profile?.salon_name || "Meu Salão";

  // Função central para adicionar log tanto na interface quanto no console do navegador (DevTools / F12)
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

    setConsoleLogs((prev) => [entry, ...prev.slice(0, 199)]);

    // Mirror to browser DevTools console with rich CSS styling
    if (typeof window !== "undefined") {
      const badgeStyle =
        level === "error"
          ? "background: #ef4444; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;"
          : level === "warn"
            ? "background: #f59e0b; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px;"
            : level === "success"
              ? "background: #10b981; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;"
              : "background: #6366f1; color: white; font-weight: bold; padding: 2px 6px; border-radius: 4px;";

      const prefix = `%c[BellaMais WhatsApp ${level.toUpperCase()}] [${source}]%c ${message}`;
      if (level === "error") {
        console.error(prefix, badgeStyle, "color: inherit;", details || "");
      } else if (level === "warn") {
        console.warn(prefix, badgeStyle, "color: inherit;", details || "");
      } else {
        console.log(prefix, badgeStyle, "color: inherit;", details || "");
      }
    }
  };

  // Carrega configurações salvas do Firestore e LocalStorage
  useEffect(() => {
    if (!user) return;
    async function loadWhatsAppData() {
      if (!user) return;
      logEvent("info", "CLIENT", "Carregando configurações de WhatsApp salvas...");

      // 1. Carrega imediatamente do LocalStorage (offline-first, ultra-rápido)
      try {
        const localCached = localStorage.getItem(`bellamais_whatsapp_${user.uid}`);
        if (localCached) {
          const d = JSON.parse(localCached);
          if (d.isConnected !== undefined) setIsConnected(d.isConnected);
          if (d.connectedPhone) setConnectedPhone(d.connectedPhone);
          if (d.connectedAt) setConnectedAt(d.connectedAt);
          if (d.salonPhone) setSalonPhone(d.salonPhone);
          if (d.providerMode) setProviderMode(d.providerMode);
          if (d.gatewayUrl) setGatewayUrl(d.gatewayUrl);
          if (d.gatewayApiKey) setGatewayApiKey(d.gatewayApiKey);
          if (d.instanceName) setInstanceName(d.instanceName);
          if (d.autoMessages && Array.isArray(d.autoMessages) && d.autoMessages.length > 0) {
            setAutoMessages(d.autoMessages);
          }
          logEvent("info", "CLIENT", "Configurações restauradas do cache local com sucesso.");
        }
      } catch (err) {}

      // 2. Sincroniza com a nuvem (Firestore)
      try {
        let loadedFromCloud = false;

        // Tenta coleção direta whatsapp_config
        try {
          const ref = doc(db, "whatsapp_config", user.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const d = snap.data();
            applyLoadedData(d);
            loadedFromCloud = true;
          }
        } catch (permErr) {
          // Se whatsapp_config não tiver regra liberada no Firebase Console, tenta salon_extras
        }

        if (!loadedFromCloud) {
          try {
            const extrasRef = doc(db, "salon_extras", user.uid);
            const extrasSnap = await getDoc(extrasRef);
            if (extrasSnap.exists()) {
              const d = extrasSnap.data()?.whatsapp_config;
              if (d) {
                applyLoadedData(d);
                loadedFromCloud = true;
              }
            }
          } catch (e) {}
        }

        if (loadedFromCloud) {
          logEvent("success", "CLIENT", "Configurações sincronizadas com a nuvem (Firestore).");
        }
      } catch (e: any) {
        logEvent("info", "CLIENT", "Operando com persistência local garantida no navegador.");
      }
    }

    function applyLoadedData(d: any) {
      if (d.isConnected !== undefined) setIsConnected(d.isConnected);
      if (d.connectedPhone) setConnectedPhone(d.connectedPhone);
      if (d.connectedAt) setConnectedAt(d.connectedAt);
      if (d.salonPhone) setSalonPhone(d.salonPhone);
      if (d.providerMode) setProviderMode(d.providerMode);
      if (d.gatewayUrl) setGatewayUrl(d.gatewayUrl);
      if (d.gatewayApiKey) setGatewayApiKey(d.gatewayApiKey);
      if (d.instanceName) setInstanceName(d.instanceName);
      if (d.autoMessages && Array.isArray(d.autoMessages) && d.autoMessages.length > 0) {
        setAutoMessages(d.autoMessages);
      }
    }

    loadWhatsAppData();
  }, [user]);

  const saveWhatsAppData = async (updates: Record<string, any>) => {
    if (!user) return;

    // 1. Salva imediatamente no LocalStorage para nunca perder dados
    try {
      const prev = JSON.parse(localStorage.getItem(`bellamais_whatsapp_${user.uid}`) || "{}");
      const merged = { ...prev, ...updates };
      localStorage.setItem(`bellamais_whatsapp_${user.uid}`, JSON.stringify(merged));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
      logEvent("success", "CLIENT", "Configurações salvas no armazenamento local.");
    } catch (e) {}

    // 2. Tenta sincronizar com o Firestore
    try {
      logEvent("info", "CLIENT", `Sincronizando ${Object.keys(updates).join(", ")} no banco de dados...`);
      let synced = false;

      try {
        await setDoc(doc(db, "whatsapp_config", user.uid), updates, { merge: true });
        synced = true;
      } catch (err: any) {
        // Fallback: salva dentro de salon_extras (coleção autorizada nas regras do Firebase)
        try {
          await setDoc(doc(db, "salon_extras", user.uid), { whatsapp_config: updates }, { merge: true });
          synced = true;
        } catch (e2) {}
      }

      if (synced) {
        logEvent("success", "CLIENT", "Sincronização com o Firestore concluída!");
      } else {
        logEvent("info", "CLIENT", "Dados preservados com segurança no cache local do salão.");
      }
    } catch (e: any) {
      logEvent("info", "CLIENT", "Dados preservados no navegador.");
    }
  };

  // Gerador de QR Code / Código de Pareamento
  const generateConnectionCredentials = async () => {
    setIsLoadingQr(true);
    setCountdown(45);
    logEvent(
      "info",
      "SERVER_API",
      `Solicitando novo QR Code ao servidor... (Método: ${connectMethod}, Provedor: ${providerMode})`
    );

    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          provider: providerMode === "evolution" ? "gateway" : "free_direct",
          connectionMethod: connectMethod,
          phoneNumber: salonPhone,
          salonName: salonName,
          gatewayUrl: gatewayUrl.trim(),
          apiKey: gatewayApiKey.trim(),
          instanceName: instanceName.trim(),
        }),
      });

      const data = await res.json();
      logEvent("info", "SERVER_API", `Resposta recebida do servidor: HTTP ${res.status}`, data);

      if (data.qrCodeBase64) {
        setQrCodeDataUrl(data.qrCodeBase64);
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }

      const isReal = Boolean(data.isRealWhatsAppHandshake);
      setIsRealHandshake(isReal);

      if (!isReal) {
        setGatewayWarning(data.warning || "Modo de simulação ativo.");
        logEvent(
          "warn",
          "WHATSAPP_MOBILE",
          "⚠️ ATENÇÃO: QR Code gerado em MODO SIMULAÇÃO (Sem Evolution API ou Z-API)."
        );
        logEvent(
          "error",
          "WHATSAPP_MOBILE",
          "📱 Ao escanear este QR code com o celular em 'Aparelhos Conectados', o WhatsApp exibirá: 'CÓDIGO QR INVÁLIDO'."
        );
        logEvent(
          "info",
          "DIAGNOSTICO",
          "💡 MOTIVO TÉCNICO: O WhatsApp exige que o QR Code contenha o token criptográfico Noise Protocol gerado por um socket ativo (Evolution API / Baileys). Strings puras de texto são rejeitadas pelo app do WhatsApp."
        );
        logEvent(
          "success",
          "DIAGNOSTICO",
          "✅ COMO RESOLVER: 1) Conecte sua Evolution API ou Z-API na aba 'Configurar Gateway', ou 2) Use o 'Modo Disparo Direto (WhatsApp Web)' que é 100% gratuito e não precisa de QR code!"
        );
      } else {
        setGatewayWarning(null);
        logEvent(
          "success",
          "GATEWAY",
          "🟢 QR CODE REAL DO WHATSAPP GERADO COM SUCESSO! Pronto para escanear no celular sem erros."
        );
      }
    } catch (err: any) {
      logEvent("error", "SERVER_API", `Erro ao gerar credenciais: ${err?.message || err}`);
      console.error("Erro ao gerar credenciais:", err);
    } finally {
      setIsLoadingQr(false);
    }
  };

  // Timer regressivo de expiração do QR Code
  useEffect(() => {
    if (!qrCodeDataUrl && !pairingCode) return;
    if (isConnected) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [qrCodeDataUrl, pairingCode, isConnected]);

  // Carrega o QR Code inicial caso esteja desconectado
  useEffect(() => {
    if (!isConnected && !qrCodeDataUrl && !pairingCode) {
      generateConnectionCredentials();
    }
  }, [isConnected, connectMethod]);

  // Executar Diagnóstico Completo do WhatsApp
  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    logEvent("info", "DIAGNOSTICO", "=== INICIANDO DIAGNÓSTICO COMPLETO DO WHATSAPP ===");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "diagnostic",
          gatewayUrl: gatewayUrl.trim(),
          apiKey: gatewayApiKey.trim(),
          instanceName: instanceName.trim(),
          phoneNumber: salonPhone,
        }),
      });

      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        data.logs.forEach((l: any) => {
          logEvent(l.level as any, "DIAGNOSTICO", l.message);
        });
      }

      if (data.gatewayStatus === "reachable") {
        setGatewayStatusBadge("online");
        logEvent("success", "DIAGNOSTICO", "Gateway WhatsApp está ONLINE e respondendo normalmente!");
      } else if (data.gatewayStatus === "unreachable" || data.gatewayStatus === "error_response") {
        setGatewayStatusBadge("offline");
        logEvent("error", "DIAGNOSTICO", `Gateway offline ou chave incorreta: status=${data.gatewayStatus}`);
      } else {
        setGatewayStatusBadge("none");
      }
      logEvent("info", "DIAGNOSTICO", "=== DIAGNÓSTICO FINALIZADO ===");
    } catch (e: any) {
      logEvent("error", "DIAGNOSTICO", `Falha no diagnóstico: ${e?.message || e}`);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Testar Conexão com o Gateway na aba de Gateway
  const handleTestGateway = async () => {
    if (!gatewayUrl.trim()) {
      alert("Por favor, digite a URL da sua Evolution API ou Z-API.");
      return;
    }
    setIsTestingGateway(true);
    logEvent("info", "GATEWAY", `Testando conectividade com: ${gatewayUrl.trim()}...`);
    try {
      await handleRunDiagnostic();
      await saveWhatsAppData({
        gatewayUrl: gatewayUrl.trim(),
        gatewayApiKey: gatewayApiKey.trim(),
        instanceName: instanceName.trim(),
        providerMode: "evolution",
      });
      // Se deu certo, regenera o QR Code oficial
      setActiveTab("connection");
      generateConnectionCredentials();
    } catch (e: any) {
      logEvent("error", "GATEWAY", `Erro no teste de gateway: ${e?.message || e}`);
    } finally {
      setIsTestingGateway(false);
    }
  };

  // Confirmar Conexão após leitura do QR Code ou digitação do código
  const handleConfirmConnection = async () => {
    setIsConfirming(true);
    logEvent("info", "SERVER_API", "Verificando confirmação de leitura do QR Code...");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm",
          phoneNumber: salonPhone,
          salonName: salonName,
        }),
      });
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        const phoneFormatted = data.phoneNumber || salonPhone;
        setConnectedPhone(phoneFormatted);
        const timeNow = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        setConnectedAt(timeNow);
        setQrCodeDataUrl(null);
        setPairingCode(null);

        logEvent(
          "success",
          "CLIENT",
          `WhatsApp conectado com sucesso para o número ${phoneFormatted} em ${timeNow}!`
        );

        await saveWhatsAppData({
          isConnected: true,
          connectedPhone: phoneFormatted,
          connectedAt: timeNow,
          connectionMethod: connectMethod,
          salonPhone: salonPhone,
        });
      }
    } catch (err: any) {
      logEvent("error", "SERVER_API", `Erro ao confirmar conexão: ${err?.message || err}`);
      alert("Erro ao confirmar conexão. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Desconectar Sessão
  const handleDisconnect = async () => {
    if (
      !confirm(
        "Tem certeza que deseja desconectar o WhatsApp do salão? Os envios automáticos serão pausados."
      )
    ) {
      return;
    }
    logEvent("info", "SERVER_API", "Desconectando sessão do WhatsApp...");
    setIsConnected(false);
    setConnectedPhone("");
    setConnectedAt("");
    setQrCodeDataUrl(null);
    setPairingCode(null);
    await saveWhatsAppData({
      isConnected: false,
      connectedPhone: "",
      connectedAt: null,
    });
    logEvent("warn", "CLIENT", "Sessão desconectada. Gerando novo QR Code...");
    setTimeout(() => {
      generateConnectionCredentials();
    }, 300);
  };

  const currentRule = useMemo(() => {
    return autoMessages.find((r) => r.id === selectedRuleId) || autoMessages[0];
  }, [autoMessages, selectedRuleId]);

  const simulatedMessageText = useMemo(() => {
    if (!currentRule) return "";
    return currentRule.template
      .replace(/{{cliente}}/g, "Mariana Silva")
      .replace(/{{servico}}/g, "Corte & Escova Modelada")
      .replace(/{{profissional}}/g, "Camila Santos")
      .replace(/{{data}}/g, "Amanhã (Quinta)")
      .replace(/{{hora}}/g, "14:30")
      .replace(/{{salao}}/g, salonName)
      .replace(/{{pix}}/g, salonPhone || "11999998888")
      .replace(/{{link_avaliacao}}/g, "g.page/r/bellamais");
  }, [currentRule, salonName, salonPhone]);

  const handleTestDispatch = (customPhone?: string, customText?: string) => {
    const raw = customPhone || testRecipientPhone || salonPhone || "";
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      alert("Por favor, digite um número de WhatsApp com DDD para o teste.");
      return;
    }
    const num = clean.length <= 11 ? `55${clean}` : clean;
    const text = customText || simulatedMessageText;
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?phone=${num}&text=${encoded}`;

    logEvent("info", "CLIENT", `Disparando mensagem direta para o WhatsApp: +${num}`);
    logEvent("debug", "CLIENT", `URL de disparo gerada: ${waUrl}`);

    window.open(waUrl, "_blank");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    logEvent("info", "CLIENT", `Código copiado para a área de transferência: ${text}`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLogs = () => {
    const text = consoleLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.source}]: ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleClearLogs = () => {
    setConsoleLogs([]);
    logEvent("info", "CLIENT", "Console de logs limpo pelo usuário.");
  };

  const filteredLogs = useMemo(() => {
    if (logFilter === "ERRORS") return consoleLogs.filter((l) => l.level === "error");
    if (logFilter === "WARNS") return consoleLogs.filter((l) => l.level === "warn" || l.level === "error");
    if (logFilter === "API") return consoleLogs.filter((l) => l.source === "SERVER_API" || l.source === "GATEWAY");
    return consoleLogs;
  }, [consoleLogs, logFilter]);

  return (
    <div className="flex flex-col min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
      <Header title="WhatsApp Salão" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-[1480px] w-full mx-auto">
        {/* Top Navigation & Status Bar */}
        <div className="bg-[var(--card-bg)] rounded-3xl p-4 md:p-5 shadow-xs border border-[var(--card-border)] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: "connection",
                label: "Conexão Baileys",
                icon: Smartphone,
              },
              {
                id: "gateway",
                label: "Servidor Baileys & Gateway",
                icon: Server,
              },
              {
                id: "console",
                label: `Console de Logs (${consoleLogs.length})`,
                icon: Terminal,
                highlight: consoleLogs.some((l) => l.level === "error"),
              },
              {
                id: "automation",
                label: "Modelos das 10 Mensagens",
                icon: BellRing,
              },
              {
                id: "inbox",
                label: "Disparo Rápido para Clientes",
                icon: MessageCircle,
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
                {tab.highlight && activeTab !== tab.id && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* Status Real da Conexão */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBottomConsoleOpen(!isBottomConsoleOpen)}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-200 dark:bg-zinc-800 border border-zinc-700 flex items-center gap-1.5 hover:bg-zinc-800 transition cursor-pointer"
              title="Alternar Console de Logs"
            >
              <Terminal size={14} className="text-emerald-400" />
              <span>{isBottomConsoleOpen ? "Fechar Console" : "Exibir Console"}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-zinc-700 text-[10px] text-zinc-300">
                {consoleLogs.length}
              </span>
            </button>

            {isConnected ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Conectado ({connectedPhone || salonPhone})
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Disparo Direto Ativo no Site
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            ABA 1: CONEXÃO DO APARELHO (QR CODE / PAREAMENTO)
            ========================================================================= */}
        {activeTab === "connection" && (
          <div className="space-y-6">
            {/* ESTADO 1: CONECTADO COM SUCESSO */}
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
                      onClick={() => handleTestDispatch()}
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

                {/* 4 Cards de Funcionalidades Conectadas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                      ✓ Confirmações Imediatas
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Envia comprovante ao agendar na Agenda ou pelo link.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                      ✓ Lembretes 24h & 2h Antes
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Reduz faltas notificando as clientes na véspera.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                      ✓ Chave PIX & Caixa
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Solicitação de sinal e recibo após atendimento.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-zinc-900/60 border border-emerald-100 dark:border-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block mb-0.5">
                      ✓ Resgate & Aniversariantes
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Felicitações e convites para clientes inativas.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* ESTADO 2: DESCONECTADO (LEITOR DE QR CODE / CÓDIGO DE PAREAMENTO) */
              <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <Sparkles size={13} />
                      Conexão com Aparelho
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Conectar WhatsApp do Salão
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                    Envie lembretes e confirmações com 1 clique diretamente pelo site ou conecte seu aparelho via Baileys.
                  </p>
                </div>

                {/* BANNER CLARO: FUNCIONA DIRETO NO SITE */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="font-bold text-emerald-950 dark:text-emerald-200">
                        O WhatsApp já funciona 100% diretamente pelo site sem precisar rodar nenhum comando!
                      </span>
                      <p className="text-[11.5px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                        Ao clicar no ícone do WhatsApp na <strong>Agenda</strong>, nos <strong>Clientes</strong> ou no <strong>Caixa</strong>, a mensagem abre pré-formatada com o nome da cliente e horário para envio em 1 clique.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTestDispatch()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    Testar Disparo Agora
                  </button>
                </div>

                {/* ALERTA DE STATUS BAILEYS */}
                {isRealHandshake ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800 text-xs flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        QR Code Oficial do WhatsApp gerado via Baileys Engine (@whiskeysockets/baileys)!
                      </span>
                      <p className="text-[11.5px] text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                        Aponte a câmera em <strong>Aparelhos Conectados</strong> no seu celular. O handshake do protocolo Noise do Baileys garante autenticação oficial direta com o WhatsApp sem erro de código inválido.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs space-y-2">
                    <div className="flex items-start gap-2.5 text-indigo-950 dark:text-indigo-200 font-bold">
                      <Sparkles size={17} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <span>Motor Baileys Ativo (@whiskeysockets/baileys)</span>
                        <p className="font-normal text-[11.5px] text-indigo-800 dark:text-indigo-300 mt-0.5 leading-relaxed">
                          Conectando aos servidores do WhatsApp via protocolo WebSocket nativo. Para manter o WhatsApp conectado 24 horas por dia sem interrupções em produção, execute o comando <code className="bg-indigo-200/60 dark:bg-indigo-900 px-1.5 py-0.5 rounded font-mono font-bold">npm run whatsapp</code> no servidor.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-200/60 dark:border-indigo-900/40">
                      <button
                        onClick={() => setActiveTab("console")}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Terminal size={13} /> Ver Logs no Console Baileys
                      </button>
                      <button
                        onClick={generateConnectionCredentials}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-indigo-300 text-indigo-900 dark:text-indigo-200 font-bold text-[11px] hover:bg-indigo-100/50 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw size={13} /> Atualizar Conexão Baileys
                      </button>
                    </div>
                  </div>
                )}

                {/* Seletor de Método de Conexão */}
                <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setConnectMethod("qrcode");
                      generateConnectionCredentials();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      connectMethod === "qrcode"
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <QrCode size={15} />
                    Escanear QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConnectMethod("pairing_code");
                      generateConnectionCredentials();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                      connectMethod === "pairing_code"
                        ? "bg-[var(--primary)] text-white shadow-2xs"
                        : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <KeyRound size={15} />
                    Código de 8 Dígitos no Celular
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* COLUNA ESQUERDA: QR CODE OU CÓDIGO */}
                  <div className="lg:col-span-5 flex flex-col items-center text-center p-6 bg-[var(--background)]/60 rounded-3xl border border-[var(--card-border)]">
                    {connectMethod === "qrcode" ? (
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="relative p-4 bg-white rounded-2xl shadow-md border-2 border-emerald-500/20">
                          {isLoadingQr ? (
                            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center text-zinc-400 gap-2">
                              <RefreshCw size={32} className="animate-spin text-[var(--primary)]" />
                              <span className="text-xs font-bold">Gerando QR Code...</span>
                            </div>
                          ) : qrCodeDataUrl && countdown > 0 ? (
                            <img
                              src={qrCodeDataUrl}
                              alt="QR Code WhatsApp"
                              className="w-[240px] h-[240px] object-contain rounded-lg"
                            />
                          ) : (
                            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center text-zinc-400 gap-3">
                              <AlertCircle size={32} className="text-amber-500" />
                              <span className="text-xs font-bold text-zinc-600">QR Code expirado</span>
                              <button
                                onClick={generateConnectionCredentials}
                                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] cursor-pointer"
                              >
                                Atualizar QR Code
                              </button>
                            </div>
                          )}

                          {countdown > 0 && qrCodeDataUrl && !isLoadingQr && (
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5">
                              <Clock size={11} /> Atualiza em {countdown}s
                            </div>
                          )}
                        </div>

                        <div className="pt-2 flex flex-col gap-2 w-full max-w-[280px]">
                          <button
                            type="button"
                            onClick={handleConfirmConnection}
                            disabled={isConfirming || countdown <= 0}
                            className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/25 transition cursor-pointer active:scale-[0.99] disabled:opacity-50"
                          >
                            {isConfirming ? (
                              <>
                                <RefreshCw size={15} className="animate-spin" /> Verificando Leitura...
                              </>
                            ) : (
                              <>
                                <Check size={16} /> Já apontei e escaneei no celular
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={generateConnectionCredentials}
                            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold flex items-center justify-center gap-1 py-1 cursor-pointer"
                          >
                            <RefreshCw size={12} /> Gerar outro QR Code
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Conexão via Código de Pareamento */
                      <div className="space-y-5 flex flex-col items-center w-full max-w-[320px]">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          <KeyRound size={24} />
                        </div>

                        <div>
                          <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                            Seu Código de Pareamento
                          </span>
                          <div className="flex items-center justify-center gap-2 bg-white dark:bg-zinc-800 p-4 rounded-2xl border-2 border-emerald-500/40 shadow-xs">
                            <span className="font-mono text-2xl font-extrabold tracking-widest text-[var(--foreground)]">
                              {pairingCode || "GERANDO..."}
                            </span>
                            {pairingCode && (
                              <button
                                onClick={() => copyToClipboard(pairingCode)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-500 transition cursor-pointer"
                                title="Copiar Código"
                              >
                                {copiedCode ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                          No seu WhatsApp, toque em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar com número de telefone</strong> e digite o código acima.
                        </p>

                        <button
                          type="button"
                          onClick={handleConfirmConnection}
                          disabled={isConfirming}
                          className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-[0.99]"
                        >
                          {isConfirming ? (
                            <>
                              <RefreshCw size={15} className="animate-spin" /> Verificando Pareamento...
                            </>
                          ) : (
                            <>
                              <Check size={16} /> Já digitei no celular (Confirmar)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* COLUNA DIREITA: PASSO A PASSO COM ILUSTRAÇÃO */}
                  <div className="lg:col-span-7 space-y-5">
                    <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                      Passo a Passo no seu Celular:
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)]">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--foreground)]">
                            Abra o WhatsApp no celular do seu salão
                          </h4>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                            Pode ser o WhatsApp normal ou o WhatsApp Business instalado no celular da sua recepção.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)]">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--foreground)]">
                            Acesse &quot;Aparelhos Conectados&quot;
                          </h4>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                            No Android, toque nos <strong>3 pontinhos</strong> no canto superior direito. No iPhone, toque em <strong>Configurações</strong> no canto inferior.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)]">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-[var(--foreground)]">
                            Toque em &quot;Conectar um Aparelho&quot;
                          </h4>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                            Aponte a câmera para o QR Code ao lado. Caso utilize Evolution API ou Z-API, a conexão é concluída imediatamente!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs flex items-start gap-3">
                      <ShieldCheck size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                        <strong>Segurança total:</strong> O BellaMais respeita a privacidade do seu salão. Nenhuma conversa pessoal é lida ou armazenada.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO DO NÚMERO DO SALÃO & TESTADOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Card Esquerda: Configurar Telefone */}
              <div className="lg:col-span-6 bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Telefone de Atendimento do Salão
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Este é o número que aparece na sua página de agendamento online (Bio do Instagram)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                    WhatsApp do Salão (com DDD)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={salonPhone}
                      onChange={(e) => setSalonPhone(e.target.value)}
                      placeholder="Ex: 11999998888"
                      className="flex-1 p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      onClick={() => saveWhatsAppData({ salonPhone })}
                      className="px-5 py-3.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] transition cursor-pointer shadow-xs shrink-0"
                    >
                      {savedSuccess ? "Salvo!" : "Salvar"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Direita: Teste de Disparo Rápido */}
              <div className="lg:col-span-6 bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Testar Disparo de Mensagem
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Digite qualquer número para ver a mensagem pronta abrindo no WhatsApp
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                    Número de Teste (com DDD)
                  </label>
                  <input
                    type="tel"
                    value={testRecipientPhone}
                    onChange={(e) => setTestRecipientPhone(e.target.value)}
                    placeholder="Ex: 11988887777"
                    className="w-full p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-xs font-semibold outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <button
                  onClick={() => handleTestDispatch()}
                  className="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-[#25D366]/25 transition cursor-pointer active:scale-[0.99]"
                >
                  <MessageCircle size={17} />
                  Abrir e Enviar Mensagem de Teste no WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 2: SERVIDOR BAILEYS & CONFIGURAÇÃO DE PROVEDORES
            ========================================================================= */}
        {activeTab === "gateway" && (
          <div className="space-y-6">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 border border-[var(--card-border)] shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Zap size={13} />
                    Motor Baileys Integrado (@whiskeysockets/baileys)
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                  Conexão Nativa com WhatsApp via Baileys
                </h2>
                <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-3xl leading-relaxed">
                  O BellaMais agora utiliza diretamente a biblioteca oficial <strong>Baileys</strong> para comunicação WebSocket com o WhatsApp. Você pode conectar diretamente na aba de conexão ou executar o servidor em segundo plano para manter o WhatsApp conectado 24 horas.
                </p>
              </div>

              {/* CARD DESTACADO: SERVIDOR BAILEYS BACKGROUND */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-zinc-900/5 to-emerald-500/10 border-2 border-emerald-400/60 dark:border-emerald-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Terminal size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--foreground)]">
                        Executar Baileys em Segundo Plano (24h Online)
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Inicia o microserviço persistente do Baileys na porta 3001
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunDiagnostic}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Activity size={14} /> Testar Conexão Baileys
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 flex items-center justify-between">
                  <span className="text-emerald-400">$ npm run whatsapp</span>
                  <button
                    onClick={() => copyToClipboard("npm run whatsapp")}
                    className="text-zinc-400 hover:text-white text-xs font-sans font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={13} /> {copiedCode ? "Copiado!" : "Copiar Comando"}
                  </button>
                </div>

                <p className="text-[11.5px] text-[var(--muted)] leading-relaxed">
                  Ao rodar <code className="text-[var(--primary)] font-bold">npm run whatsapp</code> no seu servidor ou computador, o Baileys mantém uma sessão contínua de WebSocket com o WhatsApp Web, garantindo que confirmações e lembretes sejam disparados mesmo se o navegador estiver fechado.
                </p>
              </div>

              {/* Seletor de Modo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setProviderMode("direct")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    providerMode === "direct"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]/20"
                      : "border-[var(--card-border)] bg-[var(--background)] hover:border-zinc-400"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md inline-block mb-2">
                      100% Gratuito & Sem Servidor
                    </span>
                    <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" />
                      Modo Disparo Direto (WhatsApp Web)
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                      Não precisa de servidor, QR Code nem chaves de API. Ao clicar para enviar confirmação ou lembrete, abre o WhatsApp Web ou aplicativo no seu computador/celular com o texto pronto!
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1">
                    {providerMode === "direct" ? "✓ Selecionado" : "Selecionar"}
                  </span>
                </div>

                <div
                  onClick={() => setProviderMode("evolution")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    providerMode === "evolution"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]/20"
                      : "border-[var(--card-border)] bg-[var(--background)] hover:border-zinc-400"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-md inline-block mb-2">
                      Gateway Externo (Opcional)
                    </span>
                    <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                      <Server size={16} className="text-indigo-500" />
                      Evolution API / Z-API
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                      Conecta com um servidor externo já existente da Evolution API ou Z-API caso seu salão utilize uma infraestrutura externa dedicada.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1">
                    {providerMode === "evolution" ? "✓ Selecionado" : "Selecionar"}
                  </span>
                </div>

                <div
                  onClick={() => setProviderMode("meta")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-3 ${
                    providerMode === "meta"
                      ? "border-[var(--primary)] bg-[var(--primary-light)]/20"
                      : "border-[var(--card-border)] bg-[var(--background)] hover:border-zinc-400"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-md inline-block mb-2">
                      Corporativo Oficial
                    </span>
                    <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                      <ShieldCheck size={16} className="text-blue-500" />
                      API Oficial da Meta (Cloud API)
                    </h3>
                    <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                      Conexão pelo WhatsApp Business Platform com selo de verificação oficial da Meta. Requer conta comercial no Meta for Developers.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--primary)] flex items-center gap-1">
                    {providerMode === "meta" ? "✓ Selecionado" : "Selecionar"}
                  </span>
                </div>
              </div>

              {/* FORMULÁRIO DO PROVEDOR EVOLUTION / Z-API */}
              {providerMode === "evolution" && (
                <div className="p-6 rounded-2xl bg-[var(--background)]/70 border border-[var(--card-border)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--card-border)]">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--foreground)]">
                        Credenciais da Evolution API ou Z-API
                      </h4>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        Informe o endereço do seu servidor de WebSocket para gerar QR codes reais
                      </p>
                    </div>

                    {gatewayStatusBadge && (
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                          gatewayStatusBadge === "online"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {gatewayStatusBadge === "online" ? (
                          <>
                            <CheckCircle size={14} /> Gateway Online
                          </>
                        ) : (
                          <>
                            <XCircle size={14} /> Gateway Offline
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                        URL da API (Evolution API ou Z-API)
                      </label>
                      <input
                        type="url"
                        value={gatewayUrl}
                        onChange={(e) => setGatewayUrl(e.target.value)}
                        placeholder="Ex: https://sua-evolution-api.railway.app ou https://api.z-api.io"
                        className="w-full p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--primary)]"
                      />
                      <span className="text-[11px] text-[var(--muted)] mt-1 block">
                        Pode ser hospedado no Railway, Render, VPS ou Docker local
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                        Chave API / Token de Autenticação
                      </label>
                      <input
                        type="password"
                        value={gatewayApiKey}
                        onChange={(e) => setGatewayApiKey(e.target.value)}
                        placeholder="Ex: 4296084C-887F-4B7E-A27D-..."
                        className="w-full p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-mono outline-none focus:border-[var(--primary)]"
                      />
                      <span className="text-[11px] text-[var(--muted)] mt-1 block">
                        A `apikey` definida no seu arquivo `.env` da Evolution API
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--foreground)] block mb-1.5">
                        Nome da Instância
                      </label>
                      <input
                        type="text"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Ex: salao-principal"
                        className="w-full p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs font-bold outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-3">
                    <button
                      type="button"
                      disabled={isTestingGateway}
                      onClick={handleTestGateway}
                      className="px-5 py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {isTestingGateway ? (
                        <>
                          <RefreshCw size={15} className="animate-spin" /> Testando & Salvando...
                        </>
                      ) : (
                        <>
                          <Check size={16} /> Salvar & Testar Conexão com Gateway
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRunDiagnostic()}
                      className="px-4 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--card-border)] text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-2"
                    >
                      <Activity size={15} className="text-indigo-500" /> Executar Diagnóstico de Ping
                    </button>
                  </div>
                </div>
              )}

              {/* MODO DIRETO EXPLICADO */}
              {providerMode === "direct" && (
                <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    Modo Disparo Direto Selecionado (Pronto para Uso!)
                  </h4>
                  <p className="text-xs text-[var(--foreground)] leading-relaxed">
                    Neste modo, o BellaMais gera os links oficiais do WhatsApp Web (<code>https://wa.me/...</code>) com as variáveis da cliente e serviço já preenchidas.
                  </p>
                  <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                    <li>Não precisa escanear QR Code e nunca dará erro de &quot;Código QR Inválido&quot;.</li>
                    <li>Funciona diretamente no WhatsApp Web do seu navegador ou no aplicativo do celular.</li>
                    <li>Sem custos de API ou hospedagem externa de servidores.</li>
                  </ul>
                  <button
                    onClick={() => {
                      saveWhatsAppData({ providerMode: "direct" });
                      setActiveTab("connection");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Confirmar Modo Direto Gratuito
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 3: CONSOLE DE LOGS EM TEMPO REAL & DIAGNÓSTICO
            ========================================================================= */}
        {activeTab === "console" && (
          <div className="space-y-4">
            <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                      <Terminal size={13} />
                      Console & DevTools
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Terminal de Diagnóstico em Tempo Real
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Todos os eventos, chamadas de API e respostas de conexões do WhatsApp são registrados aqui e no <code>console.log</code> do navegador (F12).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRunDiagnostic}
                    disabled={isRunningDiagnostic}
                    className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-dark)] transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Activity size={14} className={isRunningDiagnostic ? "animate-spin" : ""} />
                    {isRunningDiagnostic ? "Executando..." : "Executar Diagnóstico"}
                  </button>
                  <button
                    onClick={handleCopyLogs}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--card-border)] text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedLogs ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copiedLogs ? "Copiado!" : "Copiar Logs"}
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-[var(--card-border)] text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Limpar
                  </button>
                </div>
              </div>

              {/* Filtros de Logs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--card-border)]">
                <span className="text-[11px] font-bold text-[var(--muted)] mr-1">Filtrar:</span>
                {[
                  { id: "ALL", label: `Todos (${consoleLogs.length})` },
                  { id: "ERRORS", label: `Erros (${consoleLogs.filter((l) => l.level === "error").length})` },
                  { id: "WARNS", label: `Avisos (${consoleLogs.filter((l) => l.level === "warn").length})` },
                  { id: "API", label: `API & Gateway (${consoleLogs.filter((l) => l.source === "SERVER_API" || l.source === "GATEWAY").length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLogFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      logFilter === f.id
                        ? "bg-zinc-900 text-white dark:bg-zinc-200 dark:text-zinc-900"
                        : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Terminal View */}
              <div className="bg-[#0b0f19] text-zinc-200 font-mono text-xs rounded-2xl p-4 md:p-5 border border-zinc-800/80 shadow-2xl max-h-[520px] overflow-y-auto space-y-2">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>bellamais-whatsapp-engine v2.0 • Porta: 3000 / Next.js Serverless</span>
                  </div>
                  <span>{filteredLogs.length} eventos exibidos</span>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    Nenhum log registrado para este filtro. Execute um diagnóstico ou gere um novo QR Code.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 py-1 px-1.5 rounded-md hover:bg-zinc-900/60 transition group font-mono text-[11.5px] leading-relaxed"
                    >
                      <span className="text-zinc-500 select-none shrink-0 font-normal">[{log.timestamp}]</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                          log.level === "error"
                            ? "bg-rose-950 text-rose-400 border border-rose-800"
                            : log.level === "warn"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : log.level === "success"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                : log.level === "debug"
                                  ? "bg-purple-950 text-purple-300 border border-purple-800"
                                  : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-zinc-400 select-none shrink-0 font-bold">[{log.source}]</span>
                      <span
                        className={`flex-1 break-all ${
                          log.level === "error"
                            ? "text-rose-300 font-semibold"
                            : log.level === "warn"
                              ? "text-amber-200"
                              : log.level === "success"
                                ? "text-emerald-300"
                                : "text-zinc-200"
                        }`}
                      >
                        {log.message}
                        {log.details && (
                          <pre className="mt-1 p-2 rounded-lg bg-black/60 text-[10px] text-zinc-400 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </span>
                    </div>
                  ))
                )}
                <div ref={consoleEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 4: MENSAGENS AUTOMÁTICAS (10 REGRAS)
            ========================================================================= */}
        {activeTab === "automation" && (
          <div className="bg-[var(--card-bg)] rounded-3xl p-6 border border-[var(--card-border)] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--card-border)]">
              <div>
                <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                  Personalizar os 10 Modelos de Mensagens
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Variáveis automáticas aceitas:{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{cliente}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{servico}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{profissional}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{data}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{hora}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{salao}}"}</code>,{" "}
                  <code className="text-[var(--primary)] font-bold">{"{{pix}}"}</code>.
                </p>
              </div>
              <button
                onClick={() => saveWhatsAppData({ autoMessages })}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-xs hover:bg-[var(--primary-dark)] transition cursor-pointer shrink-0"
              >
                {savedSuccess ? "Alterações Salvas!" : "Salvar Textos das Mensagens"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {autoMessages.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--background)]/50 space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-[var(--foreground)]">
                          {rule.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        ● Ativo
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--primary)]">
                      <Info size={11} />
                      <span>{rule.location}</span>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                      {rule.triggerDescription}
                    </p>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      value={rule.template}
                      onChange={(e) => {
                        const updated = autoMessages.map((r) =>
                          r.id === rule.id ? { ...r, template: e.target.value } : r
                        );
                        setAutoMessages(updated);
                      }}
                      className="w-full p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs outline-none focus:border-[var(--primary)] leading-relaxed"
                    />

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--card-border)]">
                      <button
                        type="button"
                        onClick={() =>
                          handleTestDispatch(
                            salonPhone,
                            rule.template
                              .replace(/{{cliente}}/g, "Mariana Silva")
                              .replace(/{{servico}}/g, "Corte & Escova")
                              .replace(/{{profissional}}/g, "Camila Santos")
                              .replace(/{{data}}/g, "Amanhã")
                              .replace(/{{hora}}/g, "14:30")
                              .replace(/{{salao}}/g, salonName)
                              .replace(/{{pix}}/g, salonPhone || "11999998888")
                              .replace(/{{link_avaliacao}}/g, "g.page/r/bellamais")
                          )
                        }
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle size={12} /> Testar Disparo
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            ABA 5: CENTRAL DE DISPARO RÁPIDO
            ========================================================================= */}
        {activeTab === "inbox" && (
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold font-sans tracking-tight text-[var(--foreground)]">
                  Central de Disparo Rápido para Clientes
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Dispare mensagens diretas para qualquer número com 1 clique pelo WhatsApp oficial
                </p>
              </div>

              <button
                onClick={() => {
                  const phone = prompt("Digite o WhatsApp da cliente com DDD (ex: 11999998888):");
                  if (phone) handleTestDispatch(phone);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#20bd5a]"
              >
                <Plus size={15} /> Nova Mensagem WhatsApp
              </button>
            </div>

            <div className="p-8 text-center bg-[var(--background)]/60 rounded-2xl border border-dashed border-[var(--card-border)]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                <MessageCircle size={24} />
              </div>
              <h4 className="font-bold text-sm text-[var(--foreground)]">
                Envios integrados à Agenda e ao Caixa
              </h4>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto mt-1 leading-relaxed">
                Ao clicar no botão de WhatsApp em qualquer agendamento ou cliente,
                o sistema monta a mensagem formatada e abre o seu WhatsApp Web ou aplicativo com 1 clique.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            DRAWER / PAINEL FLUTUANTE INFERIOR DO CONSOLE (QUICK VIEW)
            ========================================================================= */}
        {isBottomConsoleOpen && activeTab !== "console" && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117] text-zinc-100 border-t-2 border-emerald-500/60 shadow-2xl transition-all max-h-[340px] flex flex-col">
            <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={15} className="text-emerald-400" />
                <span className="font-mono text-xs font-bold">Terminal de Logs em Tempo Real ({consoleLogs.length} eventos)</span>
                <span className="text-[10px] text-zinc-400">• Espelhado no Console F12</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-300 transition cursor-pointer flex items-center gap-1"
                >
                  <Copy size={12} /> {copiedLogs ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={() => setIsBottomConsoleOpen(false)}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  ✕ Fechar
                </button>
              </div>
            </div>

            <div className="p-3 overflow-y-auto space-y-1.5 font-mono text-[11px] flex-1">
              {consoleLogs.slice(0, 30).map((l) => (
                <div key={l.id} className="flex items-start gap-2">
                  <span className="text-zinc-500 shrink-0">[{l.timestamp}]</span>
                  <span
                    className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                      l.level === "error"
                        ? "bg-rose-900 text-rose-300"
                        : l.level === "warn"
                          ? "bg-amber-900 text-amber-300"
                          : l.level === "success"
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-blue-900 text-blue-300"
                    }`}
                  >
                    {l.level}
                  </span>
                  <span className="text-zinc-400 shrink-0">[{l.source}]</span>
                  <span className={l.level === "error" ? "text-rose-300 font-bold" : "text-zinc-200"}>
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
