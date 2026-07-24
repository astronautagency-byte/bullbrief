import { NextResponse } from "next/server";
import { getStockFundamentals } from "@/lib/providers/morningstar/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol parameter" }, { status: 400 });
  }

  try {
    const data = await getStockFundamentals(symbol);
    if (!data) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch stock data" },
      { status: err.status || 502 }
    );
  }
}
