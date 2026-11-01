import "server-only";
import { normalizeTicker, peerCandidates, type ReviewProduct, type ReviewResearch, type ReviewAssetType } from "./model";
const headers = { "User-Agent": "Mozilla/5.0" };
const num = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : v && typeof v === "object" && "raw" in v ? num(v.raw) : null;
const str = (v: unknown): string | null => typeof v === "string" && v.trim() ? v : null;
async function json(url: string) {
  const response = await fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Yahoo Finance returned HTTP ${response.status}.`);
  return response.json();
}
// Public quote-summary requests require a server-side Yahoo session.
let session: Promise<{ cookie: string; crumb: string }> | null = null;
let sessionExpires = 0;
async function yahooSession() {
  if (!session || Date.now() >= sessionExpires) {
    sessionExpires = Date.now() + 20 * 60 * 1000;
    session = (async () => {
      const response = await fetch("https://fc.yahoo.com", { headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
      const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
      if (!cookie) throw new Error("Yahoo session unavailable.");
      const crumbResponse = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", { headers: { ...headers, Cookie: cookie }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!crumbResponse.ok) throw new Error("Yahoo profile session unavailable.");
      const crumb = await crumbResponse.text();
      if (!crumb || crumb.length > 200) throw new Error("Yahoo returned an invalid session.");
      return { cookie, crumb };
    })().catch(error => { session = null; throw error; });
  }
  return session;
}
async function profile(symbol: string) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { cookie, crumb } = await yahooSession();
    const response = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=quoteType,defaultKeyStatistics,summaryDetail,fundProfile,fundPerformance,assetProfile&crumb=${encodeURIComponent(crumb)}`, { headers: { ...headers, Cookie: cookie }, cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (response.ok) return response.json();
    if (response.status !== 401 || attempt === 1) throw new Error(`Yahoo profile returned HTTP ${response.status}.`);
    session = null;
  }
  throw new Error("Yahoo profile unavailable.");
}
export async function fetchProduct(symbol: string, expected?: ReviewAssetType): Promise<ReviewProduct> {
  const warnings: string[] = [];
  const [chart, summary] = await Promise.all([
    json(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`),
    profile(symbol).catch(() => { warnings.push("Yahoo profile metrics were unavailable. Confirm fees, risk and returns against current issuer disclosure."); return null; }),
  ]);
  const meta = chart?.chart?.result?.[0]?.meta;
  if (!meta || meta.symbol?.toUpperCase() !== symbol) throw new Error(`No exact Yahoo instrument found for ${symbol}. Check the exchange suffix and fund series.`);
  const instrument = String(meta.instrumentType).toUpperCase();
  const type = instrument === "ETF" ? "etf" : instrument === "MUTUALFUND" ? "mutual-fund" : instrument === "EQUITY" ? "equity" : null;
  if (!type || (expected && type !== expected)) throw new Error(`${symbol} is reported as ${instrument}, not ${expected || "a supported product"}. Confirm the exact instrument.`);
  const r = summary?.quoteSummary?.result?.[0];
  const stats = r?.defaultKeyStatistics, detail = r?.summaryDetail;
  const name = str(r?.quoteType?.longName) || str(meta.longName) || str(meta.shortName);
  if (!name) throw new Error(`Yahoo did not identify the name for ${symbol}.`);
  return { symbol, name, type, currency: str(meta.currency), exchange: str(meta.fullExchangeName) || str(meta.exchangeName), category: str(r?.fundProfile?.categoryName) || str(r?.assetProfile?.sector), businessDescription: str(r?.assetProfile?.longBusinessSummary)?.slice(0, 6000) || null,
    expenseRatio: type === "equity" ? null : num(stats?.annualReportExpenseRatio) ?? num(stats?.expenseRatio) ?? num(r?.fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio),
    beta: num(stats?.beta) ?? num(stats?.beta3Year), return3Y: num(r?.fundPerformance?.trailingReturns?.threeYear) ?? num(stats?.threeYearAverageReturn), dividendYield: num(detail?.trailingAnnualDividendYield), price: num(meta.regularMarketPrice),
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`, retrievedAt: new Date().toISOString(), marketAsOf: typeof meta.regularMarketTime === "number" ? new Date(meta.regularMarketTime * 1000).toISOString() : null, warnings };
}
function categoryFor(product: ReviewProduct) {
  // Only explicit source categories or maintained exact-symbol benchmark groups.
  for (const [category, symbols] of Object.entries(peerCandidates)) if (symbols.includes(product.symbol)) return { category, basis: `Maintained benchmark mapping for ${product.symbol}: ${category}. Advisor must confirm mandate, currency and shelf availability.` };
  const c = product.category?.toLowerCase() || "";
  const category = c.includes("canadian equity") ? "Canadian equity" : c.includes("us equity") || c.includes("large blend") ? "US equity" : c.includes("financial") ? "Canadian financials" : c.includes("energy") ? "Canadian energy" : c.includes("technology") ? "Technology" : c.includes("health") ? "Healthcare" : null;
  return category ? { category, basis: `Yahoo category: ${product.category}. Canadian benchmark candidates require advisor confirmation.` } : null;
}
export async function researchProduct(input: { symbol: string; assetType: ReviewAssetType; market: "CA" | "US"; category?: string; alternatives?: string[] }): Promise<ReviewResearch> {
  const symbol = normalizeTicker(input.symbol, input.market, input.assetType);
  const target = await fetchProduct(symbol, input.assetType);
  const mapped = input.category ? { category: input.category, basis: `Advisor-selected comparison category: ${input.category}.` } : categoryFor(target);
  const candidates = input.alternatives || (mapped ? peerCandidates[mapped.category].filter(s => s !== symbol).slice(0, 2) : []);
  if (new Set([symbol, ...candidates]).size !== candidates.length + 1) throw new Error("Choose two distinct alternatives that differ from the target.");
  const outcomes = await Promise.allSettled(candidates.map(s => fetchProduct(s)));
  const alternatives = outcomes.flatMap(r => r.status === "fulfilled" ? [r.value] : []);
  const warnings = outcomes.flatMap((r, i) => r.status === "rejected" ? [`${candidates[i]} could not be fetched. Choose another alternative and retry.`] : []);
  if (alternatives.length !== 2) warnings.push("Two alternatives are required before archiving. Select a comparison category or enter exact alternative symbols.");
  if (target.type === "equity") warnings.push("ETF candidates are portfolio alternatives, not direct issuer peers. Explain why they are reasonable actions for this client.");
  if (alternatives.some(p => p.currency !== target.currency)) warnings.push("The comparison contains different currencies. Returns and prices have not been FX-normalized.");
  return { target, alternatives, categoryBasis: input.alternatives ? "Advisor-entered alternative instruments." : mapped?.basis || "No supported category match. Advisor selection required.", warnings };
}
