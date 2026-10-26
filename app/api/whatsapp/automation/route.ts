import { NextRequest, NextResponse } from "next/server";
import { getBaileysStatus, sendBaileysMessage } from "@/lib/baileysManager";

export const runtime = "nodejs";

interface AutomationRequestBody {
  appointments?: Array<{
    id: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    status: string;
    professionalName?: string;
    whatsappRemindersSent?: {
      dayBefore?: boolean;
      twoHoursBefore?: boolean;
      postFeedback?: boolean;
    };
  }>;
  salonName?: string;
  salonPhone?: string;
  pixKey?: string;
  rulesConfig?: {
    confirm24h?: boolean;
    reminder2h?: boolean;
    postCare?: boolean;
    inactiveClients?: boolean;
  };
  templates?: {
    confirm24h?: string;
    reminder2h?: string;
    postCare?: string;
  };
}

/**
 * Endpoint do Motor de Piloto Automático do WhatsApp
 * Executa checagem inteligente de agendamentos e dispara lembretes sem intervenção humana.
 */
export async function GET(req: NextRequest) {
  const baileysServerUrl = (process.env.WHATSAPP_BAILEYS_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
  let isConnected = false;
  let connectedPhone = "";

  // 1. Checa microserviço HTTP
  try {
    const sRes = await fetch(`${baileysServerUrl}/status`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    if (sRes.ok) {
      const sData = await sRes.json();
      if (sData.isConnected) {
        isConnected = true;
        connectedPhone = sData.connectedPhone;
      }
    }
  } catch (e) {}

  // 2. Checa Baileys embutido
  if (!isConnected) {
    const bStatus = getBaileysStatus();
    isConnected = bStatus.isConnected;
    connectedPhone = bStatus.connectedPhone;
  }

  return NextResponse.json({
    ok: true,
    engine: "WhatsApp Automation Pilot",
    isConnected,
    connectedPhone,
    status: isConnected ? "running" : "idle_disconnected",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: AutomationRequestBody = await req.json().catch(() => ({}));
    const {
      appointments = [],
      salonName = "Studio de Beleza",
      pixKey = "",
      rulesConfig = {
        confirm24h: true,
        reminder2h: true,
        postCare: true,
      },
      templates = {},
    } = body;

    const baileysServerUrl = (process.env.WHATSAPP_BAILEYS_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
    let isConnected = false;
    let connectedPhone = "";

    // Verifica status da conexão
    try {
      const sRes = await fetch(`${baileysServerUrl}/status`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.isConnected) {
          isConnected = true;
          connectedPhone = sData.connectedPhone;
        }
      }
    } catch (e) {}

    if (!isConnected) {
      const bStatus = getBaileysStatus();
      isConnected = bStatus.isConnected;
      connectedPhone = bStatus.connectedPhone;
    }

    if (!isConnected) {
      return NextResponse.json({
        ok: false,
        connected: false,
        message:
          "WhatsApp desconectado do servidor. Escaneie o QR Code na aba Conexão para que o robô envie as mensagens 100% no automático.",
        sentCount: 0,
        pendingAppointments: appointments.length,
      });
    }

    // Datas de referência em Horário de Brasília
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const dispatched: Array<{
      appointmentId: string;
      clientName: string;
      phone: string;
      type: "24h_confirmation" | "2h_reminder" | "post_feedback";
      messageId?: string;
    }> = [];

    const logs: string[] = [];

    // Helper para preenchimento de templates
    const fillTemplate = (tpl: string, apt: any) => {
      const formattedPrice = (apt.price || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const [year, month, day] = (apt.date || "").split("-");
      const dateFormatted = day && month ? `${day}/${month}` : apt.date;

      return tpl
        .replace(/{cliente}/g, apt.clientName.split(" ")[0])
        .replace(/{nome}/g, apt.clientName)
        .replace(/{servico}/g, apt.serviceName)
        .replace(/{data}/g, dateFormatted)
        .replace(/{horario}/g, apt.time)
        .replace(/{valor}/g, formattedPrice)
        .replace(/{salao}/g, salonName)
        .replace(/{profissional}/g, apt.professionalName || "Nossa especialista")
        .replace(/{chave_pix}/g, pixKey || "Solicite a chave no salão");
    };

    // Template padrão carinhoso de 24h
    const default24hTemplate =
      templates.confirm24h ||
      `Oi, {cliente}! 💕 Tudo bem?\nPassando para confirmar seu horário amanhã ({data}) às {horario} para {servico} aqui no {salao}.\n\nPodemos confirmar sua presença?\n\n*1.* Digite *SIM* para confirmar\n*2.* Digite *NÃO* para reagendar\n\nTe esperamos com carinho! ✨`;

    // Template padrão de 2h
    const default2hTemplate =
      templates.reminder2h ||
      `Oi, {cliente}! 🌸 Sua bancada já está pronta e seu cafezinho te esperando!\n\nLembrando que seu horário para {servico} é hoje às *{horario}*.\n\nQualquer imprevisto nos avise. Até daqui a pouco! 💕`;

    // Template de pós-atendimento
    const defaultPostTemplate =
      templates.postCare ||
      `Oi, {cliente}! ✨ Foi um imenso prazer cuidar de você hoje no {salao}!\n\nConta para a gente: o que achou do seu atendimento?\nSeu feedback é muito importante para nós. Até a próxima visita! 💖`;

    // Função interna para disparo seguro via Baileys
    const dispatchMessage = async (phone: string, text: string) => {
      const clean = phone.replace(/\D/g, "");
      const formatted = clean.length <= 11 ? `55${clean}` : clean;

      // Tenta microserviço
      try {
        const res = await fetch(`${baileysServerUrl}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: formatted, text }),
          signal: AbortSignal.timeout(4000),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) return { sent: true, messageId: data.messageId };
        }
      } catch (e) {}

      // Tenta Baileys embutido
      const resEmbedded = await sendBaileysMessage(formatted, text);
      return resEmbedded;
    };

    // Varredura dos agendamentos
    for (const apt of appointments) {
      if (!apt.clientPhone || apt.status === "cancelled" || apt.status === "no_show") {
        continue;
      }

      const alreadySent = apt.whatsappRemindersSent || {};

      // 1. REGRA 24H (Véspera)
      if (
        rulesConfig.confirm24h &&
        apt.date === tomorrowStr &&
        apt.status === "pending" &&
        !alreadySent.dayBefore
      ) {
        const text = fillTemplate(default24hTemplate, apt);
        const result = await dispatchMessage(apt.clientPhone, text);

        if (result.sent) {
          dispatched.push({
            appointmentId: apt.id,
            clientName: apt.clientName,
            phone: apt.clientPhone,
            type: "24h_confirmation",
            messageId: result.messageId,
          });
          logs.push(`🤖 [Confirmação 24h] Enviado para ${apt.clientName} (${apt.serviceName} - amanhã às ${apt.time})`);
          // Delay de proteção anti-banimento (1.2s entre mensagens)
          await new Promise((r) => setTimeout(r, 1200));
        }
      }

      // 2. REGRA 2H ("Bancada Pronta")
      if (
        rulesConfig.reminder2h &&
        apt.date === todayStr &&
        (apt.status === "pending" || apt.status === "confirmed") &&
        !alreadySent.twoHoursBefore
      ) {
        const [aptH, aptM] = (apt.time || "00:00").split(":").map(Number);
        const aptTotalMinutes = aptH * 60 + aptM;
        const diffMinutes = aptTotalMinutes - currentTotalMinutes;

        // Se falta entre 40 minutos e 180 minutos (3 horas)
        if (diffMinutes >= 40 && diffMinutes <= 180) {
          const text = fillTemplate(default2hTemplate, apt);
          const result = await dispatchMessage(apt.clientPhone, text);

          if (result.sent) {
            dispatched.push({
              appointmentId: apt.id,
              clientName: apt.clientName,
              phone: apt.clientPhone,
              type: "2h_reminder",
              messageId: result.messageId,
            });
            logs.push(`🤖 [Lembrete 2h] Enviado para ${apt.clientName} (${apt.serviceName} - hoje às ${apt.time})`);
            await new Promise((r) => setTimeout(r, 1200));
          }
        }
      }

      // 3. REGRA PÓS-ATENDIMENTO (30min pós-serviço)
      if (
        rulesConfig.postCare &&
        apt.date === todayStr &&
        apt.status === "completed" &&
        !alreadySent.postFeedback
      ) {
        const [aptH, aptM] = (apt.time || "00:00").split(":").map(Number);
        const aptTotalMinutes = aptH * 60 + aptM;
        const diffMinutes = currentTotalMinutes - aptTotalMinutes;

        // Se já passou pelo menos 20 minutos do horário
        if (diffMinutes >= 20 && diffMinutes <= 360) {
          const text = fillTemplate(defaultPostTemplate, apt);
          const result = await dispatchMessage(apt.clientPhone, text);

          if (result.sent) {
            dispatched.push({
              appointmentId: apt.id,
              clientName: apt.clientName,
              phone: apt.clientPhone,
              type: "post_feedback",
              messageId: result.messageId,
            });
            logs.push(`🤖 [Pós-Atendimento] Feedback solicitado para ${apt.clientName}`);
            await new Promise((r) => setTimeout(r, 1200));
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      connectedPhone,
      sentCount: dispatched.length,
      dispatched,
      logs,
      message:
        dispatched.length > 0
          ? `🎉 Sucesso! O robô do WhatsApp disparou ${dispatched.length} mensagens automaticamente sem nenhuma intervenção manual.`
          : "Tudo em dia! Nenhum novo agendamento precisou de disparo neste momento.",
    });
  } catch (error: any) {
    console.error("[WhatsApp Automation API Error]:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro no processamento da automação." },
      { status: 500 }
    );
  }
}
