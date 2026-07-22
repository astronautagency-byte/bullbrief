import { NextResponse } from "next/server";
import { groqChat } from "@/lib/providers/groq/client";
import { getMultiQuotes } from "@/lib/providers/yahoo/client";
import { fetchRSSNews } from "@/lib/providers/rss-news/client";

const GROQ_KEY = process.env.GROQ_API_KEY;

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
  context: { marketData: any[]; news: any[] },
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

export async function POST(request: Request) {
  if (!GROQ_KEY) {
    return NextResponse.json(
      { error: "AI assistant is not configured" },
      { status: 503 }
    );
  }

  let message: string;
  try {
    const body = await request.json();
    message = body.message;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Missing message" }, { status: 400 });
  }

  try {
    const symbols = INDEXES.map((i) => i.symbol);

    const [quoteMap, newsResult] = await Promise.allSettled([
      getMultiQuotes(symbols),
      fetchRSSNews({ limit: 5 }),
    ]);

    const quotes = quoteMap.status === "fulfilled" ? quoteMap.value : new Map();
    const marketData = INDEXES.map((def) => {
      const q = quotes.get(def.symbol);
      return {
        symbol: def.symbol,
        name: def.name,
        price: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
      };
    });

    const news = newsResult.status === "fulfilled" ? newsResult.value.articles : [];

    const reply = await callGroqWithRetry(message, { marketData, news });

    return NextResponse.json({ reply });
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
