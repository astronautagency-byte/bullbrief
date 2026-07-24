import YahooFinance from 'yahoo-finance2';
import type { Asset } from '../../src/types.js';

const yahooFinance = new YahooFinance();

const TICKER_SYMBOLS = ['^GSPC', '^IXIC', '^DJI', 'BTC-USD', '^TNX', 'EURUSD=X'];

export interface TickerItem {
  label: string;
  symbol: string;
  price: number;
  changePercent: number;
  changeAmount: number;
  suffix?: string;
}

const TICKER_LABELS: Record<string, string> = {
  '^GSPC': 'SPX 500',
  '^IXIC': 'NASDAQ',
  '^DJI': 'DOW JONES',
  'BTC-USD': 'BTC/USD',
  '^TNX': 'US 10Y',
  'EURUSD=X': 'EUR/USD',
};

function formatMarketCap(value?: number): string {
  if (!value) return '—';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString();
}

function formatVolume(value?: number): string {
  if (!value) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export async function fetchQuotes(symbols: string[]): Promise<Asset[]> {
  if (symbols.length === 0) return [];

  const normalized = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const quotes = await yahooFinance.quote(normalized);

  const quoteList = Array.isArray(quotes) ? quotes : [quotes];

  return quoteList
    .filter((q) => q && q.symbol)
    .map((quote) => {
      const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? 0;
      const changePercent = quote.regularMarketChangePercent ?? 0;
      const changeAmount = quote.regularMarketChange ?? 0;

      return {
        symbol: quote.symbol.replace('.TO', '').toUpperCase(),
        name: quote.shortName || quote.longName || quote.symbol,
        price: Number(price.toFixed(2)),
        dayChangePercent: Number(changePercent.toFixed(2)),
        dayChangeAmount: Number(changeAmount.toFixed(2)),
        marketCap: formatMarketCap(quote.marketCap),
        volume24h: formatVolume(quote.regularMarketVolume),
      };
    });
}

export async function fetchSingleQuote(symbol: string): Promise<Asset | null> {
  const results = await fetchQuotes([symbol]);
  return results[0] ?? null;
}

export async function fetchMarketTickers(): Promise<TickerItem[]> {
  const quotes = await yahooFinance.quote(TICKER_SYMBOLS);
  const quoteList = Array.isArray(quotes) ? quotes : [quotes];

  return quoteList
    .filter((q) => q?.symbol)
    .map((quote) => {
      const symbol = quote.symbol;
      const price = quote.regularMarketPrice ?? 0;
      const changePercent = quote.regularMarketChangePercent ?? 0;
      const changeAmount = quote.regularMarketChange ?? 0;

      const isYield = symbol === '^TNX';
      const isForex = symbol === 'EURUSD=X';

      return {
        label: TICKER_LABELS[symbol] || symbol,
        symbol,
        price: isYield ? Number(price.toFixed(3)) : Number(price.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        changeAmount: Number(changeAmount.toFixed(isForex ? 4 : 2)),
        suffix: isYield ? '%' : undefined,
      };
    });
}

export async function fetchChartData(
  symbol: string,
  range: '1mo' | '3mo' | '6mo' | 'ytd' | '1y' | 'max'
): Promise<{ date: string; close: number }[]> {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case '1mo':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'max':
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
  }

  const history = await yahooFinance.chart(symbol, {
    period1: startDate,
    period2: endDate,
    interval: range === '1mo' ? '1d' : '1d',
  });

  return (history.quotes || [])
    .filter((point) => point.close != null)
    .map((point) => ({
      date: point.date.toISOString(),
      close: Number(point.close!.toFixed(2)),
    }));
}
