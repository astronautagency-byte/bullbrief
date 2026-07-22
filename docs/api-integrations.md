# API Integrations

## Marketstack

**Purpose:** Stock market data, ticker search, historical prices

**Base URL:** `https://api.marketstack.com/v1`

**Authentication:** API key via `access_key` query parameter

### Endpoints Used

| Endpoint | Function | Cache Duration |
|---|---|---|
| `/tickers` | `searchTickers(query)` | 24 hours |
| `/tickers/:symbol` | `getTickerDetails(symbol)` | 7 days |
| `/eod/latest` | `getLatestPrices(symbols)` | 12 hours |
| `/eod/:symbol` | `getHistoricalPrices(symbol, from, to)` | 12 hours |

### Rate Limits
- Free: 100 requests/month
- Basic: 10,000 requests/month
- 1 request/second

### Assumptions
- End-of-day data is used by default (free tier limitation)
- Intraday data available on paid plans
- Historical data limited to 1 year on free tier

## Marketaux

**Purpose:** Financial news aggregation, sentiment analysis

**Base URL:** `https://api.marketaux.com/v1`

**Authentication:** API token via `api_token` query parameter

### Endpoints Used

| Endpoint | Function | Cache Duration |
|---|---|---|
| `/news/all` | `getLatestNews()` | 10 minutes |
| `/news/all` | `getNewsForSymbols(symbols)` | 10 minutes |
| `/news/all` | `getNewsForIndustries(industries)` | 10 minutes |
| `/news/all` | `searchNews(query)` | 10 minutes |

### Rate Limits
- Free: 100 API credits/month
- Basic: 50,000 API credits/month

### Ranking Algorithm
Articles are ranked by:
1. Watchlist symbol matches (weight: 10)
2. Industry matches (weight: 5)
3. Country matches (weight: 2)
4. Recency (weight: 0.5/hour)
5. Sentiment presence (weight: 1)

### Deduplication
- Normalized title matching
- Canonical URL matching

## Podcast API

**Purpose:** Podcast search, episode discovery

**Environment Variables:**
- `PODCAST_API_KEY`
- `PODCAST_API_USER_ID`
- `PODCAST_API_BASE_URL`

### Provider Interface

```typescript
interface PodcastProvider {
  searchPodcasts(query: string): Promise<Podcast[]>;
  searchEpisodes(query: string): Promise<Episode[]>;
  getPodcast(id: string): Promise<Podcast>;
  getRecentEpisodes(podcastId: string): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode>;
}
```

### Fallback
- Mock provider included for development
- App works without podcast API configured
