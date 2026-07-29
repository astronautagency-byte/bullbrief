import type { Asset, Invoice, NewsItem, StockSearchResult, User } from '../types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  changePercent: number;
  changeAmount: number;
  suffix?: string;
}

export interface StockAnalysis {
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  rating: string;
  reasoning: string[];
}

export interface NewsAnalysis {
  implications: { title: string; text: string }[];
  sentiment: number;
  summary: string;
}

export interface DailyBriefing {
  title: string;
  summary: string;
  highlights: { title: string; text: string; impact: 'High' | 'Neutral' | 'Bearish' }[];
  sentimentScore: number;
}

export interface ChartPoint {
  date: string;
  close: number;
}

export interface AccountState {
  user: User;
  watchlist: Asset[];
  invoices: Invoice[];
  updatedAt: string;
}

export const api = {
  health: () => request<{ status: string; geminiConfigured: boolean }>('/health'),

  getTickers: () => request<TickerItem[]>('/market/tickers'),

  getQuotes: (symbols: string[]) =>
    request<Asset[]>(`/market/quotes?symbols=${encodeURIComponent(symbols.join(','))}`),

  searchStocks: (query: string) =>
    request<StockSearchResult[]>(`/market/search?q=${encodeURIComponent(query)}`),

  getQuote: (symbol: string) => request<Asset>(`/market/quote/${encodeURIComponent(symbol)}`),

  getChart: (symbol: string, range: string, market?: string) =>
    request<ChartPoint[]>(
      `/market/chart/${encodeURIComponent(symbol)}?range=${range}${market ? `&market=${market}` : ''}`
    ),

  getNews: () => request<NewsItem[]>('/news'),

  analyzeStock: (symbol: string, name: string, price: number, changePercent: number) =>
    request<StockAnalysis>('/ai/analyze-stock', {
      method: 'POST',
      body: JSON.stringify({ symbol, name, price, changePercent }),
    }),

  analyzeNews: (title: string, text: string, source: string) =>
    request<NewsAnalysis>('/ai/analyze-news', {
      method: 'POST',
      body: JSON.stringify({ title, text, source }),
    }),

  getDailyBriefing: (marketContext: string) =>
    request<DailyBriefing>('/ai/daily-briefing', {
      method: 'POST',
      body: JSON.stringify({ marketContext }),
    }),

  startAccountSession: (user: User, legacy?: { watchlist: Asset[]; invoices: Invoice[] }) =>
    request<AccountState>('/account/session', {
      method: 'POST',
      body: JSON.stringify({ user, legacy }),
    }),

  endAccountSession: () => request<void>('/account/session', { method: 'DELETE' }),

  getAccountState: () => request<AccountState>('/account/state'),

  exportAccount: () => request<{ exportedAt: string; notice: string; account: AccountState }>('/account/export'),

  deleteAccount: () => request<void>('/account', { method: 'DELETE' }),

  updateAccountProfile: (profile: Partial<User>) =>
    request<AccountState>('/account/profile', { method: 'PUT', body: JSON.stringify(profile) }),

  addAccountAsset: (asset: Asset) =>
    request<AccountState>('/account/watchlist', { method: 'POST', body: JSON.stringify(asset) }),

  removeAccountAsset: (symbol: string) =>
    request<AccountState>(`/account/watchlist/${encodeURIComponent(symbol)}`, { method: 'DELETE' }),

  updateAccountInvoices: (invoices: Invoice[]) =>
    request<AccountState>('/account/invoices', { method: 'PUT', body: JSON.stringify(invoices) }),
};
