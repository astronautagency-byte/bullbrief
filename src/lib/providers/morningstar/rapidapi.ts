const HOST = "morningstar13.p.rapidapi.com";
const BASE = `https://${HOST}`;
const KEY = process.env.RAPIDAPI_MORNINGSTAR_KEY || "";

function headers() {
  return {
    "x-rapidapi-host": HOST,
    "x-rapidapi-key": KEY,
  };
}

export interface AutoCompleteResult {
  performanceId: string;
  ticker: string;
  name: string;
  exchange: string;
  securityType: string;
}

export interface StockDetails {
  symbol: string;
  pe: number | null;
  pegRatio: number | null;
  starRating: number | null;
  starOutOf: number;
  name: string | null;
  marketCap: number | null;
  dividendYield: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  totalReturn1Y: number | null;
  totalReturn3Y: number | null;
  totalReturn5Y: number | null;
  morningstarRating3Y: number | null;
  morningstarRating5Y: number | null;
  morningstarRating10Y: number | null;
  processRating: string | null;
  peopleRating: string | null;
  parentRating: string | null;
  esgRiskRating: string | null;
}

const EXCHANGE_MAP: Record<string, string> = {
  NASDAQ: "XNAS",
  NYSE: "XNYSE",
  TSX: "XTSE",
  TSXV: "XTSX",
  AMEX: "XASE",
  ARCA: "XARC",
  BATS: "XCBO",
};

function normalizeExchange(exchange?: string | null): string {
  if (!exchange) return "XNAS";
  const upper = exchange.toUpperCase();
  if (EXCHANGE_MAP[upper]) return EXCHANGE_MAP[upper];
  if (upper.startsWith("X")) return upper;
  return `X${upper}`;
}

const searchCache = new Map<string, AutoCompleteResult>();
const detailsCache = new Map<string, StockDetails>();

export async function autoComplete(query: string): Promise<AutoCompleteResult[]> {
  if (!KEY) return [];
  const q = query.trim().toUpperCase();
  if (searchCache.has(q)) return [searchCache.get(q)!];

  try {
    const res = await fetch(`${BASE}/auto-complete?q=${encodeURIComponent(q)}`, {
      headers: headers(),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const results: AutoCompleteResult[] = (json.results || [])
      .filter((r: any) => r.securityType === "ST" || r.securityType === "FE")
      .map((r: any) => ({
        performanceId: r.performanceId,
        ticker: r.ticker,
        name: r.name,
        exchange: r.exchange,
        securityType: r.securityType,
      }));
    if (results.length > 0) searchCache.set(q, results[0]);
    return results;
  } catch {
    return [];
  }
}

export async function getStockDetails(
  ticker: string,
  exchange?: string
): Promise<StockDetails> {
  if (!KEY) return { symbol: ticker, pe: null, pegRatio: null, starRating: null, starOutOf: 5, name: null, marketCap: null, dividendYield: null, priceToBook: null, priceToSales: null, totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null, morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null, processRating: null, peopleRating: null, parentRating: null, esgRiskRating: null };
  const cacheKey = `${ticker}:${exchange || ""}`;
  if (detailsCache.has(cacheKey)) return detailsCache.get(cacheKey)!;

  const ex = normalizeExchange(exchange);

  try {
    const res = await fetch(
      `${BASE}/stock/details?ticker=${encodeURIComponent(ticker)}&exchange=${ex}`,
      { headers: headers(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return { symbol: ticker, pe: null, pegRatio: null, starRating: null, starOutOf: 5, name: null, marketCap: null, dividendYield: null, priceToBook: null, priceToSales: null, totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null, morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null, processRating: null, peopleRating: null, parentRating: null, esgRiskRating: null };
    const json = await res.json();
    const comps = json.components || {};

    let pe: number | null = null;
    let pegRatio: number | null = null;
    let starRating: number | null = null;
    let name: string | null = null;
    let marketCap: number | null = null;
    let dividendYield: number | null = null;
    let priceToBook: number | null = null;
    let priceToSales: number | null = null;

    // P/E from keyStatistics
    const ks = comps.keyStatistics?.payload?.dataPoints;
    if (ks) {
      const peEntry = ks["priceToEarnings[normalized]"] || ks["priceToEarnings[trailing]"];
      if (peEntry?.value != null) pe = peEntry.value;

      const pegEntry = ks["priceToEarningsGrowth[trailing]"];
      if (pegEntry?.value != null) pegRatio = pegEntry.value;

      const mcEntry = ks["marketCapitalization"];
      if (mcEntry?.value != null) marketCap = mcEntry.value;

      const divEntry = ks["dividendYieldFactored"];
      if (divEntry?.value != null) dividendYield = divEntry.value;

      const pbEntry = ks["priceToBook"];
      if (pbEntry?.value != null) priceToBook = pbEntry.value;

      const psEntry = ks["priceToSales"];
      if (psEntry?.value != null) priceToSales = psEntry.value;
    }

    // P/E fallback from valuationVsBenchmarks
    if (pe === null) {
      const vvb = comps.valuationVsBenchmarks?.payload?.dataPoints;
      if (Array.isArray(vvb)) {
        for (const dp of vvb) {
          const vals = dp.values || {};
          const peVal = vals["priceToEarnings[normalized]"] || vals["priceToEarnings[trailing]"];
          if (peVal?.value != null) { pe = peVal.value; break; }
        }
      }
    }

    // Star rating from priceToFairValueSummary
    const pfv = comps.priceToFairValueSummary?.payload?.capsule?.stockStarRating;
    if (pfv) {
      const rawVal = pfv.value;
      if (rawVal != null && typeof rawVal === "number") {
        starRating = Math.round(rawVal / 5);
      }
    }

    // Name from profile
    const profile = comps.profile?.payload;
    if (profile?.name) name = profile.name;

    // Extract additional ratings from sustainability/process data if available
    const processRating: string | null = null;
    const peopleRating: string | null = null;
    const parentRating: string | null = null;
    let esgRiskRating: string | null = null;

    const sustainability = comps.sustainability?.payload;
    if (sustainability) {
      const esgScore = sustainability.morningstarSustainabilityScore;
      if (esgScore?.value != null) {
        const val = esgScore.value;
        if (val <= 10) esgRiskRating = "Low";
        else if (val <= 20) esgRiskRating = "Medium";
        else if (val <= 30) esgRiskRating = "High";
        else esgRiskRating = "Severe";
      }
    }

    const result: StockDetails = {
      symbol: ticker, pe, pegRatio, starRating, starOutOf: 5, name,
      marketCap, dividendYield, priceToBook, priceToSales,
      totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null,
      morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null,
      processRating, peopleRating, parentRating, esgRiskRating,
    };
    detailsCache.set(cacheKey, result);
    return result;
  } catch {
    return { symbol: ticker, pe: null, pegRatio: null, starRating: null, starOutOf: 5, name: null, marketCap: null, dividendYield: null, priceToBook: null, priceToSales: null, totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null, morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null, processRating: null, peopleRating: null, parentRating: null, esgRiskRating: null };
  }
}

export async function getMultipleStockDetails(
  symbols: Array<{ ticker: string; exchange?: string }>
): Promise<Map<string, StockDetails>> {
  const results = await Promise.allSettled(
    symbols.map((s) => getStockDetails(s.ticker, s.exchange))
  );
  const map = new Map<string, StockDetails>();
  for (const r of results) {
    if (r.status === "fulfilled") {
      map.set(r.value.symbol, r.value);
    }
  }
  return map;
}
