// In-memory store for demo mode (no PostgreSQL)
// All data is ephemeral — lost on server restart

export interface DemoWatchlist {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}

export interface DemoWatchlistItem {
  id: string;
  watchlistId: string;
  symbol: string;
  companyName: string | null;
  exchangeCode: string | null;
  sortOrder: number;
  addedAt: string;
}

export interface DemoSavedArticle {
  id: string;
  userId: string;
  articleProviderId: string;
  title: string;
  url: string;
  savedAt: string;
}

export interface DemoSavedEpisode {
  id: string;
  userId: string;
  episodeProviderId: string;
  podcastTitle: string;
  episodeTitle: string;
  audioUrl: string | null;
  savedAt: string;
  progressSeconds: number;
}

export interface DemoUserPreference {
  id: string;
  userId: string;
  timezone: string;
  briefingSchedule: string;
  marketInterests: string[];
  podcastInterests: string[];
  theme: string;
  countryFocus: string;
}

let watchlists = new Map<string, DemoWatchlist>();
let watchlistItems = new Map<string, DemoWatchlistItem>();
let savedArticles = new Map<string, DemoSavedArticle>();
let savedEpisodes = new Map<string, DemoSavedEpisode>();
let userPreferences = new Map<string, DemoUserPreference>();

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Watchlists
export function findWatchlists(userId: string): DemoWatchlist[] {
  return Array.from(watchlists.values()).filter((w) => w.userId === userId);
}

export function createWatchlist(userId: string, name: string): DemoWatchlist {
  const wl: DemoWatchlist = {
    id: genId("wl"),
    userId,
    name,
    isDefault: false,
    createdAt: new Date().toISOString(),
  };
  watchlists.set(wl.id, wl);
  return wl;
}

export function findWatchlistById(id: string): DemoWatchlist | undefined {
  return watchlists.get(id);
}

export function updateWatchlist(id: string, data: { name?: string }): DemoWatchlist | undefined {
  const wl = watchlists.get(id);
  if (!wl) return undefined;
  if (data.name) wl.name = data.name;
  return wl;
}

export function deleteWatchlist(id: string): boolean {
  return watchlists.delete(id);
}

export function countWatchlists(userId: string): number {
  return Array.from(watchlists.values()).filter((w) => w.userId === userId).length;
}

// Watchlist Items
export function findWatchlistItems(watchlistId: string): DemoWatchlistItem[] {
  return Array.from(watchlistItems.values())
    .filter((i) => i.watchlistId === watchlistId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findWatchlistItemById(id: string): DemoWatchlistItem | undefined {
  return watchlistItems.get(id);
}

export function findWatchlistItemBySymbol(watchlistId: string, symbol: string): DemoWatchlistItem | undefined {
  return Array.from(watchlistItems.values()).find(
    (i) => i.watchlistId === watchlistId && i.symbol === symbol
  );
}

export function createWatchlistItem(
  watchlistId: string,
  symbol: string,
  companyName: string | null,
  exchangeCode: string | null,
  sortOrder: number
): DemoWatchlistItem {
  const item: DemoWatchlistItem = {
    id: genId("wli"),
    watchlistId,
    symbol,
    companyName,
    exchangeCode,
    sortOrder,
    addedAt: new Date().toISOString(),
  };
  watchlistItems.set(item.id, item);
  return item;
}

export function updateWatchlistItem(id: string, data: { sortOrder?: number }): DemoWatchlistItem | undefined {
  const item = watchlistItems.get(id);
  if (!item) return undefined;
  if (data.sortOrder !== undefined) item.sortOrder = data.sortOrder;
  return item;
}

export function deleteWatchlistItem(id: string): boolean {
  return watchlistItems.delete(id);
}

// Saved Articles
export function findSavedArticles(userId: string): DemoSavedArticle[] {
  return Array.from(savedArticles.values()).filter((a) => a.userId === userId);
}

export function findSavedArticleById(id: string): DemoSavedArticle | undefined {
  return savedArticles.get(id);
}

export function findSavedArticleByProviderId(userId: string, providerId: string): DemoSavedArticle | undefined {
  return Array.from(savedArticles.values()).find(
    (a) => a.userId === userId && a.articleProviderId === providerId
  );
}

export function createSavedArticle(
  userId: string,
  articleProviderId: string,
  title: string,
  url: string
): DemoSavedArticle {
  const article: DemoSavedArticle = {
    id: genId("sa"),
    userId,
    articleProviderId,
    title,
    url,
    savedAt: new Date().toISOString(),
  };
  savedArticles.set(article.id, article);
  return article;
}

export function deleteSavedArticle(id: string): boolean {
  return savedArticles.delete(id);
}

// Saved Episodes
export function findSavedEpisodes(userId: string): DemoSavedEpisode[] {
  return Array.from(savedEpisodes.values()).filter((e) => e.userId === userId);
}

export function findSavedEpisodeById(id: string): DemoSavedEpisode | undefined {
  return savedEpisodes.get(id);
}

export function findSavedEpisodeByProviderId(userId: string, providerId: string): DemoSavedEpisode | undefined {
  return Array.from(savedEpisodes.values()).find(
    (e) => e.userId === userId && e.episodeProviderId === providerId
  );
}

export function createSavedEpisode(
  userId: string,
  episodeProviderId: string,
  podcastTitle: string,
  episodeTitle: string,
  audioUrl: string | null
): DemoSavedEpisode {
  const episode: DemoSavedEpisode = {
    id: genId("se"),
    userId,
    episodeProviderId,
    podcastTitle,
    episodeTitle,
    audioUrl,
    savedAt: new Date().toISOString(),
    progressSeconds: 0,
  };
  savedEpisodes.set(episode.id, episode);
  return episode;
}

export function deleteSavedEpisode(id: string): boolean {
  return savedEpisodes.delete(id);
}

// User Preferences
export function findUserPreference(userId: string): DemoUserPreference | undefined {
  return userPreferences.get(userId);
}

export function upsertUserPreference(
  userId: string,
  data: Partial<Omit<DemoUserPreference, "id" | "userId">>
): DemoUserPreference {
  const existing = userPreferences.get(userId);
  if (existing) {
    Object.assign(existing, data);
    return existing;
  }
  const pref: DemoUserPreference = {
    id: genId("pref"),
    userId,
    timezone: data.timezone || "America/New_York",
    briefingSchedule: data.briefingSchedule || "morning",
    marketInterests: data.marketInterests || [],
    podcastInterests: data.podcastInterests || [],
    theme: data.theme || "dark",
    countryFocus: data.countryFocus || "us",
  };
  userPreferences.set(userId, pref);
  return pref;
}
