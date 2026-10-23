import { NextRequest, NextResponse } from "next/server";

/**
 * Endpoint real para envio de mensagens pelo WhatsApp:
 * - Suporta API Oficial da Meta (texto dentro da janela de 24h ou templates aprovados)
 * - Suporta Provedor Compatível (Evolution API / Z-API / WPPConnect)
 */
export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { sent: false, message: "Número de telefone inválido." },
        { status: 400 },
      );
    }
    const formattedPhone =
      cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    if (provider === "free_direct") {
      const waUrl = `https://api.whatsapp.com/send?phone=${encodeURIComponent(formattedPhone)}&text=${encodeURIComponent(messageText || "")}`;
      return NextResponse.json({
        sent: true,
        provider: "free_direct",
        directUrl: waUrl,
        message: "Link de envio gratuito gerado com sucesso!",
      });
    }

    if (provider === "meta_official") {
      if (!phoneNumberId || !accessToken) {
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

      return NextResponse.json({
        sent: true,
        messageId: data?.messages?.[0]?.id,
        provider: "meta_official",
      });
    }

    // Gateway provider
    const effectiveGatewayUrl =
      gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
    const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
    const effectiveInstance = instanceName || "salao-principal";

    if (!effectiveGatewayUrl || !effectiveApiKey) {
      return NextResponse.json(
        {
          sent: false,
          requiresCredentials: true,
          message:
            "Credenciais de API ainda não configuradas. Configure a API Oficial da Meta ou o Gateway WhatsApp na aba Conexão.",
        },
        { status: 400 },
      );
    }

    const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
    const gwRes = await fetch(
      `${baseUrl}/message/sendText/${encodeURIComponent(effectiveInstance)}`,
      {
        method: "POST",
        headers: {
          apikey: effectiveApiKey,
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
      return NextResponse.json(
        {
          sent: false,
          message:
            gwData?.message || "Erro ao enviar mensagem pelo gateway WhatsApp.",
        },
        { status: gwRes.status },
      );
    }

    return NextResponse.json({
      sent: true,
      messageId: gwData?.key?.id || crypto.randomUUID(),
      provider: "qr_gateway",
    });
  } catch (error) {
    console.error("Error in /api/whatsapp/send:", error);
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
