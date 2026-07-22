import type { Quote } from "@/lib/types";

export async function getStockPrice(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        next: { revalidate: 300 },
      }
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
