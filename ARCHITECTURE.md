# ARCHITECTURE

Kurio / GreenMint — NFT marketplace SPA. React 19 + TypeScript + Vite, TanStack
Router/Query, Axios, `socket.io-client`, Tailwind v4, shadcn/ui, MSW.

Everything runs on **simulated data**. There is no backend: the "server" is a
Mock Service Worker layer with an in-memory database. This document describes the
contracts, the session/cart/cache model, and how REST and realtime reconcile.

---

## 1. Layers

```
routes/            TanStack Router file-based routes; loaders prefetch via queryClient
features/<domain>/ api.ts (queryOptions + mutations + typed fns), components, hooks
  auth  catalog  cart  checkout  favorites  wallets  profile  realtime  account
lib/               http (axios), query (QueryClient), socket (socket.io-client), money
contracts/         the single source of REST + event types (transport ⇄ state ⇄ UI)
mocks/             db (in-memory), handlers/* (REST), socket.ts (WebSocket), scenario.ts
```

- **Transport → state**: every network call goes through the single Axios
  instance (`lib/http.ts`). Responses are typed against `contracts/`.
- **State**: TanStack Query owns all server state. No server data lives in
  `useState`/`useEffect`.
- **UI**: components read from Query; mutations invalidate.
- **Mocks are the only place fake data exists.** Components, hooks and the Axios
  client contain no fixtures or alternate business paths.

---

## 2. REST contracts

Base URL `VITE_API_URL` (default `/api`). All list array params are serialised as
repeated keys (`collections=a&collections=b`) — `paramsSerializer: { indexes: null }`.
Errors are normalised to `ApiError { kind, status, fields?, payload? }`
(`kind`: `validation | unauthorized | forbidden | not-found | conflict |
transient | timeout | network | unknown`). Bodies carry `{ message, code?, fields? }`.

| Resource | Endpoint | Notes |
| --- | --- | --- |
| **Session & account** | `POST /auth/register` | 422 field errors · 409 `email_taken` · sets session, merges guest cart |
| | `POST /auth/login` | 401 on bad credentials · merges guest cart |
| | `GET /auth/session` | 401 when the token is missing/expired |
| | `POST /auth/logout` | clears the session |
| **NFTs** | `GET /nfts` | `q, collections[], networks[], priceMinEth, priceMaxEth, tab, sort, page, pageSize` → `Paginated<NftSummary>` |
| | `GET /nfts/facets` | same filters minus sort/paging → per-facet counts (computed with the *other* active filters) + price range |
| | `GET /nfts/:id` | by id or slug · 404 when unknown |
| **Favorites** | `GET /favorites` | `{ nftIds }` · auth required |
| | `PUT /favorites/:nftId` / `DELETE /favorites/:nftId` | returns the updated list |
| **Cart** | `GET /cart` | owner is the user id, or `guest` |
| | `POST /cart/items` | `{ nftId, editionId, quantity }` · 409 `unavailable` |
| | `PATCH /cart/items/:editionId` | `{ quantity }` · re-checks live availability · 409 `unavailable` · `quantity<=0` removes |
| | `DELETE /cart/items/:editionId` | |
| | `PUT /cart/coupon` / `DELETE /cart/coupon` | `GREEN10` = 10% · 422 `invalid` / `expired` |
| **Quote** | `POST /quote` | prices the cart (server-side, in wei): `subtotalEth, discountEth, networkFeeEth, totalEth, couponError, quoteHash, expiresAt` |
| **Orders** | `POST /orders` | **idempotent** — `Idempotency-Key` header required. `{ quoteHash, cartId, walletId, network, collector }`. 400 missing key · 409 `stale_quote` · 409 `conflict` (same key, different payload). Clears the cart; owner recorded privately. |
| | `GET /orders/:id` | **owner-scoped** — a non-owner gets 404. Settles a `pending` order to `confirmed`/`rejected` after ~2.5s and emits `order.updated`. |
| **Profile** | `PATCH /profile` | `{ name?, email?, avatar? }` · 409 `{ fields: { email } }` |
| | `POST /profile/password` | `{ currentPassword, newPassword }` · 422 `{ fields: { currentPassword } }` |
| **Wallets** | `GET /wallets` | `Wallet[]` for the user |
| | `PUT /wallets/:role` | upsert primary/secondary — `{ label, address, networks }` |
| | `POST /wallets/connect` | connection simulation — `{ provider }` → `{ address }` · 409 `rejected` |

