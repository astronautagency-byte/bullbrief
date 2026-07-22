import type { Quote } from "@/lib/types";
import type {
  MarketstackTickerSearchResponse,
  MarketstackTickerDetailResponse,
  MarketstackQuoteResponse,
  MarketstackHistoricalResponse,
} from "./types";
import { mapQuote, mapHistoricalData, mapSearchResult } from "./mappers";
import { MarketstackError } from "./errors";

const BASE_URL = "https://api.marketstack.com/v1";
const API_KEY = process.env.MARKETSTACK_API_KEY;

function getApiKey(): string {
  if (!API_KEY) {
    throw new MarketstackError("MARKETSTACK_API_KEY is not configured");
  }
  return API_KEY;
}

async function fetchMarketstack<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("access_key", getApiKey());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new MarketstackError(
      `Marketstack API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const json = await response.json();
  if (json.error) {
    throw new MarketstackError(json.error.message || "Marketstack API error", undefined, json.error.code);
  }

  return json as T;
}

export async function searchTickers(
  query: string
): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  const res = await fetchMarketstack<MarketstackTickerSearchResponse>("/tickers", {
    search: query,
    limit: "10",
  });
  return res.data.map(mapSearchResult);
}

export async function getTickerDetails(
  symbol: string,
  exchange?: string
): Promise<Quote | null> {
  const params: Record<string, string> = {};
  if (exchange) params.exchange = exchange;

  try {
    const res = await fetchMarketstack<MarketstackTickerDetailResponse>(
      `/tickers/${symbol}`,
      params
    );
    return {
      symbol: res.data.symbol,
      companyName: res.data.name,
      exchangeCode: res.data.stock_exchange,
      currency: null,
      price: null,
      open: null,
      high: null,
      low: null,
      previousClose: null,
      change: null,
      changePercent: null,
      volume: null,
      marketTimestamp: null,
      retrievedAt: new Date().toISOString(),
      dataType: "end_of_day",
      isStale: true,
    };
  } catch {
    return null;
  }
}

export async function getLatestPrices(
  symbols: string[]
): Promise<Quote[]> {
  const res = await fetchMarketstack<MarketstackQuoteResponse>("/eod/latest", {
    symbols: symbols.join(","),
  });
  return res.data.map(mapQuote);
}

export async function getHistoricalPrices(
  symbol: string,
  dateFrom: string,
  dateTo: string
): Promise<Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>> {
  const res = await fetchMarketstack<MarketstackHistoricalResponse>(
    `/eod/${symbol}`,
    {
      date_from: dateFrom,
      date_to: dateTo,
      limit: "1000",
    }
  );
  return mapHistoricalData(res.data);
}

export async function getMarketSnapshot(
  symbols: string[]
): Promise<Quote[]> {
  return getLatestPrices(symbols);
}
