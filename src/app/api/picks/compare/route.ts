import { NextResponse } from "next/server";
import { getStockPrices } from "@/lib/providers/yahoo/client";
import { getMultipleStockDetails } from "@/lib/providers/morningstar/rapidapi";

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

  const yahooQuotes = await getStockPrices(symbols);
  const priceMap = new Map(yahooQuotes.map((q) => [q.symbol, q]));

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
      marketCap: q?.marketCap ?? null,
      // Morningstar data
      pe: ms?.pe ?? q?.pe ?? null,
      starRating: ms?.starRating ?? null,
      starOutOf: ms?.starOutOf ?? 5,
      priceToBook: ms?.priceToBook ?? null,
      priceToSales: ms?.priceToSales ?? null,
      priceToCashFlow: ms?.priceToCashFlow ?? null,
      dividendYield: ms?.dividendYield ?? null,
      sector: ms?.sector ?? null,
      industry: ms?.industry ?? null,
      fairValue: ms?.fairValue ?? null,
      economicMoat: ms?.economicMoat ?? null,
    };
  });

  return NextResponse.json({ data });
}
