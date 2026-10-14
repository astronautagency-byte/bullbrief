import { NextResponse } from "next/server";
import { getStockPrice, getHistoricalData, getStockAnalysis, getStockFinancialSeries } from "@/lib/providers/yahoo/client";
import { getStockDetails } from "@/lib/providers/morningstar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const range = (searchParams.get("range") || "1mo") as "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "5y" | "max";

  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }

  const [quote, history, volumeHistory, analysis, financialSeries] = await Promise.all([
    getStockPrice(symbol),
    getHistoricalData(symbol, range),
    getHistoricalData(symbol, "3mo"),
    getStockAnalysis(symbol),
    getStockFinancialSeries(symbol),
  ]);

  const researchTicker = symbol.replace(/\.(TO|V|NE)$/i, "");
  const researchExchange = symbol.endsWith(".TO") || quote?.currency === "CAD" ? "TSX" : quote?.exchangeCode || undefined;
  const research = await getStockDetails(researchTicker, researchExchange);
  const volumes = (volumeHistory?.points ?? []).map((point) => point.volume).filter((volume) => volume > 0);
  const calculatedAverageVolume = volumes.length
    ? Math.round(volumes.reduce((total, volume) => total + volume, 0) / volumes.length)
    : null;
  const calculatedMarketCap = research.sharesOutstanding != null && quote?.price != null
    ? research.sharesOutstanding * quote.price
    : null;
  const enrichedQuote = quote ? {
    ...quote,
    averageVolume: quote.averageVolume ?? calculatedAverageVolume,
    marketCap: quote.marketCap ?? calculatedMarketCap,
    pe: research.pe ?? quote.pe,
  } : null;

  return NextResponse.json({
    quote: enrichedQuote,
    fundamentals: {
      sector: research.sector,
      industry: research.industry,
      dividendYield: research.dividendYield,
      priceToBook: research.priceToBook,
      priceToSales: research.priceToSales,
      priceToCashFlow: research.priceToCashFlow,
      fairValue: research.fairValue,
      economicMoat: research.economicMoat,
      profileDescription: research.profileDescription ?? analysis?.profile.description ?? null,
      website: research.website ?? analysis?.profile.website ?? null,
      employees: research.employees ?? analysis?.profile.employees ?? null,
    },
    analysis,
    financialSeries,
    history: history?.points.map((p) => ({
      date: p.date,
      value: p.close,
      volume: p.volume,
    })) ?? [],
    range,
  });
}
