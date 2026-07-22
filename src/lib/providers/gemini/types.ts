import { z } from "zod";

export const GeminiArticleAnalysisSchema = z.object({
  geminiSentimentScore: z.number().min(-1).max(1),
  geminiSentimentLabel: z.enum(["strongly_positive", "positive", "neutral", "negative", "strongly_negative"]),
  geminiConfidence: z.number().min(0).max(1),
  keyTopics: z.array(z.string()),
  entities: z.array(z.string()),
  marketImpact: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type GeminiArticleAnalysis = z.infer<typeof GeminiArticleAnalysisSchema> & {
  articleId: string;
  title: string;
  content: string;
  source: string;
  publishedAt: string;
};

export interface GeminiStockRankingResponse {
  ranked_stocks: GeminiStockRanking[];
}

export interface GeminiStockRanking {
  symbol: string;
  score: number;
  reasoning: string;
}
