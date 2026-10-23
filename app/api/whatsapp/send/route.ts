import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint real para envio de mensagens pelo WhatsApp:
 * - Suporta API Oficial da Meta (texto dentro da janela de 24h ou templates aprovados)
 * - Suporta Provedor Compatível (Evolution API / Z-API / WPPConnect)
 * - Suporta Modo Direto (WhatsApp Web / App wa.me 100% gratuito)
 */
export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  console.log(`\n[WhatsApp Send Server - ${timestamp}] Disparo de mensagem solicitado.`);

  try {
    const body = await req.json();
    const {
      provider,
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
      console.warn(`[WhatsApp Send Server] Número inválido recebido: "${toPhone}"`);
      return NextResponse.json(
        { sent: false, message: "Número de telefone inválido. Informe DDD + Número." },
        { status: 400 },
      );
    }
    const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    console.log(`[WhatsApp Send Server] Destinatário formatado: ${formattedPhone} | Provedor: ${provider || "auto"}`);

    if (provider === "free_direct" || (!gatewayUrl && !phoneNumberId && !process.env.WHATSAPP_GATEWAY_URL)) {
      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(messageText || "")}`;
      console.log(`[WhatsApp Send Server] Gerado link direto WhatsApp Web: ${waUrl.substring(0, 80)}...`);
      return NextResponse.json({
        sent: true,
        provider: "free_direct",
        directUrl: waUrl,
        message: "Link de envio direto do WhatsApp gerado com sucesso!",
      });
    }

    if (provider === "meta_official") {
      if (!phoneNumberId || !accessToken) {
        console.warn("[WhatsApp Send Server] Meta Official sem credenciais completas.");
        return NextResponse.json(
          {
            sent: false,
            requiresCredentials: true,
            message:
              "Envio via API Oficial pendente: configure o Phone Number ID e o Access Token da Meta.",
          },
          { status: 400 },
        );
      }

      const payload = templateName
        ? {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: templateLanguage },
            },
          }
        : {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "text",
            text: { preview_url: false, body: messageText },
          };

      const res = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        console.error("[WhatsApp Send Server] Erro Meta Cloud API:", data?.error);
        return NextResponse.json(
          {
            sent: false,
            message:
              data?.error?.message ||
              "Erro ao enviar mensagem pela API Oficial da Meta.",
            details: data?.error,
          },
          { status: res.status },
        );
      }

      console.log("[WhatsApp Send Server] Mensagem entregue com sucesso via Meta Official!");
      return NextResponse.json({
        sent: true,
        messageId: data?.messages?.[0]?.id,
        provider: "meta_official",
      });
    }

    // Gateway provider (Evolution API / Z-API)
    const effectiveGatewayUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
    const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
    const effectiveInstance = instanceName || "salao-principal";

    if (!effectiveGatewayUrl || !effectiveApiKey) {
      console.warn("[WhatsApp Send Server] Nenhum gateway configurado para envio em background.");
      return NextResponse.json(
        {
          sent: false,
          requiresCredentials: true,
          message:
            "Credenciais de API ainda não configuradas. Configure o Gateway WhatsApp na aba Configurar Gateway.",
        },
        { status: 400 },
      );
    }

    const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
    console.log(`[WhatsApp Send Server] Disparando via Gateway: ${baseUrl}/message/sendText/${effectiveInstance}`);
    
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
      },
    );

    const gwData = await gwRes.json().catch(() => ({}));
    if (!gwRes.ok) {
      console.error("[WhatsApp Send Server] Erro no envio via Gateway:", gwData);
      return NextResponse.json(
        {
          sent: false,
          message: gwData?.message || "Erro ao enviar mensagem pelo gateway WhatsApp.",
        },
        { status: gwRes.status },
      );
    }

    console.log("[WhatsApp Send Server] Mensagem enviada com sucesso pelo Gateway!");
    return NextResponse.json({
      sent: true,
      messageId: gwData?.key?.id || crypto.randomUUID(),
      provider: "qr_gateway",
    });
  } catch (error) {
    console.error("[WhatsApp Send Server] Erro crítico no envio:", error);
    return NextResponse.json(
      {
        sent: false,
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao enviar mensagem.",
      },
      { status: 500 },
    );
  }
}
