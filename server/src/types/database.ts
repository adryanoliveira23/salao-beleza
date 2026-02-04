/**
 * Tipos para o banco de dados Supabase
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          name: string | null;
          plan_type: string;
          subscription_status: string;
          expires_at: string | null;
          cakto_customer_id: string | null;
          last_payment_date: string | null;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          name?: string | null;
          plan_type?: string;
          subscription_status?: string;
          expires_at?: string | null;
          cakto_customer_id?: string | null;
          last_payment_date?: string | null;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          name?: string | null;
          plan_type?: string;
          subscription_status?: string;
          expires_at?: string | null;
          cakto_customer_id?: string | null;
          last_payment_date?: string | null;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_history: {
        Row: {
          id: string;
          user_id: string;
          cakto_transaction_id: string;
          amount: number;
          currency: string;
          status: string;
          payment_method: string | null;
          webhook_data: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cakto_transaction_id: string;
          amount: number;
          currency?: string;
          status: string;
          payment_method?: string | null;
          webhook_data?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cakto_transaction_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          webhook_data?: unknown;
          created_at?: string;
        };
      };
    };
  };
}
