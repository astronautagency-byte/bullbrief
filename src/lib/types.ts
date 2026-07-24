export type Quote = {
  symbol: string;
  companyName: string | null;
  exchangeCode: string | null;
  currency: string | null;
  price: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  pe: number | null;
  marketCap: number | null;
  marketTimestamp: string | null;
  retrievedAt: string;
  dataType: "real_time" | "intraday" | "delayed" | "end_of_day";
  isStale: boolean;
};

export type Article = {
  providerId: string;
  title: string;
  description: string | null;
  sourceName: string;
  sourceDomain: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  relatedSymbols: string[];
  industries: string[];
  countries: string[];
  sentimentScore: number | null;
  sentimentLabel: "positive" | "neutral" | "negative" | null;
  retrievedAt: string;
};

export type Podcast = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  artworkUrl: string | null;
  websiteUrl: string | null;
  feedUrl: string | null;
  categories: string[];
};

export type Episode = {
  id: string;
  podcastId: string;
  podcastTitle: string;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  audioUrl: string | null;
  externalUrl: string | null;
  publishedAt: string | null;
  durationSeconds: number | null;
  categories: string[];
};

export type Watchlist = {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  items: WatchlistItem[];
};

export type WatchlistItem = {
  id: string;
  symbol: string;
  companyName: string | null;
  exchangeCode: string | null;
  sortOrder: number;
  addedAt: string;
};

export type UserPreferences = {
  id: string;
  timezone: string;
  briefingSchedule: "morning" | "market_close" | "both" | "none";
  marketInterests: string[];
  podcastInterests: string[];
  theme: "dark" | "light" | "system";
  countryFocus: "us" | "ca" | "both";
};

export type SavedArticle = {
  id: string;
  articleProviderId: string;
  title: string;
  url: string;
  savedAt: string;
};

export type SavedEpisode = {
  id: string;
  episodeProviderId: string;
  podcastTitle: string;
  episodeTitle: string;
  audioUrl: string | null;
  savedAt: string;
  progressSeconds: number;
};

export type BriefingData = {
  generatedAt: string;
  marketSummary: string;
  indexPerformance: IndexPerformance[];
  watchlistMovers: WatchlistMovers;
  headlineTopics: string[];
  sentimentScore: number | null;
};

export type IndexPerformance = {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  isPositive: boolean;
};

export type WatchlistMovers = {
  topGainer: { symbol: string; changePercent: number } | null;
  topDecliner: { symbol: string; changePercent: number } | null;
  mostMentioned: { symbol: string; mentionCount: number } | null;
  mostPositive: { symbol: string; sentimentScore: number } | null;
  mostNegative: { symbol: string; sentimentScore: number } | null;
};

export type MarketSnapshotItem = {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  sparklineData: number[];
  lastUpdated: string;
  dataType: Quote["dataType"];
};

export type TrendDirection = "up" | "down" | "neutral";

export function getTrendDirection(change: number | null): TrendDirection {
  if (change === null || change === 0) return "neutral";
  return change > 0 ? "up" : "down";
}

export function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(percent: number | null): string {
  if (percent === null) return "—";
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

export function formatChange(change: number | null): string {
  if (change === null) return "—";
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

export function formatVolume(volume: number | null): string {
  if (volume === null) return "—";
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDataFreshnessLabel(dataType: Quote["dataType"]): string {
  switch (dataType) {
    case "real_time":
      return "Live";
    case "intraday":
      return "Intraday";
    case "delayed":
      return "Delayed";
    case "end_of_day":
      return "End of day";
    default:
      return "Unknown";
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}
