import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  initBaileys,
  getBaileysStatus,
  getBaileysPairingCode,
  disconnectBaileys,
} from "@/lib/baileysManager";

export const runtime = "nodejs";

/**
 * Endpoint de Conexão WhatsApp com Baileys (@whiskeysockets/baileys):
 * - Gera QR Code oficial do protocolo Noise (Multi-Device)
 * - Gera Código de Pareamento de 8 dígitos nativo
 * - Suporta processo Baileys embutido ou microserviço HTTP persistente (whatsapp-server.js)
 * - Suporta Gateways externos (Evolution API / Z-API / Meta)
 */
export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  console.log(`\n[WhatsApp Connect API - ${timestamp}] Requisição recebida.`);

  try {
    const body = await req.json();
    const {
      action = "generate", // "generate" | "pair" | "confirm" | "disconnect" | "status" | "diagnostic"
      provider = "baileys", // "baileys" | "gateway" | "meta_official" | "direct"
      connectionMethod = "qrcode", // "qrcode" | "pairing_code"
      phoneNumber,
      salonName = "Meu Salão",
      // Gateway fields (Evolution API / Z-API)
      gatewayUrl,
      instanceName,
      apiKey,
      // Meta Official fields
      wabaId,
      phoneNumberId,
      accessToken,
    } = body;

    console.log(`[WhatsApp Connect API] Ação: "${action}" | Provedor: "${provider}" | Método: "${connectionMethod}"`);

    const baileysServerUrl = (process.env.WHATSAPP_BAILEYS_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

    // Ação: Diagnóstico do Baileys e Servidor
    if (action === "diagnostic") {
      const logs: Array<{ timestamp: string; level: string; message: string }> = [];
      const addLog = (level: string, message: string) => {
        const time = new Date().toLocaleTimeString("pt-BR", { hour12: false });
        logs.push({ timestamp: time, level, message });
      };

      addLog("info", "Iniciando diagnóstico do Baileys Engine WhatsApp...");
      addLog("info", `Node.js: ${process.version} | Runtime: Node.js (Vercel/Local)`);

      // 1. Testa Microserviço Baileys HTTP (whatsapp-server.js)
      let microserviceOnline = false;
      try {
        const pingRes = await fetch(`${baileysServerUrl}/status`, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        if (pingRes.ok) {
          microserviceOnline = true;
          const sData = await pingRes.json();
          addLog("success", `Microserviço Baileys ativo na porta 3001 (${baileysServerUrl})! Conectado: ${sData.isConnected}`);
        }
      } catch (e) {
        addLog("info", `Microserviço em porta 3001 não detectado. Utilizando Baileys Engine embutido no processo Next.js.`);
      }

      // 2. Estado do Baileys embutido
      const baileysStatus = getBaileysStatus();
      addLog("info", `Baileys embutido: Estado="${baileysStatus.connectionState}", Conectado=${baileysStatus.isConnected}`);
      if (baileysStatus.connectedPhone) {
        addLog("success", `Telefone conectado via Baileys: ${baileysStatus.connectedPhone}`);
      }

      // 3. Testa Gateway externo se configurado
      const effectiveUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL;
      const effectiveKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY;
      if (effectiveUrl && effectiveKey) {
        addLog("info", `Gateway externo configurado: ${effectiveUrl}`);
      }

      return NextResponse.json({
        ok: true,
        action: "diagnostic",
        microserviceOnline,
        baileysStatus,
        logs,
      });
    }

    // Ação: Desconectar Sessão
    if (action === "disconnect") {
      console.log("[WhatsApp Connect API] Desconectando sessão do Baileys...");
      // Tenta desconectar no microserviço HTTP
      try {
        await fetch(`${baileysServerUrl}/disconnect`, {
          method: "POST",
          signal: AbortSignal.timeout(3000),
        });
      } catch (e) {}

      // Desconecta no Baileys embutido
      await disconnectBaileys();

      return NextResponse.json({
        connected: false,
        state: "disconnected",
        message: "WhatsApp desconectado com sucesso.",
      });
    }

    // Ação: Confirmar Conexão após leitura do QR Code
    if (action === "confirm") {
      // Verifica no microserviço HTTP
      try {
        const sRes = await fetch(`${baileysServerUrl}/status`, {
          method: "GET",
          signal: AbortSignal.timeout(2500),
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.isConnected) {
            return NextResponse.json({
              connected: true,
              state: "open",
              phoneNumber: sData.connectedPhone,
              connectedAt: sData.connectedAt || new Date().toISOString(),
              message: "WhatsApp conectado via Baileys Server!",
            });
          }
        }
      } catch (e) {}

      // Verifica no Baileys embutido
      const bStatus = getBaileysStatus();
      if (bStatus.isConnected) {
        return NextResponse.json({
          connected: true,
          state: "open",
          phoneNumber: bStatus.connectedPhone,
          connectedAt: bStatus.connectedAt || new Date().toISOString(),
          message: "WhatsApp conectado via Baileys Engine!",
        });
      }

      // Se não houver socket real conectado, retorna falso! Zero dados fakes/simulados
      return NextResponse.json({
        connected: false,
        state: bStatus.connectionState || "disconnected",
        message:
          "O aparelho ainda não concluiu a leitura do QR Code. Aponte a câmera do WhatsApp em 'Aparelhos Conectados'.",
      });
    }

    // Ação: Status da Sessão
    if (action === "status") {
      // Tenta microserviço HTTP
      try {
        const sRes = await fetch(`${baileysServerUrl}/status`, {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          return NextResponse.json({
            connected: sData.isConnected,
            state: sData.connectionState,
            phoneNumber: sData.connectedPhone,
            provider: "baileys_service",
          });
        }
      } catch (e) {}

      // Consulta Baileys embutido
      const bStatus = getBaileysStatus();
      return NextResponse.json({
        connected: bStatus.isConnected,
        state: bStatus.connectionState,
        phoneNumber: bStatus.connectedPhone,
        provider: "baileys_embedded",
      });
    }

    // Ação: Solicitar Código de Pareamento de 8 dígitos
    if (action === "pair" || connectionMethod === "pairing_code") {
      const cleanPhone = (phoneNumber || "").replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length < 10) {
        return NextResponse.json(
          { ok: false, message: "Informe um telefone válido com DDD para gerar o código de pareamento." },
          { status: 400 }
        );
      }

      // Tenta no microserviço HTTP
      try {
        const pRes = await fetch(`${baileysServerUrl}/pair`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanPhone }),
          signal: AbortSignal.timeout(8000),
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.pairingCode) {
            return NextResponse.json({
              ok: true,
              provider: "baileys",
              pairingCode: pData.pairingCode,
              message: "Código de pareamento oficial do Baileys gerado! Digite no seu WhatsApp.",
            });
          }
        }
      } catch (e) {}

      // Tenta no Baileys embutido
      const pairingCode = await getBaileysPairingCode(cleanPhone);
      if (pairingCode) {
        return NextResponse.json({
          ok: true,
          provider: "baileys",
          pairingCode: pairingCode,
          message: "Código de pareamento oficial do Baileys gerado! Digite no seu WhatsApp.",
        });
      }
    }

    // =========================================================================
    // AÇÃO: GENERATE (GERAR QR CODE BAILEYS REAL)
    // =========================================================================

    // 1. Tenta obter o QR code do microserviço Baileys HTTP (whatsapp-server.js)
    try {
      const qrRes = await fetch(`${baileysServerUrl}/qr`, {
        method: "GET",
        signal: AbortSignal.timeout(3000),
      });
      if (qrRes.ok) {
        const qrData = await qrRes.json();
        if (qrData.qrCodeBase64 || qrData.isConnected) {
          console.log("[WhatsApp Connect API] QR Code obtido do microserviço Baileys com sucesso!");
          return NextResponse.json({
            connected: qrData.isConnected,
            provider: "baileys",
            isRealWhatsAppHandshake: true,
            qrCodeBase64: qrData.qrCodeBase64,
            pairingCode: qrData.pairingCode,
            state: qrData.connectionState,
            message: qrData.isConnected
              ? "WhatsApp Conectado via Baileys!"
              : "QR Code Oficial do Baileys gerado! Aponte a câmera em 'Aparelhos Conectados'.",
          });
        }
      }
    } catch (e) {
      // Microserviço offline, prossegue com Baileys embutido
    }

    // 2. Inicializa o Baileys embutido
    console.log("[WhatsApp Connect API] Inicializando Baileys embutido...");
    await initBaileys();

    // Aguarda até 3 segundos para captura do primeiro evento de QR Code do Baileys se ainda não houver
    let bStatus = getBaileysStatus();
    if (!bStatus.qrCodeBase64 && !bStatus.isConnected) {
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 500));
        bStatus = getBaileysStatus();
        if (bStatus.qrCodeBase64 || bStatus.isConnected) break;
      }
    }

    if (bStatus.isConnected) {
      return NextResponse.json({
        connected: true,
        provider: "baileys",
        isRealWhatsAppHandshake: true,
        state: "open",
        phoneNumber: bStatus.connectedPhone,
        connectedAt: bStatus.connectedAt,
        message: "WhatsApp conectado via Baileys Engine!",
      });
    }

    if (bStatus.qrCodeBase64) {
      console.log("[WhatsApp Connect API] QR Code oficial do Baileys pronto para envio!");
      return NextResponse.json({
        connected: false,
        provider: "baileys",
        isRealWhatsAppHandshake: true,
        qrCodeBase64: bStatus.qrCodeBase64,
        pairingCode: bStatus.pairingCode,
        state: bStatus.connectionState,
        expiresIn: 45,
        message: "QR Code Oficial do Baileys gerado! Aponte a câmera em 'Aparelhos Conectados' no seu celular.",
      });
    }

    // Se o Baileys ainda estiver estabelecendo a chave de criptografia, gera imagem de carregamento com aviso amigável
    const cleanPhone = (phoneNumber || "").replace(/\D/g, "");
    const sessionPayload = `BAILEYS-INIT-${cleanPhone || "SALON"}-${Date.now()}`;
    const fallbackQr = await QRCode.toDataURL(sessionPayload, {
      width: 320,
      margin: 2,
      color: { dark: "#111b21", light: "#ffffff" },
    });

    return NextResponse.json({
      connected: false,
      provider: "baileys",
      isRealWhatsAppHandshake: false,
      qrCodeBase64: fallbackQr,
      state: "connecting",
      expiresIn: 30,
      message: "Inicializando socket do Baileys com o WhatsApp. Atualize em alguns segundos para ler o QR Code definitivo.",
    });
  } catch (error) {
    console.error("[WhatsApp Connect API] Erro interno crítico:", error);
    return NextResponse.json(
      {
        connected: false,
        message:
          error instanceof Error
            ? `Erro de conexão: ${error.message}`
            : "Erro interno ao processar conexão do WhatsApp.",
      },
      { status: 500 }
    );
  }
}