### Money

ETH values travel as **decimal strings**. All arithmetic (line totals, discount,
network fee, order total) is done in **wei with `BigInt`** (`lib/money.ts`) — no
floats. Quantities are integers. The `quoteHash` binds a priced cart state; the
order must be created against a fresh hash.

---

## 3. Realtime events (Socket.IO)

`socket.io-client` connects to `VITE_WS_URL` (path `/socket.io`, `transports:
['websocket']`). Identity is announced with an `identify` event on `connect`
(the mock reads it from there, not the handshake).

| Event | Payload | Client behaviour |
| --- | --- | --- |
| `nft.updated` | `{ type, nftId, version, priceEth, available }` | If `version` advances: invalidate the NFT detail + all `nfts` lists + cart/quote → refetch from REST. If the NFT is in the cart, toast the collector. |
| `order.updated` | `{ type, orderId, version, status, transactionRef, explorerUrl }` | If `version` advances: patch the order cache + invalidate. Delivered **only to the order owner**. |

**Version guards.** `RealtimeProvider` keeps a `Map<resourceKey, lastVersion>`.
An event whose version is `<=` the last applied (duplicate or out-of-order) is
dropped — no cache write, no side effect (toast). Cache entries are also checked
so a stale event can't overwrite a newer REST value.

**Reconnect reconciliation.** On `socket.io reconnect`, all mounted `nfts`,
`cart` and `orders` queries are invalidated → refetched. REST is the source of
truth; the socket only signals *when* to refetch.

**Lifecycle.** `RealtimeProvider` (single instance at the app root) owns the
socket. It connects when a user id appears and disconnects on logout / unmount;
listeners are removed in the effect cleanup.

**The mock.** MSW's browser worker does not reliably intercept WebSocket in this
version, so `mocks/socket.ts` ships a small `WebSocket` implementation that
speaks the Engine.IO v4 / Socket.IO v5 wire protocol for `/socket.io/` and
delegates every other URL to the native class. It is installed
(`mocks/install-socket.ts`, imported first in `main.tsx`) **before**
`socket.io-client` is evaluated, because engine.io captures the `WebSocket`
global at module load. Limitations: events + handshake + ping only — no rooms,
namespaces, acks or binary.

---

## 4. Session policy

