/* eslint-disable @typescript-eslint/no-explicit-any -- Provider payloads are runtime-normalized below. */
import { NextResponse } from "next/server";
import { groqChat } from "@/lib/providers/groq/client";
import { GeminiProvider } from "@/lib/providers/gemini/client";
import { getMultiQuotes } from "@/lib/providers/yahoo/client";
import { fetchRSSNews } from "@/lib/providers/rss-news/client";

const GROQ_KEY = process.env.GROQ_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const INDEXES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^GSPTSE", name: "TSX" },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGroqWithRetry(
  message: string,
  context: { marketData: any[]; news: any[]; watchlist: string[]; generatedAt: string },
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await groqChat(message, context);
    } catch (err: any) {
      if (err?.code === "RATE_LIMITED" && attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

function normalizeReply(reply: string) {
  return reply
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-+]\s+/gm, "• ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  if (!GROQ_KEY && !GEMINI_KEY) {
    return NextResponse.json(
      { error: "AI assistant is not configured" },
      { status: 503 }
    );
  }

  let message: string;
  let requestedSymbols: string[] = [];
  try {
    const body = await request.json();
    message = body.message;
    requestedSymbols = Array.isArray(body.watchlist)
      ? body.watchlist
          .filter((symbol: unknown): symbol is string => typeof symbol === "string")
          .map((symbol: string) => symbol.trim().toUpperCase())
          .filter((symbol: string) => /^[A-Z0-9.^-]{1,15}$/.test(symbol))
          .slice(0, 25)
      : [];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  try {
    const symbols = [...new Set([...INDEXES.map((i) => i.symbol), ...requestedSymbols])];

    const [quoteMap, newsResult] = await Promise.allSettled([
      getMultiQuotes(symbols),
      fetchRSSNews({ limit: 5 }),
    ]);

    const quotes = quoteMap.status === "fulfilled" ? quoteMap.value : new Map();
    const marketData = symbols.flatMap((symbol) => {
      const q = quotes.get(symbol);
      if (!q || q.price == null || q.change == null || q.changePercent == null) return [];
      const index = INDEXES.find((item) => item.symbol === symbol);
      return [{
        symbol,
        name: index?.name ?? q.companyName ?? symbol,
        price: q.price,
        currency: q.currency,
        change: q.change,
        changePercent: q.changePercent,
        marketTimestamp: q.marketTimestamp,
        dataType: q.dataType,
      }];
    });

    const news = newsResult.status === "fulfilled"
      ? newsResult.value.articles.slice(0, 8).map((article) => ({
          title: article.title,
          description: article.description,
          sourceName: article.sourceName,
          publishedAt: article.publishedAt,
          url: article.url,
        }))
      : [];
    const context = { marketData, news, watchlist: requestedSymbols, generatedAt: new Date().toISOString() };

    let reply: string;
    try {
      if (!GROQ_KEY) throw new Error("Groq is not configured");
      reply = await callGroqWithRetry(message, context);
    } catch (primaryError) {
      if (!GEMINI_KEY) throw primaryError;
      reply = await new GeminiProvider(GEMINI_KEY).chat(message, context);
    }

    return NextResponse.json({ reply: normalizeReply(reply) });
  } catch (error: any) {
    console.error("Assistant error:", error?.message || error);
    if (error?.code === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "AI is rate-limited. Please try again in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
