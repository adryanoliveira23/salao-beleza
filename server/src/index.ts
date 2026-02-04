import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as caktoService from './caktoService.js';
import type { CaktoWebhookData } from './types/cakto.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Webhook do Cakto
// IMPORTANTE: Usar express.raw() para preservar o body como Buffer para validação de assinatura
app.post(
  '/api/webhooks/cakto',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    console.log('\n🔔 Webhook Cakto recebido:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Body type:', typeof req.body);
    console.log('Body:', req.body);

    try {
      let webhookData: CaktoWebhookData;

      // Verificar se o body é um Buffer e converter
      if (Buffer.isBuffer(req.body)) {
        console.log('📦 Convertendo Buffer para string...');
        const bodyString = req.body.toString('utf8');
        console.log('String convertida:', bodyString);
        webhookData = JSON.parse(bodyString) as CaktoWebhookData;
      } else if (typeof req.body === 'object' && req.body !== null) {
        webhookData = req.body as CaktoWebhookData;
      } else {
        console.log('📝 Parseando JSON do body string...');
        webhookData = JSON.parse(req.body as string) as CaktoWebhookData;
      }

      console.log('📋 Dados do webhook parseados:', JSON.stringify(webhookData, null, 2));

      // Validação de assinatura
      let signatureValid = false;
      let validationMethod = '';

      // Método 1: Verificar headers
      const signature =
        (req.headers['x-cakto-signature'] as string) ||
        (req.headers['x-signature'] as string);
      if (signature) {
        console.log('🔐 Tentando validação por header...');
        // Obter o body original como string para validação HMAC
        const bodyString = Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : JSON.stringify(req.body);
        signatureValid = caktoService.validateWebhookSignature(bodyString, signature);
        validationMethod = 'header';
      }

      // Método 2: Verificar secret no JSON (fallback)
      if (!signatureValid && webhookData.secret) {
        console.log('🔐 Header não encontrado, tentando validação por secret no JSON...');
        if (webhookData.secret === process.env.CAKTO_WEBHOOK_SECRET) {
          signatureValid = true;
          validationMethod = 'json_secret';
        }
      }

      if (!signatureValid) {
        console.log('❌ Assinatura do webhook inválida');
        console.log('Secret esperado:', process.env.CAKTO_WEBHOOK_SECRET);
        console.log('Secret recebido:', webhookData.secret);
        return res.status(400).json({ error: 'Assinatura inválida' });
      }

      console.log(`✅ Assinatura validada com sucesso (método: ${validationMethod})`);

      // Processar evento
      const event = webhookData.event;
      let result;

      switch (event) {
        case 'purchase_approved':
          console.log('💳 Processando pagamento aprovado...');
          result = await caktoService.processPaymentApproved(webhookData);
          break;

        case 'refund':
          console.log('💸 Processando reembolso...');
          result = await caktoService.processRefund(webhookData);
          break;

        case 'subscription_cancelled':
          console.log('🚫 Processando cancelamento de assinatura...');
          result = await caktoService.processSubscriptionCancelled(webhookData);
          break;

        default:
          console.log(`⚠️ Evento não suportado: ${event}`);
          return res.status(400).json({ error: `Evento não suportado: ${event}` });
      }

      console.log('✅ Webhook processado com sucesso:', result);

      res.status(200).json({
        success: true,
        event: event,
        result: result,
      });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: errorMessage,
      });
    }
  }
);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhooks/cakto`);
});
