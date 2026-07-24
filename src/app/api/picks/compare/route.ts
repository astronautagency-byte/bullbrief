import { NextResponse } from "next/server";
import { compareStocks } from "@/lib/providers/morningstar/client";

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

  try {
    const data = await compareStocks(symbols);
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to compare stocks" },
      { status: err.status || 502 }
    );
  }
}
