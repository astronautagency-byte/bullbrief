import { NextResponse } from "next/server";
import { getLatestNews, getNewsForSymbols, searchNews } from "@/lib/providers/marketaux/client";

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
    let quotaExceeded = false;

    try {
      if (query) {
        const results = await Promise.allSettled(
          Array.from({ length: 2 }, (_, i) =>
            searchNews(query, {
              symbols: symbols ?? undefined,
              limit: 5,
              page: (page - 1) * 2 + i + 1,
            })
          )
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            allArticles.push(...r.value.articles);
            total = Math.max(total, r.value.total);
          }
        }
      } else if (symbols?.length) {
        const results = await Promise.allSettled(
          Array.from({ length: 2 }, (_, i) =>
            getNewsForSymbols(symbols, {
              limit: 5,
              page: (page - 1) * 2 + i + 1,
            })
          )
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            allArticles.push(...r.value.articles);
            total = Math.max(total, r.value.total);
          }
        }
      } else {
        const results = await Promise.allSettled(
          Array.from({ length: 2 }, (_, i) =>
            getLatestNews({
              countries: countries ?? undefined,
              industries: industries ?? undefined,
              limit: 5,
              page: (page - 1) * 2 + i + 1,
            })
          )
        );
        for (const r of results) {
          if (r.status === "fulfilled") {
            allArticles.push(...r.value.articles);
            total = Math.max(total, r.value.total);
          }
        }
      }
    } catch (err: any) {
      if (err?.message?.includes("usage_limit") || err?.message?.includes("limit_reached")) {
        quotaExceeded = true;
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
      hasMore: uniqueArticles.length >= requestedLimit,
      quotaExceeded,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { data: [], total: 0, page, hasMore: false, quotaExceeded: true },
      { status: 200 }
    );
  }
}
