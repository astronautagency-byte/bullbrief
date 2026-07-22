import { z } from "zod";

export const latestNewsSchema = z.object({
  countries: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  symbols: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1),
});

export const newsForSymbolsSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)).min(1).max(20),
  limit: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1),
});

export const newsForIndustriesSchema = z.object({
  industries: z.array(z.string()).min(1),
  limit: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1),
});

export const searchNewsSchema = z.object({
  query: z.string().min(1).max(100),
  symbols: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).default(20),
  page: z.number().min(1).default(1),
});

export type LatestNewsInput = z.infer<typeof latestNewsSchema>;
export type NewsForSymbolsInput = z.infer<typeof newsForSymbolsSchema>;
export type NewsForIndustriesInput = z.infer<typeof newsForIndustriesSchema>;
export type SearchNewsInput = z.infer<typeof searchNewsSchema>;
