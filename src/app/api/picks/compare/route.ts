import { NextResponse } from "next/server";
import { getStockPrices } from "@/lib/providers/yahoo/client";
import { getMultipleStockDetails } from "@/lib/providers/morningstar/rapidapi";

const EXCHANGE_MAP: Record<string, string> = {
  NASDAQ: "XNAS",
  NYSE: "XNYSE",
  TSX: "XTSE",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length < 2) {
    return NextResponse.json({ error: "At least 2 symbols required" }, { status: 400 });
  }

  if (symbols.length > 6) {
    return NextResponse.json({ error: "Maximum 6 symbols" }, { status: 400 });
  }

  // Fetch Yahoo prices (always works)
  const yahooQuotes = await getStockPrices(symbols);
  const priceMap = new Map(yahooQuotes.map((q) => [q.symbol, q]));

  // Fetch Morningstar details (P/E + star rating) via RapidAPI
  const morningstarDetails = await getMultipleStockDetails(
    symbols.map((s) => ({ ticker: s }))
  );

  const data = symbols.map((sym) => {
    const q = priceMap.get(sym);
    const ms = morningstarDetails.get(sym);
    return {
      symbol: sym,
      companyName: q?.companyName || ms?.name || sym,
      price: q?.price ?? null,
      change: q?.change ?? null,
      changePercent: q?.changePercent ?? null,
      pe: ms?.pe ?? q?.pe ?? null,
      starRating: ms?.starRating ?? null,
      starOutOf: ms?.starOutOf ?? 5,
    };
  });

  return NextResponse.json({ data });
}
