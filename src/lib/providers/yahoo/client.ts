import type { Quote } from "@/lib/types";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH_BASE = "https://query2.finance.yahoo.com/v1/finance/search";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

// TSX symbols that need .TO suffix for Yahoo Finance
const TSX_SYMBOLS = new Set([
  "TD","RY","BNS","BMO","CM","ENB","TRP","CNR","CP","SU","CNQ","CVE",
  "MFC","SLF","BAM","BN","L","ATD","T","RCI","QBR","GIB","ITX","BB",
  "DOL","WSP","AEM","ABX","FM","CSU","TKO","SHOP",
]);

export function toYahooSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  if (upper.includes(".")) return upper;
  if (TSX_SYMBOLS.has(upper)) return `${upper}.TO`;
  return upper;
}

export interface YahooSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  currency: "CAD" | "USD";
  quoteType: "EQUITY" | "ETF";
}

const CANADIAN_EXCHANGES = new Set(["TOR", "TSX", "VAN", "TSXV", "NEO", "CNQ"]);
const US_EXCHANGES = new Set(["NMS", "NGM", "NCM", "NYQ", "ASE", "PCX", "BTS"]);

export async function searchStocks(query: string): Promise<YahooSearchResult[]> {
  const url = new URL(YAHOO_SEARCH_BASE);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("quotesCount", "25");
  url.searchParams.set("newsCount", "0");
  url.searchParams.set("enableFuzzyQuery", "true");

  const response = await fetch(url, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Yahoo search failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    quotes?: Array<Record<string, unknown>>;
  };
  const results: YahooSearchResult[] = [];
  const seen = new Set<string>();

  for (const quote of payload.quotes ?? []) {
    const symbol = typeof quote.symbol === "string" ? quote.symbol.toUpperCase() : "";
    const exchangeCode = typeof quote.exchange === "string" ? quote.exchange.toUpperCase() : "";
    const quoteType = typeof quote.quoteType === "string" ? quote.quoteType.toUpperCase() : "";
    const isCanadian =
      symbol.endsWith(".TO") ||
      symbol.endsWith(".V") ||
      symbol.endsWith(".NE") ||
      CANADIAN_EXCHANGES.has(exchangeCode);
    const isUs = US_EXCHANGES.has(exchangeCode);

    if (
      !symbol ||
      seen.has(symbol) ||
      (!isCanadian && !isUs) ||
      (quoteType !== "EQUITY" && quoteType !== "ETF")
    ) {
      continue;
    }

    const shortName = typeof quote.shortname === "string" ? quote.shortname : "";
    const longName = typeof quote.longname === "string" ? quote.longname : "";
    const displayExchange =
      typeof quote.exchDisp === "string"
        ? quote.exchDisp
        : isCanadian
          ? "Toronto"
          : exchangeCode;

    seen.add(symbol);
    results.push({
      symbol,
      name: shortName || longName || symbol,
      exchange: displayExchange,
      currency: isCanadian ? "CAD" : "USD",
      quoteType: quoteType as "EQUITY" | "ETF",
    });
  }

  return results.slice(0, 12);
}

export interface HistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  symbol: string;
  points: HistoricalPoint[];
  currency: string;
}

export async function getStockPrice(
  symbol: string,
  exactSymbol = false
): Promise<Quote | null> {
  const yahooSymbol = exactSymbol ? symbol.toUpperCase() : toYahooSymbol(symbol);
  try {
    const res = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`,
      { headers: HEADERS, next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      symbol: symbol.toUpperCase(),
      companyName: meta.shortName ?? meta.symbol ?? symbol,
      exchangeCode: meta.exchangeName ?? "",
      currency: meta.currency ?? "CAD",
      price,
      open: meta.regularMarketOpen ?? null,
      high: meta.regularMarketDayHigh ?? null,
      low: meta.regularMarketDayLow ?? null,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? null,
      averageVolume: meta.averageDailyVolume3Month ?? null,
      pe: meta.trailingPE ?? null,
      marketCap: meta.marketCap ?? null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      bid: meta.bid ?? null,
      ask: meta.ask ?? null,
      marketTimestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
      retrievedAt: new Date().toISOString(),
      // Yahoo's public chart response does not provide a reliable entitlement-aware
      // real-time guarantee, so label it conservatively.
      dataType: "delayed",
      isStale: true,
    };
  } catch {
    return null;
  }
}

export async function getStockPrices(symbols: string[]): Promise<Quote[]> {
  const results = await Promise.allSettled(
    symbols.map((s) => getStockPrice(s))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<Quote> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

export async function getHistoricalData(
  symbol: string,
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max" = "1mo"
): Promise<ChartData | null> {
  const yahooSymbol = toYahooSymbol(symbol);
  const intervalMap: Record<string, string> = {
    "1d": "5m",
    "5d": "15m",
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1d",
    "1y": "1wk",
    "5y": "1mo",
    "max": "3mo",
  };

  try {
    const res = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(yahooSymbol)}?interval=${intervalMap[range]}&range=${range}`,
      { headers: HEADERS, next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0];
    if (!quote) return null;

    const points: HistoricalPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i];

      if (close != null) {
        points.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: open ?? close,
          high: high ?? close,
          low: low ?? close,
          close,
          volume: volume ?? 0,
        });
      }
    }

    return {
      symbol: result.meta?.symbol ?? symbol,
      points,
      currency: result.meta?.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

export async function getIndexQuote(symbol: string): Promise<Quote | null> {
  return getStockPrice(symbol);
}

export async function getMultiQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const quotes = await getStockPrices(symbols);
  const map = new Map<string, Quote>();
  for (const q of quotes) {
    map.set(q.symbol, q);
  }
  return map;
}
