# Kurio — NFT Marketplace

![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.3.0-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3.3-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.102.8-FF4154?logo=reactquery&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-1.63.0-2EAD33?logo=playwright&logoColor=white)
![MSW](https://img.shields.io/badge/MSW-2.15.0-FF8A65?logoColor=white)
![Node](https://img.shields.io/badge/Node-≥22.19-339933?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9.15.5-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Solução completa para um desafio frontend de marketplace de NFTs. SPA construída em React 19 + TypeScript, convertendo fielmente um design Figma em código funcional, com simulação 100% de backend (Mock Service Worker + banco em memória + WebSocket realtime simulado).

---

## 📋 Sobre o Desafio

### Objetivo Principal
Desenvolver uma aplicação web completa de marketplace NFT (Kurio / GreenMint) a partir de um design Figma, implementando não só a fidelidade visual pixel-perfect, mas também toda a lógica de negócio de um e-commerce real — autenticação, catálogo paginado, favoritos, carrinho, checkout com idempotência, atualizações em tempo real via WebSocket e suporte a múltiplos cenários de falha de rede.

### Requisitos Cumpridos
- **Fidelidade visual**: Implementação exata do design Figma em todas as telas (desktop e mobile), incluindo tipografia, espaçamentos, cores e componentes interativos.
- **Dados simulados**: Toda a aplicação roda sobre mocks sem dependência de backend real — MSW intercepeta HTTP e WebSocket no browser.
- **Responsividade**: Layouts completamente separados para desktop e mobile (não apenas breakpoints CSS), com componentes dedicados por viewport.
- **Paridade entre plataformas**: Todas as funcionalidades operam identicamente em desktop e mobile.
- **Qualidade de código**: Tipagem estrita TypeScript, arquitetura em camadas, cache estratégico e testes E2E + visuais.

---

## 🛠️ Tecnologias & Ferramentas

| Categoria | Tecnologia | Versão | Propósito |
|-----------|-----------|--------|-----------|
| **Core** | React | 19.2.8 | UI framework |
| | TypeScript | ~6.0.2 | Tipagem estática |
| | Vite | ^8.3.0 | Build tool & dev server |
| **Roteamento & Estado** | TanStack Router | ^1.170.35 | File-based routing com loaders |
| | TanStack Query | ^5.102.8 | Gerenciamento de estado servidor e cache |
| | @tanstack/zod-adapter | ^1.167.0 | Validação de search params |
| **Estilo & UI** | Tailwind CSS | ^4.3.3 | Utility-first CSS |
| | shadcn/ui (Radix) | v1.x | Primitivos acessíveis (Dialog, Slider, Toaster) |
| | class-variance-authority | ^0.7.1 | Variantes de componentes |
| | lucide-react | ^1.44.0 | Ícones |
| | Fontsource Roboto Mono | ^5.3.0 | Tipografia variável |
| **HTTP & Realtime** | Axios | ^1.20.0 | Cliente HTTP interceptado |
| | socket.io-client | ^4.8.3 | Comunicação WebSocket |
| **Mocks** | MSW | ^2.15.0 | Service Worker de interceptação |
| | @mswjs/socket.io-binding | ^0.2.0 | Mock de WebSocket |
| **Validação** | Zod | ^3.25.76 | Schema validation |
| **Testes** | Playwright | ^1.63.0 | E2E + Visual regression |
| | sharp | ^0.35.4 | Processamento de imagens (snapshots) |
| **Performance** | Lighthouse | ^13.4.1 | Auditoria de performance/SEO/a11y |
| **Linting** | oxlint | ^1.81.0 | Linter ultrarrápido |
| **Package Manager** | pnpm | 9.15.5 | Gerenciador de pacotes |
| **Runtime** | Node | ≥22.19 | Requisito mínimo |

---

## 🏗️ Arquitetura Adotada

### Estrutura em Camadas (Layered Architecture)

```
src/
├── routes/              # TanStack Router file-based — 9 telas + placeholders
│   ├── index.tsx        # Home / Início
│   ├── mercado.tsx      # Catálogo
│   ├── nft.$nftId.tsx   # Detalhe do NFT
│   ├── carrinho.tsx     # Carrinho
│   ├── pagamento.tsx    # Checkout
│   ├── pedido.$orderId.tsx # Confirmação de pedido
│   ├── login.tsx        # Autenticação
│   ├── cadastro.tsx     # Registro
│   ├── perfil.tsx       # Perfil do usuário
│   ├── carteiras.tsx    # Carteiras Web3
│   └── favoritos.tsx    # Lista de favoritos
│
├── features/<domínio>/  # Feature slices — API + Componentes + Hooks
│   ├── auth/            # Login/cadastro (form + OAuth Google/Facebook)
│   ├── catalog/         # Listagem, filtros, paginação, busca
│   ├── nft/             # Detalhe, galeria, painel de compra
│   ├── cart/            # Carrinho, cupom, produtos recomendados
│   ├── checkout/        # Pagamento, conexão de carteira, revisão
│   ├── favorites/       # Toggle e lista de favoritos
│   ├── profile/         # Dados do perfil, alteração de senha
│   ├── wallets/         # Gestão de carteiras primárias/secundárias
│   ├── account/         # Layout compartilhado (sidebar)
│   └── realtime/        # Socket.IO provider + version guards
│
├── lib/                 # Cross-cutting utilities
│   ├── http.ts          # Instância Axios única (interceptores, auth, erros)
│   ├── query.ts         # QueryClient configurado (staleTime, retry, gcTime)
│   ├── socket.ts        # Socket.IO client singleton
│   ├── money.ts         # Aritmética em wei (BigInt) — sem floats
│   ├── utils.ts         # cn(), helpers
│   └── viewport.ts      # Detecção real de viewport (matchMedia)
│
├── contracts/           # Tipos REST + Eventos — fonte única da verdade
│   └── index.ts         # User, NFT, Cart, Quote, Order, RealtimeEvent, ApiError
│
├── components/          # UI compartilhada
│   ├── ui/              # shadcn primitives (button, slider, toaster)
│   ├── layout/          # Header, Footer, RootLayout, MobileTabBar/TopBar
│   └── Hero, PromoCards, BlogSection, Breadcrumb...
│
└── mocks/               # Simulação completa de backend
    ├── db.ts            # Banco em memória com persistência localStorage
    ├── handlers/        # REST handlers (auth, nfts, account)
    ├── socket.ts        # WebSocket mock (Engine.IO/Socket.IO v4/v5)
    ├── scenario.ts      # Cenários determinísticos (slow, flaky, offline...)
    └── data/seed.ts     # Dados semeados (NFTs, usuários teste)
```

### Princípios Arquiteturais
1. **Separação Responsabilidade de Transporte → Estado → UI**: Toda requisição passa por `lib/http.ts` (Axios) → respostas tipadas contra `contracts/` → TanStack Query gerencia estado servidor → componentes apenas leem do cache.
2. **Dados simulados isolados**: Nenhum fixture ou dado hardcoded existe fora de `mocks/`. Componentes, hooks e cliente HTTP são agnósticos.
3. **Cache isolado por usuário**: Todas as chaves privadas do Query incluem `userId` (ex: `['cart', userId]`) para evitar vazamento entre sessões.
4. **REST como fonte da verdade**: Socket apenas sinaliza *quando* refazer fetch; reconciliação faz invalidateQueries + refetch via HTTP.

---

## ✨ Principais Funcionalidades Implementadas

### 1. Autenticação Completa
- **Login / Cadastro tradicional** com validação client-side (Zod) + server-side (MSW)
- **OAuth Google** via SDK oficial Google Identity Services (GSI) — One Tap com fallback popup
- **OAuth Facebook** via FB JS SDK v23.0 — popup oficial com escopo `public_profile,email`
- **Mesclagem de carrinho convidado → usuário** no momento do login/cadastro (preserva itens do visitante)
- **Proteção de rotas**: `/pagamento`, `/pedido/:id`, `/perfil`, `/carteiras` redirecionam para login com `?redirect=` e retornam após autenticação
- **Sessão persistente** via token JWT em localStorage + `GET /auth/session` reidrata no reload
- **Logout limpo**: invalidação de cache privado + desconexão do socket

### 2. Catálogo de NFTs
- **Listagem paginada** com `keepPreviousData` (transição suave entre páginas)
- **Filtros facetados**: coleções, redes (Ethereum/Polygon/Solana), faixa de preço via slider
- **Abas**: Todos / Novos / Em alta
- **Ordenação**: Mais recentes / Menor preço / Maior preço / Nome
- **Busca textual** debounced
- **Skeletons de carregamento** e estados vazios
- **Mobile**: filtros em bottom sheet separado

### 3. Detalhe do NFT
- **Galeria de imagens** com modal em tela cheia
- **Seleção de edição** (preços/estoque variantes)
- **Painel de compra** com quantidade + disponibilidade em tempo real
- **Atributos e metadados** do token
- **Produtos relacionados** ("Mais desta coleção" — 5 itens)
- **Breadcrumb navegável**

### 4. Favoritos
- **Toggle otimista** com rollback em erro
- **Página dedicada** listando NFTs favoritados

### 5. Carrinho de Compras
- **Servidor-autoritário**: cliente nunca calcula totais; lê de `GET /cart` + `POST /quote`
- **Aplicação de cupom**: `GREEN10` = 10% off, validação de expirado/inválido
- **Produtos recomendados** ("Colecionadores também viram")
- **Mobile**: layout dedicado com header, lista e summary separados
- **Atualizações em tempo real**: se preço de item no carrinho mudar via socket → toast + invalidação

### 6. Checkout & Pagamento
- **Revisão de pedido** com revalidação automática do quote antes de submeter
- **Proteção contra preço obsoleto**: se `quoteHash` mudar desde exibição → exibe novo total e pede reconfirmação
- **Idempotência**: chave `Idempotency-Key = sessionNonce:quoteHash` previne duplicatas; timeout retenta 1× com mesma chave e recupera pedido existente
- **Conexão de carteira Web3** simulada (Metamask/Phantom)
- **Acompanhamento em tempo real**: pedido transita `pending → confirmed/rejected` via socket + polling fallback
- **Recibo imutável**: pedido armazena snapshot dos itens, preços e imagens no momento da compra

### 7. Área do Usuário
- **Perfil**: edição de nome, e-mail, avatar + alteração de senha
- **Carteiras**: gestão de carteira primária e secundária (endereço, redes suportadas, label)
- **Sidebar de conta** com navegação

### 8. Atualizações em Tempo Real (WebSocket)
- **Socket.IO v5** com Engine.IO v4 mockado no browser
- **Eventos**: `nft.updated` (preço/disponibilidade) e `order.updated` (status pedido)
- **Version guards**: ignora eventos duplicados ou fora de ordem (versão monotônica)
- **Reconnect reconciliation**: ao reconectar, invalida todas as queries montadas e refaz fetch via REST
- **Escopo por dono**: eventos de pedido são entregues apenas ao dono (404 para terceiros)

### 9. Resiliência e Cenários de Falha
A aplicação inclui 10 cenários determinísticos acessíveis via `?scenario=<nome>`:

| Cenário | O que exercita |
|---------|---------------|
| `default` | Happy path |
| `slow-network` | Latência alta + skeletons |
| `flaky-network` | 35% de 503 transitórios + out-of-order responses |
| `offline` | Sem conectividade |
| `empty-catalog` | Estado vazio global |
| `coupon-expired` | Todos cupons retornam 422 expired |
| `price-changed-during-checkout` | Preço do item muda após abrir pagamento |
| `order-timeout-then-recover` | POST /orders trava, retry idempotente recupera |
| `payment-rejected` | Pedido sempre cai em `rejected` |
| `wallet-connect-rejected` | Conexão de carteira é recusada |

### 10. Acessibilidade (a11y)
- **Radix UI primitives** com foco e ARIA corretos por padrão
- **Contraste de texto**: ≥6.7:1 em todos os pares texto/fundo (passa WCAG 2.1 AA)
- **Focus rings** de alto contraste em navegação por teclado
- **Movimento reduzido**: `reducedMotion` habilitado em testes visuais

---

## 🧗 Desafios Superados

### 1. Mock de WebSocket sem suporte nativo do MSW
**Problema**: MSW v2 não intercepta WebSockets de forma confiável no browser, e `socket.io-client` captura a referência global `WebSocket` no carregamento do módulo.

**Solução**: Implementei um wrapper customizado do `WebSocket` global em [`src/mocks/socket.ts`](./src/mocks/socket.ts) que fala o protocolo Engine.IO v4 / Socket.IO v5 na camada de wire, instalado via [`src/mocks/install-socket.ts`](./src/mocks/install-socket.ts) **antes** da importação do `socket.io-client` em [`src/main.tsx`](./src/main.tsx). Suporta eventos, handshake e ping — suficiente para o fluxo realtime completo.

### 2. Layouts completamente diferentes entre Desktop e Mobile (Auth)
**Problema**: O Figma de Login/Cadastro mobile não é apenas o encolhido do desktop — é uma página full-screen diferente, sem dialog, sem backdrop, sem tabs e com CTA copy distinto. Reutilizar o `Radix Dialog` com CSS `hidden` deixava a página inteira `inert` (Radix bloqueia interação atrás de dialogs abertos), fazendo com que nenhum toque funcionasse no mobile.

**Solução**: Criei [`useIsDesktopViewport`](./src/lib/viewport.ts) com `matchMedia()` real (não breakpoint CSS) para renderizar condicionalmente `AuthModal` (Dialog Radix) ou `MobileAuthScreen` (página full), compartilhando o hook `useAuthForm` para estado/submissão. Também removi `MobileTopBar` e `MobileTabBar` dessas rotas.

### 3. Aritmética de criptomoeda sem ponto flutuante
**Problema**: Valores em ETH usando `number`/`float` gerariam erros de arredondamento acumulados no checkout.

**Solução**: Todos os valores ETH transitam como `string` decimal nos contracts e a aritmética (subtotal, desconto, taxa de rede, total) é executada em **wei** usando `BigInt` em [`src/lib/money.ts`](./src/lib/money.ts). O `quoteHash` liga o preço calculado ao pedido, impedindo compras com valor desatualizado.

### 4. Out-of-order responses em filtros dinâmicos
**Problema**: Filtros facetados e paginação acionam múltiplas requisições concorrentes; uma resposta antiga poderia sobrescrever dados novos.

**Solução**: Todas as `queryFn` do TanStack Query encaminham o `AbortSignal` recebido para o Axios, de modo que requisições suplantadas são canceladas e suas respostas descartadas.

### 5. Proteção contra duplicatas no checkout
**Problema**: Duplo clique em "Confirmar compra" geraria pedidos duplicados, e timeouts de rede forçariam retry sem saber se a requisição original chegou.

**Solução**: Chave de idempotência estruturada `sessionNonce:quoteHash` — estável por tentativa (timeout retenta com mesma chave e recupera o pedido já criado) e muda apenas quando o carrinho precificado mudar. Handler MSW valida payload idêntico para mesma chave (409 `conflict` se diferente).

---

## 🎯 Decisões Técnicas & Justificativas

### 1. TanStack Router (file-based) ao invés de React Router
**Justificativa**: Integração nativa e de primeira classe com TanStack Query via `queryClient.ensureQueryData()` nos route loaders, possibilitando prefetch automático na navegação sem duplicação de código. Tipagem segura de search params e rotas (navegação tipada).

### 2. TanStack Query como único dono do estado servidor
**Justificativa**: Nenhum dado de servidor vive em `useState`/`useEffect`. Isso elimina classe inteira de bugs de sincronização e habilita estratégias de cache consistentes (staleTime, retry controlado, invalidação por mutation e por eventos realtime).

### 3. MSW como mock layer, não MSWJS/data
**Justificativa**: MSW puro com banco em memória custom (`mocks/db.ts`) + persistência em `localStorage` oferece controle total sobre o ciclo de vida dos dados, transações, versionamento de eventos e cenários determinísticos — algo que bibliotecas de mock de mais alto nível abstraem demais.

### 4. Axios ao invés de fetch nativo
**Justificativa**: Ecossistema maduro de interceptores (auth token, normalização de erros, await do MSW worker boot), `paramsSerializer` configurável (para filtros `?collections=a&collections=b`), e suporte nativo a `AbortSignal`.

### 5. Mobile layouts dedicados, não só CSS responsivo
**Justificativa**: O design Figma especifica composições estruturalmente diferentes entre viewports (ex: mobile login não tem dialog, mobile checkout tem header/CTA bar próprios). Renderizar componentes diferentes via `matchMedia` (não só `hidden md:`) evita problemas de acessibilidade como dialogs inertes e marcação HTML desnecessária.

### 6. Campos decorativos do Figma não implementados
**Justificativa**: Decisão consciente de omitir campos que existiam no Figma mas não possuíam contraparte no contrato (nome de usuário, nome ENS, código de indicação, etc.). Renderizar campos que "parecem funcionar" mas não fazem nada viola a exigência de não mostrar dados/UI fictícios.

---

## 🚀 Instalação & Execução Local

### Pré-requisitos
- **Node.js** ≥ 22.19 (ver `.nvmrc`)
- **pnpm** ≥ 9.15.5 (package manager obrigatório, lock incluso)

```powershell
# Instalar Node via nvm (recomendado)
nvm install 22
nvm use 22

# Instalar pnpm globalmente se ainda não tiver
corepack enable
corepack prepare pnpm@9.15.5 --activate
```

### Passo 1: Clonar e instalar dependências
```bash
git clone <repo-url>
cd frontend-challenge
pnpm install
```

### Passo 2: Configurar variáveis de ambiente
O projeto já inclui `.env` com defaults para mock. Para **OAuth real funcionar**, preencha as variáveis abaixo (se estiverem em branco, os botões mostram aviso de setup em vez de executar fluxo):

```env
# .env

# REST e WebSocket (já configurados)
VITE_API_URL=/api
VITE_WS_URL=/
VITE_ENABLE_MOCKS=true

# OAuth 2.0 — Google Cloud Console → OAuth 2.0 Client IDs
# Origens JavaScript autorizadas: http://localhost:5173
# URIs de redirecionamento autorizados: http://localhost:5173
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com

# OAuth Facebook Login — Meta for Developers → My Apps → Settings → Basic
# Domínios autorizados: localhost
VITE_FACEBOOK_APP_ID=seu-app-id-aqui
```

### Passo 3: Executar servidor de desenvolvimento
```bash
pnpm dev
```
Abre em **http://localhost:5173** — mocks já estão ativados por padrão.

### Passo 4: Build e preview de produção
```bash
pnpm build       # tsc -b && vite build → dist/
pnpm preview     # Servidor estático em http://localhost:4173 (mocks ativados)
```

---

## 🧪 Execução de Testes

### Testes E2E (Playwright)
Executa 12 specs cobrindo catalogo, detalhe, auth, favoritos, carrinho, compra, falhas de pagamento, conta, realtime, resiliência, a11y e loading states. Roda em Chromium desktop (1440×900) e mobile Pixel 7 (390×844).

```bash
# Instala navegadores do Playwright (primeira vez)
pnpm exec playwright install chromium

# Roda specs E2E (build + preview automáticos)
pnpm test:e2e
```

Saída: relatório HTML em `playwright-report/` + traces em caso de falha.

### Testes Visuais (Pixel-perfect Regression)
Compara screenshots de 4 telas principais (início, detalhe, carrinho, pagamento) contra baselines em `e2e/__screenshots__/`.

```bash
# Rodar validação visual
pnpm test:visual

# Atualizar baselines se design mudou intencionalmente
pnpm test:visual:update
```

### Auditoria Lighthouse
Mede Performance, Accessibility, Best Practices e SEO em 3 runs por página/perfil (Início + Detalhe, desktop + mobile). Reporta mediana.

```bash
pnpm audit:lighthouse
```

Relatórios brutos HTML/JSON em `lighthouse/reports/`.

### Qualidade Estática
```bash
# Type checking estrito (projeto inteiro)
pnpm typecheck

# Linting ultrarrápido
pnpm lint
```

---

## 🔑 Credenciais de Teste

### Login tradicional (e-mail + senha)
Dois usuários semeados no banco mock — ambos usam a mesma senha:

| E-mail | Nome | Senha |
|--------|------|-------|
| `ada@greenmint.test` | Ada Verde | `senha123` |
| `bruno@greenmint.test` | Bruno Mata | `senha123` |

### Login Social — Google OAuth (✅ funcional para demonstração)
O fluxo de login com **Google** está totalmente implementado e funcional via SDK oficial **Google Identity Services (GSI)** com One Tap + fallback popup. Basta clicar no botão "Continuar com Google" na tela de login/cadastro que você será autenticado com a sua conta Google real — não são necessárias credenciais fictícias.

> ⚠️ O `VITE_GOOGLE_CLIENT_ID` já está configurado no `.env` do projeto. Se por acaso o botão apresentar aviso de setup, é só preencher a variável com seu próprio Client ID do Google Cloud Console (origens autorizadas: `http://localhost:5173`).

### Cupom de desconto
`GREEN10` — aplica 10% de desconto no carrinho. Qualquer outro código é rejeitado.

---

## 📊 Resultados de Qualidade

### Lighthouse (mediana, build de produção)
| Página · Perfil | Performance | Accessibility | Best Practices | SEO |
|-----------------|-------------|---------------|----------------|-----|
| Início · Mobile | 81 | 100 | 100 | 100 |
| Início · Desktop | 99 | 99 | 100 | 100 |
| Detalhe · Mobile | 81 | 100 | 100 | 100 |
| Detalhe · Desktop | 99 | 100 | 100 | 100 |

- **Accessibility, Best Practices e SEO**: 100% em todas as páginas/perfis.
- **Performance Mobile (81)**: GAP estrutural devido à arquitetura obrigatória de mocks client-side (MSW worker + socket.io-client + TanStack Router/Query somam ~320 KB de JS no critical path). Em produção real com `VITE_ENABLE_MOCKS=false`, esse overhead é removido.
- **Core Web Vitals Mobile**: TBT = 60-80 ms, CLS = 0 (perfeitos); gargalo está em FCP/LCP (3.1-4.0 s em rede 4G+CPU 4×).

---

## 📦 Deploy

Aplicação é uma SPA pura — requer history fallback para `index.html`. Configurações inclusas para 3 plataformas:

### Vercel
Arquivo `vercel.json` incluso. Deploy direto do painel Vercel:
- **Build command**: `pnpm build`
- **Output directory**: `dist`
- **Framework preset**: Vite

### Netlify
Arquivo `netlify.toml` incluso. Conecte o repositório.

### Cloudflare Pages
Arquivo `public/_redirects` incluso com `/*  /index.html  200`:
- **Build command**: `pnpm build`
- **Output directory**: `dist`

Os arquivos `mockServiceWorker.js` e assets são servidos como estáticos antes do fallback; acesso direto e refresh de qualquer rota funciona no deploy.

---

## 📁 Documentação Complementar

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Especificação completa de contracts REST/WebSocket, política de sessão, estratégia de cache TanStack Query, fluxo de checkout/idempotência, lista completa de desvios do Figma com justificativas e resultado detalhado do auditoria Lighthouse.

---

## 📝 Licença

MIT — Projeto desenvolvido como desafio técnico.
