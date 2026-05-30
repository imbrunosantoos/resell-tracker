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
- Items with free-text category, **photo** (any format) and **notes**
- **Order detail page** with items as cards, **large photos** (click to zoom in a lightbox), mark as sold, etc.
- **Bulk select** — pick several items and change the category of all at once
- **Search and filters** — by text, partner, status (in stock / sold) and category
- **Mark as sold** in one click — small modal with price + date (suggests the minimum price and today's date)
- **Stale-stock alert** — items unsold for more than X days (configurable) are highlighted with a badge, and a "Not selling" list on the home page
- **Expenses** (chip, domain, packaging…) that come out of the real profit — monthly ones count for each active month, one-offs count once; each can be solo or split with a partner
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

- **Home** (`/`) — overview: summary cards, "this month", monthly profit chart and a "not selling" list.
- **Orders** (`/pedidos`) — create an order, filter/search and a compact list. Click an order → **detail** (`/pedidos/[id]`) with items as cards, **large photos** (click to zoom), mark as sold, etc.
- **Profit** (`/lucro`) — monthly chart (profit / received vs invested), profit per partner, profit per category and recent sales.
- **Accounts** (`/contas`) — logins and passwords per platform/partner (encrypted).
- **Settings** (`/definicoes`) — minimum margin, day alert, expenses, export/import backup and sign out.

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
│   │   ├── lucro/  contas/  definicoes/
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

- **Monthly expenses** are counted for each month the operation has been active (since the earliest date); **one-offs** count once.
- A partner only bears their **half** of expenses marked as split with them; solo expenses are fully yours.
- Sync between devices is by *polling*: the app reloads the state every so often and whenever you save, so what your partner enters shows up to you shortly after.

## Ideas for the future

- Sales platform per item (Vinted, OLX…) with their own fees
- Monthly goals with a progress bar
- Real-time sync (websockets) instead of polling

## License

MIT — use, modify and share freely.
