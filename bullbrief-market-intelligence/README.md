# BullBrief Market Intelligence

Personalized daily market briefing and intelligence workspace for financial advisors.

## Features

- **Live market ticker** — S&P 500, NASDAQ, Dow, BTC, 10Y yield, EUR/USD via Yahoo Finance
- **Watchlist with live quotes** — auto-refreshes every 60 seconds, persisted in localStorage
- **News feed** — aggregated from Yahoo Finance, Investing.com, and Cointelegraph RSS
- **AI analysis** — stock bias, news implications, and daily briefings via Gemini (optional)
- **Full UI** — Pulse dashboard, Quick Pulse radar, podcast hub, Pro pricing, account/billing

## Prerequisites

- Node.js 18+
- Optional: [Gemini API key](https://aistudio.google.com/apikey) for AI features

## Quick Start

```bash
cd bullbrief-market-intelligence
npm install
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY (optional but recommended)
npm run dev
```

Open **http://localhost:3000**

The dev command starts both:
- **API server** on port 3001 (`/api/*`)
- **Vite frontend** on port 3000 (proxies API requests)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Enables live AI stock analysis, news implications, and daily briefings |
| `PORT` | No | API server port (default: 3001) |

Without `GEMINI_API_KEY`, the app still runs with rule-based fallbacks for AI features.

## Production

```bash
npm run build
npm start
```

Serves the built frontend and API from a single server on port 3001 (or `PORT`).

## Project Structure

```
bullbrief-market-intelligence/
├── server/           # Express API (market data, news, AI)
├── src/
│   ├── components/   # React UI components
│   ├── hooks/        # Live data hooks
│   └── services/     # API client & localStorage
└── index.html
```

## Demo Login

Use the **Demo Sandbox Fast Login** buttons on the sign-in page to explore as Elena Vance (Basic or Pro tier).
