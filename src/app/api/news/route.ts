import { NextResponse } from "next/server";
import { fetchRSSNews } from "@/lib/providers/rss-news/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keywords = searchParams.get("q") || undefined;
  const countries = searchParams.get("countries")?.split(",").filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit")) || 25, 100);
  const page = Number(searchParams.get("page")) || 1;
  const offset = (page - 1) * limit;

  try {
    const result = await fetchRSSNews({
      keywords,
      countries,
      limit,
      offset,
    });

    return NextResponse.json({
      data: result.articles,
      total: result.total,
      page,
      hasMore: offset + limit < result.total,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    return NextResponse.json(
      { data: [], total: 0, page, hasMore: false },
      { status: 200 }
    );
  }
}
