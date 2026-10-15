export type KypAssetType = "fund" | "stock";

export interface KypHolding {
  id: string;
  performanceId?: string;
  requestedName: string;
  searchQuery: string;
  assetType: KypAssetType;
  symbol?: string;
  exchange?: string;
}

export const KYP_HOLDINGS: KypHolding[] = [
  { id: "mip-mlf", requestedName: "MIP MLF TRST INV SVGS MS -NL", searchQuery: "MIP MLF TRST INV SVGS MS", assetType: "fund" },
  { id: "npp-energy", requestedName: "NPP ENGY FD SRS SR F -NL", searchQuery: "NPP ENGY FD SRS SR F", assetType: "fund" },
  { id: "harvest-healthcare", requestedName: "HARVEST HLTHCRE LEADRS CL A", searchQuery: "HARVEST HEALTHCARE LEADERS CLASS A", assetType: "fund" },
  { id: "td", requestedName: "TORONTO DOMINION BK", searchQuery: "TD", assetType: "stock", symbol: "TD.TO", exchange: "TSX" },
  { id: "amazon", requestedName: "AMAZON.COM", searchQuery: "AMZN", assetType: "stock", symbol: "AMZN", exchange: "NASDAQ" },
  { id: "enbridge", requestedName: "ENBRIDGE INC", searchQuery: "ENB", assetType: "stock", symbol: "ENB.TO", exchange: "TSX" },
  { id: "suncor", requestedName: "SUNCOR ENERGY INC", searchQuery: "SU", assetType: "stock", symbol: "SU.TO", exchange: "TSX" },
  { id: "alphabet", requestedName: "ALPHABET INC", searchQuery: "GOOGL", assetType: "stock", symbol: "GOOGL", exchange: "NASDAQ" },
  { id: "microsoft", requestedName: "MICROSOFT", searchQuery: "MSFT", assetType: "stock", symbol: "MSFT", exchange: "NASDAQ" },
  { id: "rbc", requestedName: "ROYAL BANK OF CDA", searchQuery: "RY", assetType: "stock", symbol: "RY.TO", exchange: "TSX" },
];

export interface KypProductRecord extends KypHolding {
  status: "verified" | "partial" | "not_found";
  asOf: string;
  identity: {
    performanceId: string | null;
    name: string | null;
    ticker: string | null;
    exchange: string | null;
  };
  facts: {
    price: number | null;
    changePercent: number | null;
    currency: string | null;
    sector: string | null;
    industry: string | null;
    pe: number | null;
    priceToBook: number | null;
    priceToSales: number | null;
    priceToCashFlow: number | null;
    dividendYield: number | null;
    fairValue: number | null;
    starRating: number | null;
    economicMoat: string | null;
    marketCap: number | null;
    volume: number | null;
    averageVolume: number | null;
    fiftyTwoWeekLow: number | null;
    fiftyTwoWeekHigh: number | null;
    bid: number | null;
    ask: number | null;
  };
  morningstar: {
    profileDescription: string | null;
    styleBox: string | null;
    employees: number | null;
    website: string | null;
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
  };
  uploadedFactsheet?: ExtractedFundFactsheet & {
    fileName: string;
    pageCount: number;
    extractedAt: string;
  };
}

export interface ExtractedFundFactsheet {
  assetType: "fund" | "stock" | null;
  productName: string | null;
  fundCode: string | null;
  category: string | null;
  currency: string | null;
  cusip: string | null;
  isin: string | null;
  inceptionDate: string | null;
  manager: string | null;
  riskLevel: string | null;
  mer: number | null;
  managementFee: number | null;
  morningstarRating: number | null;
  investmentObjective: string | null;
  investmentStrategy: string | null;
  specificRisks: string | null;
  assetAllocation: string | null;
  geographicAllocation: string | null;
  sectorAllocation: string | null;
  topHoldings: string | null;
  return1Y: number | null;
  return3Y: number | null;
  return5Y: number | null;
  return10Y: number | null;
  standardDeviation: number | null;
  sharpeRatio: number | null;
  distributionFrequency: string | null;
  asOfDate: string | null;
  issuer: string | null;
  ticker: string | null;
  primaryExchange: string | null;
  sector: string | null;
  peRatio: number | null;
  currentPrice: number | null;
  targetPrice: number | null;
  dividendYield: number | null;
  profitability: string | null;
  riskMeasure: string | null;
  historicalPerformance: string | null;
  liquidity: string | null;
  businessDescription: string | null;
  comparables: string | null;
  fairValue: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyTwoWeekHigh: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  netMargin: number | null;
  annualPerformance?: Array<{ year: string; totalReturn: number | null; dividendYield: number | null; marketCap: number | null }>;
  annualFinancials?: Array<{ year: string; revenue: number | null; netIncome: number | null; eps: number | null; dividend: number | null; bookValue: number | null; operatingCashFlow: number | null; freeCashFlow: number | null }>;
  annualProfitability?: Array<{ year: string; returnOnAssets: number | null; returnOnEquity: number | null; netMargin: number | null }>;
  annualValuation?: Array<{ year: string; pe: number | null; priceToSales: number | null; priceToBook: number | null; priceToCashFlow: number | null }>;
  quarterlyResults?: Array<{ period: string; revenue: number | null; revenuePrior: number | null; revenueGrowth: number | null; eps: number | null; epsPrior: number | null }>;
  comparisonProducts?: ExtractedFundFactsheet[];
}

export function normalizeExtractedProducts(products: ExtractedFundFactsheet[]) {
  const consolidated = new Map<string, ExtractedFundFactsheet>();
  for (const product of products) {
    const identifier = product.ticker || product.fundCode || product.cusip || product.isin || product.productName;
    const key = `${product.assetType || "product"}:${identifier || crypto.randomUUID()}`.trim().toLowerCase();
    const existing = consolidated.get(key);
    if (!existing) {
      consolidated.set(key, product);
      continue;
    }
    const merged = { ...existing } as ExtractedFundFactsheet & Record<string, unknown>;
    for (const [field, value] of Object.entries(product)) {
      const current = merged[field];
      if (value == null || value === "") continue;
      if (current == null || current === "" || (Array.isArray(current) && Array.isArray(value) && value.length > current.length)) merged[field] = value;
    }
    consolidated.set(key, merged);
  }
  return [...consolidated.values()];
}

export function uploadedDocumentTitle(fileName: string) {
  const withoutExtension = fileName.replace(/^.*[\\/]/, "").replace(/\.pdf$/i, "").trim();
  const withoutCopySuffix = withoutExtension.replace(/(?:\s*[-_]\s*|\s*\()\d+\)?$/i, "").trim();
  return withoutCopySuffix || "Uploaded KYP";
}
