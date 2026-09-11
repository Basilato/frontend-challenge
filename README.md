# Kurio — NFT Marketplace

Frontend challenge solution. A React + TypeScript SPA implementing the Kurio /
GreenMint NFT marketplace from Figma, running entirely on **simulated data** (no
backend — a Mock Service Worker layer with an in-memory database, plus a mock
Socket.IO server for realtime).

Design → code notes and the full contract/session/cache model are in
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack

React 19 · TypeScript · Vite 8 · TanStack Router (file-based, URL-driven state) ·
TanStack Query v5 · Axios · `socket.io-client` · Tailwind CSS v4 · shadcn/ui ·
MSW 2 · Playwright · Lighthouse. Package manager: **pnpm**. Node **≥ 22.19**
(`.nvmrc` = 22).

## Setup

```sh
pnpm install
pnpm dev            # http://localhost:5173 — mocks enabled
```

The mock layer is always on unless `VITE_ENABLE_MOCKS=false`. It ships in the
production build too (the deploy runs against mocks).

### Environment variables

`.env` (committed — no secrets):

| Var | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | REST base URL (intercepted by MSW) |
| `VITE_WS_URL` | `/` | Socket.IO endpoint (intercepted by the mock WebSocket) |
| `VITE_ENABLE_MOCKS` | `true` | set to `false` to disable the mock layer entirely |

## Test credentials

Two seeded collectors (password `senha123` for both):

| Email | Name |
| --- | --- |
| `ada@greenmint.test` | Ada Verde |
| `bruno@greenmint.test` | Bruno Mata |

Coupon code: **`GREEN10`** (10% off). Any other code is rejected.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | dev server with mocks |
| `pnpm build` | `tsc -b && vite build` → `dist/` |
| `pnpm preview` | serve the build on `:4173` |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | oxlint |
| `pnpm test:e2e` | Playwright (builds + previews first) |
| `pnpm test:visual` | Playwright visual-regression specs (`@visual`) |
| `pnpm test:e2e:update` | refresh visual baselines |
| `pnpm audit:lighthouse` | Lighthouse audit of Início + Detalhe (see `lighthouse/`) |

## Mock scenarios

The mock layer has named, deterministic scenarios. Select one on first load with
`?scenario=<name>` (persisted for the tab), or from the browser console:

```js
window.__mock.scenarioNames            // list
window.__mock.setScenario('offline')   // switch (reload to apply everywhere)
window.__mock.resetDb()                 // restore the seed scenario in full
window.__mock.emitNftUpdated('nft_1', { priceEth: '9.99' })   // push a realtime event
window.__mock.emitOrderUpdated('order_xxx', 'confirmed')
```

| Scenario | Reproduces |
| --- | --- |
| `default` | happy path |
| `empty-catalog` | zero results everywhere |
| `slow-network` | high fixed latency + jitter — exercises skeletons |
| `flaky-network` | ~35% transient 503s + out-of-order list responses |
| `offline` | no connectivity |
| `coupon-expired` | every coupon returns 422 `expired` |
| `price-changed-during-checkout` | opening `/pagamento` pushes an `nft.updated` for a cart item ~2.5s later → the collector is warned and the quote is blocked as stale |
| `order-timeout-then-recover` | the first `POST /orders` hangs past the client timeout; the idempotent retry recovers the same order |
| `payment-rejected` | orders settle to `rejected` |
| `wallet-connect-rejected` | the wallet connection simulation refuses |

### Reproducing the failure flows

- **Loading / skeletons**: `?scenario=slow-network`, navigate the catalog and open a detail.
- **Transient errors + retry**: `?scenario=flaky-network`; retry from the inline error state.
- **Empty state**: `?scenario=empty-catalog`.
- **Session expiry**: `window.__mock.resetDb()` while signed in, then trigger any
  private request (e.g. open `/carrinho` → `/pagamento`) — the 401 redirects to
  `/login?redirect=…` and returns you afterwards.
- **Coupon rejected**: `?scenario=coupon-expired`, or just type any code ≠ `GREEN10`.
- **Price changed mid-checkout**: `?scenario=price-changed-during-checkout`, add
  an item, go to `/pagamento`, wait ~3s, press *Confirmar compra* — it asks you
  to re-confirm the new total.
- **Order timeout + idempotent recovery**: `?scenario=order-timeout-then-recover`,
  complete a checkout — the confirmation ends up on the same order, not a duplicate.
- **Payment rejected**: `?scenario=payment-rejected`, complete a checkout.
- **Duplicate-submit protection**: double-click *Confirmar compra* — the button
  disables and the idempotency key dedupes server-side.
- **Realtime duplicates / stale events**: after an order settles, call
  `window.__mock.emitOrderUpdated(id, 'pending')` — the version guard ignores it.
- **Reconnect reconciliation**: `?scenario=offline` then back to `default` and
  reload — mounted queries refetch from REST.

## Deploy

SPA — needs a history fallback to `index.html`. Configs are included for:

- **Vercel** — `vercel.json` (build `pnpm build`, output `dist`).
- **Netlify** — `netlify.toml`.
- **Cloudflare Pages** — `public/_redirects` (build `pnpm build`, output `dist`).

`mockServiceWorker.js` and `assets/*` are served as static files before the
fallback. Direct access and refresh of any route work on the deployed site.

## Project layout

```
src/
  routes/          file-based routes (9 screens + nav placeholders)
  features/<domain>/  api.ts (queryOptions + mutations) + components
  lib/             http · query · socket · money · utils
  contracts/       REST + event types — the transport ⇄ state ⇄ UI boundary
  components/ui/   shadcn/ui primitives (button, slider, toaster)
  mocks/           db + REST handlers + WebSocket mock + scenarios
e2e/               Playwright specs
lighthouse/        audit runner + config
```
