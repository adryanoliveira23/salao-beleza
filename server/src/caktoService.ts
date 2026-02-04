import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import type {
  CaktoWebhookData,
  ProcessResult,
  UserInfo,
  SubscriptionCheckResult,
  PaymentHistoryResult,
} from './types/cakto.js';

dotenv.config();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurações do Cakto
const CAKTO_CONFIG = {
  webhookSecret: process.env.CAKTO_WEBHOOK_SECRET!,
  productId: process.env.CAKTO_PRODUCT_ID!,
  checkoutUrl: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID}`,
};

/**
 * Valida a assinatura do webhook
 */
export function validateWebhookSignature(
  payload: string | Buffer | unknown,
  signature: string
): boolean {
  try {
    // Garantir que o payload seja uma string
    const payloadString = Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

    const expectedSignature = crypto
      .createHmac('sha256', CAKTO_CONFIG.webhookSecret)
      .update(payloadString)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Busca usuário por email (método robusto)
 */
async function findUserByEmail(email: string): Promise<UserInfo | null> {
  try {
    console.log(`🔍 Buscando usuário com email: ${email}`);

    // Método 1: Buscar na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profile && !profileError) {
      console.log('👤 Usuário encontrado na tabela profiles:', profile);
      return {
        userId: profile.id,
        email: profile.email,
        name: profile.full_name || profile.name || '',
        plan: profile.plan_type || 'free',
        subscription_status: profile.subscription_status,
      };
    }

    // Método 2: Buscar no auth.users (fallback)
    console.log('🔄 Tentando buscar no auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários:', authError);
      return null;
    }

    const user = authUsers.users.find((u) => u.email === email);
    if (user) {
      console.log('👤 Usuário encontrado no auth:', user);
      return {
        userId: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || '',
        plan: 'free',
      };
    }

    console.log('❌ Usuário não encontrado');
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Processa pagamento aprovado
 */
export async function processPaymentApproved(
  webhookData: CaktoWebhookData
): Promise<ProcessResult> {
  try {
    // Extrair dados do webhook (estrutura correta do Cakto)
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount;
    const paymentMethod = transaction.paymentMethod;
    const status = transaction.status;

    console.log('Dados extraídos:');
    console.log('- Customer:', customer);
    console.log('- Transaction ID:', transactionId);
    console.log('- Amount:', amount);
    console.log('- Payment Method:', paymentMethod);
    console.log('- Status:', status);

    // Verificar se é usuário de teste
    const isTestUser =
      customer.email.includes('example.com') ||
      customer.email.includes('test') ||
      customer.email.includes('john.doe');

    if (isTestUser) {
      console.log('🧪 Usuário de teste detectado, processando em modo de teste');
    }

    // Buscar usuário
    const user = await findUserByEmail(customer.email);

    if (!user && !isTestUser) {
      console.log('❌ Usuário não encontrado para email:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId,
      };
    }

    let userId = user?.userId;

    // Para usuários de teste, simular processamento
    if (isTestUser && !user) {
      console.log('🧪 Simulando processamento para usuário de teste');
      userId = 'test-user-id';
    }

    // Atualizar perfil para premium (se usuário real)
    if (user && !isTestUser && userId) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan_type: 'premium',
          subscription_status: 'active',
          last_payment_date: new Date().toISOString(),
          payment_method: paymentMethod,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
      } else {
        console.log('✅ Perfil atualizado para premium');
      }
    }

    // Salvar histórico de pagamento (se usuário real)
    if (user && !isTestUser && userId) {
      const { error: historyError } = await supabase.from('payment_history').insert({
        user_id: userId,
        cakto_transaction_id: transactionId,
        amount: amount,
        currency: 'BRL',
        status: 'completed',
        payment_method: paymentMethod,
        webhook_data: webhookData.data,
      });

      if (historyError) {
        console.error('❌ Erro ao salvar histórico:', historyError);
      } else {
        console.log('✅ Histórico de pagamento salvo');
      }
    }

    const result: ProcessResult = {
      success: true,
      message: isTestUser
        ? `Webhook processado (usuário de teste: ${customer.email})`
        : 'Pagamento processado com sucesso',
      transaction_id: transactionId,
      amount: amount,
      test_mode: isTestUser,
    };

    console.log('✅ Pagamento aprovado processado:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

/**
 * Processa reembolso
 */
export async function processRefund(webhookData: CaktoWebhookData): Promise<ProcessResult> {
  try {
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount;

    console.log('💸 Processando reembolso:', {
      email: customer.email,
      transactionId,
      amount,
    });

    // Buscar usuário
    const user = await findUserByEmail(customer.email);

    if (!user) {
      console.log('❌ Usuário não encontrado para reembolso:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId,
      };
    }

    // Cancelar assinatura (voltar para free)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'free',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada (voltou para free)');
    }

    // Registrar reembolso no histórico
    const { error: historyError } = await supabase.from('payment_history').insert({
      user_id: user.userId,
      cakto_transaction_id: `refund_${transactionId}`,
      amount: -amount, // Valor negativo para reembolso
      currency: 'BRL',
      status: 'refunded',
      payment_method: 'refund',
      webhook_data: webhookData.data,
    });

    if (historyError) {
      console.error('❌ Erro ao registrar reembolso:', historyError);
    } else {
      console.log('✅ Reembolso registrado no histórico');
    }

    const result: ProcessResult = {
      success: true,
      message: 'Reembolso processado com sucesso',
      transaction_id: transactionId,
      amount: amount,
    };

    console.log('✅ Reembolso processado:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao processar reembolso:', error);
    throw error;
  }
}

/**
 * Processa cancelamento de assinatura
 */
export async function processSubscriptionCancelled(
  webhookData: CaktoWebhookData
): Promise<ProcessResult> {
  try {
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;

    console.log('🚫 Processando cancelamento de assinatura:', {
      email: customer.email,
      transactionId,
    });

    // Buscar usuário
    const user = await findUserByEmail(customer.email);

    if (!user) {
      console.log('❌ Usuário não encontrado para cancelamento:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId,
      };
    }

    // Cancelar assinatura (voltar para free)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_type: 'free',
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada');
    }

    // Registrar cancelamento no histórico
    const { error: historyError } = await supabase.from('payment_history').insert({
      user_id: user.userId,
      cakto_transaction_id: `cancel_${transactionId}`,
      amount: 0,
      currency: 'BRL',
      status: 'cancelled',
      payment_method: 'cancellation',
      webhook_data: webhookData.data,
    });

    if (historyError) {
      console.error('❌ Erro ao registrar cancelamento:', historyError);
    } else {
      console.log('✅ Cancelamento registrado no histórico');
    }

    const result: ProcessResult = {
      success: true,
      message: 'Cancelamento processado com sucesso',
      transaction_id: transactionId,
    };

    console.log('✅ Cancelamento processado:', result);
    return result;
  } catch (error) {
    console.error('❌ Erro ao processar cancelamento:', error);
    throw error;
  }
}

/**
 * Gera URL de checkout personalizada
 */
export function generateCheckoutUrl(userEmail: string, customData: Record<string, string> = {}): string {
  const params = new URLSearchParams({
    email: userEmail,
    ...customData,
  });

  return `${CAKTO_CONFIG.checkoutUrl}?${params.toString()}`;
}

/**
 * Verifica status da assinatura do usuário
 */
export async function checkUserSubscription(userEmail: string): Promise<SubscriptionCheckResult> {
  try {
    const user = await findUserByEmail(userEmail);

    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado',
      };
    }

    return {
      success: true,
      user: {
        email: user.email,
        plan: user.plan,
        subscription_status: user.subscription_status,
        isPremium: user.plan === 'premium',
      },
    };
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return {
      success: false,
      message: 'Erro ao verificar assinatura',
    };
  }
}

/**
 * Lista histórico de pagamentos do usuário
 */
export async function getUserPaymentHistory(userEmail: string): Promise<PaymentHistoryResult> {
  try {
    const user = await findUserByEmail(userEmail);

    if (!user) {
      return {
        success: false,
        message: 'Usuário não encontrado',
      };
    }

    const { data: payments, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return {
        success: false,
        message: 'Erro ao buscar histórico',
      };
    }

    return {
      success: true,
      payments: payments || [],
    };
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return {
      success: false,
      message: 'Erro ao buscar histórico',
    };
  }
}
