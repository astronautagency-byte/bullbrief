import type { Quote } from "@/lib/types";
import type { MarketstackQuoteResponse, MarketstackHistoricalResponse } from "./types";

export function mapQuote(raw: MarketstackQuoteResponse["data"][0]): Quote {
  const price = raw.intraday_price ?? raw.price;
  const previousClose = raw.previous_close;
  const change = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

  const now = new Date();
  const dataTime = new Date(raw.timestamp * 1000);
  const diffMinutes = (now.getTime() - dataTime.getTime()) / 60000;

  let dataType: Quote["dataType"] = "end_of_day";
  if (raw.intraday_price !== null) {
    dataType = "intraday";
  } else if (diffMinutes < 5) {
    dataType = "real_time";
  } else if (diffMinutes < 60) {
    dataType = "delayed";
  }

  return {
    symbol: raw.symbol,
    companyName: raw.name,
    exchangeCode: raw.exchange,
    currency: raw.currency,
    price,
    open: raw.open,
    high: raw.high,
    low: raw.low,
    previousClose: raw.previous_close,
    change,
    changePercent,
    volume: raw.volume,
    pe: null,
    marketCap: null,
    marketTimestamp: new Date(raw.timestamp * 1000).toISOString(),
    retrievedAt: now.toISOString(),
    dataType,
    isStale: diffMinutes > 60,
  };
}

export function mapHistoricalData(
  data: MarketstackHistoricalResponse["data"]
): Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> {
  return data
    .map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function mapSearchResult(
  item: { symbol: string; name: string; stock_exchange: string }
): { symbol: string; name: string; exchange: string } {
  return {
    symbol: item.symbol,
    name: item.name,
    exchange: item.stock_exchange,
  };
}
