# BellaMais — Design System & Diretrizes de UI/UX (2026)

Este documento é a **Fonte Única da Verdade (Single Source of Truth)** do BellaMais. Ele define a identidade visual, psicologia das cores, tipografia feminina, micro-interações e experiência do usuário (UX) pensadas com carinho para o universo dos salões de beleza femininos, clínicas de estética, nail designers e spas.

---

## 1. Missão, Público-Alvo e Filosofia de Design

### O Público-Alvo
O **BellaMais** foi desenhado com foco especial nas **mulheres empreendedoras da beleza**:
* Cabeleireiras e Coloristas
* Manicures e Nail Designers
* Designers de Sobrancelhas e Lash Designers
* Maquiadoras e Esteticistas
* Proprietárias e Gerentes de Studios e Salões de Beleza

### A Filosofia Central: Amigável, Descomplicado (MVP) e com Alma
* **Amigável e Acolhedor**: A plataforma não pode parecer um software frio de contabilidade, planilha cinza ou terminal de TI. Deve transmitir a energia de entrar em um salão iluminado, charmoso e organizado, onde dá gosto e ânimo de trabalhar.
* **MVP Descomplicado**: O que a profissional precisa ver está a um toque de distância. Sem burocracias ou menus infinitos. Visão clara de faturamento, agenda do dia, clientes e serviços.
* **Sem Ruído / Zero Conversa Fiada**: Nada de banners gigantescos e prolixos ("*Salão aberto hoje... sexta-feira... Boa noite, Studio Glow ✨ Você tem 0 atendimentos...*") que roubam metade da tela útil. A simpatia do BellaMais está na **clareza visual**, nos detalhes encantadores e nos atalhos inteligentes, não em blocos de texto redundantes.
* **Nada Genérico**: Uma experiência com personalidade própria, pensada para as rotinas da beleza (mensagens carinhosas de confirmação no WhatsApp, controle de retorno de retoques, agendamento facilitado e mimos para aniversariantes).

---

## 2. Psicologia das Cores & Harmonia Visual (Regra 60-30-10)

Para acabar de vez com a **briga de cores** (poluição de cartões e botões com cores primárias desconexas) e ao mesmo tempo **evitar telas apagadas ou sem vida no modo escuro**, o sistema segue uma paleta feminina, calorosa e equilibrada:

```
┌────────────────────────────────────────────────────────────────────────┐
│  60% Base / Canvas Nobre                                               │
│  Light: Porcelana Nude Suave (#fdfaf8)                                 │
│  Dark:  Veludo Ameixa Noturno (#140d13)                                │
├────────────────────────────────────────┬───────────────────────────────┤
│  30% Estrutura & Cartões               │ 10% Acentos Vivos             │
│  Light: Branco Puro + Quartzo Rosa     │ Framboesa Glow (#be185d),     │
│  Dark:  Vidro Ameixa Profundo (#1d131b)│ Champagne Gold & Menta Suave  │
└────────────────────────────────────────┴───────────────────────────────┘
```

### Paleta de Superfícies & Cores

| Token | Modo Claro (Light) | Modo Escuro (Dark) | Função Psicológica |
| :--- | :--- | :--- | :--- |
| `--background` | `#fdfaf8` (Porcelana quente) | `#140d13` (Veludo ameixa profundo) | Fundo acolhedor, descansa a visão e valoriza o conteúdo |
| `--card-bg` | `#ffffff` (Branco puro) | `#1d131b` (Ameixa nobre elevado) | Cartões com presença suave e leitura nítida |
| `--card-border` | `#eedee7` (Quartzo rosa suave) | `#311f2c` (Borda aveludada sutil) | Delimitação sutil sem poluição |
| `--foreground` | `#1a1218` (Ameixa grafite profunda) | `#fdf4f8` (Branco cristal rosado) | Textos principais e números destacados |
| `--muted` | `#73646d` (Malva neutro) | `#b8a3af` (Lavanda acinzentada) | Legendas, datas e apoios informativos |

