import { NextResponse } from "next/server";
import { getStockPrices } from "@/lib/providers/yahoo/client";
import type { Quote } from "@/lib/types";

const STOCK_NAMES: Record<string, { name: string; exchange: string }> = {
  AAPL: { name: "Apple Inc.", exchange: "NASDAQ" },
  MSFT: { name: "Microsoft Corp.", exchange: "NASDAQ" },
  GOOGL: { name: "Alphabet Inc.", exchange: "NASDAQ" },
  AMZN: { name: "Amazon.com Inc.", exchange: "NASDAQ" },
  NVDA: { name: "NVIDIA Corp.", exchange: "NASDAQ" },
  META: { name: "Meta Platforms", exchange: "NASDAQ" },
  TSLA: { name: "Tesla Inc.", exchange: "NASDAQ" },
  NFLX: { name: "Netflix Inc.", exchange: "NASDAQ" },
  AMD: { name: "Advanced Micro Devices", exchange: "NASDAQ" },
  INTC: { name: "Intel Corp.", exchange: "NASDAQ" },
  JPM: { name: "JPMorgan Chase", exchange: "NYSE" },
  V: { name: "Visa Inc.", exchange: "NYSE" },
  JNJ: { name: "Johnson & Johnson", exchange: "NYSE" },
  WMT: { name: "Walmart Inc.", exchange: "NYSE" },
  UNH: { name: "UnitedHealth Group", exchange: "NYSE" },
  XOM: { name: "Exxon Mobil", exchange: "NYSE" },
  "BRK.B": { name: "Berkshire Hathaway", exchange: "NYSE" },
  PG: { name: "Procter & Gamble", exchange: "NYSE" },
  MA: { name: "Mastercard Inc.", exchange: "NYSE" },
  HD: { name: "Home Depot", exchange: "NYSE" },
  DIS: { name: "Walt Disney Co.", exchange: "NYSE" },
  BAC: { name: "Bank of America", exchange: "NYSE" },
  PFE: { name: "Pfizer Inc.", exchange: "NYSE" },
  CRM: { name: "Salesforce Inc.", exchange: "NYSE" },
  COST: { name: "Costco Wholesale", exchange: "NASDAQ" },
  BA: { name: "Boeing Co.", exchange: "NYSE" },
  GS: { name: "Goldman Sachs", exchange: "NYSE" },
  SQ: { name: "Block Inc.", exchange: "NYSE" },
  BABA: { name: "Alibaba Group", exchange: "NYSE" },
  NIO: { name: "NIO Inc.", exchange: "NYSE" },
  RIVN: { name: "Rivian Automotive", exchange: "NASDAQ" },
  COIN: { name: "Coinbase Global", exchange: "NASDAQ" },
  PLTR: { name: "Palantir Technologies", exchange: "NYSE" },
  SNOW: { name: "Snowflake Inc.", exchange: "NYSE" },
  UBER: { name: "Uber Technologies", exchange: "NYSE" },
  ABNB: { name: "Airbnb Inc.", exchange: "NASDAQ" },
  SPOT: { name: "Spotify Technology", exchange: "NYSE" },
  SHOP: { name: "Shopify Inc.", exchange: "TSX" },
  TD: { name: "Toronto-Dominion Bank", exchange: "TSX" },
  RY: { name: "Royal Bank of Canada", exchange: "TSX" },
  BNS: { name: "Bank of Nova Scotia", exchange: "TSX" },
  BMO: { name: "Bank of Montreal", exchange: "TSX" },
  CM: { name: "CIBC", exchange: "TSX" },
  ENB: { name: "Enbridge Inc.", exchange: "TSX" },
  TRP: { name: "TC Energy Corp.", exchange: "TSX" },
  CNR: { name: "Canadian National Railway", exchange: "TSX" },
  CP: { name: "Canadian Pacific Kansas City", exchange: "TSX" },
  SU: { name: "Suncor Energy", exchange: "TSX" },
  CNQ: { name: "Canadian Natural Resources", exchange: "TSX" },
  CVE: { name: "Cenovus Energy", exchange: "TSX" },
  MFC: { name: "Manulife Financial", exchange: "TSX" },
  SLF: { name: "Sun Life Financial", exchange: "TSX" },
  BAM: { name: "Brookfield Asset Management", exchange: "TSX" },
  BN: { name: "Brookfield Corp.", exchange: "TSX" },
  L: { name: "Loblaw Companies", exchange: "TSX" },
  ATD: { name: "Alimentation Couche-Tard", exchange: "TSX" },
  T: { name: "BCE Inc.", exchange: "TSX" },
  RCI: { name: "Rogers Communications", exchange: "TSX" },
  QBR: { name: "Quebecor Inc.", exchange: "TSX" },
  GIB: { name: "CGI Inc.", exchange: "TSX" },
  ITX: { name: "Open Text Corp.", exchange: "TSX" },
  BB: { name: "BlackBerry Ltd.", exchange: "TSX" },
  DOL: { name: "Dollarama Inc.", exchange: "TSX" },
  WSP: { name: "WSP Global Inc.", exchange: "TSX" },
  AEM: { name: "Agnico Eagle Mines", exchange: "TSX" },
  ABX: { name: "Barrick Gold", exchange: "TSX" },
  FM: { name: "First Quantum Minerals", exchange: "TSX" },
  CSU: { name: "Constellation Software", exchange: "TSX" },
  TKO: { name: "Topaz Energy", exchange: "TSX" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)
    : [];

  const priceMap: Record<string, Quote> = {};

  if (symbols.length > 0) {
    try {
      const yahooQuotes = await getStockPrices(symbols);
      for (const q of yahooQuotes) {
        priceMap[q.symbol] = q;
      }
    } catch (err) {
      console.error("Yahoo Finance failed:", err);
    }
  }

  return NextResponse.json({
    data: symbols.map((s) => {
      const quote = priceMap[s];
      return {
        symbol: s,
        companyName: quote?.companyName || STOCK_NAMES[s]?.name || STOCK_NAMES[s.replace(/\.(TO|V|NE)$/, "")]?.name || s,
        exchangeCode: quote?.exchangeCode || STOCK_NAMES[s]?.exchange || STOCK_NAMES[s.replace(/\.(TO|V|NE)$/, "")]?.exchange || "Unknown exchange",
        currency: quote?.currency || null,
        price: quote?.price ?? null,
        change: quote?.change ?? null,
        changePercent: quote?.changePercent ?? null,
        previousClose: quote?.previousClose ?? null,
        open: quote?.open ?? null,
        high: quote?.high ?? null,
        low: quote?.low ?? null,
        volume: quote?.volume ?? null,
        marketCap: quote?.marketCap ?? null,
        pe: quote?.pe ?? null,
        marketTimestamp: quote?.marketTimestamp ?? null,
        retrievedAt: quote?.retrievedAt ?? null,
        dataType: quote?.dataType ?? "unavailable",
        isStale: quote?.isStale ?? true,
        available: Boolean(quote),
      };
    }),
  });
}
