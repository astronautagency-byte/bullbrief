import { NextResponse } from "next/server";
import { getMultiQuotes } from "@/lib/providers/yahoo/client";
import { fetchRSSNews } from "@/lib/providers/rss-news/client";
import { getLatestNews } from "@/lib/providers/marketaux/client";
import { groqGenerateBriefSummary } from "@/lib/providers/groq/client";
import type { BriefingData, WatchlistMovers, Article } from "@/lib/types";

const GROQ_KEY = process.env.GROQ_API_KEY;

const INDEXES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^GSPTSE", name: "TSX" },
];

export async function GET() {
  try {
    const symbols = INDEXES.map((i) => i.symbol);

    const [quoteMap, marketauxNews, rssNews] = await Promise.allSettled([
      getMultiQuotes(symbols),
      getLatestNews({ countries: ["us", "ca"], limit: 3, page: 1 }),
      fetchRSSNews({ limit: 10 }),
    ]);

    const quotes = quoteMap.status === "fulfilled" ? quoteMap.value : new Map();
    const indexes = INDEXES.map((def) => {
      const q = quotes.get(def.symbol);
      return {
        symbol: def.symbol,
        name: def.name,
        value: q?.price ?? 0,
        change: q?.change ?? 0,
        changePercent: q?.changePercent ?? 0,
        isPositive: (q?.change ?? 0) >= 0,
      };
    });

    const marketauxArticles = marketauxNews.status === "fulfilled" ? marketauxNews.value.articles : [];
    const rssArticles = rssNews.status === "fulfilled" ? rssNews.value.articles : [];
    const articleKeys = new Set<string>();
    const articles: Article[] = [...marketauxArticles, ...rssArticles]
      .filter((article) => {
        const key = article.title.toLowerCase().replace(/\W/g, "").slice(0, 80);
        if (articleKeys.has(key)) return false;
        articleKeys.add(key);
        return true;
      })
      .slice(0, 10);

    const movers: WatchlistMovers = {
      topGainer: null,
      topDecliner: null,
      mostMentioned: null,
      mostPositive: null,
      mostNegative: null,
    };

    const headlines = articles.slice(0, 5).map((a) => a.title);

    let summary = "";
    let aiConfidence: number | null = null;
    let keyInsights: string[] = [];

    if (GROQ_KEY) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const aiResult = await groqGenerateBriefSummary(
            indexes,
            articles,
            []
          );
          summary = aiResult.summary;
          aiConfidence = aiResult.confidence;
          keyInsights = aiResult.keyInsights;
          break;
        } catch (err: unknown) {
          if (typeof err === "object" && err !== null && "code" in err && err.code === "RATE_LIMITED" && attempt < 2) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
            continue;
          }
          console.error("Groq brief failed, falling back to template:", err);
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

  if (headlines.length > 0) {
    summary += `Today's top stories focus on ${headlines[0].toLowerCase().slice(0, 60)}.`;
  }

  return summary;
}
