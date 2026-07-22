import { NextResponse } from "next/server";
import { getHistoricalPrices } from "@/lib/providers/marketstack/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const { searchParams } = new URL(_request.url);
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: "from and to query parameters are required" },
      { status: 400 }
    );
  }

  try {
    const data = await getHistoricalPrices(symbol, dateFrom, dateTo);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Historical prices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical prices" },
      { status: 502 }
    );
  }
}
