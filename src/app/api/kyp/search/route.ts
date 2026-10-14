import { NextResponse } from "next/server";
import { autoComplete } from "@/lib/providers/morningstar/rapidapi";
import { searchStocks } from "@/lib/providers/yahoo/client";
import type { KypAssetType } from "@/lib/kyp";

const CANADIAN_EXCHANGES = new Set(["XTSE", "XTSX", "TSX", "TSXV", "TOR", "VAN", "NEO", "CSE", "CNQ"]);
const US_EXCHANGES = new Set(["XNAS", "XNYS", "XNYSE", "XASE", "XARC", "NASDAQ", "NYSE", "AMEX", "NMS", "NGM", "NCM", "NYQ", "ASE", "PCX", "BTS"]);

function marketLabel(exchange: string, ticker: string) {
  const value = exchange.trim().toUpperCase();
  if (CANADIAN_EXCHANGES.has(value) || /\.(TO|V|NE)$/i.test(ticker)) {
    if (value === "XTSX" || value === "TSXV" || value === "VAN" || ticker.endsWith(".V")) return "TSXV";
    if (value === "NEO" || ticker.endsWith(".NE")) return "NEO";
    if (value === "CSE" || value === "CNQ") return "CSE";
    return "TSX";
  }
  if (["XNAS", "NASDAQ", "NMS", "NGM", "NCM"].includes(value)) return "NASDAQ";
  if (["XASE", "AMEX", "ASE"].includes(value)) return "AMEX";
  if (["XARC", "PCX"].includes(value)) return "NYSE Arca";
  return "NYSE";
}

function isCanadaOrUs(exchange: string, ticker: string) {
  const value = exchange.trim().toUpperCase();
  return CANADIAN_EXCHANGES.has(value) || US_EXCHANGES.has(value) || /\.(TO|V|NE)$/i.test(ticker);
}

function quoteSymbol(ticker: string, exchange: string) {
  const value = ticker.trim().toUpperCase();
  if (value.includes(".")) return value;
  const market = marketLabel(exchange, value);
  if (market === "TSX") return `${value}.TO`;
  if (market === "TSXV") return `${value}.V`;
  if (market === "NEO") return `${value}.NE`;
  return value;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("q") || "").trim().slice(0, 80);
  const requestedType = params.get("type");
  const type: KypAssetType | "all" = requestedType === "stock" || requestedType === "fund" ? requestedType : "all";
  if (query.length < 2) return NextResponse.json({ data: [] });

  const [morningstarResult, yahooResult] = await Promise.allSettled([
    autoComplete(query),
    searchStocks(query),
  ]);
  const morningstar = morningstarResult.status === "fulfilled" ? morningstarResult.value : [];
  const yahoo = yahooResult.status === "fulfilled" ? yahooResult.value : [];
  const output: Array<{ id: string; name: string; ticker: string; exchange: string; currency: string; assetType: KypAssetType; source: "Morningstar" | "Yahoo" }> = [];
  const seen = new Set<string>();

  for (const item of morningstar) {
    const assetType: KypAssetType = item.securityType === "FE" ? "fund" : "stock";
    if (type !== "all" && type !== assetType) continue;
    if (assetType === "stock" && !isCanadaOrUs(item.exchange, item.ticker)) continue;
    const exchange = assetType === "fund" && !item.exchange ? "Fund" : marketLabel(item.exchange, item.ticker);
    const ticker = assetType === "stock" ? quoteSymbol(item.ticker, item.exchange) : item.ticker;
    const key = item.performanceId || `${ticker}:${item.name}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ id: item.performanceId || key, name: item.name, ticker, exchange, currency: exchange === "TSX" || exchange === "TSXV" || exchange === "NEO" || exchange === "CSE" ? "CAD" : assetType === "fund" ? "" : "USD", assetType, source: "Morningstar" });
  }

  for (const item of yahoo) {
    const assetType: KypAssetType = item.quoteType === "ETF" ? "fund" : "stock";
    if (type !== "all" && type !== assetType) continue;
    const exchange = marketLabel(item.exchange, item.symbol);
    const key = `${item.symbol}:${assetType}`.toLowerCase();
    if (seen.has(key) || output.some((entry) => entry.ticker === item.symbol && entry.assetType === assetType)) continue;
    seen.add(key);
    output.push({ id: `yahoo-${key}`, name: item.name, ticker: item.symbol, exchange, currency: item.currency, assetType, source: "Yahoo" });
  }

  return NextResponse.json({ data: output.slice(0, 12) });
}
