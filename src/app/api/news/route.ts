import { NextResponse } from "next/server";
import { getLatestNews, getNewsForSymbols, searchNews } from "@/lib/providers/marketaux/client";

const PAGES_PER_REQUEST = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get("symbols")?.split(",").filter(Boolean);
  const query = searchParams.get("q");
  const countries = searchParams.get("countries")?.split(",").filter(Boolean);
  const industries = searchParams.get("industries")?.split(",").filter(Boolean);
  const requestedLimit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const page = Number(searchParams.get("page")) || 1;

  try {
    let allArticles: Awaited<ReturnType<typeof getLatestNews>>["articles"] = [];
    let total = 0;

    if (query) {
      const results = await Promise.all(
        Array.from({ length: PAGES_PER_REQUEST }, (_, i) =>
          searchNews(query, {
            symbols: symbols ?? undefined,
            limit: 3,
            page: (page - 1) * PAGES_PER_REQUEST + i + 1,
          })
        )
      );
      for (const r of results) {
        allArticles.push(...r.articles);
        total = Math.max(total, r.total);
      }
    } else if (symbols?.length) {
      const results = await Promise.all(
        Array.from({ length: PAGES_PER_REQUEST }, (_, i) =>
          getNewsForSymbols(symbols, {
            limit: 3,
            page: (page - 1) * PAGES_PER_REQUEST + i + 1,
          })
        )
      );
      for (const r of results) {
        allArticles.push(...r.articles);
        total = Math.max(total, r.total);
      }
    } else {
      const results = await Promise.all(
        Array.from({ length: PAGES_PER_REQUEST }, (_, i) =>
          getLatestNews({
            countries: countries ?? undefined,
            industries: industries ?? undefined,
            limit: 3,
            page: (page - 1) * PAGES_PER_REQUEST + i + 1,
          })
        )
      );
      for (const r of results) {
        allArticles.push(...r.articles);
        total = Math.max(total, r.total);
      }
    }

    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter((a) => {
      if (seen.has(a.providerId)) return false;
      seen.add(a.providerId);
      return true;
    });

    return NextResponse.json({
      data: uniqueArticles,
      total,
      page,
      hasMore: uniqueArticles.length === requestedLimit || allArticles.length === PAGES_PER_REQUEST * 3,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", data: [], total: 0 },
      { status: 502 }
    );
  }
}
