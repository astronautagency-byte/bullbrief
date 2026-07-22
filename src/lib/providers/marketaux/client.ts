import type { Article } from "@/lib/types";
import type { MarketauxNewsResponse } from "./types";
import { mapArticle, rankArticles, deduplicateArticles } from "./mappers";
import { MarketauxError } from "./errors";

const BASE_URL = "https://api.marketaux.com/v1";
const API_TOKEN = process.env.MARKETAUX_API_TOKEN;
const DEFAULT_COUNTRIES = "us,ca";

function getApiToken(): string {
  if (!API_TOKEN) {
    throw new MarketauxError("MARKETAUX_API_TOKEN is not configured");
  }
  return API_TOKEN;
}

async function fetchMarketaux<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_token", getApiToken());
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new MarketauxError(
      `Marketaux API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const json = await response.json();
  return json as T;
}

export async function getLatestNews(options: {
  countries?: string[];
  industries?: string[];
  symbols?: string[];
  limit?: number;
  page?: number;
}): Promise<{ articles: Article[]; total: number }> {
  const params: Record<string, string> = {
    countries: options.countries?.length
      ? options.countries.join(",")
      : DEFAULT_COUNTRIES,
    limit: String(options.limit ?? 20),
    page: String(options.page ?? 1),
  };
  if (options.industries?.length) params.industries = options.industries.join(",");
  if (options.symbols?.length) params.symbols = options.symbols.join(",");

  const res = await fetchMarketaux<MarketauxNewsResponse>("/news/all", params);
  return {
    articles: res.data.map(mapArticle),
    total: res.meta.found,
  };
}

export async function getNewsForSymbols(
  symbols: string[],
  options: { limit?: number; page?: number } = {}
): Promise<{ articles: Article[]; total: number }> {
  const params: Record<string, string> = {
    countries: DEFAULT_COUNTRIES,
    symbols: symbols.join(","),
    limit: String(options.limit ?? 20),
    page: String(options.page ?? 1),
  };

  const res = await fetchMarketaux<MarketauxNewsResponse>("/news/all", params);
  return {
    articles: res.data.map(mapArticle),
    total: res.meta.found,
  };
}

export async function getNewsForIndustries(
  industries: string[],
  options: { limit?: number; page?: number } = {}
): Promise<{ articles: Article[]; total: number }> {
  const params: Record<string, string> = {
    countries: DEFAULT_COUNTRIES,
    industries: industries.join(","),
    limit: String(options.limit ?? 20),
    page: String(options.page ?? 1),
  };

  const res = await fetchMarketaux<MarketauxNewsResponse>("/news/all", params);
  return {
    articles: res.data.map(mapArticle),
    total: res.meta.found,
  };
}

export async function searchNews(
  query: string,
  options: {
    symbols?: string[];
    limit?: number;
    page?: number;
    watchlistSymbols?: string[];
    preferredIndustries?: string[];
    preferredCountries?: string[];
  } = {}
): Promise<{ articles: Article[]; total: number }> {
  const params: Record<string, string> = {
    countries: DEFAULT_COUNTRIES,
    search: query,
    limit: String(options.limit ?? 20),
    page: String(options.page ?? 1),
  };
  if (options.symbols?.length) params.symbols = options.symbols.join(",");

  const res = await fetchMarketaux<MarketauxNewsResponse>("/news/all", params);
  let articles = res.data.map(mapArticle);

  if (options.watchlistSymbols || options.preferredIndustries || options.preferredCountries) {
    articles = rankArticles(
      articles,
      options.watchlistSymbols,
      options.preferredIndustries,
      options.preferredCountries
    );
  }

  articles = deduplicateArticles(articles);

  return {
    articles,
    total: res.meta.found,
  };
}

export { rankArticles, deduplicateArticles };
