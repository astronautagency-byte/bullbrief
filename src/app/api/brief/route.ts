import { NextResponse } from "next/server";
import { getLatestPrices } from "@/lib/providers/marketstack/client";
import { getLatestNews } from "@/lib/providers/marketaux/client";
import { GeminiProvider } from "@/lib/providers/gemini/client";
import type { BriefingData, WatchlistMovers, Article } from "@/lib/types";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const INDEXES = [
  { symbol: "SPX", name: "S&P 500" },
  { symbol: "IXIC", name: "Nasdaq" },
  { symbol: "DJI", name: "Dow Jones" },
  { symbol: "TSX", name: "TSX" },
];

export async function GET() {
  try {
    const watchlistSymbols: string[] = [];

    const [indexData, watchlistData, newsResult] = await Promise.allSettled([
      getLatestPrices(INDEXES.map((i) => i.symbol)),
      watchlistSymbols.length > 0
        ? getLatestPrices(watchlistSymbols)
        : Promise.resolve([]),
      getLatestNews({ limit: 10 }),
    ]);

    const indexes =
      indexData.status === "fulfilled"
        ? indexData.value.map((q, idx) => ({
            symbol: INDEXES[idx].symbol,
            name: INDEXES[idx].name,
            value: q.price ?? 0,
            change: q.change ?? 0,
            changePercent: q.changePercent ?? 0,
            isPositive: (q.change ?? 0) >= 0,
          }))
        : [];

    const movers =
      watchlistData.status === "fulfilled" && watchlistData.value.length > 0
        ? computeMovers(watchlistData.value)
        : {
            topGainer: null,
            topDecliner: null,
            mostMentioned: null,
            mostPositive: null,
            mostNegative: null,
          };

    const articles: Article[] =
      newsResult.status === "fulfilled" ? newsResult.value.articles : [];

    const headlines = articles.slice(0, 5).map((a) => a.title);

    let summary = "";
    let aiConfidence: number | null = null;
    let keyInsights: string[] = [];

    if (GEMINI_KEY) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const gemini = new GeminiProvider(GEMINI_KEY);
          const aiResult = await gemini.generateBriefSummary(
            indexes,
            articles,
            watchlistSymbols
          );
          summary = aiResult.summary;
          aiConfidence = aiResult.confidence;
          keyInsights = aiResult.keyInsights;
          break;
        } catch (err: any) {
          if (err?.status === 429 && attempt < 2) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          console.error("Gemini brief failed, falling back to template:", err);
          summary = generateSummary(indexes, movers, headlines);
          break;
        }
      }
    } else {
      summary = generateSummary(indexes, movers, headlines);
    }

    const briefing: BriefingData = {
      generatedAt: new Date().toISOString(),
      marketSummary: summary,
      indexPerformance: indexes,
      watchlistMovers: movers,
      headlineTopics: headlines,
      sentimentScore: aiConfidence,
    };

    return NextResponse.json({
      data: briefing,
      keyInsights,
      articles: articles.slice(0, 8),
    });
  } catch (error) {
    console.error("Brief generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}

function computeMovers(
  quotes: Array<{ symbol: string; changePercent: number | null }>
): WatchlistMovers {
  const sorted = [...quotes].sort(
    (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0)
  );

  return {
    topGainer: sorted[0]
      ? { symbol: sorted[0].symbol, changePercent: sorted[0].changePercent ?? 0 }
      : null,
    topDecliner: sorted[sorted.length - 1]
      ? {
          symbol: sorted[sorted.length - 1].symbol,
          changePercent: sorted[sorted.length - 1].changePercent ?? 0,
        }
      : null,
    mostMentioned: null,
    mostPositive: null,
    mostNegative: null,
  };
}

function generateSummary(
  indexes: Array<{
    name: string;
    changePercent: number;
    isPositive: boolean;
  }>,
  movers: WatchlistMovers,
  headlines: string[]
): string {
  const up = indexes.filter((i) => i.isPositive);
  const down = indexes.filter((i) => !i.isPositive);

  let summary = "Markets are ";

  if (up.length > down.length) {
    summary += "mostly positive today";
  } else if (down.length > up.length) {
    summary += "mostly negative today";
  } else {
    summary += "mixed today";
  }

  if (up.length > 0 && down.length > 0) {
    summary += `, with ${up.map((i) => i.name).join(" and ")} advancing while ${down.map((i) => i.name).join(" and ")} decline${down.length === 1 ? "s" : ""}`;
  }
  summary += ". ";

  if (movers.topGainer && movers.topGainer.changePercent > 1) {
    summary += `${movers.topGainer.symbol} is your strongest mover at +${movers.topGainer.changePercent.toFixed(2)}%. `;
  }

  if (movers.topDecliner && movers.topDecliner.changePercent < -1) {
    summary += `${movers.topDecliner.symbol} is your weakest at ${movers.topDecliner.changePercent.toFixed(2)}%. `;
  }

  if (headlines.length > 0) {
    summary += `Today's top stories focus on ${headlines[0].toLowerCase().slice(0, 60)}.`;
  }

  return summary;
}
