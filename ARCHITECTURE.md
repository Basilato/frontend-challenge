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
- **Carteiras screen**: built from the shared form patterns + the frame's field
  metadata — the Figma MCP hit the Starter-plan rate limit before a dedicated
  `get_design_context` call. Visuals to be reconciled.
- **Socket transport** is pinned to `websocket` (the mock has no HTTP polling
  fallback). Explorer / transaction references are simulated.

## 9. Lighthouse audit

`pnpm audit:lighthouse` (`lighthouse/run.mjs`) runs 3 measurements per page ×
profile against the production build (`vite build && vite preview`) and reports
the median of each category. Início = `/`, Detalhe = `/nft/nft_1`.

| Page · profile | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Início · mobile | 81 | 100 | 100 | 100 |
| Início · desktop | 99 | 99 | 100 | 100 |
| Detalhe · mobile | 82 | 100 | 100 | 100 |
| Detalhe · desktop | 99 | 100 | 100 | 100 |

Targets: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90.
**Accessibility, Best Practices and SEO clear their targets on every page and
profile (desktop and mobile). Performance clears its target on desktop (99) but
falls short on mobile (81–82)** — median Core Web Vitals for the mobile runs:

| Page (mobile) | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- |
| Início | 3.1 s | 4.0 s | 64 ms | 0 |
| Detalhe | 3.0 s | 4.0 s | 43 ms | 0 |

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
