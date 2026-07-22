const watchlist = new Map<string, Set<string>>();

export function getWatchlist(): string[] {
  const stored = watchlist.get("default");
  return stored ? Array.from(stored) : [];
}

export function addToWatchlist(symbol: string): boolean {
  if (!watchlist.has("default")) {
    watchlist.set("default", new Set());
  }
  const s = watchlist.get("default")!;
  if (s.has(symbol)) return false;
  s.add(symbol);
  return true;
}

export function removeFromWatchlist(symbol: string): boolean {
  const s = watchlist.get("default");
  if (!s) return false;
  return s.delete(symbol);
}

export function isInWatchlist(symbol: string): boolean {
  const s = watchlist.get("default");
  return s ? s.has(symbol) : false;
}
