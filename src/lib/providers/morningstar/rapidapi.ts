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

type RawAutoCompleteResult = {
  performanceId?: string;
  ticker?: string;
  name?: string;
  exchange?: string;
  securityType?: string;
};

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
  profileDescription: string | null;
  styleBox: string | null;
  employees: number | null;
  website: string | null;
  performanceId: string | null;
  cusip: string | null;
  isin: string | null;
  analystReportTitle: string | null;
  analystName: string | null;
  reportPublishedAt: string | null;
  reportUpdatedAt: string | null;
  ratingAsOf: string | null;
  evaluatedPrice: number | null;
  fairValueAsOf: string | null;
  fairValueCurrency: string | null;
  fairValueUncertainty: string | null;
  oneStarPrice: number | null;
  twoStarPrice: number | null;
  fourStarPrice: number | null;
  fiveStarPrice: number | null;
  forwardDividendYield: number | null;
  totalYield: number | null;
  dividendMonths: number[];
  returnOnAssets: number | null;
  returnOnEquity: number | null;
  returnOnCapital: number | null;
  quickRatio: number | null;
  currentRatio: number | null;
  interestCoverage: number | null;
  sharesOutstanding: number | null;
  competitors: Array<{ ticker: string; name: string; exchange: string }>;
  availableComponents: string[];
  lockedComponents: string[];
  requestStatus: "live" | "unavailable";
  retrievedAt: string | null;
}

const EMPTY_RESULT = (ticker: string): StockDetails => ({
  symbol: ticker, pe: null, pegRatio: null, starRating: null, starOutOf: 5, name: null,
  marketCap: null, dividendYield: null, priceToBook: null, priceToSales: null, priceToCashFlow: null,
  totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null,
  morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null,
  processRating: null, peopleRating: null, parentRating: null, esgRiskRating: null,
  sector: null, industry: null, fairValue: null, economicMoat: null,
  profileDescription: null, styleBox: null, employees: null, website: null,
  performanceId: null, cusip: null, isin: null, analystReportTitle: null, analystName: null,
  reportPublishedAt: null, reportUpdatedAt: null, ratingAsOf: null, evaluatedPrice: null,
  fairValueAsOf: null, fairValueCurrency: null, fairValueUncertainty: null,
  oneStarPrice: null, twoStarPrice: null, fourStarPrice: null, fiveStarPrice: null,
  forwardDividendYield: null, totalYield: null, dividendMonths: [],
  returnOnAssets: null, returnOnEquity: null, returnOnCapital: null,
  quickRatio: null, currentRatio: null, interestCoverage: null, sharesOutstanding: null,
  competitors: [], availableComponents: [], lockedComponents: [],
  requestStatus: "unavailable", retrievedAt: null,
});

type DataPoint = { value?: unknown; locked?: boolean; displayAs?: string; properties?: Record<string, { value?: unknown }> };

function unlockedValue<T>(point: DataPoint | undefined): T | null {
  if (!point || point.locked || point.displayAs?.includes("LOCK")) return null;
  return point.value == null ? null : point.value as T;
}

function numberValue(point: DataPoint | undefined): number | null {
  const value = unlockedValue<unknown>(point);
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringValue(point: DataPoint | undefined): string | null {
  const value = unlockedValue<unknown>(point);
  return typeof value === "string" && value.trim() ? value : null;
}

function containsLockedData(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== "object" || depth > 6) return false;
  if (Array.isArray(value)) return value.some((item) => containsLockedData(item, depth + 1));
  const record = value as Record<string, unknown>;
  if (record.locked === true || (typeof record.displayAs === "string" && record.displayAs.includes("LOCK"))) return true;
  return Object.values(record).some((item) => containsLockedData(item, depth + 1));
}

