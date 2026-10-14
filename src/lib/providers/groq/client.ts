/* eslint-disable @typescript-eslint/no-explicit-any -- External provider payloads are normalized after receipt. */
import type { Article } from "@/lib/types";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

export class GroqError extends Error {
  constructor(
    message: string,
    public code: "API_KEY_MISSING" | "API_CALL_FAILED" | "INVALID_RESPONSE" | "RATE_LIMITED",
    public status?: number
  ) {
    super(message);
    this.name = "GroqError";
  }
}

async function callGroq(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new GroqError("GROQ_API_KEY is not configured", "API_KEY_MISSING");

  const response = await fetch(GROQ_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (response.status === 429) {
    throw new GroqError("Rate limited", "RATE_LIMITED", 429);
  }

  if (!response.ok) {
    throw new GroqError(`Groq API error: ${response.status}`, "API_CALL_FAILED", response.status);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "I couldn't generate a response.";
}

export async function groqChat(
  message: string,
  context?: { marketData?: any; news?: Array<Pick<Article, "title" | "description" | "sourceName" | "publishedAt" | "url">>; watchlist?: string[]; generatedAt?: string }
): Promise<string> {
  const systemPrompt = `You are BullBrief AI, a factual research assistant for Canadian financial advisors.

Accuracy rules:
1. Treat the supplied context as the only source for current prices, market moves, portfolio holdings and news. Never invent, estimate or recall current financial facts from model memory.
2. If the context does not contain enough evidence to answer a question, say exactly what information is unavailable. Do not fill gaps with assumptions.
3. A zero is a valid value only when it is explicitly present in the context. Missing data is unavailable, not zero.
4. Identify price facts with the security or index symbol. Identify news facts with the supplied source name. Preserve the distinction between a reported fact and your interpretation.
5. Do not claim to know client objectives, KYC, suitability, tax circumstances, dealer shelf status, cost basis, position size or portfolio allocation unless that information appears in the context.
6. Do not give a personalized recommendation or instruction to buy, sell or hold. Provide research considerations and verification steps.
7. Use Canadian compliance terminology precisely. KYC concerns the client's identity, circumstances, finances, investment knowledge, objectives, time horizon, risk tolerance and risk capacity. KYP concerns the security's structure, features, risks, costs, liquidity, initial approval and material changes. Never describe client risk tolerance or client objectives as KYP.
8. Verified facts may contain only values or claims directly present in the supplied records. Put causal explanations, implications and phrases such as "reflecting" or "driven by" under Interpretation unless the supplied news record explicitly attributes them.

Lead with the direct answer. Then use the plain-text headings "Verified facts" and, only when useful, "Interpretation". Never place an inference under Verified facts. Provide no more than five prioritized facts or considerations. Keep the response under 220 words. Use plain text only. Do not use markdown, asterisks, tables, em dashes or en dashes. End with one short informational-only disclaimer.`;

  let userPrompt = `User question: ${message}`;

  if (context?.watchlist?.length) {
    userPrompt += `\n\nPortfolio symbols supplied by the application: ${context.watchlist.join(", ")}`;
  }
  if (context?.generatedAt) userPrompt += `\nContext assembled at: ${context.generatedAt}`;
  if (context?.marketData) {
    userPrompt += `\n\nCurrent market data:\n${JSON.stringify(context.marketData, null, 2).slice(0, 1500)}`;
  }
  if (context?.news?.length) {
    userPrompt += `\n\nRecent news records:\n${JSON.stringify(context.news.slice(0, 8), null, 2).slice(0, 6000)}`;
  }

  return callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.1, maxTokens: 1024 }
  );
}

export async function groqGenerateBriefSummary(
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

  const text = await callGroq(
    [{ role: "user", content: prompt }],
    { temperature: 0.3, maxTokens: 1024 }
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new GroqError("No JSON in response", "INVALID_RESPONSE");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    summary: parsed.summary || "",
    confidence: parsed.confidence ?? 0.5,
    keyInsights: parsed.keyInsights || parsed.key_insights || [],
  };
}
