import { NextResponse } from "next/server";
import { searchStocks } from "@/lib/providers/yahoo/client";
import { searchTickersSchema } from "@/lib/providers/marketstack/schemas";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  const parsed = searchTickersSchema.safeParse({ query });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameter" },
      { status: 400 }
    );
  }

  try {
    const results = await searchStocks(parsed.data.query);
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Yahoo Finance search error:", error);
    return NextResponse.json(
      { error: "Failed to search tickers" },
      { status: 502 }
    );
  }
}
