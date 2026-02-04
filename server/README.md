# Servidor de Integração Cakto

Este servidor processa webhooks do Cakto para gerenciar pagamentos e assinaturas.

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase e Cakto.

### 3. Executar Migrations

Execute as migrations do Supabase para criar as tabelas necessárias:

- `supabase/migrations/001_profiles.sql` - Adiciona campos de pagamento à tabela profiles
- `supabase/migrations/002_payment_history.sql` - Cria tabela de histórico de pagamentos

### 4. Instalar Dependências TypeScript

```bash
npm install
```

### 5. Iniciar o Servidor

**Modo desenvolvimento (com watch):**
```bash
npm run dev
```

**Modo produção:**
```bash
# Primeiro, compile o TypeScript
npm run build

# Depois, inicie o servidor
npm start
```

O servidor estará rodando em `http://localhost:3001`

## Endpoints

### Health Check
```
GET /api/health
```

### Webhook Cakto
```
POST /api/webhooks/cakto
```

## Testes Locais com ngrok

Para testar webhooks localmente:

1. Instale o ngrok:
```bash
npm install -g ngrok
```

2. Inicie o servidor:
```bash
npm start
```

3. Em outro terminal, exponha a porta:
```bash
ngrok http 3001
```

4. Use a URL HTTPS gerada pelo ngrok no painel do Cakto como URL do webhook.

## Estrutura

- `index.js` - Servidor Express principal
- `caktoService.js` - Lógica de processamento dos webhooks
- `.env` - Variáveis de ambiente (não commitado)