### Cores de Acento com Função Específica

1. 🌸 **Framboesa Glow (`#be185d` Light / `#f43f5e` Dark)**:
   * **Cor Identitária do BellaMais**.
   * Usada para o botão de ação primária (`+ Novo Agendamento`), menus ativos e barras de destaque. Transmite feminilidade, vitalidade, autoestima e carinho.
2. ✨ **Champagne Dourado (`#d97706` Light / `#fbbf24` Dark)**:
   * Usada para serviços mais procurados (coroa), metas batidas e destaques de alta performance. Transmite prestígio, celebração e prosperidade.
3. 🌿 **Esmeralda Suave (`#059669` Light / `#10b981` Dark)**:
   * Usada exclusivamente para confirmações de horário e saúde financeira (lucro disponível, pró-labore, pagamentos recebidos). Transmite tranquilidade e segurança financeira.
4. 💜 **Lilás Orquídea (`#7c3aed` Light / `#c084fc` Dark)**:
   * Usada em pequenos chips de categorias e horários na grade. Transmite criatividade e bem-estar.

> [!IMPORTANT]
> **Harmonia Absoluta**: Nunca crie cartões inteiros vermelhos, amarelos ou verdes competindo na mesma linha. Os cartões compartilham a **mesma superfície limpa e nobre** (`--card-bg`), e a cor vive em pequenos selos decorativos (*jewel chips*) e gráficos elegantes.

---

## 3. Tipografia Feminina & Hierarquia Visual

A tipografia do BellaMais reflete elegância, modernidade e calor humano:

* **Fonte Principal da Interface**: **Outfit** (`var(--font-outfit)`).
  * Curvas geométricas suaves, amigáveis, acolhedoras e altamente legíveis. Muito utilizada no branding de cosméticos, autocuidado e clínicas de alto padrão.
* **Números e Valores Monetários**: **Inter** ou numerais tabulares (`tabular-nums font-bold`).
  * Garante alinhamento perfeito de colunas em faturamento, preços e datas.
* **Toques Editoriais & Nome do Salão**: **Playfair Display / Cormorant Garamond** (`font-serif`).
  * Reservada para a marca e cabeçalhos de destaque, trazendo sofisticação de revista de moda.
* **Disciplina de Pesos**:
  * Proibido o uso de `font-black` ou `font-extrabold` (800/900) agressivos que pesam a tela.
  * Preferência por `font-medium` (500), `font-semibold` (600) e `font-bold` (700).

---

## 4. Arquitetura de Superfícies & Contraste no Modo Escuro (Fim do "Tudo Sólido")

Para garantir que os cartões nunca pareçam blocos opacos chapados ou indistinguíveis do fundo no Modo Escuro, adotamos uma arquitetura de **3 Níveis de Profundidade Óptica**:

