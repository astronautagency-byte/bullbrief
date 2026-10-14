# API Integrations

## Advisor workspace data coverage

BullBrief can reproduce the workflow and information architecture of a professional multi-panel research terminal, but not proprietary subscription data without equivalent licences. UI modules must render only fields returned by an approved provider.

| Workspace dataset | Current BullBrief source | Status |
|---|---|---|
| Quotes, OHLC, volume and price history | Yahoo public market endpoints, with Marketstack fallback | Connected, conservatively labelled delayed |
| Annual and quarterly financial statements | Yahoo fundamentals time-series; Morningstar service when configured | Connected |
| Company profile and valuation ratios | Morningstar Direct or RapidAPI fallback; Yahoo profile fallback | Connected where entitled |
| Analyst rating and target price | Yahoo insights research feed; Morningstar research when entitled | Connected where published |
| Technical outlook, support, resistance and relative valuation | Yahoo insights feed, Trading Central attribution | Connected where published |
| Company and portfolio news | Marketaux and publisher RSS | Connected |
| Advisor holdings, market value and unrealized gain or loss | BullBrief watchlists and position records | Connected |
| Fund ratings, risk, fees, holdings and factsheets | Morningstar Direct Web Services | Requires Morningstar account and entitled views |
| Real-time options flow and unusual activity | No approved provider | Licensed provider required, such as Unusual Whales |
| Premium real-time newswires | No approved provider | Licensed newswire agreement required |
| Streaming real-time exchange quotes | Current providers do not guarantee streaming entitlement | Exchange-licensed feed required |

Public Yahoo endpoints are a development and fallback source, not a substitute for a commercial redistribution agreement. Production use must be reviewed against provider terms and Canadian and U.S. exchange entitlements.

## Morningstar Direct Web Services

**Purpose:** Licensed equity and managed-investment reference data, research fields, ratings, risk, holdings, fees and KYP report inputs

**Base URL:** `https://www.us-api.morningstar.com/direct-web-services` for the Americas, unless Morningstar supplies a different regional URL

**Authentication:** Server-side OAuth bearer token. Credentials and tokens must never be exposed to the browser.

### BullBrief integration

BullBrief uses the official Direct Web Services adapter as the primary Morningstar source when it is fully configured. The legacy RapidAPI adapter remains a temporary fallback so the demo does not lose existing research fields while Morningstar licensing and entitlements are being provisioned.

The adapter uses the Investment Details endpoint:

```text
GET /v1/investments/{id}/{viewId}?idType={identifierType}
```

BullBrief also checks the account's available investment views with:

```text
GET /v1/investments/views
```

View IDs are not hard-coded because they depend on the datasets licensed to the Morningstar account. Add the exact equity and managed-investment view IDs supplied by Morningstar.

### Required environment variables

| Variable | Purpose |
|---|---|
| `MORNINGSTAR_DWS_BASE_URL` | Regional Direct Web Services base URL |
| `MORNINGSTAR_DWS_AUTH_URL` | Morningstar token endpoint supplied for the account |
| `MORNINGSTAR_DWS_USERNAME` | Morningstar as a Service username |
| `MORNINGSTAR_DWS_PASSWORD` | Morningstar as a Service password |
| `MORNINGSTAR_DWS_CLIENT_ID` | OAuth client ID, when required by the account |
| `MORNINGSTAR_DWS_CLIENT_SECRET` | OAuth client secret, when required by the account |
| `MORNINGSTAR_DWS_EQUITY_VIEW` | Entitled Investment Details equity view ID |
| `MORNINGSTAR_DWS_MANAGED_VIEW` | Entitled Investment Details managed-investment view ID |
| `MORNINGSTAR_DWS_ACCESS_TOKEN` | Optional short-lived token for a local connection test only |
| `MORNINGSTAR_DWS_FACTSHEET_URL_TEMPLATE` | Entitled Reports API URL or path supplied by Morningstar, using `{performanceId}` and optionally `{languageId}` placeholders |
| `MORNINGSTAR_DWS_FACTSHEET_METHOD` | Reports API method, normally `GET` or `POST` |
| `MORNINGSTAR_DWS_FACTSHEET_BODY_TEMPLATE` | Optional JSON request template for a POST-based report contract |

Use the authenticated `/api/morningstar/status` endpoint to validate authentication and list the account's entitled investment views. It never returns credentials or access tokens.

Fund factsheets are retrieved through the authenticated `/api/kyp/factsheet` proxy. The browser never receives the Morningstar access token or upstream report URL. Morningstar configures report delivery during onboarding, so the URL and request template remain environment configuration rather than a guessed hard-coded endpoint.

### Data rules

- Morningstar calls run only on the server.
- Access tokens are cached in memory and renewed before expiry.
- Licensed data is displayed only when the selected view actually returns it.
- Missing or unentitled fields stay empty. They are not fabricated.
- Custom Data API is reserved for institution-specific universes or overrides. It is not the primary source for standard security research.

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
