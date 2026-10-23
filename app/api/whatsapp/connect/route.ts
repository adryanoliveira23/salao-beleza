import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

/**
 * Endpoint para conexão com o WhatsApp:
 * 1. Suporta Gateway Próprio (Evolution API / Z-API / WPPConnect) com QR Code real de pareamento.
 * 2. Suporta Diagnóstico completo e Logs detalhados para exibição no Console.
 * 3. Suporta API Oficial da Meta (Graph API v20.0).
 * 4. Suporta Modo Simulação/Direto com avisos claros sobre a exigência de protocolo Noise pelo WhatsApp mobile.
 */
export async function POST(req: NextRequest) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  console.log(`\n[WhatsApp API Server - ${timestamp}] Requisição recebida em /api/whatsapp/connect`);

  try {
    const body = await req.json();
    const {
      action = "generate", // "generate" | "confirm" | "disconnect" | "status" | "diagnostic"
      provider = "gateway", // "gateway" | "meta_official" | "direct"
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

    console.log(`[WhatsApp API Server] Ação: "${action}" | Provedor: "${provider}" | Método: "${connectionMethod}"`);

    // Ação: Diagnóstico do Sistema
    if (action === "diagnostic") {
      const logs: Array<{ timestamp: string; level: string; message: string }> = [];
      const addLog = (level: string, message: string) => {
        const time = new Date().toLocaleTimeString("pt-BR", { hour12: false });
        logs.push({ timestamp: time, level, message });
        console.log(`[WhatsApp Diagnostic] [${level.toUpperCase()}] ${message}`);
      };

      addLog("info", "Iniciando diagnóstico do serviço de WhatsApp BellaMais...");
      addLog("info", `Ambiente: Node.js ${process.version} | Timestamp: ${new Date().toISOString()}`);

      const envGwUrl = process.env.WHATSAPP_GATEWAY_URL || "";
      const envGwKey = process.env.WHATSAPP_GATEWAY_API_KEY ? "CONFIGURADO (***)" : "NÃO CONFIGURADO";
      addLog("info", `Variáveis de ambiente do servidor: WHATSAPP_GATEWAY_URL="${envGwUrl || 'vazio'}", WHATSAPP_GATEWAY_API_KEY="${envGwKey}"`);

      const effectiveUrl = gatewayUrl || envGwUrl;
      const effectiveKey = apiKey || (process.env.WHATSAPP_GATEWAY_API_KEY || "");
      const effectiveInst = instanceName || "salao-principal";

      let gatewayStatus = "not_configured";
      let gatewayDetails: any = null;

      if (effectiveUrl && effectiveKey) {
        addLog("info", `Testando conectividade com o Gateway: ${effectiveUrl} (instância: ${effectiveInst})...`);
        try {
          const pingStart = Date.now();
          const cleanUrl = effectiveUrl.replace(/\/$/, "");
          
          // Testa chamada à instância
          const pingRes = await fetch(`${cleanUrl}/instance/connectionState/${encodeURIComponent(effectiveInst)}`, {
            method: "GET",
            headers: {
              apikey: effectiveKey,
              Authorization: `Bearer ${effectiveKey}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000),
          }).catch(async () => {
            // Se falhar connectionState, tenta /instance/connect
            return await fetch(`${cleanUrl}/instance/connect/${encodeURIComponent(effectiveInst)}`, {
              method: "GET",
              headers: { apikey: effectiveKey, Authorization: `Bearer ${effectiveKey}` },
              signal: AbortSignal.timeout(5000),
            });
          });

          const latency = Date.now() - pingStart;
          addLog("info", `Resposta do Gateway recebida em ${latency}ms (Status HTTP: ${pingRes.status})`);

          if (pingRes.ok) {
            const data = await pingRes.json().catch(() => ({}));
            gatewayStatus = "reachable";
            gatewayDetails = data;
            addLog("success", `Gateway acessível com sucesso! Estado retornado: ${JSON.stringify(data).substring(0, 120)}`);
          } else {
            gatewayStatus = "error_response";
            addLog("warn", `Gateway respondeu com erro HTTP ${pingRes.status}. Verifique se a instância "${effectiveInst}" foi criada e se a API Key está correta.`);
          }
        } catch (gwErr: any) {
          gatewayStatus = "unreachable";
          addLog("error", `Não foi possível contactar o Gateway: ${gwErr?.message || gwErr}. Verifique se a URL está online.`);
        }
      } else {
        addLog("warn", "Nenhum Gateway externo configurado. Operando em Modo Direto / Demonstração.");
        addLog("info", "NOTA IMPORTANTE SOBRE 'QR CODE INVÁLIDO': O aplicativo oficial do WhatsApp no celular requer uma sessão WebSocket ativa com o protocolo Noise (Evolution API / Z-API). Ao escanear um QR code sintético, o celular rejeitará com 'QR Code Inválido'.");
      }

      return NextResponse.json({
        ok: true,
        action: "diagnostic",
        gatewayStatus,
        gatewayConfigured: Boolean(effectiveUrl && effectiveKey),
        gatewayUrl: effectiveUrl ? effectiveUrl.replace(/\/\/[^@]+@/, "//***@") : null,
        logs,
      });
    }

    // Ação: Desconectar Sessão
    if (action === "disconnect") {
      const effectiveGatewayUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
      const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
      const effectiveInstance = instanceName || "salao-principal";

      if (effectiveGatewayUrl && effectiveApiKey) {
        try {
          const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
          await fetch(`${baseUrl}/instance/logout/${encodeURIComponent(effectiveInstance)}`, {
            method: "DELETE",
            headers: { apikey: effectiveApiKey, Authorization: `Bearer ${effectiveApiKey}` },
          }).catch(() => {});
        } catch (e) {
          // Ignora erro no logout remoto
        }
      }

      console.log("[WhatsApp API Server] Sessão desconectada com sucesso.");
      return NextResponse.json({
        connected: false,
        state: "disconnected",
        message: "Sessão do WhatsApp desconectada com sucesso.",
      });
    }

    // Ação: Confirmar Conexão após leitura do QR Code
    if (action === "confirm") {
      const cleanPhone = (phoneNumber || "").replace(/\D/g, "");
      const formattedPhone = cleanPhone
        ? cleanPhone.length <= 11
          ? `+55 (${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`
          : `+${cleanPhone}`
        : "+55 (11) 99999-8888";

      console.log(`[WhatsApp API Server] Confirmação de conexão para: ${formattedPhone}`);
      return NextResponse.json({
        connected: true,
        state: "open",
        phoneNumber: formattedPhone,
        connectedAt: new Date().toISOString(),
        message: "WhatsApp conectado com sucesso! Sessão ativa.",
      });
    }

    // Ação: Status da Sessão
    if (action === "status") {
      const effectiveGatewayUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
      const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
      const effectiveInstance = instanceName || "salao-principal";

      if (effectiveGatewayUrl && effectiveApiKey) {
        try {
          const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
          const statusRes = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(effectiveInstance)}`, {
            method: "GET",
            headers: { apikey: effectiveApiKey, Authorization: `Bearer ${effectiveApiKey}` },
            signal: AbortSignal.timeout(4000),
          });
          if (statusRes.ok) {
            const data = await statusRes.json();
            const isOpen = data?.instance?.state === "open" || data?.state === "open" || data?.state === "CONNECTED";
            return NextResponse.json({
              connected: isOpen,
              state: data?.instance?.state || data?.state || "unknown",
              provider: "gateway",
            });
          }
        } catch (e) {
          // Fallback para desconectado
        }
      }

      return NextResponse.json({
        connected: false,
        state: "disconnected",
        provider: "none",
      });
    }

    // Provedor Meta Oficial (Graph API)
    if (provider === "meta_official") {
      console.log("[WhatsApp API Server] Tentativa de conexão via Meta Official Graph API");
      if (!phoneNumberId || !accessToken) {
        return NextResponse.json(
          {
            connected: false,
            requiresCredentials: true,
            message: "Credenciais pendentes: Informe o Phone Number ID e o Access Token da Meta.",
          },
          { status: 400 },
        );
      }

      const metaRes = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const metaData = await metaRes.json();

      if (!metaRes.ok || metaData.error) {
        console.warn("[WhatsApp API Server] Erro de autenticação Meta:", metaData?.error);
        return NextResponse.json(
          {
            connected: false,
            requiresCredentials: true,
            message:
              metaData?.error?.message ||
              "Não foi possível autenticar na API da Meta. Verifique as credenciais.",
            details: metaData?.error,
          },
          { status: 401 },
        );
      }

      console.log("[WhatsApp API Server] Conexão Meta autenticada com sucesso!");
      return NextResponse.json({
        connected: true,
        provider: "meta_official",
        verifiedName:
          metaData.verified_name || metaData.display_phone_number || "WhatsApp Oficial",
        displayPhoneNumber: metaData.display_phone_number || phoneNumber,
        qualityRating: metaData.quality_rating || "GREEN",
        wabaId,
        message: "Conectado e verificado com sucesso na API Oficial da Meta!",
      });
    }

    // Provedor Gateway (Evolution API / Z-API / WPPConnect)
    const effectiveGatewayUrl = gatewayUrl || process.env.WHATSAPP_GATEWAY_URL || "";
    const effectiveApiKey = apiKey || process.env.WHATSAPP_GATEWAY_API_KEY || "";
    const effectiveInstance = instanceName || "salao-principal";

    if (effectiveGatewayUrl && effectiveApiKey) {
      console.log(`[WhatsApp API Server] Chamando Gateway WhatsApp: ${effectiveGatewayUrl} (Instância: ${effectiveInstance})`);
      try {
        const baseUrl = effectiveGatewayUrl.replace(/\/$/, "");
        const cleanPhone = (phoneNumber || "").replace(/\D/g, "");

        // 1. Tenta obter o QR code ou estado de conexão atual da instância
        const connectUrl =
          connectionMethod === "pairing_code" && cleanPhone
            ? `${baseUrl}/instance/connect/${encodeURIComponent(effectiveInstance)}?number=${encodeURIComponent(cleanPhone)}`
            : `${baseUrl}/instance/connect/${encodeURIComponent(effectiveInstance)}`;

        let gwRes = await fetch(connectUrl, {
          method: "GET",
          headers: {
            apikey: effectiveApiKey,
            Authorization: `Bearer ${effectiveApiKey}`,
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
        });

        // 2. Se a instância não existir (HTTP 404), cria a instância automaticamente
        if (gwRes.status === 404 || gwRes.status === 400) {
          console.log(`[WhatsApp API Server] Instância "${effectiveInstance}" não existe no Gateway. Tentando criar...`);
          const createRes = await fetch(`${baseUrl}/instance/create`, {
            method: "POST",
            headers: {
              apikey: effectiveApiKey,
              Authorization: `Bearer ${effectiveApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              instanceName: effectiveInstance,
              qrcode: true,
              integration: "WHATSAPP-BAILEYS",
            }),
            signal: AbortSignal.timeout(8000),
          });

          if (createRes.ok) {
            console.log(`[WhatsApp API Server] Instância criada com sucesso! Buscando QR code...`);
            // Busca o connect novamente
            gwRes = await fetch(connectUrl, {
              method: "GET",
              headers: {
                apikey: effectiveApiKey,
                Authorization: `Bearer ${effectiveApiKey}`,
                "Content-Type": "application/json",
              },
              signal: AbortSignal.timeout(8000),
            });
          }
        }

        const gwData = await gwRes.json().catch(() => ({}));
        console.log(`[WhatsApp API Server] Resposta do Gateway (HTTP ${gwRes.status}):`, JSON.stringify(gwData).substring(0, 150));

        if (gwRes.ok) {
          const isAlreadyConnected =
            gwData?.instance?.state === "open" || gwData?.state === "CONNECTED" || gwData?.state === "open";

          const qrRaw = gwData?.base64 || gwData?.qrcode?.base64 || gwData?.code || null;
          // Normaliza se vier sem prefixo data:image/png
          const qrCodeBase64 = qrRaw
            ? qrRaw.startsWith("data:")
              ? qrRaw
              : `data:image/png;base64,${qrRaw}`
            : null;

          return NextResponse.json({
            connected: isAlreadyConnected,
            provider: "real_gateway",
            isRealWhatsAppHandshake: true,
            qrCodeBase64: qrCodeBase64,
            pairingCode: gwData?.pairingCode || gwData?.code || null,
            state: gwData?.instance?.state || gwData?.state || "connecting",
            message: isAlreadyConnected
              ? "WhatsApp conectado e ativo via Gateway!"
              : connectionMethod === "pairing_code"
                ? "Código de pareamento oficial gerado! Digite no seu WhatsApp em Aparelhos Conectados."
                : "QR Code Oficial do WhatsApp gerado! Aponte a câmera em 'Aparelhos Conectados'.",
          });
        } else {
          console.warn(`[WhatsApp API Server] Gateway retornou status ${gwRes.status}:`, gwData);
          // Continua para o fallback explicativo com aviso claro no console
        }
      } catch (e: any) {
        console.error("[WhatsApp API Server] Erro ao contactar Gateway:", e?.message || e);
      }
    }

    // =========================================================================
    // MODO SEM GATEWAY / DEMONSTRAÇÃO
    // =========================================================================
    // IMPORTANTE: Explica claramente o porquê do WhatsApp acusar "Código QR inválido"
    console.log("[WhatsApp API Server] Gerando QR Code de Demonstração / Interface (isRealWhatsAppHandshake = false)");
    
    const cleanPhone = (phoneNumber || "11999998888").replace(/\D/g, "");
    const sessionPayload = `BELLAMAIS-WAPP-${cleanPhone}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Imagem do QR Code para teste de interface
    const qrCodeDataUrl = await QRCode.toDataURL(sessionPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: "#111b21",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let pairingCode = "";
    for (let i = 0; i < 8; i++) {
      if (i === 4) pairingCode += "-";
      pairingCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return NextResponse.json({
      connected: false,
      provider: "native_demo",
      isRealWhatsAppHandshake: false,
      qrCodeBase64: qrCodeDataUrl,
      pairingCode: pairingCode,
      state: "connecting",
      expiresIn: 45,
      hasGatewayConfigured: Boolean(effectiveGatewayUrl && effectiveApiKey),
      warning:
        "AVISO: Nenhum Gateway WhatsApp ativo (Evolution API / Z-API). O aplicativo do celular em 'Aparelhos Conectados' retornará 'Código QR Inválido' porque o WhatsApp exige uma sessão WebSocket ativa com o protocolo Noise para emparelhamento.",
      solution:
        "Configure sua Evolution API ou Z-API na aba 'Configurar Gateway' para gerar o QR code 100% válido, ou utilize o 'Modo Direto Gratuito' (WhatsApp Web / wa.me) para enviar mensagens sem precisar de servidor.",
      message:
        "QR Code de interface gerado. Para escanear no celular real sem erro de 'Código QR Inválido', configure uma instância da Evolution API ou use o Modo Direto.",
    });
  } catch (error) {
    console.error("[WhatsApp API Server] Erro interno crítico:", error);
    return NextResponse.json(
      {
        connected: false,
        message:
          error instanceof Error
            ? `Erro de conexão: ${error.message}`
            : "Erro interno ao processar conexão do WhatsApp.",
      },
      { status: 500 },
    );
  }
}
