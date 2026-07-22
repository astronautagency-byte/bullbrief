import type { Quote } from "@/lib/types";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

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

export async function getStockPrice(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
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
      symbol: meta.symbol ?? symbol,
      companyName: meta.shortName ?? meta.symbol ?? symbol,
      exchangeCode: meta.exchangeName ?? "",
      currency: meta.currency ?? "USD",
      price,
      open: meta.regularMarketOpen ?? null,
      high: meta.regularMarketDayHigh ?? null,
      low: meta.regularMarketDayLow ?? null,
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? null,
      marketTimestamp: new Date(meta.regularMarketTime * 1000).toISOString(),
      retrievedAt: new Date().toISOString(),
      dataType: "real_time",
      isStale: false,
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
  range: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" = "1mo"
): Promise<ChartData | null> {
  const intervalMap: Record<string, string> = {
    "1d": "5m",
    "5d": "15m",
    "1mo": "1d",
    "3mo": "1d",
    "6mo": "1d",
    "1y": "1wk",
  };

  try {
    const res = await fetch(
      `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=${intervalMap[range]}&range=${range}`,
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
