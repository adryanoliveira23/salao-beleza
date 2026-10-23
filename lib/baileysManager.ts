import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

export interface BaileysState {
  socket: WASocket | null;
  isConnected: boolean;
  connectedPhone: string;
  connectedAt: string | null;
  qrCodeBase64: string | null;
  rawQR: string | null;
  pairingCode: string | null;
  connectionState: "idle" | "connecting" | "open" | "close";
  logs: Array<{ timestamp: string; level: string; message: string }>;
  isInitializing: boolean;
}

// Singleton global para persistir estado na memória do processo Node.js
const globalForBaileys = globalThis as unknown as {
  __baileysState?: BaileysState;
};

if (!globalForBaileys.__baileysState) {
  globalForBaileys.__baileysState = {
    socket: null,
    isConnected: false,
    connectedPhone: "",
    connectedAt: null,
    qrCodeBase64: null,
    rawQR: null,
    pairingCode: null,
    connectionState: "idle",
    logs: [],
    isInitializing: false,
  };
}

const state = globalForBaileys.__baileysState;

function addBaileysLog(level: "info" | "success" | "warn" | "error" | "debug", message: string) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  state.logs.unshift({ timestamp, level, message });
  if (state.logs.length > 100) state.logs.pop();
  console.log(`[Baileys Engine - ${timestamp}] [${level.toUpperCase()}] ${message}`);
}

function getAuthFolder(): string {
  // Em ambientes de nuvem (Vercel/Lambda), /tmp é a única pasta gravável
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const baseDir = isVercel ? "/tmp" : process.cwd();
  const authDir = path.join(baseDir, ".baileys_auth_info");
  if (!fs.existsSync(authDir)) {
    try {
      fs.mkdirSync(authDir, { recursive: true });
    } catch (e) {
      // Ignora erro se pasta já existir
    }
  }
  return authDir;
}

/**
 * Inicializa a conexão nativa com o WhatsApp via protocolo WebSocket do Baileys
 */
export async function initBaileys(forceRestart = false): Promise<BaileysState> {
  if (state.isConnected && state.socket && !forceRestart) {
    addBaileysLog("info", "Instância Baileys já está conectada e ativa.");
    return state;
  }

  if (state.isInitializing && !forceRestart) {
    addBaileysLog("info", "Baileys já está em processo de inicialização...");
    return state;
  }

  state.isInitializing = true;
  state.connectionState = "connecting";
  addBaileysLog("info", "Iniciando cliente nativo Baileys (@whiskeysockets/baileys)...");

  try {
    const authFolder = getAuthFolder();
    addBaileysLog("info", `Diretório de autenticação: ${authFolder}`);

    const { state: authState, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1017531287] as [number, number, number],
      isLatest: true,
    }));

    addBaileysLog("info", `Versão do protocolo WhatsApp Web: ${version.join(".")} (Última: ${isLatest})`);

    const sock = makeWASocket({
      version,
      auth: authState,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["BellaMais Salão", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      markOnlineOnConnect: true,
    });

    state.socket = sock;

    // Escuta eventos de atualização de credenciais
    sock.ev.on("creds.update", async () => {
      try {
        await saveCreds();
        addBaileysLog("debug", "Credenciais de sessão do Baileys salvas no disco.");
      } catch (e: any) {
        addBaileysLog("warn", `Erro ao salvar credenciais Baileys: ${e?.message}`);
      }
    });

    // Escuta eventos de status da conexão e QR Code criptografado
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR CODE OFICIAL MULTI-DEVICE
      if (qr) {
        state.rawQR = qr;
        addBaileysLog("info", "QR Code oficial do Baileys gerado pelo WhatsApp (Protocolo Noise)!");

        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: {
              dark: "#111b21",
              light: "#ffffff",
            },
            errorCorrectionLevel: "M",
          });
          state.qrCodeBase64 = qrDataUrl;
          addBaileysLog("success", "QR Code oficial convertido em imagem Base64 pronta para escaneamento!");
        } catch (qrErr: any) {
          addBaileysLog("error", `Erro ao renderizar imagem QR Code do Baileys: ${qrErr?.message}`);
        }
      }

      // CONEXÃO ABERTA (CONECTADO COM SUCESSO)
      if (connection === "open") {
        state.isConnected = true;
        state.connectionState = "open";
        state.qrCodeBase64 = null;
        state.rawQR = null;
        state.pairingCode = null;

        const rawUser = sock.user?.id || "";
        const cleanPhone = rawUser.split(":")[0] || rawUser.split("@")[0] || "Aparelho Conectado";
        state.connectedPhone = cleanPhone;
        state.connectedAt = new Date().toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        addBaileysLog("success", `🎉 WHATSAPP CONECTADO COM SUCESSO VIA BAILEYS! Número: ${cleanPhone}`);
      }

      // CONEXÃO FECHADA (DESCONECTADO OU QUEDA DE REDE)
      if (connection === "close") {
        state.isConnected = false;
        state.connectionState = "close";

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        addBaileysLog(
          shouldReconnect ? "warn" : "error",
          `Conexão Baileys fechada. Código: ${statusCode}. Reconectar automático: ${shouldReconnect}`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          addBaileysLog("info", "Sessão deslogada pelo aparelho. Limpando credenciais antigas...");
          cleanAuthFolder();
        } else if (shouldReconnect) {
          // Tenta reconectar suavemente
          setTimeout(() => {
            initBaileys(true);
          }, 3000);
        }
      }
    });

    state.isInitializing = false;
    return state;
  } catch (err: any) {
    state.isInitializing = false;
    state.connectionState = "close";
    addBaileysLog("error", `Falha crítica ao inicializar Baileys: ${err?.message || err}`);
    return state;
  }
}

