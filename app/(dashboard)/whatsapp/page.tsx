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

  const [activeTab, setActiveTab] = useState<"connection" | "automation" | "inbox">("connection");

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

  // Configurações do Salão
  const [salonPhone, setSalonPhone] = useState(profile?.phone || "11999998888");
  const [testRecipientPhone, setTestRecipientPhone] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Selected rule for interactive phone preview
  const [selectedRuleId, setSelectedRuleId] = useState<string>("confirmation");

  // Auto Messages State
  const [autoMessages, setAutoMessages] = useState<AutoMessageRule[]>(DEFAULT_AUTO_MESSAGES);

  const salonName = profile?.salon_name || "Meu Salão";

  // Carrega configurações salvas do Firestore
  useEffect(() => {
    if (!user) return;
    async function loadWhatsAppData() {
      if (!user) return;
      try {
        const ref = doc(db, "whatsapp_config", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.isConnected !== undefined) setIsConnected(d.isConnected);
          if (d.connectedPhone) setConnectedPhone(d.connectedPhone);
          if (d.connectedAt) setConnectedAt(d.connectedAt);
          if (d.salonPhone) setSalonPhone(d.salonPhone);
          if (d.autoMessages && Array.isArray(d.autoMessages) && d.autoMessages.length > 0) {
            setAutoMessages(d.autoMessages);
          }
        }
      } catch (e) {
        // Ignora silenciosamente
      }
    }
    loadWhatsAppData();
  }, [user]);

  const saveWhatsAppData = async (updates: Record<string, any>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "whatsapp_config", user.uid), updates, {
        merge: true,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (e) {
      // Ignora silenciosamente
    }
  };

  // Gerador de QR Code / Código de Pareamento Real
  const generateConnectionCredentials = async () => {
    setIsLoadingQr(true);
    setCountdown(45);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          connectionMethod: connectMethod,
          phoneNumber: salonPhone,
          salonName: salonName,
        }),
      });
      const data = await res.json();
      if (data.qrCodeBase64) {
        setQrCodeDataUrl(data.qrCodeBase64);
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (err) {
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

  // Confirmar Conexão após leitura do QR Code ou digitação do código
  const handleConfirmConnection = async () => {
    setIsConfirming(true);
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

        await saveWhatsAppData({
          isConnected: true,
          connectedPhone: phoneFormatted,
          connectedAt: timeNow,
          connectionMethod: connectMethod,
          salonPhone: salonPhone,
        });
      }
    } catch (err) {
      alert("Erro ao confirmar conexão. Tente novamente.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Desconectar Sessão
  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar o WhatsApp do salão? Os envios automáticos serão pausados.")) {
      return;
    }
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
    // Gera novo QR code para poder reconectar
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
    window.open(`https://api.whatsapp.com/send?phone=${num}&text=${encoded}`, "_blank");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
                label: "Conexão do Aparelho",
                icon: Smartphone,
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
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Real da Conexão */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/80 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                WhatsApp Conectado ({connectedPhone || salonPhone})
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/80 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Aguardando Leitura do QR Code
              </span>
            )}
          </div>
        </div>

        {/* =========================================================================
            ABA 1: CONEXÃO REAL DO APARELHO (QR CODE / CÓDIGO)
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
                      Conexão Oficial
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                    Conectar WhatsApp do Salão
                  </h2>
                  <p className="text-xs md:text-sm text-[var(--muted)] mt-1 max-w-2xl leading-relaxed">
                    Escaneie o QR Code abaixo com o celular da sua recepção para conectar o WhatsApp oficial ao BellaMais. É rápido, seguro e exatamente igual ao WhatsApp Web.
                  </p>
                </div>

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
                    Escanear QR Code (Recomendado)
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
                            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] font-semibold flex items-center justify-center gap-1 py-1"
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
                            Pode ser o WhatsApp normal ou o WhatsApp Business instalado no seu celular da recepção.
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
                            Aponte a câmera para o QR Code ao lado. A conexão é confirmada na hora e seu salão já fica pronto para disparar!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs flex items-start gap-3">
                      <ShieldCheck size={18} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                        <strong>Segurança total:</strong> O BellaMais utiliza a mesma criptografia de ponta a ponta do WhatsApp oficial. Nenhuma mensagem pessoal é lida ou armazenada.
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
            ABA 2: MENSAGENS AUTOMÁTICAS (10 REGRAS)
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
                          r.id === rule.id ? { ...r, template: e.target.value } : r,
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
                              .replace(/{{link_avaliacao}}/g, "g.page/r/bellamais"),
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
            ABA 3: CENTRAL DE DISPARO RÁPIDO
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
      </div>
    </div>
  );
}
