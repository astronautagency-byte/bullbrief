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
  priceToCashFlow: number | null;
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
  sector: string | null;
  industry: string | null;
  fairValue: number | null;
  economicMoat: string | null;
}

const EMPTY_RESULT = (ticker: string): StockDetails => ({
  symbol: ticker, pe: null, pegRatio: null, starRating: null, starOutOf: 5, name: null,
  marketCap: null, dividendYield: null, priceToBook: null, priceToSales: null, priceToCashFlow: null,
  totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null,
  morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null,
  processRating: null, peopleRating: null, parentRating: null, esgRiskRating: null,
  sector: null, industry: null, fairValue: null, economicMoat: null,
});

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
  if (!KEY) return EMPTY_RESULT(ticker);
  const cacheKey = `${ticker}:${exchange || ""}`;
  if (detailsCache.has(cacheKey)) return detailsCache.get(cacheKey)!;

  const ex = normalizeExchange(exchange);

  try {
    const res = await fetch(
      `${BASE}/stock/details?ticker=${encodeURIComponent(ticker)}&exchange=${ex}`,
      { headers: headers(), next: { revalidate: 3600 } }
    );
    if (!res.ok) return EMPTY_RESULT(ticker);
    const json = await res.json();
    const comps = json.components || {};

    let pe: number | null = null;
    let priceToSales: number | null = null;
    let dividendYield: number | null = null;
    let starRating: number | null = null;
    let name: string | null = null;
    let priceToBook: number | null = null;
    let priceToCashFlow: number | null = null;
    let sector: string | null = null;
    let industry: string | null = null;
    let fairValue: number | null = null;
    let economicMoat: string | null = null;

    // === keyStatistics: P/E, P/S, Dividend Yield ===
    const ks = comps.keyStatistics?.payload?.dataPoints;
    if (ks) {
      const peEntry = ks["priceToEarnings[normalized]"] || ks["priceToEarnings[trailing]"];
      if (peEntry?.value != null) pe = peEntry.value;

      const psEntry = ks["priceToSales"];
      if (psEntry?.value != null) priceToSales = psEntry.value;

      // Dividend yield: try trailing, then forward
      const divEntry = ks["dividendYield[trailing]"] || ks["dividendYield[forward]"];
      if (divEntry?.value != null) dividendYield = divEntry.value;
    }

    // === valuationVsBenchmarks: P/E fallback, P/B, P/S fallback, P/CF ===
    const vvb = comps.valuationVsBenchmarks?.payload?.dataPoints;
    if (Array.isArray(vvb) && vvb.length > 0) {
      const vals = vvb[0].values || {};

      if (pe === null) {
        const peVal = vals["priceToEarnings[normalized]"] || vals["priceToEarnings[trailing]"];
        if (peVal?.value != null) pe = peVal.value;
      }

      if (priceToSales === null) {
        const psVal = vals["priceToSales"];
        if (psVal?.value != null) priceToSales = psVal.value;
      }

      const pbVal = vals["priceToBook"];
      if (pbVal?.value != null) priceToBook = pbVal.value;

      const pcfVal = vals["priceToCashFlow"];
      if (pcfVal?.value != null) priceToCashFlow = pcfVal.value;
    }

    // === priceToFairValueSummary: Star rating (0-100 scale, divide by 20 for 1-5) ===
    const pfv = comps.priceToFairValueSummary?.payload?.capsule?.stockStarRating;
    if (pfv?.value != null && typeof pfv.value === "number") {
      starRating = Math.round(pfv.value / 20);
      if (starRating < 1) starRating = 1;
      if (starRating > 5) starRating = 5;
    }

    // === profile: Name, Sector, Industry ===
    const profileDP = comps.profile?.payload?.dataPoints;
    if (profileDP) {
      if (profileDP.sector?.value) sector = profileDP.sector.value;
      if (profileDP.industry?.value) industry = profileDP.industry.value;
    }
    const profileName = comps.profile?.payload?.companyProfile;
    // Name comes from profile or from the top-level page data
    name = comps.profile?.payload?.name || null;

    // === companyReport: Fair value, Economic moat ===
    const crDP = comps.companyReport?.payload?.dataPoints;
    if (crDP) {
      const fvEntry = crDP.fairValue;
      if (fvEntry?.value != null) fairValue = fvEntry.value;

      const moatEntry = crDP.economicMoat;
      if (moatEntry?.value != null) economicMoat = moatEntry.value;
    }

    // === Fields NOT available in this API ===
    const pegRatio = null;       // Not in keyStatistics
    const marketCap = null;      // Not in keyStatistics
    const processRating = null;  // Not in this API
    const peopleRating = null;   // Not in this API
    const parentRating = null;   // Not in this API
    let esgRiskRating = null;    // Not in this API (no sustainability component)

    const result: StockDetails = {
      symbol: ticker, pe, pegRatio, starRating, starOutOf: 5, name,
      marketCap, dividendYield, priceToBook, priceToSales, priceToCashFlow,
      totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null,
      morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null,
      processRating, peopleRating, parentRating, esgRiskRating,
      sector, industry, fairValue, economicMoat,
    };
    detailsCache.set(cacheKey, result);
    return result;
  } catch {
    return EMPTY_RESULT(ticker);
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
