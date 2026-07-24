const SERVICE_URL = process.env.MORNINGSTAR_SERVICE_URL || "http://localhost:8000";

export class MorningstarError extends Error {
  constructor(
    message: string,
    public code: "SERVICE_UNAVAILABLE" | "STOCK_NOT_FOUND" | "FETCH_FAILED",
    public status?: number
  ) {
    super(message);
    this.name = "MorningstarError";
  }
}

async function fetchService<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${SERVICE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(30000),
    });
  } catch (err: any) {
    if (err.name === "TimeoutError" || err.code === "ABORT_ERR") {
      throw new MorningstarError("Morningstar service timed out", "SERVICE_UNAVAILABLE");
    }
    throw new MorningstarError(
      `Cannot reach Morningstar service: ${err.message}`,
      "SERVICE_UNAVAILABLE"
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new MorningstarError(
      body.detail || `Morningstar service error: ${response.status}`,
      "FETCH_FAILED",
      response.status
    );
  }

  return response.json();
}

export interface StockFundamentals {
  symbol: string;
  price: number | null;
  historical: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose: number;
    date: string;
  }>;
}

export interface StockFinancials {
  symbol: string;
  incomeStatement: any;
  balanceSheet: any;
  cashFlow: any;
}

export interface ComparisonResult {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  recentPrices: number[];
  error?: string;
}

export interface ScreenerResult {
  meta: {
    securityID: string;
    performanceID: string;
    ticker: string;
    exchange: string;
  };
  fields: {
    name: { value: string };
    isin: { value: string };
    priceToEarnings: { value: number };
    sector: { value: string };
    marketCap: { value: number };
    morningstarOverallRating: { value: number };
  };
}

export async function getStockFundamentals(symbol: string): Promise<StockFundamentals | null> {
  try {
    return await fetchService<StockFundamentals>(
      `/api/stock/${encodeURIComponent(symbol)}`
    );
  } catch (err) {
    if (err instanceof MorningstarError && err.code === "FETCH_FAILED") return null;
    throw err;
  }
}

export async function getStockFinancials(symbol: string): Promise<StockFinancials | null> {
  try {
    return await fetchService<StockFinancials>(
      `/api/stock/${encodeURIComponent(symbol)}/financials`
    );
  } catch (err) {
    if (err instanceof MorningstarError && err.code === "FETCH_FAILED") return null;
    throw err;
  }
}

export async function compareStocks(symbols: string[]): Promise<ComparisonResult[]> {
  try {
    return await fetchService<ComparisonResult[]>("/api/compare", {
      symbols: symbols.join(","),
    });
  } catch {
    return [];
  }
}

export async function screenStocks(filters: {
  query?: string;
  sector?: string;
  peMax?: number;
  peMin?: number;
  starMin?: number;
}): Promise<ScreenerResult[]> {
  const params: Record<string, string> = {};
  if (filters.query) params.query = filters.query;
  if (filters.sector) params.sector = filters.sector;
  if (filters.peMax !== undefined) params.peMax = String(filters.peMax);
  if (filters.peMin !== undefined) params.peMin = String(filters.peMin);
  if (filters.starMin !== undefined) params.starMin = String(filters.starMin);

  try {
    return await fetchService<ScreenerResult[]>("/api/screener", params);
  } catch {
    return [];
  }
}
