import { NextResponse } from "next/server";
import { screenStocks } from "@/lib/providers/morningstar/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: {
    query?: string;
    sector?: string;
    peMax?: number;
    peMin?: number;
    starMin?: number;
  } = {};

  const query = searchParams.get("query");
  const sector = searchParams.get("sector");
  const peMax = searchParams.get("peMax");
  const peMin = searchParams.get("peMin");
  const starMin = searchParams.get("starMin");

  if (query) filters.query = query;
  if (sector) filters.sector = sector;
  if (peMax) filters.peMax = Number(peMax);
  if (peMin) filters.peMin = Number(peMin);
  if (starMin) filters.starMin = Number(starMin);

  try {
    const data = await screenStocks(filters);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Screener failed" },
      { status: err.status || 502 }
    );
  }
}
