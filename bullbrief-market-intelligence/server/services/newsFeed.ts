import Parser from 'rss-parser';
import type { NewsItem } from '../../src/types.js';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail'],
  },
});

const FEEDS = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'YAHOO FINANCE', category: 'markets' as const },
  { url: 'https://www.investing.com/rss/news_25.rss', source: 'INVESTING.COM', category: 'markets' as const },
  { url: 'https://cointelegraph.com/rss', source: 'COINTELEGRAPH', category: 'crypto' as const },
];

function timeAgo(timestamp: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds || 1} SEC AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} MIN AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} HOUR${hours > 1 ? 'S' : ''} AGO`;
  const days = Math.floor(hours / 24);
  return `${days} DAY${days > 1 ? 'S' : ''} AGO`;
}

function parsePubDate(item: Parser.Item): number {
  const raw = item.pubDate || item.isoDate;
  if (!raw) return Date.now();

  const parsed = new Date(raw);
  const timestamp = parsed.getTime();
  if (Number.isNaN(timestamp)) return Date.now();

  return Math.min(timestamp, Date.now());
}

function makeNewsId(source: string, item: Parser.Item): string {
  const key = `${source}:${item.guid || item.link || item.title || ''}`;
  return `news-${Buffer.from(key).toString('base64url').slice(0, 24)}`;
}

function extractText(item: Parser.Item): string {
  const raw =
    item.contentSnippet ||
    item.summary ||
    item.content?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
    item.title ||
    '';

  return raw.slice(0, 320);
}

function extractImage(item: Parser.Item): string {
  const mediaContent = (item as Record<string, unknown>)['media:content'] as { $?: { url?: string } } | undefined;
  if (mediaContent?.$?.url) return mediaContent.$.url;

  const enclosure = item.enclosure?.url;
  if (enclosure && /\.(jpg|jpeg|png|webp|gif)/i.test(enclosure)) return enclosure;

  const content = item.content || item.contentSnippet || '';
  const imgMatch = content.match(/src="([^"]+)"/);
  if (imgMatch) return imgMatch[1];

  return 'https://images.unsplash.com/photo-1611974789855-9c245a0869e9?w=400&h=250&fit=crop';
}

function categorize(title: string, text: string, defaultCategory: NewsItem['category']): NewsItem['category'] {
  const combined = `${title} ${text}`.toLowerCase();
  if (/bitcoin|crypto|ethereum|blockchain|btc|eth|solana/.test(combined)) return 'crypto';
  if (/forex|currency|eur\/usd|gbp|yen|dollar index/.test(combined)) return 'forex';
  if (/stock|market|fed|treasury|earnings|s&p|nasdaq|equity/.test(combined)) return 'markets';
  return defaultCategory;
}

export async function fetchLatestNews(limit = 20): Promise<NewsItem[]> {
  const allItems: Array<NewsItem & { pubTimestamp: number }> = [];

  await Promise.allSettled(
    FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of parsed.items.slice(0, 8)) {
          if (!item.title) continue;
          const pubTimestamp = parsePubDate(item);
          const text = extractText(item);

          allItems.push({
            id: makeNewsId(feed.source, item),
            source: feed.source,
            time: timeAgo(pubTimestamp),
            title: item.title,
            text,
            imageUrl: extractImage(item),
            category: categorize(item.title, text, feed.category),
            pubTimestamp,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch feed ${feed.url}:`, error);
      }
    })
  );

  return allItems
    .sort((a, b) => b.pubTimestamp - a.pubTimestamp)
    .slice(0, limit)
    .map(({ pubTimestamp: _pubTimestamp, ...item }) => item);
}
