# ReSell — reselling tracker

Web app to run a reselling operation. It organizes everything by **order** and, inside each one, by the **items** you bought, and automatically works out what matters: real cost, margin, profit and how long it took to sell.

It started as a static page in plain JavaScript and is now built on **Next.js + SQLite**, with a personal login per person, data shared and synced across devices, and installable on the phone as an app (PWA).

## What it calculates

For each item:

- **Real cost** — what you paid for the piece + the PayPal fee spread across the order's items + the bag
- **Margin** in euros and as a percentage
- **Days to sell** — from the goods' arrival date to the sale date
- **Minimum sale price** — for the minimum margin you set (e.g. 20%), it shows "don't sell below €X"

And at the business level:

- Global summary: invested, unsold stock, revenue, sales profit, expenses and **real profit** (after everything)
- **Profit per category**, with bars, **sell-through** (% already sold) and average days per category
- **Monthly chart** — profit per month, or received vs invested per month (toggle)
- **Monthly report** — your profit and number of sales this month vs. the previous one
- **Profit per partner** — each order made with a partner splits the profit in half; solo orders are 100% yours

## Features

- Orders with purchase date, arrival date, PayPal fee and bag cost
- **Partner per order** — choose who it was made with (or solo); profit splits in half automatically
- Items with free-text category, **size** (Polo XS–XXL, football shirts S–XL), **photo** and **notes**. Photos are **downscaled in the browser** before upload (and iPhone **HEIC is converted to JPEG**, so it shows everywhere)
- **Autofill from past items** — type an item's name and pick a previous one to copy its photo, purchase price and category (the photo is copied, not shared)
- **Order builder** (tab **Novo Pedido**) — a draft you fill over time (each shirt with photo, name, size and **quantity** — they're all football shirts, so there's no category to pick); "Criar pedido" then creates the real order (quantity N → **N separate items**), downloads a **catalog image** (grid of photos + name/size/qty) and opens the **supplier's WhatsApp** with the text ready
- **Patches per shirt** (optional) — some shirts have exclusive patches, so you can add a patch with a **name** and a **photo** (paste with ⌘/Ctrl+V too). They show small and discreet on the shirt, carry over to each created item, and appear on the catalog image and supplier text
- **Paste a photo** (⌘/Ctrl+V) inside an order — pastes into the selected item, or creates a new item with it (and into a patch when its name field is focused)
- **Order detail page** with items as cards, **large photos** (click to zoom in a lightbox), mark as sold, etc.
- **Bulk select** — pick several items and change the category of all at once
- **Search and filters** — by text, partner, status (in stock / sold) and category
- **Recent sales** — filterable by partner, showing each person's **profit share**
- **Mark as sold** in one click — small modal with price + date (suggests the minimum price and today's date)
- **Stale-stock alert** — items unsold for more than X days (configurable) are highlighted with a badge, and a "Not selling" list on the home page
- **Expenses** (chip, domain, packaging…) in their own tab, coming out of the real profit — monthly ones count for each active month, one-offs count once; each can be solo or split with a partner
- **Accounts vault** — stores logins/passwords per platform and per partner; passwords are **encrypted (AES-256)** on the server
- **Export** a backup as **JSON** or **CSV** (one row per item, with the calculated columns — opens straight in Excel/Sheets) and import it back
- **Multiple users**, each with their own login, sharing the same business data
- **PWA** — installable on the phone without any app store

## Running it

You need Node.js 22 or newer (the app uses the native `node:sqlite` module).

```bash
npm install
npm run dev
# open http://localhost:3000
```

The first time, create your account on the login screen. From there your partner can create their own account and you both work on the same data.

For production:

```bash
npm run build
npm start
```

### Accessing from the phone (local network)

To use the app on your phone without a domain or HTTPS, on the same Wi-Fi:

1. Copy `.env.example` to `.env.local` and set `COOKIE_INSEGURO=1` (without this, in production the browser rejects the session cookie over HTTP and login won't work).
2. Start the server listening on the whole network:
   ```bash
   npm run build
   npx next start -H 0.0.0.0
   ```
3. Find the computer's IP (e.g. `ipconfig getifaddr en0` on a Mac) and on the phone open `http://<computer-ip>:3000`.

On the phone you can also use "Add to Home Screen" to install it as an app (PWA).

> When you move to a domain with HTTPS, set `COOKIE_INSEGURO=0` again — it's safer.

### Desktop launcher (macOS)

There are two helper apps on the Desktop: **ReSell** and **Parar ReSell**.

- **ReSell** rebuilds the app, **restarts** the server (`pkill` any old `next start`, then `next start`
  again) and opens `http://localhost:3000`. Restarting every time is deliberate: it guarantees the
  running server is always the current build, so you never end up looking at a stale version.
- **Parar ReSell** stops the server.

After changing the code, just click **ReSell** — it rebuilds and serves the new version. The service
worker is versioned (`resell-v3`), so installed PWAs pick up the new version automatically; it caches
only static assets and never caches pages (a page navigation always hits the network).

## Where the data lives

Everything inside the `data/` folder (created on first run, outside git):

- `data/resell.db` — the SQLite database (orders, items, partners, expenses, accounts)
- `data/uploads/` — the item photos
- `data/.chave` — the key that encrypts the account passwords (**don't lose it or share it**)

Copy the `data/` folder for a full backup. The **Export JSON** button saves the business data (orders, items, partners, expenses), but **not** the account passwords — those only with a copy of the DB + key.

## Stack

- **Next.js** (App Router) — pages, API and server rendering
- **SQLite** via `node:sqlite` — no native dependencies to compile; ships with Node
- **bcryptjs** — login passwords hashed; **AES-256-GCM** (`node:crypto`) for the account passwords
- No UI or charting libraries: the theme (dark premium, emerald accent) is hand-written CSS and the charts are CSS bars inside the component

## Pages

The app is organized by tabs at the top, each on its own page:

- **Home** (`/`) — overview: colored summary cards, "this month", monthly profit chart and a "not selling" list.
- **Orders** (`/pedidos`) — filter/search (text, partner, status, category) and a compact list. Click an order → **detail** (`/pedidos/[id]`) with items as cards, **large photos** (paste or upload, click to zoom), mark as sold and bulk category.
- **Novo Pedido** (`/novo-pedido`) — order builder: a persistent draft of shirts (photo, name, size, quantity, and optional patches with name + photo). "Criar pedido" creates the order (quantity → N items), downloads a catalog image and opens the supplier's WhatsApp with the text.
- **Profit** (`/lucro`) — profit per partner, monthly chart (profit / received vs invested), profit per category, and recent sales (filterable by partner, showing each person's share).
- **Expenses** (`/despesas`) — recurring or one-off expenses, solo or split with a partner.
- **Accounts** (`/contas`) — logins and passwords per platform/partner (encrypted; loaded only on this page).
- **Settings** (`/definicoes`) — minimum margin, day alert, export/import backup and sign out.

## Structure

```
resell-tracker/
├── app/
│   ├── layout.jsx            root (html, fonts, PWA)
│   ├── login/                sign in / create account screen
│   ├── (app)/                authenticated pages (share the AppShell)
│   │   ├── layout.jsx        guards the session + hands the state to AppShell
│   │   ├── page.jsx          Home
│   │   ├── pedidos/          list + [id] (detail)
│   │   ├── lucro/  despesas/  contas/  definicoes/
│   ├── api/                  endpoints (state, orders, items, expenses, config, export…)
│   ├── components/           AppShell (state), TopNav, pages and UI blocks
│   └── globals.css           dark premium theme + emerald accent
├── lib/
│   ├── db.js                 SQLite connection + migrations
│   ├── repo.js               reads/writes (snake_case ↔ camelCase)
│   ├── calculos.js           real cost, margin, days, summaries, profit per partner, monthly data
│   ├── auth.js               sessions and login passwords
│   ├── cripto.js             encryption of account passwords (AES-256)
│   ├── fotos.js              store/serve the item photos
│   └── cores.js              stable color per category
├── middleware.js             protects routes (no session → /login)
├── public/                   manifest, service worker and icon (PWA)
└── data/                     database, photos and key (generated locally)
```

The business state lives in a single place on the client (`app/components/AppShell.jsx`, provided via
context), kept alive while navigating between tabs — with optimistic editing and *polling* sync.

## Notes

- Each expense has a **date**: **one-off** expenses count once, in their month; **monthly** expenses count for each month from their date up to the current month.
- A partner only bears their **half** of expenses marked as split with them; solo expenses are fully yours.
- Sync between devices is by *polling*: the app reloads the state every so often and whenever you save, so what your partner enters shows up to you shortly after.

## Ideas for the future

- Sales platform per item (Vinted, OLX…) with their own fees
- Monthly goals with a progress bar
- Real-time sync (websockets) instead of polling

## License

MIT — use, modify and share freely.
