import type { Article } from "@/lib/types";

const GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

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
  context?: { marketData?: any; news?: Article[]; watchlist?: string[] }
): Promise<string> {
  const systemPrompt = `You are BullBrief AI, a helpful financial market assistant. You provide concise, actionable market insights. You are knowledgeable about stocks, ETFs, indices, and market trends. Always remind users that your analysis is informational only and not financial advice. Keep responses concise and focused.`;

  let userPrompt = `User question: ${message}`;

  if (context?.watchlist?.length) {
    userPrompt += `\n\nUser's watchlist: ${context.watchlist.join(", ")}`;
  }
  if (context?.marketData) {
    userPrompt += `\n\nCurrent market data:\n${JSON.stringify(context.marketData, null, 2).slice(0, 1500)}`;
  }
  if (context?.news?.length) {
    userPrompt += `\n\nRecent headlines:\n${context.news.slice(0, 5).map((a: Article) => `- ${a.title}`).join("\n")}`;
  }

  return callGroq(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.7, maxTokens: 2048 }
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
