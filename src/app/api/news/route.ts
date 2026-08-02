import { NextResponse } from "next/server";
import { fetchRSSNews } from "@/lib/providers/rss-news/client";
import { getLatestNews, searchNews } from "@/lib/providers/marketaux/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("q") || undefined;
  const countries = searchParams.get("countries")?.split(",").filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
  const page = Number(searchParams.get("page")) || 1;
  const offset = (page - 1) * limit;

  try {
    const [marketauxResult, rssResult] = await Promise.allSettled([
      keywords
        ? searchNews(keywords, { limit: Math.min(limit, 3), page, preferredCountries: countries })
        : getLatestNews({ countries, limit: Math.min(limit, 3), page }),
      fetchRSSNews({ keywords, countries, limit, offset }),
    ]);
    const primary = marketauxResult.status === "fulfilled" ? marketauxResult.value : { articles: [], total: 0 };
    const fallback = rssResult.status === "fulfilled" ? rssResult.value : { articles: [], total: 0 };
    const seen = new Set<string>();
    const articles = [...primary.articles, ...fallback.articles]
      .filter((article) => {
        const key = article.title.toLowerCase().replace(/\W/g, "").slice(0, 80);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, limit);
    const result = { articles, total: Math.max(primary.total, fallback.total) };

    return NextResponse.json({
      data: result.articles,
      total: result.total,
      page,
      hasMore: page * limit < result.total,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { data: [], total: 0, page, hasMore: false },
      { status: 200 }
    );
  }
}
