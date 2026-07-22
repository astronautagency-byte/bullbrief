import { NextResponse } from "next/server";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/watchlist-store";
import { getLatestPrices } from "@/lib/providers/marketstack/client";
import { getStockPrices } from "@/lib/providers/yahoo/client";

const STOCK_NAMES: Record<string, { name: string; exchange: string }> = {
  AAPL: { name: "Apple Inc.", exchange: "NASDAQ" },
  MSFT: { name: "Microsoft Corp.", exchange: "NASDAQ" },
  GOOGL: { name: "Alphabet Inc.", exchange: "NASDAQ" },
  AMZN: { name: "Amazon.com Inc.", exchange: "NASDAQ" },
  NVDA: { name: "NVIDIA Corp.", exchange: "NASDAQ" },
  META: { name: "Meta Platforms", exchange: "NASDAQ" },
  TSLA: { name: "Tesla Inc.", exchange: "NASDAQ" },
  "BRK.B": { name: "Berkshire Hathaway", exchange: "NYSE" },
  UNH: { name: "UnitedHealth Group", exchange: "NYSE" },
  JNJ: { name: "Johnson & Johnson", exchange: "NYSE" },
  V: { name: "Visa Inc.", exchange: "NYSE" },
  JPM: { name: "JPMorgan Chase", exchange: "NYSE" },
  WMT: { name: "Walmart Inc.", exchange: "NYSE" },
  PG: { name: "Procter & Gamble", exchange: "NYSE" },
  MA: { name: "Mastercard Inc.", exchange: "NYSE" },
  HD: { name: "Home Depot", exchange: "NYSE" },
  DIS: { name: "Walt Disney Co.", exchange: "NYSE" },
  BAC: { name: "Bank of America", exchange: "NYSE" },
  XOM: { name: "Exxon Mobil", exchange: "NYSE" },
  PFE: { name: "Pfizer Inc.", exchange: "NYSE" },
  NFLX: { name: "Netflix Inc.", exchange: "NASDAQ" },
  INTC: { name: "Intel Corp.", exchange: "NASDAQ" },
  AMD: { name: "Advanced Micro Devices", exchange: "NASDAQ" },
  CRM: { name: "Salesforce Inc.", exchange: "NYSE" },
  COST: { name: "Costco Wholesale", exchange: "NASDAQ" },
  BA: { name: "Boeing Co.", exchange: "NYSE" },
  GS: { name: "Goldman Sachs", exchange: "NYSE" },
  SQ: { name: "Block Inc.", exchange: "NYSE" },
  SHOP: { name: "Shopify Inc.", exchange: "TSX" },
  BABA: { name: "Alibaba Group", exchange: "NYSE" },
  NIO: { name: "NIO Inc.", exchange: "NYSE" },
  RIVN: { name: "Rivian Automotive", exchange: "NASDAQ" },
  COIN: { name: "Coinbase Global", exchange: "NASDAQ" },
  PLTR: { name: "Palantir Technologies", exchange: "NYSE" },
  SNOW: { name: "Snowflake Inc.", exchange: "NYSE" },
  UBER: { name: "Uber Technologies", exchange: "NYSE" },
  ABNB: { name: "Airbnb Inc.", exchange: "NASDAQ" },
  SPOT: { name: "Spotify Technology", exchange: "NYSE" },
};

export async function GET() {
  const symbols = getWatchlist();

  let priceMap: Record<string, { price: number; change: number; changePercent: number }> = {};

  if (symbols.length > 0) {
    try {
      const quotes = await getLatestPrices(symbols);
      for (const q of quotes) {
        priceMap[q.symbol] = {
          price: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
        };
      }
    } catch (err) {
      console.error("Marketstack failed, trying Yahoo Finance:", err);
    }

    if (Object.keys(priceMap).length === 0) {
      try {
        const yahooQuotes = await getStockPrices(symbols);
        for (const q of yahooQuotes) {
          priceMap[q.symbol] = {
            price: q.price ?? 0,
            change: q.change ?? 0,
            changePercent: q.changePercent ?? 0,
          };
        }
      } catch (err) {
        console.error("Yahoo Finance also failed:", err);
      }
    }
  }

  return NextResponse.json({
    data: symbols.map((s) => ({
      symbol: s,
      companyName: STOCK_NAMES[s]?.name ?? s,
      exchangeCode: STOCK_NAMES[s]?.exchange ?? "NASDAQ",
      price: priceMap[s]?.price ?? 0,
      change: priceMap[s]?.change ?? 0,
      changePercent: priceMap[s]?.changePercent ?? 0,
    })),
  });
}

export async function POST(request: Request) {
  const { symbol } = await request.json();
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const added = addToWatchlist(symbol.toUpperCase());
  return NextResponse.json({ added, symbol: symbol.toUpperCase() });
}

export async function DELETE(request: Request) {
  const { symbol } = await request.json();
  if (!symbol || typeof symbol !== "string") {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const removed = removeFromWatchlist(symbol.toUpperCase());
  return NextResponse.json({ removed, symbol: symbol.toUpperCase() });
}
