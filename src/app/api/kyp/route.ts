import { NextResponse } from "next/server";
import { KYP_HOLDINGS, type KypHolding, type KypProductRecord } from "@/lib/kyp";
import { autoComplete, getFundDetails, getStockDetails } from "@/lib/providers/morningstar";
import { getStockPrice } from "@/lib/providers/yahoo/client";

function scoreMatch(holding: KypHolding, name: string, ticker: string) {
  const needle = holding.searchQuery.toLowerCase();
  const exactTicker = ticker.toLowerCase() === needle;
  const nameMatch = name.toLowerCase().includes(needle);
  return exactTicker ? 3 : nameMatch ? 2 : 1;
}

async function buildRecord(holding: KypHolding): Promise<KypProductRecord> {
  const matches = await autoComplete(holding.searchQuery);
  const expectedType = holding.assetType === "stock" ? "ST" : "FE";
  const identity = matches
    .filter((item) => item.securityType === expectedType)
    .sort((a, b) => {
      if (holding.performanceId) {
        if (a.performanceId === holding.performanceId) return -1;
        if (b.performanceId === holding.performanceId) return 1;
      }
      return scoreMatch(holding, b.name, b.ticker) - scoreMatch(holding, a.name, a.ticker);
    })[0];

  const [quote, research] = holding.assetType === "stock" && holding.symbol
    ? await Promise.all([
        getStockPrice(holding.symbol, true, true),
        getStockDetails(holding.symbol.replace(/\.(TO|V|NE)$/i, ""), holding.exchange),
      ])
    : holding.assetType === "fund" && (holding.performanceId || identity?.performanceId)
      ? [null, await getFundDetails(holding.performanceId || identity!.performanceId, identity?.name || holding.requestedName)]
      : [null, null];

  const hasResearch = Boolean(identity) || Boolean(research && [
    research.pe,
    research.starRating,
    research.fairValue,
    research.sector,
  ].some((value) => value != null));
  const hasQuote = Boolean(quote?.price != null);
  const moat = research?.economicMoat?.trim().toLowerCase();
  const economicMoat = moat === "wide" || moat === "narrow" || moat === "none" ? `${moat[0].toUpperCase()}${moat.slice(1)}` : null;

  return {
    ...holding,
    status: hasResearch && (holding.assetType === "fund" || hasQuote) ? "verified" : hasResearch || hasQuote ? "partial" : "not_found",
    asOf: new Date().toISOString(),
    identity: {
      performanceId: identity?.performanceId || research?.performanceId || null,
      name: identity?.name || research?.name || quote?.companyName || null,
      ticker: identity?.ticker || holding.symbol || null,
      exchange: identity?.exchange || holding.exchange || quote?.exchangeCode || null,
    },
    facts: {
      price: quote?.price ?? null,
      changePercent: quote?.changePercent ?? null,
      currency: quote?.currency ?? null,
      sector: research?.sector ?? null,
      industry: research?.industry ?? null,
      pe: research?.pe ?? quote?.pe ?? null,
      priceToBook: research?.priceToBook ?? null,
      priceToSales: research?.priceToSales ?? null,
      priceToCashFlow: research?.priceToCashFlow ?? null,
      dividendYield: research?.dividendYield ?? null,
      fairValue: research?.fairValue ?? null,
      starRating: research?.starRating ?? null,
      economicMoat,
      marketCap: quote?.marketCap ?? null,
      volume: quote?.volume ?? null,
      averageVolume: quote?.averageVolume ?? null,
      fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? null,
      fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
      bid: quote?.bid ?? null,
      ask: quote?.ask ?? null,
    },
    morningstar: {
      profileDescription: research?.profileDescription ?? null,
      styleBox: research?.styleBox ?? null,
      employees: research?.employees ?? null,
      website: research?.website ?? null,
      cusip: research?.cusip ?? null,
      isin: research?.isin ?? null,
      analystReportTitle: research?.analystReportTitle ?? null,
      analystName: research?.analystName ?? null,
      reportPublishedAt: research?.reportPublishedAt ?? null,
      reportUpdatedAt: research?.reportUpdatedAt ?? null,
      ratingAsOf: research?.ratingAsOf ?? null,
      evaluatedPrice: research?.evaluatedPrice ?? null,
      fairValueAsOf: research?.fairValueAsOf ?? null,
      fairValueCurrency: research?.fairValueCurrency ?? null,
      fairValueUncertainty: research?.fairValueUncertainty ?? null,
      oneStarPrice: research?.oneStarPrice ?? null,
      twoStarPrice: research?.twoStarPrice ?? null,
      fourStarPrice: research?.fourStarPrice ?? null,
      fiveStarPrice: research?.fiveStarPrice ?? null,
      forwardDividendYield: research?.forwardDividendYield ?? null,
      totalYield: research?.totalYield ?? null,
      dividendMonths: research?.dividendMonths ?? [],
      returnOnAssets: research?.returnOnAssets ?? null,
      returnOnEquity: research?.returnOnEquity ?? null,
      returnOnCapital: research?.returnOnCapital ?? null,
      quickRatio: research?.quickRatio ?? null,
      currentRatio: research?.currentRatio ?? null,
      interestCoverage: research?.interestCoverage ?? null,
      sharesOutstanding: research?.sharesOutstanding ?? null,
      competitors: research?.competitors ?? [],
      availableComponents: research?.availableComponents ?? [],
      lockedComponents: research?.lockedComponents ?? [],
      requestStatus: research?.requestStatus ?? "unavailable",
      retrievedAt: research?.retrievedAt ?? null,
    },
  };
}

export async function POST(request: Request) {
  let requested: unknown;
  try {
    requested = (await request.json()).holdings;
  } catch {
    requested = undefined;
  }

  const allowed = new Map(KYP_HOLDINGS.map((holding) => [holding.id, holding]));
  const normalizeHolding = (item: unknown): KypHolding | null => {
    if (typeof item === "string") return allowed.get(item) || null;
    if (!item || typeof item !== "object") return null;
    const candidate = item as Record<string, unknown>;
    const id = typeof candidate.id === "string" ? candidate.id.trim().slice(0, 80) : "";
    const requestedName = typeof candidate.requestedName === "string" ? candidate.requestedName.trim().slice(0, 140) : "";
    const searchQuery = typeof candidate.searchQuery === "string" ? candidate.searchQuery.trim().slice(0, 80) : "";
    const assetType = candidate.assetType === "fund" || candidate.assetType === "stock" ? candidate.assetType : null;
    if (!id || !requestedName || !searchQuery || !assetType || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
    const symbol = typeof candidate.symbol === "string" ? candidate.symbol.trim().toUpperCase().slice(0, 20) : undefined;
    const exchange = typeof candidate.exchange === "string" ? candidate.exchange.trim().toUpperCase().slice(0, 20) : undefined;
    const performanceId = typeof candidate.performanceId === "string" ? candidate.performanceId.trim().slice(0, 80) : undefined;
    return { id, requestedName, searchQuery, assetType, ...(symbol ? { symbol } : {}), ...(exchange ? { exchange } : {}), ...(performanceId ? { performanceId } : {}) };
  };
  const holdings = Array.isArray(requested)
    ? requested.slice(0, 20).map(normalizeHolding).filter((item): item is KypHolding => Boolean(item))
    : KYP_HOLDINGS;
  const records = await Promise.all(holdings.map(buildRecord));

  return NextResponse.json(
    { data: records, source: "Morningstar", generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
