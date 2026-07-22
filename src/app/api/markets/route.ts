import { NextResponse } from "next/server";
import { getMultiQuotes } from "@/lib/providers/yahoo/client";

const US_INDEXES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "DOW J" },
  { symbol: "^VIX", name: "VIX" },
];

const CA_INDEXES = [
  { symbol: "^GSPTSE", name: "S&P/TSX" },
  { symbol: "^GSPTSE60", name: "S&P/TSX 60" },
  { symbol: "CADUSD=X", name: "CAD/USD" },
  { symbol: "BTC-CAD", name: "Bitcoin CAD" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") === "ca" ? "ca" : "us";
  const indexDefs = region === "ca" ? CA_INDEXES : US_INDEXES;
  const symbols = indexDefs.map((i) => i.symbol);

  const quotes = await getMultiQuotes(symbols);

  const data = indexDefs.map((def) => {
    const q = quotes.get(def.symbol);
    return {
      symbol: def.symbol,
      name: def.name,
      value: q?.price ?? 0,
      change: q?.change ?? 0,
      changePercent: q?.changePercent ?? 0,
      trend: (q?.change ?? 0) > 0 ? "up" : (q?.change ?? 0) < 0 ? "down" : "flat",
      currency: q?.currency ?? (region === "ca" ? "CAD" : "USD"),
      retrievedAt: q?.retrievedAt ?? new Date().toISOString(),
    };
  });

  return NextResponse.json({
    data,
    region,
    retrievedAt: new Date().toISOString(),
  });
}
