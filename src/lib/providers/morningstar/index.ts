import "server-only";

import { getDirectFundDetails, getDirectStockDetails, isMorningstarDirectConfigured } from "./direct";
import {
  autoComplete,
  emptyStockDetails,
  getMultipleStockDetails as getRapidApiMultipleStockDetails,
  getStockDetails as getRapidApiStockDetails,
  type StockDetails,
} from "./rapidapi";

export { autoComplete };
export type { StockDetails };

export async function getStockDetails(ticker: string, exchange?: string): Promise<StockDetails> {
  if (isMorningstarDirectConfigured()) {
    const direct = await getDirectStockDetails(ticker);
    if (direct.requestStatus === "live") return direct;
  }
  return getRapidApiStockDetails(ticker, exchange);
}

export async function getFundDetails(performanceId: string, fallbackName?: string): Promise<StockDetails> {
  if (isMorningstarDirectConfigured()) return getDirectFundDetails(performanceId, fallbackName);
  return emptyStockDetails(fallbackName || performanceId);
}

export async function getMultipleStockDetails(
  symbols: Array<{ ticker: string; exchange?: string }>
): Promise<Map<string, StockDetails>> {
  if (!isMorningstarDirectConfigured()) return getRapidApiMultipleStockDetails(symbols);
  const results = await Promise.all(symbols.map(async (item) => [item.ticker, await getStockDetails(item.ticker, item.exchange)] as const));
  return new Map(results);
}
