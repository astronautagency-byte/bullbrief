import { NextResponse } from "next/server";
import { getLatestPrices } from "@/lib/providers/marketstack/client";
import { tickerDetailsSchema } from "@/lib/providers/marketstack/schemas";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const parsed = tickerDetailsSchema.safeParse({ symbol });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid symbol parameter" },
      { status: 400 }
    );
  }

  try {
    const data = await getLatestPrices([parsed.data.symbol]);
    if (data.length === 0) {
      return NextResponse.json(
        { error: "Symbol not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error("Quote fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 502 }
    );
  }
}