const EXCHANGE_MAP: Record<string, string> = {
  NASDAQ: "XNAS",
  NMS: "XNAS",
  NGM: "XNAS",
  NCM: "XNAS",
  NYSE: "XNYS",
  NYQ: "XNYS",
  TSX: "XTSE",
  TORONTO: "XTSE",
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

const searchCache = new Map<string, AutoCompleteResult[]>();

export async function autoComplete(query: string): Promise<AutoCompleteResult[]> {
  if (!KEY) return [];
  const q = query.trim().toUpperCase();
  if (searchCache.has(q)) return searchCache.get(q)!;

  try {
    const res = await fetch(`${BASE}/auto-complete?q=${encodeURIComponent(q)}`, {
      headers: headers(),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: RawAutoCompleteResult[] };
    const results: AutoCompleteResult[] = (json.results || [])
      .filter((result) => result.securityType === "ST" || result.securityType === "FE")
      .map((result) => ({
        performanceId: result.performanceId || "",
        ticker: result.ticker || "",
        name: result.name || result.ticker || "",
        exchange: result.exchange || "",
        securityType: result.securityType || "",
      }));
    if (results.length > 0) searchCache.set(q, results);
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

  const ex = normalizeExchange(exchange);

  try {
    const res = await fetch(
      `${BASE}/stock/details?ticker=${encodeURIComponent(ticker)}&exchange=${ex}`,
      { headers: headers(), cache: "no-store" }
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
      pe = numberValue(peEntry) ?? pe;

      const psEntry = ks["priceToSales"];
      priceToSales = numberValue(psEntry) ?? priceToSales;

      // Dividend yield: try trailing, then forward
      const divEntry = ks["dividendYield[trailing]"] || ks["dividendYield[forward]"];
      dividendYield = numberValue(divEntry) ?? dividendYield;
    }

    // === valuationVsBenchmarks: P/E fallback, P/B, P/S fallback, P/CF ===
    const vvb = comps.valuationVsBenchmarks?.payload?.dataPoints;
    if (Array.isArray(vvb) && vvb.length > 0) {
      const vals = vvb[0].values || {};

      if (pe === null) {
        const peVal = vals["priceToEarnings[normalized]"] || vals["priceToEarnings[trailing]"];
        pe = numberValue(peVal) ?? pe;
      }

      if (priceToSales === null) {
        const psVal = vals["priceToSales"];
        priceToSales = numberValue(psVal) ?? priceToSales;
      }

      const pbVal = vals["priceToBook"];
      priceToBook = numberValue(pbVal);

      const pcfVal = vals["priceToCashFlow"];
      priceToCashFlow = numberValue(pcfVal);
    }

    // === priceToFairValueSummary: Star rating (0-100 scale, divide by 20 for 1-5) ===
    const capsule = comps.priceToFairValueSummary?.payload?.capsule || {};
    const rawStarRating = numberValue(capsule.stockStarRating);
    if (rawStarRating != null && rawStarRating >= 1 && rawStarRating <= 5) starRating = rawStarRating;

    // === profile: Name, Sector, Industry ===
    const profileDP = comps.profile?.payload?.dataPoints;
    if (profileDP) {
      sector = stringValue(profileDP.sector);
      industry = stringValue(profileDP.industry);
    }
    // Name comes from profile or from the top-level page data
    const companyReport = comps.companyReport?.payload;
    const security = companyReport?.security || {};
    name = security.name || null;

    // === companyReport: Fair value, Economic moat ===
    const crDP = comps.companyReport?.payload?.dataPoints;
    if (crDP) {
      fairValue = numberValue(crDP.fairValue) ?? numberValue(capsule.fairValue);
      economicMoat = stringValue(crDP.economicMoat);
    }

    // === Fields NOT available in this API ===
    const pegRatio = null;       // Not in keyStatistics
    const marketCap = null;      // Not in keyStatistics
    const processRating = null;  // Not in this API
    const peopleRating = null;   // Not in this API
    const parentRating = null;   // Not in this API
    const esgRiskRating = null;  // Not in this API (no sustainability component)

    const profile = comps.profile?.payload || {};
    const profitability = comps.profitabilityVsBenchmarks?.payload?.dataPoints?.[0]?.values || {};
    const financialStrength = comps.financialStrengthVsBenchmarks?.payload?.dataPoints?.[0]?.values || {};
    const trading = comps.tradingInformation?.payload?.dataPoints || {};
    const availableComponents = Object.keys(comps);
    const lockedComponents = availableComponents.filter((key) => containsLockedData(comps[key]));
    const dividendMonthsRaw = unlockedValue<unknown>(ks?.dividendPaymentSchedule);
    const competitors = Array.isArray(comps.competitors?.payload?.results)
      ? comps.competitors.payload.results.slice(0, 5).map((item: { ticker?: string; name?: string; exchange?: string }) => ({ ticker: item.ticker || "", name: item.name || item.ticker || "", exchange: item.exchange || "" })).filter((item: { ticker: string }) => item.ticker)
      : [];

    const result: StockDetails = {
      symbol: ticker, pe, pegRatio, starRating, starOutOf: 5, name,
      marketCap, dividendYield, priceToBook, priceToSales, priceToCashFlow,
      totalReturn1Y: null, totalReturn3Y: null, totalReturn5Y: null,
      morningstarRating3Y: null, morningstarRating5Y: null, morningstarRating10Y: null,
      processRating, peopleRating, parentRating, esgRiskRating,
      sector, industry, fairValue, economicMoat,
      profileDescription: typeof profile.companyProfile === "string" ? profile.companyProfile : null,
      styleBox: stringValue(profileDP?.stockStyleBox),
      employees: numberValue(profileDP?.totalEmployees),
      website: stringValue(profileDP?.website),
      performanceId: typeof security.performanceID === "string" ? security.performanceID : null,
      cusip: typeof security.cusip === "string" ? security.cusip : null,
      isin: typeof security.isin === "string" ? security.isin : null,
      analystReportTitle: typeof companyReport?.title === "string" ? companyReport.title : null,
      analystName: typeof companyReport?.authors?.[0]?.name === "string" ? companyReport.authors[0].name : null,
      reportPublishedAt: typeof companyReport?.publishedDate === "string" ? companyReport.publishedDate : null,
      reportUpdatedAt: typeof companyReport?.updatedDate === "string" ? companyReport.updatedDate : null,
      ratingAsOf: typeof capsule.asOfDate?.value === "string" ? capsule.asOfDate.value : null,
      evaluatedPrice: numberValue(capsule.evaluatedPrice),
      fairValueAsOf: typeof capsule.fairValueDate?.value === "string" ? capsule.fairValueDate.value : null,
      fairValueCurrency: stringValue(capsule.currency),
      fairValueUncertainty: stringValue(capsule.fairValueUncertainty),
      oneStarPrice: numberValue(capsule.oneStarPrice),
      twoStarPrice: numberValue(capsule.twoStarPrice),
      fourStarPrice: numberValue(capsule.fourStarPrice),
      fiveStarPrice: numberValue(capsule.fiveStarPrice),
      forwardDividendYield: numberValue(ks?.["dividendYield[forward]"]),
      totalYield: numberValue(ks?.totalYield),
      dividendMonths: Array.isArray(dividendMonthsRaw) ? dividendMonthsRaw.filter((month): month is number => typeof month === "number") : [],
      returnOnAssets: numberValue(profitability["returnOnAssets[normalized]"]),
      returnOnEquity: numberValue(profitability["returnOnEquity[normalized]"]),
      returnOnCapital: numberValue(profitability["returnOnCapital[normalized]"]),
      quickRatio: numberValue(financialStrength.quickRatio),
      currentRatio: numberValue(financialStrength.currentRatio),
      interestCoverage: numberValue(financialStrength.interestCoverage),
      sharesOutstanding: numberValue(trading.totalSharesOutstanding),
      competitors,
      availableComponents,
      lockedComponents,
      requestStatus: "live",
      retrievedAt: new Date().toISOString(),
    };
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
