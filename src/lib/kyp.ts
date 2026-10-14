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
}