- On login/register the response includes a `token`. It is stored in
  `localStorage` (`greenmint.session.token`) and sent as `Authorization: Bearer`
  on every request. (The mock also sets a cookie, but service-worker responses
  don't persist `Set-Cookie` across reloads, so the token is authoritative.)
- `GET /auth/session` rehydrates `useAuth` on load; the session **survives a
  reload**.
- A `401` from any call clears the token, drops private caches (`cart`,
  `favorites`, `orders`, `profile`, `wallets`) and — on protected routes — the
  router's `beforeLoad` redirects to `/login?redirect=<path>`; login returns the
  user to that path.
- Protected routes: `/pagamento`, `/pedido/$orderId`, `/perfil`, `/carteiras`
  (`/login` and `/cadastro` bounce an already-authed user out).
- Logout / user switch: `queryClient.removeQueries` for the private prefixes and
  the socket is torn down, so no data or subscription leaks to the next session.
- Guest → user: the visitor cart is merged into the user cart inside
  `issueSession` when a session is issued.

---

## 5. Cart state

- **Server-authoritative.** The cart lives in the mock db keyed by owner (user id
  or `guest`). The client never computes the cart — it reads `GET /cart` and the
  priced summary from `POST /quote`.
- `unitPriceEth` is snapshotted when an item is added. `PATCH` re-validates the
  quantity against the *live* edition availability.
- The coupon is stored on the cart; `/quote` reads it. Applying an invalid/expired
  code returns 422 and does not attach.
- **Persistence.** The mock db is written to `localStorage` (`greenmint.mockdb.v1`)
  so a refresh keeps the cart, favorites, profile, wallets and orders. `resetDb()`
  restores the seed scenario in full.
- Quantity changes are **optimistic** in `useUpdateCartItem` with rollback on a
  409; the required optimistic-with-rollback interaction is the **favorite
  toggle** (`useToggleFavorite`).

---

## 6. Cache strategy (TanStack Query)

| Concern | Approach |
| --- | --- |
| **Isolation** | Private query keys include the user id (`['cart', userId]`, `['favorites', userId]`, …). List keys include the full param object. |
| **Staleness** | `staleTime` 30s for catalog/facets, 15s for cart, 60s for session/favorites/wallets. `gcTime` 5min. `refetchOnWindowFocus: false`. |
| **Pagination** | `placeholderData: keepPreviousData` — the current page stays visible during a transition; changing any filter resets `page` to 1. |
| **Out-of-order responses** | The `queryFn` forwards the `AbortSignal` to Axios, so a superseded request is cancelled and its response discarded. |
| **Retry** | Queries retry only `transient`/`network` errors (≤2×), never 4xx. Mutations don't retry; order creation retries **once** on a timeout with the same idempotency key. |
| **Invalidation** | After a mutation, the affected keys are invalidated (favorites, cart, quote, order, session, wallets, profile). Realtime events invalidate the same keys. |
| **Loaders** | Route loaders call `ensureQueryData(queryOptions)` so navigation prefetches; the component uses the same `queryOptions`. A `not-found` in a loader is swallowed so the page renders its own empty state. |

---

## 7. Checkout & idempotency

1. Payment page revalidates the quote (`fetchQuery`) **before** submitting.
2. If `quoteHash` changed since it was shown, the new total is displayed and the
   user must confirm again — never a silent charge.
3. `Idempotency-Key = <session nonce>:<quoteHash>`. It is stable across retries of
   the same attempt (a timeout auto-retries and recovers the same order) and
   changes when the priced cart changes.
4. `POST /orders` clears the cart and records the order owner privately.
5. The order settles asynchronously (`confirmed`/`rejected`) — the confirmation
   page polls `GET /orders/:id` while `pending` **and** reacts to `order.updated`
   instantly. It recovers on refresh because the order is in the db.
6. The receipt is a **snapshot**: the order stores its own items, token ids,
   images and totals; later catalog changes don't touch it.

---

## 8. Deviations from the Figma & known limitations

- **Decorative form fields dropped**: profile (`Nome de usuário`, `Nome ENS`,
  `Apelido da carteira`), payment (`Nome de usuário`, `Nome do perfil`, `Código
  de indicação`, `Nome ENS`, secondary-address). Rendering non-functional fields
  would "appear to succeed" — out of scope per the brief. Composition and the
  in-scope fields match the design.
- **Account sidebar**: only in-scope items kept (Dados do perfil, Carteiras,
  Lista de interesse, Sair). `Atividade / Ofertas / Arquivos baixados / Suporte`
  are editorial/out-of-scope and omitted.
- **Social login** (Google/Facebook) and **"Esqueceu a senha?"** are
  informational stubs (`toast.info`).
- **Hero background**: the Figma vector exported empty; approximated with a
  radial gradient from the screenshot.
- **Mobile navigation**: the Figma mobile screen leads with a search bar + a
  bottom tab bar (no logo/hamburger) — implemented as designed. There is no
  desktop-style user menu on mobile; account is reached via the Conta tab.
- **Carteiras screen**: reconciled against the real frame (`Desktop /
  Carteiras`, node `9:1670`) after an earlier Starter-plan rate-limit blocked
  it. Composition, labels and the primary/secondary sections match. Two
  intentional deviations: (1) the Figma frame includes fields with no
  counterpart in this brief's `Wallet` contract (`Nome do perfil`, `Código de
  indicação`, `Nome ENS`, a duplicate `E-mail`) — template noise, not
  implemented, same reasoning as the dropped decorative fields above; (2)
  network selection is a multi-select pill group, not the frame's single
  `<select>`, because `Wallet.networks` is an array in the actual contract —
  a wallet legitimately supports more than one network.
- **Socket transport** is pinned to `websocket` (the mock has no HTTP polling
  fallback). Explorer / transaction references are simulated.
- **Home page — Promos + Blog + full Footer** (session 2026-09-11 fidelity
  pass): the Figma desktop frame has three sections after the catalog grid —
  `Promos` (two CTA cards), `Blog` ("Diário da Cunhagem", 4 cards) and a full
  `Footer` instance (feature medallions, newsletter, brand band, 4 link
  columns) — that had never been built; the home page cut straight from the
  grid to a 2-line copyright bar. All three are now implemented
  (`src/components/PromoCards.tsx`, `BlogSection.tsx`,
  `layout/Footer.tsx`) and, like the sidebar's Featured NFT Banner, are
  **desktop-only**: the Figma *mobile* Início frame is exactly one
  viewport tall and never scrolls into this content, so `hidden md:flex`
  matches the source, not an arbitrary cut. The two promo cards and two of
  the four blog cards reuse the *same* two placeholder character portraits
  Figma itself reuses across Hero/Promos/Blog (this file's own mock assets,
  not our NFT seed images) — the other two blog images were exported new.
  Footer link columns only route to a destination that actually exists
  (`Meu perfil`, `Lista de interesse` → `/favoritos`, `Carteira e segurança`
  → `/carteiras`, each `Coleções` entry → a real collection filter); every
  other label from the Figma template (`Minha coleção`, `Atividade`, `Central
  de ajuda`, …) renders as plain non-interactive text instead of a link to
  nowhere (rule 3). The 5 "Redes sociais" icons and the newsletter form are
  decorative for the same reason — there is no real social presence or
  mailing list behind this demo.
- **Breadcrumb** ("Início / Mercado" / "… / Carrinho" / "… / Pagamento"):
  Figma renders this as one plain bold text run (no per-segment link
  styling) on the NFT detail, cart and payment frames only — not on
  Perfil/Carteiras/Login/Cadastro, which have none. Added as
  `src/components/Breadcrumb.tsx`; `Início` and `Mercado` are real
  navigation (`Mercado` goes to the existing out-of-scope `/mercado`
  placeholder — the same route the mobile tab bar's center action already
  used), the trailing crumb (current page) is plain text. The NFT detail
  page previously had its own ad-hoc breadcrumb showing the item's
  collection instead of "Mercado", styled smaller and in the wrong color
  (`text-sm text-text-secondary` vs. Figma's bold 15px foreground) — replaced
  for consistency; the collection name is still visible in the attributes list
  further down the same page.
- **NFT detail "Compartilhar este NFT" icons**: were generic lucide
  (link / mail / share) icons wired to copy-link / mailto / `navigator.share`.
  Figma's actual icons are LinkedIn / Message / Twitter — replaced with the
  exported glyphs (`LinkedinShareIcon` / `MessageShareIcon` /
  `TwitterShareIcon` in `components/icons.tsx`) wired to the corresponding
  standard public share intents (`linkedin.com/sharing/share-offsite`,
  `mailto:`, `twitter.com/intent/tweet`).
- **Carteiras — card borders removed**: the previous "pendências conhecidas"
  note about each wallet sitting in its own bordered card (not in the flat
  Figma frame) is resolved — the border/padding wrapper was dropped in favor
  of a plain `divide-y` between the primary and secondary sections, matching
  the source. The shared account-sidebar heading also read "Minha conta";
  Figma's literal (identical on both Perfil and Carteiras) label is
  "Meu perfil" — corrected.
- **Mobile Login/Cadastro are a dedicated full-screen page, not a shrunk
  modal** (fidelity pass, session 2026-09-11): `get_metadata` on the Figma
  `Mobile / Login` (`16:1022`) and `Mobile / Cadastro` (`16:1228`) frames
  showed a completely different composition from desktop — no dialog, no
  dimmed backdrop, no tabs: a centered 32px `KURIO` wordmark, a plain title
  (`Entrar` / `Criar perfil de colecionador`), the form, a 60px CTA (`Entrar`
  / **`Criar perfil`** — not `Criar conta`, mobile-only copy), a "Mobile
  Social Block" (Google/Facebook), and a single switch-mode text line
  (`Novo na Kurio? Crie uma conta` / `Já tem uma conta? Entre`) — no search
  pill or bottom tab bar either. The previous implementation reused the exact
  desktop `AuthModal` dialog at every viewport. Rebuilt as two layouts behind
  one `useAuthForm` hook (`src/features/auth/AuthModal.tsx`): the desktop
  `Dialog`-based modal, and a plain `MobileAuthScreen` page. `AuthScreen`
  picks between them with a real `matchMedia('(min-width: 768px)')` check —
  **not** a CSS breakpoint — because the desktop version is a Radix dialog:
  mounting it `hidden` on mobile still leaves it logically `open`, and Radix
  makes the rest of the page inert while a dialog is open, which silently
  swallowed every tap on the mobile screen underneath it (`<html>` intercepts
  pointer events) until this was caught by testing the mobile flow
  end-to-end, not just screenshotting it. `RootLayout` now also skips
  `MobileTopBar`/`MobileTabBar` on `/login` and `/cadastro` (mobile only —
  desktop keeps Header/Footer, matching the Figma frame's dimmed Home-page
  backdrop). The added **"Confirmar senha"** field on Cadastro (present in
  the Figma frame's `Form`, absent from the old schema/UI entirely) is real,
  not decorative — client-validated against the password field, not sent to
  `POST /auth/register`.
- **Login/Cadastro modal tab styling** (same pass): the "Entrar | Criar
  conta" tabs were `text-xl` (24px, this project's heading size) with only
  the active tab bold; `get_design_context` on the Figma tab node gives both
  tabs `20px`/`font-medium` (500), differing only by color (active =
  `text-accent`, inactive = **`text-fg`**, not the dimmer `text-secondary`
  the old code used) — corrected, along with the tab gap (12px → Figma's
  8px) and the header-to-subtitle gap (24px → Figma's 40px). Separately, the
  "Continuar com Google/Facebook" buttons rendered with no icon at all
  (`{provider}` text only) despite Figma exporting real brand marks —
  reconstructed as `GoogleIcon`/`FacebookMarkIcon` in `components/icons.tsx`
  from the exported vector paths (Google's is a stylized multi-color mark in
  this design, not the literal "G" logotype — reproduced as exported, not
  swapped for the generic logo).
- **Footer shown on every route, not just the Figma frames that have one**
  (same pass): `RootLayout` rendered the global `Footer` unconditionally.
  Checking `get_metadata` on all 9 desktop frames found a `Footer` instance
  on Início, Detalhe, Carrinho, Pagamento and Confirmação, but **not** on
  Perfil or Carteiras (both end right after their form, ~300px of blank
  background before the 1080px frame boundary) — `RootLayout` now hides it
  on those two routes only.
- **Carrinho was missing its "Colecionadores também viram" section**: the
  Figma `Desktop / Carrinho` frame has a 5-card recommendation row between
  the cart body and the Footer (`Related Products`, same component pattern
  as the NFT detail page's "Mais desta coleção") that was never built —
  added as `src/features/cart/RecommendedProducts.tsx`, filtering out NFTs
  already in the cart rather than filtering by collection (there is no
  single "current item" on a multi-item cart to key a collection off of).
  While auditing that section, the NFT detail page's own equivalent
  (`RelatedProducts.tsx`) turned out to render 4 cards in a `grid-cols-4`
  when Figma's row holds 5 (`Frame 204` → 5 `Product Card` children) —
  widened to `lg:grid-cols-5` with `pageSize: 6`/`slice(0, 5)` so a real
  5-item collection actually fills the row.
- **Account sidebar active-state had two embellishments Figma doesn't have**:
  `get_design_context` on the Perfil/Carteiras sidebar's active row
  (`Frame 459`) shows only a `border-l-[6px]` color change between active
  and inactive — same text color (`text-accent`) and same weight (regular)
  either way. The implementation additionally swapped in `bg-surface-dark`
  and `font-medium` on the active item — removed for fidelity (the border
  alone still satisfies the "not by color alone" a11y rule, since it's a
  shape change, not a hue change).
- **Border-color contrast**: `--color-border` (#3f2319) and
  `--color-border-soft` (#55321f) — both taken directly from the Figma
  primitives — measure ~1.3–1.7:1 against `--color-ink`, short of the 3:1 SC
  1.4.11 (WCAG 2.1 AA, non-text contrast) target for input/card boundaries.
  Raised and left as-is by product decision: every bordered field still has a
  visible label above it and a high-contrast `:focus-visible` ring (2px solid
  `--color-primary`, ~6.9:1) on keyboard focus, and the brand's border color is
  a deliberate part of the Figma identity — fidelity was chosen over
  brightening it. All text/background pairs in the palette (`fg`,
  `text-secondary`, `text-accent` on `ink`/`surface-card`/`surface-dark`) clear
  AA at ≥6.7:1.

## 9. Lighthouse audit

`pnpm audit:lighthouse` (`lighthouse/run.mjs`) runs 3 measurements per page ×
profile against the production build (`vite build && vite preview`) and reports
the median of each category. Início = `/`, Detalhe = `/nft/nft_1`. Raw HTML/JSON
for every run are committed under `lighthouse/reports/` (24 files — 2 pages ×
2 profiles × 3 runs, `.report.html` + `.report.json` each).

**Tooling and environment for the committed run:** Lighthouse 13.4.1, Node
v24.13.0, Windows 10, HeadlessChrome/152.0.0.0, `throttlingMethod: simulate`.
Mobile profile: RTT 150 ms, ~1.6 Mbps throughput, 4× CPU slowdown (Lighthouse's
default "Moto G Power"-class mobile preset). Desktop profile: RTT 40 ms,
~10 Mbps throughput, no CPU slowdown. Audited 2026-09-11.

| Page · profile | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Início · mobile | 81 | 100 | 100 | 100 |
| Início · desktop | 99 | 99 | 100 | 100 |
| Detalhe · mobile | 81 | 100 | 100 | 100 |
| Detalhe · desktop | 99 | 100 | 100 | 100 |

Targets: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90.
**Accessibility, Best Practices and SEO clear their targets on every page and
profile (desktop and mobile). Performance clears its target on desktop (99) but
falls short on mobile (81)** — median Core Web Vitals for the mobile runs:

| Page (mobile) | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| Início | 3.1 s | 4.0 s | 60 ms | 0 |
| Detalhe | 3.1 s | 4.0 s | 80 ms | 0 |

TBT and CLS are effectively perfect on both pages — the gap is entirely FCP/LCP
(the two most heavily-weighted metrics), and the root cause is structural
rather than a specific unoptimized resource:

- This is a fully client-rendered SPA (no SSR/SSG), and the brief's mock-only
  architecture (rule 1) means the interception layer itself — MSW's browser
  worker plus TanStack Router/Query, Axios and a real `socket.io-client` —
  has to download, parse and execute before the first pixel paints. That's
  roughly 320 KB of JS (~160 KB gzip for the app bundle, ~160 KB gzip for
  `msw/browser`) on the critical path. Under Lighthouse's mobile profile (4×
  CPU throttling, throttled network), that JS cost dominates FCP/LCP; a real
  deployment wouldn't ship the mock layer at all (`VITE_ENABLE_MOCKS=false`
  against a real backend), which this audit — correctly, per the brief — does
  not exercise.
- Mounting no longer waits on the mock service worker: `enableMocking()` is
  kicked off in the background from `main.tsx`, and only the Axios request
  interceptor (`lib/http.ts`) awaits it before a request leaves — first paint
  is decoupled from that round trip. This and the fixes below measurably
  cleaned up Best Practices/SEO (100 across the board) but moved Performance
  by less than a point: the JS parse/execute cost, not the SW handshake, is
  the actual floor.
- Fixed along the way: the guest-mode `/auth/session` probe (guaranteed 401 on
  every anonymous load) no longer fires at all when there's no token, which
  also cleared a console-error Best Practices deduction; added `robots.txt`;
  the Detalhe page's gallery images (the page's LCP element) were requested at
  900px for a ~404px display box — resized to 640px; both LCP images now hint
  `fetchpriority="high"` (no static `<link rel=preload>` in `index.html`: it's
  shared by every route, so preloading Início's hero art there would cost
  Detalhe unused bytes for nothing, and vice versa).
- Not pursued: eliminating the mock/realtime layer from the critical path
  further would mean either SSR (out of scope — the brief specifies a Vite
  SPA) or deferring data-dependent rendering behind a non-mock-gated shell,
  which risks masking real request/response state behind a synthetic loading
  frame. Given the ceiling is the mandated client-side mocking architecture
  itself rather than an overlooked asset, further chase of the last ~8 points
  was judged not worth that risk.
