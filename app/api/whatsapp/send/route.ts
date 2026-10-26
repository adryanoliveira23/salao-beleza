import { NextRequest, NextResponse } from "next/server";
import { sendBaileysMessage, getBaileysStatus } from "@/lib/baileysManager";

export const runtime = "nodejs";

/**
 * Endpoint real para envio de mensagens pelo WhatsApp com suporte a Baileys:
 * - 1. Envio nativo pelo Baileys Engine (@whiskeysockets/baileys)
 * - 2. Suporta Microserviço Baileys em porta 3001 (whatsapp-server.js)
 * - 3. Suporta API Oficial da Meta / Gateways externos
 * - 4. Suporta Modo Direto (WhatsApp Web wa.me)
 */
export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  console.log(`\n[WhatsApp Send API - ${timestamp}] Disparo de mensagem solicitado.`);

  try {
    const body = await req.json();
    const {
      provider = "baileys",
      toPhone,
      messageText,
      templateName,
      templateLanguage = "pt_BR",
      // Meta Official
      phoneNumberId,
      accessToken,
      // Gateway
      gatewayUrl,
      instanceName,
      apiKey,
    } = body;

    const cleanPhone = (toPhone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      console.warn(`[WhatsApp Send API] Número inválido recebido: "${toPhone}"`);
      return NextResponse.json(
        { sent: false, message: "Número de telefone inválido. Informe DDD + Número." },
        { status: 400 }
      );
    }
    const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    console.log(`[WhatsApp Send API] Destinatário: ${formattedPhone} | Provedor: ${provider}`);

    // Modo Direto forçado ou explícito
    if (provider === "free_direct") {
      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(messageText || "")}`;
      return NextResponse.json({
        sent: true,
        provider: "free_direct",
        directUrl: waUrl,
        message: "Link de envio direto do WhatsApp gerado com sucesso!",
      });
    }

    // 1. TENTA ENVIO VIA MICROSERVIÇO BAILEYS HTTP (whatsapp-server.js)
    const baileysServerUrl = (process.env.WHATSAPP_BAILEYS_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
    try {
      const bRes = await fetch(`${baileysServerUrl}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: formattedPhone, text: messageText }),
        signal: AbortSignal.timeout(5000),
      });
      if (bRes.ok) {
        const bData = await bRes.json();
        if (bData.ok) {
          console.log("[WhatsApp Send API] Mensagem enviada com sucesso pelo Microserviço Baileys!");
          return NextResponse.json({
            sent: true,
            messageId: bData.messageId,
            provider: "baileys_service",
          });
        }
      }
    } catch (e) {
      // Microserviço offline, tenta Baileys embutido
    }

    // 2. TENTA ENVIO VIA BAILEYS ENGINE EMBUTIDO
    const bStatus = getBaileysStatus();
    if (bStatus.isConnected) {
      const bResult = await sendBaileysMessage(formattedPhone, messageText);
      if (bResult.sent) {
        console.log("[WhatsApp Send API] Mensagem enviada via Baileys Engine embutido!");
        return NextResponse.json({
          sent: true,
          messageId: bResult.messageId,
          provider: "baileys_embedded",
        });
      }
    }

    // 3. Tenta Gateway Externo se configurado
    const effectiveGatewayUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
    const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
    const effectiveInstance = instanceName || "salao-principal";

    if (effectiveGatewayUrl && effectiveApiKey) {
      const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
      const gwRes = await fetch(
        `${baseUrl}/message/sendText/${encodeURIComponent(effectiveInstance)}`,
        {
          method: "POST",
          headers: {
            apikey: effectiveApiKey,
            Authorization: `Bearer ${effectiveApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: messageText,
          }),
        }
      );
      if (gwRes.ok) {
        const gwData = await gwRes.json().catch(() => ({}));
        return NextResponse.json({
          sent: true,
          messageId: gwData?.key?.id || crypto.randomUUID(),
          provider: "qr_gateway",
        });
      }
    }

    // 4. FALLBACK ELEGANTE: SE BAILEYS DESCONECTADO
    const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(messageText || "")}`;
    return NextResponse.json({
      sent: false,
      isAutomated: false,
      requiresManualDispatch: true,
      provider: "free_direct",
      directUrl: waUrl,
      message: "WhatsApp não está emparelhado no servidor. Conecte o QR Code para disparos automáticos ou utilize o envio manual.",
    });
  } catch (error) {
    console.error("[WhatsApp Send API] Erro crítico no envio:", error);
    return NextResponse.json(
      {
        sent: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar mensagem.",
      },
      { status: 500 }
    );
  }
}
