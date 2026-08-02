import Parser from "rss-parser";
import type { Article } from "@/lib/types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "BullBrief/1.0",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
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
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
}

type MediaItem = {
  mediaContent?: { $?: { url?: string }; url?: string };
  mediaThumbnail?: { $?: { url?: string }; url?: string };
  contentEncoded?: string;
};

function rssImage(item: MediaItem & { enclosure?: { url?: string }; content?: string }): string | null {
  return item.enclosure?.url
    || item.mediaContent?.$?.url
    || item.mediaContent?.url
    || item.mediaThumbnail?.$?.url
    || item.mediaThumbnail?.url
    || extractImage(item.contentEncoded || item.content || "")
    || null;
}

async function openGraphImage(articleUrl: string): Promise<string | null> {
  if (!articleUrl) return null;
  try {
    const response = await fetch(articleUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BullBrief/1.0; +https://bullbrief.vercel.app)" },
      redirect: "follow",
      signal: AbortSignal.timeout(3500),
      next: { revalidate: 3600 },
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) return null;
    const html = (await response.text()).slice(0, 400_000);
    const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/i);
    if (!match?.[1]) return null;
    return new URL(match[1].replace(/&amp;/g, "&"), response.url).toString();
  } catch {
    return null;
  }
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
          imageUrl: rssImage(item as typeof item & MediaItem),
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
  const enriched = await Promise.all(
    paginated.map(async (article, index) => {
      if (article.imageUrl || index >= 16) return article;
      return { ...article, imageUrl: await openGraphImage(article.url) };
    })
  );

  return {
    articles: enriched,
    total: unique.length,
  };
}
