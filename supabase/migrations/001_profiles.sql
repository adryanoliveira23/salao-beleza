-- ⚠️ IMPORTANTE: Use a estrutura existente da tabela profiles
-- Se você já tem a tabela profiles, apenas adicione os campos necessários:

-- Adicionar campos de pagamento à tabela profiles existente
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cakto_customer_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);
CREATE INDEX IF NOT EXISTS idx_profiles_expires_at ON profiles(expires_at);

-- Se você NÃO tem a tabela profiles, crie assim:
/*
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
    subscription_status VARCHAR(20) DEFAULT 'free',
    current_level INTEGER DEFAULT 1,
    total_points INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    cakto_customer_id VARCHAR(100),
    last_payment_date TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Usuários podem ver próprio perfil" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Permissões para roles
GRANT SELECT ON profiles TO anon;
GRANT ALL PRIVILEGES ON profiles TO authenticated;
*/
