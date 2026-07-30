export const DEFAULT_WATCHLIST_ID = "default";
export const WATCHLIST_METADATA_KEY = "bullbrief_watchlist";
export const WATCHLIST_NAME_METADATA_KEY = "bullbrief_watchlist_name";
export const MAX_WATCHLIST_ITEMS = 100;

export interface AccountWatchlistItem {
  id: string;
  symbol: string;
  companyName: string | null;
  exchangeCode: string | null;
  sortOrder: number;
  addedAt: string;
}

export interface AccountWatchlist {
  id: string;
  name: string;
  isDefault: true;
  createdAt: string;
  updatedAt: string;
  items: AccountWatchlistItem[];
}

function isWatchlistItem(value: unknown): value is AccountWatchlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AccountWatchlistItem>;
  return (
    typeof item.id === "string" &&
    typeof item.symbol === "string" &&
    typeof item.sortOrder === "number" &&
    typeof item.addedAt === "string"
  );
}

export function readAccountWatchlist(
  metadata: Record<string, unknown> | undefined
): AccountWatchlist {
  const rawItems = metadata?.[WATCHLIST_METADATA_KEY];
  const items = Array.isArray(rawItems)
    ? rawItems
        .filter(isWatchlistItem)
        .map((item) => ({
          ...item,
          symbol: item.symbol.toUpperCase(),
          companyName: typeof item.companyName === "string" ? item.companyName : null,
          exchangeCode: typeof item.exchangeCode === "string" ? item.exchangeCode : null,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .slice(0, MAX_WATCHLIST_ITEMS)
    : [];

  const timestamps = items.map((item) => item.addedAt).sort();
  return {
    id: DEFAULT_WATCHLIST_ID,
    name:
      typeof metadata?.[WATCHLIST_NAME_METADATA_KEY] === "string"
        ? metadata[WATCHLIST_NAME_METADATA_KEY]
        : "My Watchlist",
    isDefault: true,
    createdAt: timestamps[0] ?? new Date(0).toISOString(),
    updatedAt: timestamps.at(-1) ?? new Date(0).toISOString(),
    items,
  };
}

export function watchlistMetadataUpdate(
  watchlist: Pick<AccountWatchlist, "name" | "items">
): Record<string, unknown> {
  return {
    [WATCHLIST_METADATA_KEY]: watchlist.items,
    [WATCHLIST_NAME_METADATA_KEY]: watchlist.name,
  };
}
