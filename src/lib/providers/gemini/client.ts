import { Article } from "@/lib/types";
import { GeminiArticleAnalysis, GeminiArticleAnalysisSchema } from "./types";
import { z } from "zod";
import { logger } from "@/lib/logger";

export class GeminiError extends Error {
  constructor(
    message: string,
    public code: "API_KEY_MISSING" | "API_CALL_FAILED" | "INVALID_RESPONSE" | "RATE_LIMITED",
    public status?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export class GeminiProvider {
  constructor(private apiKey: string) {}

  async chat(
    message: string,
    context?: { marketData?: any; news?: Article[]; watchlist?: string[] }
  ): Promise<string> {
    const prompt = this.buildChatPrompt(message, context);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{
            text: "You are BullBrief AI, a helpful financial market assistant. You provide concise, actionable market insights. You are knowledgeable about stocks, ETFs, indices, and market trends. Always remind users that your analysis is informational only and not financial advice. Keep responses concise and focused."
          }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new GeminiError(`Gemini chat failed: ${response.status}`, "API_CALL_FAILED", response.status);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I couldn't generate a response.";
  }

  async generateBriefSummary(
    indexes: Array<{ symbol: string; name: string; value: number; change: number; changePercent: number }>,
    news: Article[],
    watchlistSymbols: string[]
  ): Promise<{ summary: string; confidence: number; keyInsights: string[] }> {
    const prompt = `You are BullBrief AI. Generate a concise daily market briefing.

**Index Performance:**
${indexes.map(i => `${i.name} (${i.symbol}): ${i.value} (${i.change >= 0 ? '+' : ''}${i.change.toFixed(2)}, ${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%)`).join('\n')}

**Top News Headlines:**
${news.slice(0, 8).map(a => `- ${a.title} (${a.sourceName})${a.sentimentLabel ? ` [${a.sentimentLabel}]` : ''}`).join('\n')}

**User's Watchlist:** ${watchlistSymbols.length > 0 ? watchlistSymbols.join(', ') : 'Not set'}

Respond with valid JSON only (no markdown, no code blocks):
{
  "summary": "2-3 sentence executive summary of today's market conditions",
  "confidence": 0.0 to 1.0,
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4"]
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      throw new GeminiError(`Gemini brief failed: ${response.status}`, "API_CALL_FAILED", response.status);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new GeminiError("No JSON in Gemini response", "INVALID_RESPONSE");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary || "",
      confidence: parsed.confidence ?? 0.5,
      keyInsights: parsed.keyInsights || parsed.key_insights || [],
    };
  }

  async analyzeArticle(
    article: Pick<Article, "providerId" | "title" | "description" | "sourceName" | "publishedAt">,
    context?: { symbols?: string[]; industries?: string[]; countries?: string[] }
  ): Promise<GeminiArticleAnalysis> {
    const prompt = `Analyze this financial news article. Return valid JSON only:
{
  "geminiSentimentScore": number (-1 to 1),
  "geminiSentimentLabel": "strongly_positive" | "positive" | "neutral" | "negative" | "strongly_negative",
  "geminiConfidence": number (0 to 1),
  "keyTopics": ["topic1", "topic2"],
  "entities": ["entity1", "entity2"],
  "marketImpact": "bullish" | "bearish" | "neutral",
  "confidence": number (0 to 1),
  "reasoning": "brief explanation"
}

Article: "${article.title}"
Source: ${article.sourceName}
Content: ${article.description || "N/A"}
${context?.symbols?.length ? `Watchlist symbols: ${context.symbols.join(", ")}` : ""}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) throw new GeminiError(`Gemini failed: ${response.status}`, "API_CALL_FAILED", response.status);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new GeminiError("No JSON in response", "INVALID_RESPONSE");

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = GeminiArticleAnalysisSchema.parse(parsed);

    return {
      articleId: article.providerId,
      title: article.title,
      content: article.description || "",
      source: article.sourceName,
      publishedAt: article.publishedAt,
      ...validated,
    };
  }

  private buildChatPrompt(message: string, context?: { marketData?: any; news?: Article[]; watchlist?: string[] }): string {
    let prompt = `User question: ${message}`;

    if (context?.watchlist?.length) {
      prompt += `\n\nUser's watchlist: ${context.watchlist.join(", ")}`;
    }
    if (context?.marketData) {
      const idx = context.marketData;
      prompt += `\n\nCurrent market data:\n${JSON.stringify(idx, null, 2).slice(0, 1500)}`;
    }
    if (context?.news?.length) {
      prompt += `\n\nRecent headlines:\n${context.news.slice(0, 5).map((a: Article) => `- ${a.title}`).join("\n")}`;
    }

    return prompt;
  }
}
