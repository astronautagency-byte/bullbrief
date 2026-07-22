import type { Article } from "@/lib/types";
import type { MarketauxNewsResponse } from "./types";

export function mapArticle(item: MarketauxNewsResponse["data"][0]): Article {
  const symbols = item.entities
    ?.filter((e) => e.type === "equity" || e.type === "index")
    .map((e) => e.symbol) ?? [];

  const industries = item.topics?.map((t) => t.topic) ?? [];
  const countries = item.entities?.map((e) => e.country).filter(Boolean) ?? [];

  let sentimentScore: number | null = null;
  let sentimentLabel: Article["sentimentLabel"] = null;
  if (item.topics && item.topics.length > 0) {
    const avgSentiment =
      item.topics.reduce((sum, t) => sum + t.sentiment_score, 0) /
      item.topics.length;
    sentimentScore = avgSentiment;
    if (avgSentiment > 0.1) sentimentLabel = "positive";
    else if (avgSentiment < -0.1) sentimentLabel = "negative";
    else sentimentLabel = "neutral";
  }

  return {
    providerId: item.uuid,
    title: item.title,
    description: item.description ?? item.snippet,
    sourceName: item.source.name,
    sourceDomain: item.source.url ? new URL(item.source.url).hostname : null,
    url: item.url,
    imageUrl: item.image_url,
    publishedAt: item.published_at,
    relatedSymbols: symbols,
    industries,
    countries: [...new Set(countries)],
    sentimentScore,
    sentimentLabel,
    retrievedAt: new Date().toISOString(),
  };
}

export function rankArticles(
  articles: Article[],
  watchlistSymbols: string[] = [],
  preferredIndustries: string[] = [],
  preferredCountries: string[] = []
): Article[] {
  const scored = articles.map((article) => {
    let score = 0;

    const matchingSymbols = article.relatedSymbols.filter((s) =>
      watchlistSymbols.includes(s)
    );
    score += matchingSymbols.length * 10;

    const matchingIndustries = article.industries.filter((i) =>
      preferredIndustries.includes(i)
    );
    score += matchingIndustries.length * 5;

    const matchingCountries = article.countries.filter((c) =>
      preferredCountries.includes(c)
    );
    score += matchingCountries.length * 2;

    const ageHours =
      (Date.now() - new Date(article.publishedAt).getTime()) / 3600000;
    score += Math.max(0, 24 - ageHours) * 0.5;

    if (article.sentimentLabel === "positive") score += 1;
    else if (article.sentimentLabel === "negative") score += 1;

    return { article, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.article);
}

export function deduplicateArticles(articles: Article[]): Article[] {
  const seen = new Map<string, Article>();

  for (const article of articles) {
    const normalizedTitle = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 80);

    const urlKey = new URL(article.url).pathname.toLowerCase();

    const titleKey = `title:${normalizedTitle}`;
    const urlKeyFormatted = `url:${urlKey}`;

    if (!seen.has(titleKey) && !seen.has(urlKeyFormatted)) {
      seen.set(titleKey, article);
      seen.set(urlKeyFormatted, article);
    }
  }

  const unique = new Set<Article>();
  for (const article of seen.values()) {
    unique.add(article);
  }
  return Array.from(unique);
}
