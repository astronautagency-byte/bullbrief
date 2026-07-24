import { prisma } from "@/lib/prisma";

const CACHE_DURATIONS: Record<string, number> = {
  "ticker-search": 24 * 60 * 60 * 1000,
  "ticker-metadata": 7 * 24 * 60 * 60 * 1000,
  "historical-eod": 12 * 60 * 60 * 1000,
  headlines: 10 * 60 * 1000,
  "podcast-search": 6 * 60 * 60 * 1000,
  "podcast-episodes": 60 * 60 * 1000,
  "daily-brief": 15 * 60 * 1000,
};

export async function getCached<T>(
  key: string,
  cacheType: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const ttl = CACHE_DURATIONS[cacheType] ?? 10 * 60 * 1000;

  try {
    if (!prisma) throw new Error("no db");
    const cached = await prisma.providerCache.findUnique({
      where: { key },
    });

    if (cached && cached.expiresAt > new Date()) {
      return cached.data as T;
    }
  } catch {
    // Cache read failed, proceed to fetch
  }

  const data = await fetcher();

  try {
    if (!prisma) throw new Error("no db");
    await prisma.providerCache.upsert({
      where: { key },
      create: {
        key,
        data: data as unknown as object,
        expiresAt: new Date(Date.now() + ttl),
      },
      update: {
        data: data as unknown as object,
        expiresAt: new Date(Date.now() + ttl),
      },
    });
  } catch {
    // Cache write failed silently
  }

  return data;
}

export async function getStaleCached<T>(key: string): Promise<T | null> {
  try {
    if (!prisma) return null;
    const cached = await prisma.providerCache.findUnique({
      where: { key },
    });
    if (cached) {
      return cached.data as T;
    }
  } catch {
    // Ignore
  }
  return null;
}
