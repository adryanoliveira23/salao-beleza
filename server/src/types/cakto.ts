/**
 * Tipos para integração com Cakto
 */

export interface CaktoCustomer {
  name: string;
  email: string;
  phone?: string;
  docNumber?: string;
}

export interface CaktoProduct {
  id: string;
  name: string;
}

export interface CaktoTransaction {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  customer: CaktoCustomer;
  product?: CaktoProduct;
}

export interface CaktoWebhookData {
  data: CaktoTransaction;
  event: 'purchase_approved' | 'refund' | 'subscription_cancelled';
  secret?: string;
}

export interface ProcessResult {
  success: boolean;
  message: string;
  transaction_id: string;
  amount?: number;
  test_mode?: boolean;
}

export interface UserInfo {
  userId: string;
  email: string;
  name: string;
  plan: string;
  subscription_status?: string;
}

export interface SubscriptionCheckResult {
  success: boolean;
  message?: string;
  user?: {
    email: string;
    plan: string;
    subscription_status?: string;
    isPremium: boolean;
  };
}

export interface PaymentHistoryResult {
  success: boolean;
  message?: string;
  payments?: Array<{
    id: string;
    user_id: string;
    cakto_transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    webhook_data: unknown;
    created_at: string;
  }>;
}
