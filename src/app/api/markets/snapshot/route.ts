import { NextResponse } from "next/server";
import { getMarketSnapshot } from "@/lib/providers/marketstack/client";
import { marketSnapshotSchema } from "@/lib/providers/marketstack/schemas";

const DEFAULT_INDEXES = ["SPX", "IXIC", "DJI", "TSX"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = symbolsParam
    ? symbolsParam.split(",").map((s) => s.trim())
    : DEFAULT_INDEXES;

  const parsed = marketSnapshotSchema.safeParse({ symbols });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid symbols parameter" },
      { status: 400 }
    );
  }

  try {
    const data = await getMarketSnapshot(parsed.data.symbols);
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Market snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market snapshot" },
      { status: 502 }
    );
  }
}
