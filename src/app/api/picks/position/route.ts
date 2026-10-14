import { NextResponse } from "next/server";
import { getStockPrice } from "@/lib/providers/yahoo/client";
import { getStockDetails } from "@/lib/providers/morningstar";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const symbol = searchParams.get("symbol")?.trim().toUpperCase();
  const requestedExchange = searchParams.get("exchange")?.trim() || undefined;
  if (!symbol || !/^[A-Z0-9.^-]{1,12}$/.test(symbol)) {
    return NextResponse.json({ error: "Enter a valid stock symbol" }, { status: 400 });
  }

  const isToronto = symbol.endsWith(".TO");
  const isVenture = symbol.endsWith(".V");
  const researchTicker = symbol.replace(/\.(TO|V|NE)$/, "");
  const researchExchange =
    requestedExchange || (isToronto ? "TSX" : isVenture ? "TSXV" : undefined);

  const [quote, research] = await Promise.all([
    // Symbols selected from search are already exchange-qualified. Preserving the
    // exact Yahoo symbol avoids mapping a U.S. interlisted ticker (for example ENB)
    // to its Canadian listing.
    getStockPrice(symbol, Boolean(requestedExchange) || symbol.includes(".")),
    getStockDetails(researchTicker, researchExchange),
  ]);

  if (!quote) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  const researchAvailable = [
    research.starRating,
    research.fairValue,
    research.economicMoat,
    research.pe,
    research.priceToBook,
  ].some((value) => value != null);
  const moatLabel = research.economicMoat?.trim().toLowerCase();
  const economicMoat =
    moatLabel === "wide" || moatLabel === "narrow" || moatLabel === "none"
      ? `${moatLabel[0].toUpperCase()}${moatLabel.slice(1)} moat`
      : null;

  return NextResponse.json({
    data: {
      symbol,
      companyName: quote.companyName || research.name || symbol,
      price: quote.price,
      changePercent: quote.changePercent,
      currency: quote.currency,
      marketCap: quote.marketCap,
      pe: research.pe ?? quote.pe,
      priceToBook: research.priceToBook,
      priceToSales: research.priceToSales,
      dividendYield: research.dividendYield,
      starRating: research.starRating,
      fairValue: research.fairValue,
      economicMoat,
      sector: research.sector,
      industry: research.industry,
      researchAvailable,
    },
  });
}