/**
 * Solicita código de pareamento de 8 dígitos para o número informado
 */
export async function getBaileysPairingCode(phone: string): Promise<string | null> {
  try {
    if (!state.socket) {
      await initBaileys();
    }
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.length <= 11 ? `55${clean}` : clean;

    if (state.socket && !state.socket.authState.creds.registered) {
      addBaileysLog("info", `Solicitando código de pareamento Baileys para: +${formatted}...`);
      const code = await state.socket.requestPairingCode(formatted);
      state.pairingCode = code;
      addBaileysLog("success", `Código de pareamento Baileys gerado: ${code}`);
      return code;
    }
    return null;
  } catch (e: any) {
    addBaileysLog("error", `Erro ao solicitar código de pareamento no Baileys: ${e?.message}`);
    return null;
  }
}

/**
 * Envia mensagem pelo WhatsApp usando a sessão ativa do Baileys
 */
export async function sendBaileysMessage(
  phone: string,
  text: string
): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  try {
    if (!state.socket || !state.isConnected) {
      return {
        sent: false,
        error: "Sessão do Baileys não está conectada. Escaneie o QR Code antes de disparar.",
      };
    }

    const clean = phone.replace(/\D/g, "");
    const formatted = clean.length <= 11 ? `55${clean}` : clean;
    const jid = `${formatted}@s.whatsapp.net`;

    addBaileysLog("info", `Enviando mensagem Baileys para: ${jid}`);
    const result = await state.socket.sendMessage(jid, { text });
    const msgId = result?.key?.id || "";

    addBaileysLog("success", `Mensagem Baileys enviada com sucesso! ID: ${msgId}`);
    return { sent: true, messageId: msgId };
  } catch (err: any) {
    addBaileysLog("error", `Erro ao enviar mensagem via Baileys: ${err?.message}`);
    return { sent: false, error: err?.message || "Falha no envio via Baileys" };
  }
}

/**
 * Desconecta a sessão atual e limpa a pasta de autenticação
 */
export async function disconnectBaileys(): Promise<void> {
  addBaileysLog("info", "Desconectando Baileys e limpando sessão...");
  try {
    if (state.socket) {
      await state.socket.logout().catch(() => {});
      state.socket.end(new Error("Desconectado pelo usuário"));
      state.socket = null;
    }
  } catch (e) {
    // Ignora
  }

  state.isConnected = false;
  state.connectedPhone = "";
  state.connectedAt = null;
  state.qrCodeBase64 = null;
  state.rawQR = null;
  state.pairingCode = null;
  state.connectionState = "idle";

  cleanAuthFolder();
  addBaileysLog("success", "Sessão Baileys desconectada com sucesso.");
}

function cleanAuthFolder() {
  try {
    const authFolder = getAuthFolder();
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
  } catch (e) {
    // Ignora
  }
}

/**
 * Obtém o estado atual da conexão Baileys
 */
export function getBaileysStatus(): Omit<BaileysState, "socket"> {
  const { socket, ...rest } = state;
  return rest;
}
