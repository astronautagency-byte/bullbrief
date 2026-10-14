import type { Quote } from "@/lib/types";

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SEARCH_BASE = "https://query2.finance.yahoo.com/v1/finance/search";
const YAHOO_SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";
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

export interface StockAnalysis {
  source: "Yahoo Finance";
  recommendationKey: string | null;
  recommendationMean: number | null;
  analystCount: number | null;
  targetLow: number | null;
  targetMean: number | null;
  targetMedian: number | null;
  targetHigh: number | null;
  earningsGrowth: number | null;
  revenueGrowth: number | null;
  recommendationTrend: Array<{
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }>;
  earningsHistory: Array<{
    quarter: string;
    actual: number | null;
    estimate: number | null;
    surprisePercent: number | null;
  }>;
  profile: {
    description: string | null;
    website: string | null;
    employees: number | null;
    city: string | null;
    country: string | null;
  };
  technical: {
    provider: string | null;
    shortTerm: string | null;
    intermediateTerm: string | null;
    longTerm: string | null;
    support: number | null;
    resistance: number | null;
    valuation: string | null;
    valuationDetail: string | null;
  } | null;
  research: {
    provider: string | null;
    title: string | null;
    publishedAt: string | null;
  } | null;
}

export interface StockFinancialPeriod {
  date: string;
  currency: string;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  dilutedEps: number | null;
}

export interface StockFinancialSeries {
  annual: StockFinancialPeriod[];
  quarterly: StockFinancialPeriod[];
}

function rawNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "raw" in value) {
    const raw = (value as { raw?: unknown }).raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  return null;
}

export async function getStockAnalysis(symbol: string): Promise<StockAnalysis | null> {
  const yahooSymbol = toYahooSymbol(symbol);
  const modules = [
    "financialData",
    "recommendationTrend",
    "earningsHistory",
    "earningsTrend",
    "assetProfile",
  ].join(",");

  try {
    const response = await fetch(
      `${YAHOO_SUMMARY_BASE}/${encodeURIComponent(yahooSymbol)}?modules=${modules}`,
      { headers: HEADERS, next: { revalidate: 900 } }
    );
    if (!response.ok) return getStockInsightRecommendation(yahooSymbol);
    const payload = await response.json();
    const result = payload?.quoteSummary?.result?.[0];
    if (!result) return getStockInsightRecommendation(yahooSymbol);
    const financial = result.financialData ?? {};
    const profile = result.assetProfile ?? {};

    return {
      source: "Yahoo Finance",
      recommendationKey: typeof financial.recommendationKey === "string" ? financial.recommendationKey : null,
      recommendationMean: rawNumber(financial.recommendationMean),
      analystCount: rawNumber(financial.numberOfAnalystOpinions),
      targetLow: rawNumber(financial.targetLowPrice),
      targetMean: rawNumber(financial.targetMeanPrice),
      targetMedian: rawNumber(financial.targetMedianPrice),
      targetHigh: rawNumber(financial.targetHighPrice),
      earningsGrowth: rawNumber(financial.earningsGrowth),
      revenueGrowth: rawNumber(financial.revenueGrowth),
      recommendationTrend: (result.recommendationTrend?.trend ?? []).slice(0, 4).map((item: Record<string, unknown>) => ({
        period: typeof item.period === "string" ? item.period : "Current",
        strongBuy: rawNumber(item.strongBuy) ?? 0,
        buy: rawNumber(item.buy) ?? 0,
        hold: rawNumber(item.hold) ?? 0,
        sell: rawNumber(item.sell) ?? 0,
        strongSell: rawNumber(item.strongSell) ?? 0,
      })),
      earningsHistory: (result.earningsHistory?.history ?? []).slice(-4).map((item: Record<string, unknown>) => ({
        quarter: typeof (item.quarter as { fmt?: unknown })?.fmt === "string" ? (item.quarter as { fmt: string }).fmt : "Quarter",
        actual: rawNumber(item.epsActual),
        estimate: rawNumber(item.epsEstimate),
        surprisePercent: rawNumber(item.surprisePercent),
      })),
      profile: {
        description: typeof profile.longBusinessSummary === "string" ? profile.longBusinessSummary : null,
        website: typeof profile.website === "string" ? profile.website : null,
        employees: rawNumber(profile.fullTimeEmployees),
        city: typeof profile.city === "string" ? profile.city : null,
        country: typeof profile.country === "string" ? profile.country : null,
      },
      technical: null,
      research: null,
    };
  } catch {
    return getStockInsightRecommendation(yahooSymbol);
  }
}

