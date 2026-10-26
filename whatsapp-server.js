/**
 * Servidor Autônomo Baileys WhatsApp (@whiskeysockets/baileys)
 * Executa um processo Node.js persistente que mantém o WebSocket do WhatsApp conectado 24h.
 *
 * Como iniciar:
 *   node whatsapp-server.js
 *   ou npm run whatsapp
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const QRCode = require("qrcode");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3001;

app.use(cors());
app.use(express.json());

// Estado em memória do Baileys
const baileysState = {
  socket: null,
  isConnected: false,
  connectedPhone: "",
  connectedAt: null,
  qrCodeBase64: null,
  rawQR: null,
  pairingCode: null,
  connectionState: "idle",
  logs: [],
};

function addLog(level, message) {
  const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
  baileysState.logs.unshift({ timestamp, level, message });
  if (baileysState.logs.length > 100) baileysState.logs.pop();
  console.log(`[Baileys Server - ${timestamp}] [${level.toUpperCase()}] ${message}`);
}

const authFolder = path.join(process.cwd(), ".baileys_auth_info");
if (!fs.existsSync(authFolder)) {
  fs.mkdirSync(authFolder, { recursive: true });
}

async function startBaileysSocket(forceRestart = false) {
  if (baileysState.isConnected && baileysState.socket && !forceRestart) {
    return;
  }

  addLog("info", "Iniciando cliente nativo Baileys no servidor...");
  baileysState.connectionState = "connecting";

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({
      version: [2, 3000, 1017531287],
    }));

    addLog("info", `Protocolo WhatsApp versão: ${version.join(".")}`);

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: true,
      browser: ["BellaMais Salão", "Chrome", "1.0.0"],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    baileysState.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        baileysState.rawQR = qr;
        addLog("info", "Novo QR Code gerado pelo protocolo Noise do WhatsApp!");

        try {
          baileysState.qrCodeBase64 = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: { dark: "#111b21", light: "#ffffff" },
          });
          addLog("success", "QR Code pronto para leitura no celular!");
        } catch (e) {
          addLog("error", `Erro ao renderizar QR: ${e.message}`);
        }
      }

      if (connection === "open") {
        baileysState.isConnected = true;
        baileysState.connectionState = "open";
        baileysState.qrCodeBase64 = null;
        baileysState.rawQR = null;
        baileysState.pairingCode = null;

        const rawUser = sock.user?.id || "";
        const cleanPhone = rawUser.split(":")[0] || rawUser.split("@")[0] || "Aparelho Conectado";
        baileysState.connectedPhone = cleanPhone;
        baileysState.connectedAt = new Date().toLocaleString("pt-BR");

        addLog("success", `🎉 WhatsApp Conectado com sucesso via Baileys! Telefone: ${cleanPhone}`);
      }

      if (connection === "close") {
        baileysState.isConnected = false;
        baileysState.connectionState = "close";

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        addLog(
          shouldReconnect ? "warn" : "error",
          `Conexão fechada. Código: ${statusCode}. Reconectar automático: ${shouldReconnect}`
        );

        if (statusCode === DisconnectReason.loggedOut) {
          addLog("info", "Sessão deslogada pelo aparelho. Limpando credenciais...");
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
          } catch (e) {}
        } else if (shouldReconnect) {
          setTimeout(() => startBaileysSocket(true), 3000);
        }
      }
    });

    // =========================================================================
    // ESCUTA DE RESPOSTAS AUTOMÁTICAS ("SIM" / "NÃO")
    // =========================================================================
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const m of messages) {
        if (m.key.fromMe || !m.message) continue;

        const remoteJid = m.key.remoteJid || "";
        if (!remoteJid.endsWith("@s.whatsapp.net")) continue;

        const cleanPhone = remoteJid.replace("@s.whatsapp.net", "");
        const rawText =
          m.message.conversation ||
          m.message.extendedTextMessage?.text ||
          m.message.buttonsResponseMessage?.selectedButtonId ||
          m.message.templateButtonReplyMessage?.selectedId ||
          "";

        if (!rawText) continue;

        const normalized = rawText.trim().toUpperCase();
        addLog("info", `📩 Mensagem recebida de ${cleanPhone}: "${rawText}"`);

        const isConfirm = /^(SIM|1|CONFIRMAR|CONFIRMO|OK|CONFIRMADO|VOU SIM|SIM!|CONFIRMO!|ESTAREI LA|ESTAREI LÁ)$/i.test(normalized);
        const isCancel = /^(NÃO|NAO|2|CANCELAR|DESMARCAR|NÃO VOU|NAO VOU|NAO CONSIGO|NÃO CONSIGO)$/i.test(normalized);

        if (isConfirm) {
          addLog("success", `🤖 Cliente ${cleanPhone} confirmou presença via WhatsApp!`);
          try {
            await sock.sendMessage(remoteJid, {
              text: "✨ *Maravilha! Seu agendamento foi CONFIRMADO com sucesso!*\n\nSua vaga está garantida e estamos preparando tudo com muito carinho para te receber. Se precisar de algo antes, é só avisar por aqui. Até logo! 💕",
            });
          } catch (e) {
            addLog("warn", `Erro ao responder confirmação: ${e.message}`);
          }
        } else if (isCancel) {
          addLog("warn", `🤖 Cliente ${cleanPhone} cancelou via WhatsApp!`);
          try {
            await sock.sendMessage(remoteJid, {
              text: "Entendido! Seu agendamento foi *cancelado* no nosso sistema. 🌸\n\nSentiremos sua falta! Caso deseje remarcar, basta nos avisar por aqui. Tenha um excelente dia!",
            });
          } catch (e) {
            addLog("warn", `Erro ao responder cancelamento: ${e.message}`);
          }
        }
      }
    });
  } catch (err) {
    addLog("error", `Falha ao iniciar Baileys: ${err.message}`);
  }
}

// ================= ROTAS DA API HTTP =================

app.get("/status", (req, res) => {
  res.json({
    ok: true,
    provider: "baileys",
    isConnected: baileysState.isConnected,
    connectedPhone: baileysState.connectedPhone,
    connectedAt: baileysState.connectedAt,
    connectionState: baileysState.connectionState,
    hasQRCode: Boolean(baileysState.qrCodeBase64),
    pairingCode: baileysState.pairingCode,
  });
});

app.get("/qr", async (req, res) => {
  if (!baileysState.socket) {
    await startBaileysSocket();
  }
  res.json({
    ok: true,
    provider: "baileys",
    isRealWhatsAppHandshake: true,
    qrCodeBase64: baileysState.qrCodeBase64,
    pairingCode: baileysState.pairingCode,
    isConnected: baileysState.isConnected,
    connectionState: baileysState.connectionState,
  });
});

app.post("/pair", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ ok: false, message: "Informe o telefone." });
  }

  const clean = phone.replace(/\D/g, "");
  const formatted = clean.length <= 11 ? `55${clean}` : clean;

  try {
    if (!baileysState.socket) {
      await startBaileysSocket();
    }

    if (baileysState.socket && !baileysState.socket.authState.creds.registered) {
      addLog("info", `Gerando código de pareamento Baileys para: +${formatted}`);
      const code = await baileysState.socket.requestPairingCode(formatted);
      baileysState.pairingCode = code;
      return res.json({ ok: true, pairingCode: code });
    }
    res.json({ ok: false, message: "Aparelho já registrado ou socket indisponível." });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
});

app.post("/send", async (req, res) => {
  const { number, text } = req.body;
  if (!number || !text) {
    return res.status(400).json({ ok: false, message: "Campos 'number' e 'text' são obrigatórios." });
  }

  if (!baileysState.socket || !baileysState.isConnected) {
    return res.status(400).json({
      ok: false,
      message: "WhatsApp não está conectado no servidor Baileys.",
    });
  }

  const clean = number.replace(/\D/g, "");
  const formatted = clean.length <= 11 ? `55${clean}` : clean;
  const jid = `${formatted}@s.whatsapp.net`;

  try {
    addLog("info", `Disparando mensagem Baileys para: ${jid}`);
    const result = await baileysState.socket.sendMessage(jid, { text });
    res.json({ ok: true, messageId: result?.key?.id });
  } catch (err) {
    addLog("error", `Erro ao enviar mensagem: ${err.message}`);
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.post("/disconnect", async (req, res) => {
  try {
    if (baileysState.socket) {
      await baileysState.socket.logout().catch(() => {});
      baileysState.socket.end(new Error("Desconectado pelo usuário"));
      baileysState.socket = null;
    }
    baileysState.isConnected = false;
    baileysState.connectedPhone = "";
    baileysState.qrCodeBase64 = null;
    baileysState.connectionState = "idle";
    try {
      fs.rmSync(authFolder, { recursive: true, force: true });
    } catch (e) {}

    addLog("info", "WhatsApp desconectado com sucesso.");
    res.json({ ok: true, message: "Desconectado com sucesso." });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

app.get("/logs", (req, res) => {
  res.json({ ok: true, logs: baileysState.logs });
});

// Inicializa o Baileys ao ligar o servidor
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Servidor Baileys WhatsApp rodando na porta ${PORT}`);
  console.log(`👉 http://localhost:${PORT}/status`);
  console.log(`======================================================\n`);
  startBaileysSocket();
});
