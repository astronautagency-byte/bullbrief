import { NextResponse } from "next/server";
import { getStockPrice, getHistoricalData } from "@/lib/providers/yahoo/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = (searchParams.get("range") || "1mo") as "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const [quote, history] = await Promise.all([
    getStockPrice(symbol),
    getHistoricalData(symbol, range),
  ]);

  return NextResponse.json({
    quote,
    history: history?.points.map((p) => ({
      date: p.date,
      value: p.close,
    })) ?? [],
    range,
  });
}
