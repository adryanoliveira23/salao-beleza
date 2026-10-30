"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Send,
  Zap,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

interface WhatsAppLog {
  id: string;
  salonName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  status: "sent" | "failed";
  timestamp: string;
}

export function WhatsAppMasterTab() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const checkStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(Boolean(data.connected));
        if (data.phoneNumber) {
          setConnectedPhone(data.phoneNumber);
        }
      }
    } catch (e) {
      console.warn("Erro ao checar status do WhatsApp Master:", e);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const generateQr = async () => {
    setIsLoadingQr(true);
    setQrCodeBase64(null);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.qrCodeBase64) {
          setQrCodeBase64(data.qrCodeBase64);
        }
        if (data.connected) {
          setIsConnected(true);
          setConnectedPhone(data.phoneNumber || "");
        }
      }
    } catch (e) {
      showToast("Erro ao requisitar QR Code.");
    } finally {
      setIsLoadingQr(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp Master do disparador automático?")) {
      return;
    }
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      if (res.ok) {
        setIsConnected(false);
        setConnectedPhone("");
        setQrCodeBase64(null);
        showToast("WhatsApp Master desconectado com sucesso.");
      }
    } catch {
      showToast("Erro ao desconectar WhatsApp Master.");
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.salonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.clientPhone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notifier */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#7E1639] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2">
          <Sparkles size={14} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <MessageCircle size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                Robô Central de Disparos (WhatsApp Master)
              </h2>
              <span
                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  isConnected
                    ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50"
                    : "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {isConnected ? "Conectado & Operacional" : "Aguardando Conexão"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Este número de WhatsApp é o motor central responsável por disparar todas as confirmações e lembretes para os clientes de todos os salões da rede.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={checkStatus}
            disabled={isCheckingStatus}
            className="px-3.5 py-2 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} className={isCheckingStatus ? "animate-spin" : ""} />
            <span>Verificar</span>
          </button>
          {isConnected ? (
            <button
              type="button"
              onClick={disconnect}
              className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut size={14} />
              <span>Desconectar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={generateQr}
              disabled={isLoadingQr}
              className="px-4 py-2 rounded-xl bg-[#7E1639] hover:bg-[#64112E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#7E1639]/20 transition cursor-pointer"
            >
              <QrCode size={14} />
              <span>{isLoadingQr ? "Gerando..." : "Conectar QR Code"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid: Conexão / Status + Preview da Mensagem */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Conexão */}
        <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 mb-3">
              <Smartphone size={16} className="text-[#7E1639] dark:text-[#E27D9A]" />
              <span>Aparelho WhatsApp Master</span>
            </h3>

            {isConnected ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      Disparador Ativo via Baileys Engine
                    </p>
                    <p className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                      +{connectedPhone || "558196896251"}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed pt-2 border-t border-emerald-200/40">
                  ✅ Todas as reservas feitas pelas clientes nas páginas de qualquer salão da plataforma estão sendo notificadas automaticamente pelo seu número.
                </div>
              </div>
            ) : qrCodeBase64 ? (
              <div className="flex flex-col items-center justify-center p-4 border border-[var(--card-border)] rounded-xl bg-stone-50 dark:bg-stone-900/40 space-y-3">
                <p className="text-xs font-semibold text-[var(--muted)] text-center">
                  Abra o WhatsApp no celular &gt; <b>Aparelhos Conectados</b> &gt; <b>Conectar Aparelho</b>
                </p>
                <div className="p-2 bg-white rounded-xl shadow-md border border-stone-200">
                  <img
                    src={qrCodeBase64}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={checkStatus}
                  className="px-4 py-2 bg-[#7E1639] text-white rounded-xl text-xs font-bold hover:bg-[#64112E] transition"
                >
                  Já escaneei no celular
                </button>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-[var(--card-border)] rounded-xl text-center space-y-3 bg-[var(--surface-hover)]/40">
                <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                  <QrCode size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]">Nenhum WhatsApp conectado no momento</p>
                  <p className="text-[11px] text-[var(--muted)] max-w-sm mx-auto mt-0.5">
                    Clique no botão abaixo para gerar o QR Code oficial e parear o seu celular como o disparador central do SaaS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateQr}
                  disabled={isLoadingQr}
                  className="px-5 py-2.5 rounded-xl bg-[#7E1639] hover:bg-[#64112E] text-white text-xs font-bold shadow-md cursor-pointer transition"
                >
                  {isLoadingQr ? "Gerando QR Code..." : "Gerar QR Code Agora"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--card-border)] text-[11px] text-[var(--muted)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              Sessão Criptografada (Multi-Device)
            </span>
            <span>Protocolo Baileys</span>
          </div>
        </div>

        {/* Card: Como a Mensagem é Entregue (Template Dinâmico) */}
        <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Formato de Envio para as Clientes</span>
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Multi-Salões Dinâmico
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#eef7f0] dark:bg-[#15231c] border border-emerald-200/70 dark:border-emerald-900/60 font-sans text-xs text-stone-800 dark:text-stone-200 space-y-2 leading-relaxed shadow-inner">
              <div className="font-semibold text-emerald-900 dark:text-emerald-300">
                Olá, Mariana! 💖 Seu agendamento foi realizado com sucesso!
              </div>
              <div className="space-y-0.5">
                <p>💅 <b>Serviço:</b> Unhas em gel</p>
                <p>📅 <b>Data:</b> 31/10/2026 às 14:00</p>
                <p>👩‍🦰 <b>Profissional:</b> Nicoly <span className="text-[10px] text-stone-500">(só aparece se selecionada)</span></p>
                <p>📍 <b>Salão:</b> [Nome Real do Salão da Francisca]</p>
              </div>
              <div className="pt-2 border-t border-emerald-300/40 dark:border-emerald-800/40 text-[11px] text-stone-600 dark:text-stone-400">
                <p>──────────────────────</p>
                <p>🤖 <i>Mensagem automática de confirmação.</i></p>
                <p>💬 <b>Dúvidas ou atendimento com o salão:</b></p>
                <p>Fale direto pelo WhatsApp: <b>(81) 98765-4321</b></p>
                <p>👉 <u>wa.me/5581987654321</u></p>
                <p>──────────────────────</p>
                <p>Agradecemos pela preferência!</p>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[11px] text-[var(--muted)]">
            💡 O cliente recebe a confirmação pelo seu número, sabe que é um robô de aviso e é direcionado para falar direto com a dona do salão pelo link clicável.
          </div>
        </div>
      </div>

      {/* Histórico Geral de Mensagens Disparadas */}
      <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <Clock size={16} className="text-[#7E1639] dark:text-[#E27D9A]" />
              <span>Registro de Disparos em Tempo Real</span>
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Auditoria de notificações enviadas para clientes de todos os salões assinantes
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, telefone ou salão..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs text-[var(--foreground)] placeholder-[var(--muted)] outline-none"
            />
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--card-border)] rounded-xl">
            <MessageCircle size={28} className="mx-auto text-stone-300 dark:text-stone-700 mb-2" />
            <p className="font-semibold text-[var(--foreground)]">Nenhum disparo registrado ainda</p>
            <p className="text-[11px] mt-0.5">Assim que clientes realizarem agendamentos, o histórico aparecerá aqui com status de entrega.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--surface-hover)] text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider border-b border-[var(--card-border)]">
                <tr>
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Salão de Origem</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Telefone</th>
                  <th className="py-2.5 px-3">Serviço</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--card-border)]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-hover)]/50 transition">
                    <td className="py-2.5 px-3 font-medium text-[var(--muted)]">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-[var(--foreground)]">{log.salonName}</td>
                    <td className="py-2.5 px-3 text-[var(--foreground)]">{log.clientName}</td>
                    <td className="py-2.5 px-3 text-[var(--muted)] font-mono">{log.clientPhone}</td>
                    <td className="py-2.5 px-3 text-[var(--foreground)]">{log.serviceName} ({log.date} às {log.time})</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} />
                        Enviado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