```
┌────────────────────────────────────────────────────────────────────────┐
│  NÍVEL 0: Canvas Base Profundo (#0d070e)                               │
│  Veludo Ameixa Noturno: absorve a luz e dá repouso à visão             │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  NÍVEL 1: Cartão Flutuante Elevado                              │  │
│  │  • Superfície: linear-gradient(180deg, #241524 0%, #170e17 100%)│  │
│  │  • Borda Nítida: rgba(255, 255, 255, 0.12)                      │  │
│  │  • Filete de Luz Superior: inset 0 1px 0 0 rgba(255, 255, 255)  │  │
│  │  • Sombra de Separação: 0 10px 28px -4px rgba(0, 0, 0, 0.65)     │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  NÍVEL 2: Campos Aninhados / Recessos (#110811)            │  │  │
│  │  │  Inputs, tabelas, filtros e caixas de status com sombra    │  │  │
│  │  │  interna rebaixada (inset 0 1px 3px rgba(0, 0, 0, 0.5))    │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

* **Jewel Chips (Selos Luminosos)**:
  * Ícones e selos de status no Modo Escuro recebem luminosidade translúcida (`rgba(..., 0.16)`) com sombra ambiente colorida (`0 0 12px`), destacando-se como joias delicadas no topo dos cartões.

---

## 5. Efeitos Sonoros Táteis & Sensoriais (Web Audio API)

Para tornar a experiência de uso envolvente, agradável e feminina (dando real ânimo ao mexer no salão), o BellaMais incorpora sintetizador de áudio tátil nativo via `lib/soundEffects.ts`:

* **100% Offline & Instantâneo**: Gerado por osciladores matemáticos da Web Audio API — zero downloads de arquivos MP3, zero latência e sem risco de links quebrados.
* **Toque de Vidro Haptic (`playClick`)**: Som delicado e moderno para botões secundários e atalhos de WhatsApp.
* **Cintilação de Sucesso (`playSuccess`)**: Acorde de duas notas ascendentes em Sino de Cristal (G5 e C6) tocado ao copiar o Link da Bio ou divulgar vagas.
* **Pop Suave de Aba (`playPop`)**: Transição harmônica ao alternar períodos (7 Dias / 6 Meses) e filtros.
* **Arpejo Cintilante (`playSparkle`)**: Som festivo ao clicar no botão primário `+ Novo Agendamento`.
* **Controle Total**: Botão tátil na barra superior (`Volume2` / `VolumeX`) permitindo silenciar ou reativar os sons a qualquer momento.

---

## 6. Ícones: Regra 100% Lucide Icons

* **Apenas ícones da biblioteca `lucide-react`**:
  * `Scissors`, `Calendar`, `DollarSign`, `Users`, `MessageCircle`, `Sparkles`, `Plus`, `Clock`, `Heart`, etc.
* **Proibições Estritas**:
  * Proibido importar SVGs manuais, vetores avulsos em `assets/` ou exports brutos de Figma.
  * Proibido uso de bibliotecas de ícones conflitantes (FontAwesome, Heroicons, Phosphor).
  * Todos os ícones mantêm espessura (`strokeWidth={1.8}`) e proporção harmoniosa (14px a 20px).

---

## 5. Micro-Interações & Sensação de Vida

Para dar ânimo e prazer ao utilizar o sistema no dia a dia:

1. **Brilho Sutil no Botão Primário (`.animate-shimmer`)**:
   * O botão `+ Novo Agendamento` possui um suave feixe de luz que desliza periodicamente, convidando o clique sem ser agressivo.
2. **Elevação Tátil nos Cartões (`hover:-translate-y-0.5`)**:
   * Cartões e itens da agenda respondem ao toque/cursor com uma leve flutuação e sombra suave de framboesa.
3. **Indicador de Salão Ativo**:
   * Selo com pulso verde suave (`animate-pulse`) indicando que o salão está aberto e pronto para receber clientes.
4. **Atalhos Rápidos de WhatsApp**:
   * Envio de confirmação e parabéns para aniversariantes com mensagens gentis já redigidas no tom do salão ("Oi querida! Passando para confirmar seu horário...").

---

## 6. Checklist de Qualidade para Novas Telas

Ao criar ou ajustar qualquer página no BellaMais:
- [x] O modo escuro preserva o tom acolhedor em **Veludo Ameixa** sem virar preto chapado ou cinza industrial.
- [x] O modo claro utiliza o fundo suave em **Porcelana** e cartões brancos com bordas quartzo rosa.
- [x] Há apenas **um botão de ação primária de destaque** na barra superior da tela.
- [x] Não há saudações longas ou textos prolixos ocupando o topo útil da tela.
- [x] Todos os ícones são 100% Lucide React (`lucide-react`).
- [x] Toda moeda usa formatação monetária padrão brasileira (`R$ 0,00`).
- [x] O compilador TypeScript (`npx tsc --noEmit`) passa com código 0.
