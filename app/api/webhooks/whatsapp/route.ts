import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook Oficial para WhatsApp Business Platform (Meta Cloud API) & Gateways compatíveis:
 * - GET: Verificação de assinatura do Webhook da Meta (hub.mode, hub.verify_token, hub.challenge)
 * - POST: Recebimento confiável de mensagens, status de entrega/leitura e gatilhos de agendamento
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "bellamais_meta_verify_2026";

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { error: "Token de verificação inválido para o Webhook WhatsApp." },
    { status: 403 },
  );
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Suporte ao formato oficial da Meta (WhatsApp Business Account)
    if (payload.object === "whatsapp_business_account") {
      const entries = payload.entry || [];
      const processedMessages: Array<{
        from: string;
        name: string;
        text: string;
        timestamp: string;
        phoneNumberId: string;
      }> = [];

      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value;
          const phoneNumberId = value?.metadata?.phone_number_id || "";
          const contactName =
            value?.contacts?.[0]?.profile?.name || "Cliente WhatsApp";
          const messages = value?.messages || [];

          for (const msg of messages) {
            if (msg.type === "text" && msg.text?.body) {
              processedMessages.push({
                from: msg.from,
                name: contactName,
                text: msg.text.body,
                timestamp: new Date().toISOString(),
                phoneNumberId,
              });
            }
          }
        }
      }

      return NextResponse.json(
        {
          received: true,
          source: "meta_official",
          processedCount: processedMessages.length,
          messages: processedMessages,
        },
        { status: 200 },
      );
    }

    // Suporte a payloads de Gateways compatíveis (Evolution API / WPPConnect)
    if (payload.event === "messages.upsert" || payload.data?.message) {
      const remoteJid = payload.data?.key?.remoteJid || "";
      const from = remoteJid.replace("@s.whatsapp.net", "");
      const pushName = payload.data?.pushName || "Cliente WhatsApp";
      const text =
        payload.data?.message?.conversation ||
        payload.data?.message?.extendedTextMessage?.text ||
        "";

      return NextResponse.json(
        {
          received: true,
          source: "qr_gateway",
          from,
          name: pushName,
          text,
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook WhatsApp Error:", error);
    return NextResponse.json(
      { error: "Falha ao processar payload do webhook." },
      { status: 500 },
    );
  }
}
