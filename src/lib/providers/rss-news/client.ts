import Parser from "rss-parser";
import type { Article } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "BullBrief/1.0",
  },
});

const RSS_FEEDS = [
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", source: "MarketWatch", domain: "marketwatch.com" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_marketpulse", source: "MarketWatch", domain: "marketwatch.com" },
  { url: "https://news.google.com/rss/search?q=stock+market&hl=en-US&gl=US&ceid=US:en", source: "Google News", domain: "news.google.com" },
  { url: "https://news.google.com/rss/search?q=investing+finance&hl=en-US&gl=US&ceid=US:en", source: "Google News", domain: "news.google.com" },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US", source: "Yahoo Finance", domain: "finance.yahoo.com" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", source: "CNBC", domain: "cnbc.com" },
  { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", source: "CNBC", domain: "cnbc.com" },
];

function categorizeArticle(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.match(/tech|ai|chip|semiconductor|apple|google|microsoft|nvidia/)) return "technology";
  if (text.match(/earnings|revenue|profit|quarterly|eps/)) return "earnings";
  if (text.match(/fed|rate|inflation|gdp|employment|recession/)) return "macro";
  if (text.match(/crypto|bitcoin|ethereum/)) return "crypto";
  if (text.match(/oil|energy|gas|opec/)) return "energy";
  if (text.match(/canadian|tsx|tsx|canada|cad/)) return "canada";
  if (text.match(/ipo|merger|acquisition|deal/)) return "deals";
  return "general";
}

function inferSentiment(title: string, description: string): "positive" | "negative" | "neutral" {
  const text = `${title} ${description}`.toLowerCase();
  const positive = ["surge", "rally", "gain", "jump", "rise", "soar", "bull", "up", "high", "record", "beat", "growth", "profit", "strong", "boom"];
  const negative = ["crash", "drop", "fall", "plunge", "slump", "bear", "down", "low", "loss", "weak", "recession", "fear", "sell", "decline", "cut"];

  const posCount = positive.filter((w) => text.includes(w)).length;
  const negCount = negative.filter((w) => text.includes(w)).length;

  if (posCount > negCount) return "positive";
  if (negCount > posCount) return "negative";
  return "neutral";
}

function extractImage(html: string): string | undefined {
  const match = html.match(/<img[^>]+src="([^"]+)"/);
  return match?.[1];
}

export async function fetchRSSNews(options: {
  keywords?: string;
  countries?: string[];
  limit?: number;
  offset?: number;
}): Promise<{ articles: Article[]; total: number }> {
  const { keywords, limit = 20, offset = 0 } = options;

  let feedsToFetch = RSS_FEEDS;

  if (keywords) {
    const kw = keywords.toLowerCase();
    feedsToFetch = [
      { url: `https://news.google.com/rss/search?q=${encodeURIComponent(kw)}&hl=en-US&gl=US&ceid=US:en`, source: "Google News", domain: "news.google.com" },
      ...RSS_FEEDS.filter((f) => f.source === "MarketWatch" || f.source === "CNBC"),
    ];
  }

  const results = await Promise.allSettled(
    feedsToFetch.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return (parsed.items || []).map((item): Article => ({
          providerId: item.guid || item.link || `${feed.source}-${item.title}`,
          title: item.title || "Untitled",
          description: item.contentSnippet || item.content || item.summary || "",
          url: item.link || "",
          sourceName: item.creator || feed.source,
          sourceDomain: feed.domain,
          imageUrl: item.enclosure?.url || extractImage(item.content || "") || null,
          publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
          relatedSymbols: [],
          industries: [],
          countries: ["US"],
          sentimentLabel: inferSentiment(item.title || "", item.contentSnippet || ""),
          sentimentScore: 0,
          retrievedAt: new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    })
  );

  const allArticles: Article[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      for (const article of r.value) {
        allArticles.push(article);
      }
    }
  }

  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    const key = a.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  const paginated = unique.slice(offset, offset + limit);

  return {
    articles: paginated,
    total: unique.length,
  };
}
