import { NextResponse } from "next/server";
import { getHistoricalData } from "@/lib/providers/yahoo/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = (searchParams.get("range") || "1mo") as "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const data = await getHistoricalData(symbol, range);

  if (!data) {
    return NextResponse.json({ data: [], symbol, range });
  }

  return NextResponse.json({
    data: data.points.map((p) => ({
      date: p.date,
      value: p.close,
    })),
    symbol: data.symbol,
    range,
    currency: data.currency,
  });
}
