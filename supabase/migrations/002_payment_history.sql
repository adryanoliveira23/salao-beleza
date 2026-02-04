-- Tabela de histórico de pagamentos
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cakto_transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BRL',
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(100),
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_transaction_id ON payment_history(cakto_transaction_id);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);

-- RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Usuários podem ver próprio histórico" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Permissões
GRANT SELECT ON payment_history TO anon;
GRANT ALL PRIVILEGES ON payment_history TO authenticated;