async function getStockInsightRecommendation(yahooSymbol: string): Promise<StockAnalysis | null> {
  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/ws/insights/v2/finance/insights?symbol=${encodeURIComponent(yahooSymbol)}`,
      { headers: HEADERS, next: { revalidate: 900 } }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const result = payload?.finance?.result;
    const recommendation = result?.recommendation;
    if (!recommendation?.rating && typeof recommendation?.targetPrice !== "number") return null;
    const report = result?.upsellSearchDD?.researchReports;
    return {
      source: typeof recommendation.provider === "string" ? recommendation.provider : "Third-party research",
      recommendationKey: typeof recommendation.rating === "string" ? recommendation.rating.toLowerCase() : null,
      recommendationMean: null,
      analystCount: null,
      targetLow: null,
      targetMean: rawNumber(recommendation.targetPrice),
      targetMedian: null,
      targetHigh: null,
      earningsGrowth: null,
      revenueGrowth: null,
      recommendationTrend: [],
      earningsHistory: [],
      profile: {
        description: typeof report?.summary === "string" ? report.summary : null,
        website: null,
        employees: null,
        city: null,
        country: null,
      },
      technical: {
        provider: typeof result?.instrumentInfo?.technicalEvents?.provider === "string" ? result.instrumentInfo.technicalEvents.provider : null,
        shortTerm: typeof result?.instrumentInfo?.technicalEvents?.shortTermOutlook?.direction === "string" ? result.instrumentInfo.technicalEvents.shortTermOutlook.direction : null,
        intermediateTerm: typeof result?.instrumentInfo?.technicalEvents?.intermediateTermOutlook?.direction === "string" ? result.instrumentInfo.technicalEvents.intermediateTermOutlook.direction : null,
        longTerm: typeof result?.instrumentInfo?.technicalEvents?.longTermOutlook?.direction === "string" ? result.instrumentInfo.technicalEvents.longTermOutlook.direction : null,
        support: rawNumber(result?.instrumentInfo?.keyTechnicals?.support),
        resistance: rawNumber(result?.instrumentInfo?.keyTechnicals?.resistance),
        valuation: typeof result?.instrumentInfo?.valuation?.description === "string" ? result.instrumentInfo.valuation.description : null,
        valuationDetail: typeof result?.instrumentInfo?.valuation?.relativeValue === "string" ? result.instrumentInfo.valuation.relativeValue : null,
      },
      research: {
        provider: typeof recommendation.provider === "string" ? recommendation.provider : null,
        title: typeof report?.title === "string" ? report.title : null,
        publishedAt: typeof report?.reportDate === "string" ? report.reportDate : null,
      },
    };
  } catch {
    return null;
  }
}

export async function getStockFinancialSeries(symbol: string): Promise<StockFinancialSeries | null> {
  const yahooSymbol = toYahooSymbol(symbol);
  const now = Math.floor(Date.now() / 1000);
  const start = now - 6 * 365 * 24 * 60 * 60;
  const types = [
    "annualTotalRevenue", "annualOperatingIncome", "annualNetIncome", "annualDilutedEPS",
    "quarterlyTotalRevenue", "quarterlyOperatingIncome", "quarterlyNetIncome", "quarterlyDilutedEPS",
  ];
  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(yahooSymbol)}?symbol=${encodeURIComponent(yahooSymbol)}&type=${types.join(",")}&period1=${start}&period2=${now}`,
      { headers: HEADERS, next: { revalidate: 3600 } }
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const series = payload?.timeseries?.result ?? [];
    const byType = new Map<string, Array<Record<string, unknown>>>();
    for (const item of series) {
      const type = item?.meta?.type?.[0];
      if (typeof type === "string" && Array.isArray(item[type])) byType.set(type, item[type]);
    }
    const assemble = (prefix: "annual" | "quarterly") => {
      const revenue = byType.get(`${prefix}TotalRevenue`) ?? [];
      return revenue.slice(-5).map((item) => {
        const date = typeof item.asOfDate === "string" ? item.asOfDate : "";
        const find = (name: string) => byType.get(`${prefix}${name}`)?.find((entry) => entry.asOfDate === date);
        return {
          date,
          currency: typeof item.currencyCode === "string" ? item.currencyCode : "USD",
          revenue: rawNumber(item.reportedValue),
          operatingIncome: rawNumber(find("OperatingIncome")?.reportedValue),
          netIncome: rawNumber(find("NetIncome")?.reportedValue),
          dilutedEps: rawNumber(find("DilutedEPS")?.reportedValue),
        };
      });
    };
    return { annual: assemble("annual"), quarterly: assemble("quarterly") };
  } catch {
    return null;
  }
}

export async function getStockPrice(
  symbol: string,
  exactSymbol = false,
  fresh = false
): Promise<Quote | null> {
  const yahooSymbol = exactSymbol ? symbol.toUpperCase() : toYahooSymbol(symbol);
  try {
    const res = await fetch(`${YAHOO_BASE}/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`, fresh
      ? { headers: HEADERS, cache: "no-store" }
      : { headers: HEADERS, next: { revalidate: 300 } });

    if (!res.ok) return null;

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const dailyQuote = result.indicators?.quote?.[0];
    const latestIndex = Array.isArray(dailyQuote?.close) ? dailyQuote.close.length - 1 : -1;
    const candleValue = (field: "open" | "high" | "low" | "volume") => {
      const value = latestIndex >= 0 ? dailyQuote?.[field]?.[latestIndex] : null;
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    };
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
      open: meta.regularMarketOpen ?? candleValue("open"),
      high: meta.regularMarketDayHigh ?? candleValue("high"),
      low: meta.regularMarketDayLow ?? candleValue("low"),
      previousClose,
      change,
      changePercent,
      volume: meta.regularMarketVolume ?? candleValue("volume"),
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
