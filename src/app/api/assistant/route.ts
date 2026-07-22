import { NextResponse } from "next/server";
import { GeminiProvider } from "@/lib/providers/gemini/client";
import { getLatestPrices } from "@/lib/providers/marketstack/client";
import { getLatestNews } from "@/lib/providers/marketaux/client";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const INDEXES = [
  { symbol: "SPX", name: "S&P 500" },
  { symbol: "IXIC", name: "Nasdaq" },
  { symbol: "DJI", name: "Dow Jones" },
  { symbol: "TSX", name: "TSX" },
];

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGeminiWithRetry(
  gemini: GeminiProvider,
  message: string,
  context: { marketData: any[]; news: any[] },
  retries = 2
): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await gemini.chat(message, context);
    } catch (err: any) {
      if (err?.status === 429 && attempt < retries) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(request: Request) {
  if (!GEMINI_KEY) {
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
    const [indexData, newsResult] = await Promise.allSettled([
      getLatestPrices(INDEXES.map((i) => i.symbol)),
      getLatestNews({ limit: 5 }),
    ]);

    const marketData =
      indexData.status === "fulfilled"
        ? indexData.value.map((q, idx) => ({
            symbol: INDEXES[idx].symbol,
            name: INDEXES[idx].name,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
          }))
        : [];

    const news =
      newsResult.status === "fulfilled" ? newsResult.value.articles : [];

    const gemini = new GeminiProvider(GEMINI_KEY);
    const reply = await callGeminiWithRetry(gemini, message, {
      marketData,
      news,
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Assistant error:", error?.message || error);
    if (error?.status === 429) {
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
