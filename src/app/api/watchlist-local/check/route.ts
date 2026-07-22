import { NextResponse } from "next/server";
import { isInWatchlist } from "@/lib/watchlist-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }
  return NextResponse.json({ inWatchlist: isInWatchlist(symbol.toUpperCase()) });
}
