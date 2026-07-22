import { z } from "zod";

export const searchTickersSchema = z.object({
  query: z.string().min(1).max(20),
});

export const tickerDetailsSchema = z.object({
  symbol: z.string().min(1).max(10),
  exchange: z.string().optional(),
});

export const historicalPricesSchema = z.object({
  symbol: z.string().min(1).max(10),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const latestPricesSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)).min(1).max(20),
});

export const marketSnapshotSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)).min(1),
});

export type SearchTickersInput = z.infer<typeof searchTickersSchema>;
export type TickerDetailsInput = z.infer<typeof tickerDetailsSchema>;
export type HistoricalPricesInput = z.infer<typeof historicalPricesSchema>;
export type LatestPricesInput = z.infer<typeof latestPricesSchema>;
export type MarketSnapshotInput = z.infer<typeof marketSnapshotSchema>;
