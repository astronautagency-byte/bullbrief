import "server-only";
import { TOP_HOLDINGS } from "@/lib/kyp-top-holdings";
import { fetchProduct } from "@/lib/kyp-review/yahoo";
import { candidateMappings, type SimulationRow, type SimulationRun } from "./model";
import { baseSimulationRow, buildTemplateNotes } from "./templates";
async function identityFor(row: SimulationRow) {
  const candidate = candidateMappings[row.holding.portfolioHolding!.identifier];
  const key = process.env.RAPIDAPI_MORNINGSTAR_KEY;
  // CDRs and ETF share classes must not inherit the parent issuer's identity.
  if (!candidate || !key || row.pattern === "cdr" || row.pattern === "etf") return null;
  const url = `https://morningstar13.p.rapidapi.com/stock/details?ticker=${encodeURIComponent(candidate.symbol.replace(/\.TO$/, ""))}&exchange=${candidate.exchange}`;
  try {
    const response = await fetch(url, { headers: { "x-rapidapi-host": "morningstar13.p.rapidapi.com", "x-rapidapi-key": key }, cache: "no-store", signal: AbortSignal.timeout(7000) });
    if (!response.ok) return null;
    const payload = await response.json();
    const security = payload?.components?.companyReport?.payload?.security;
    if (typeof security?.cusip !== "string" || !security.cusip.trim()) return null;
    return { provider: "Morningstar via RapidAPI", identifier: security.cusip.trim().toUpperCase(), name: typeof security.name === "string" ? security.name : null, retrievedAt: new Date().toISOString(), sourceUrl: url };
  } catch { return null; }
}
export async function runSimulation(id: string, enrich: boolean): Promise<SimulationRun> {
  const rows = TOP_HOLDINGS.map(baseSimulationRow);
  const cache = new Map<string, ReturnType<typeof fetchProduct>>();
  const product = (symbol: string) => {
    if (!cache.has(symbol)) cache.set(symbol, fetchProduct(symbol));
    return cache.get(symbol)!;
  };
  if (enrich) {
    let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < rows.length) {
        const row = rows[next++];
        if (!row.candidateSymbol) continue;
        const [research, identity] = await Promise.all([product(row.candidateSymbol).catch(() => null), identityFor(row)]);
        row.research = research; row.identityEvidence = identity;
        if (identity) row.identity = identity.identifier === row.holding.portfolioHolding!.identifier ? "matched" : "mismatch";
        if (!research) row.gaps.unshift("Candidate quote unavailable; no market data assumed");
        if (row.identity !== "matched") row.gaps.unshift(row.identity === "mismatch" ? "Provider identifier differs from the CSV; do not substitute this candidate" : "Source identifier has not been corroborated by a provider");
        const symbols = row.pattern === "bank" ? ["XFN.TO", "ZEB.TO"] : row.pattern === "energy" ? ["XEG.TO", "ZEO.TO"] : row.pattern === "technology" || row.pattern === "cdr" ? ["VFV.TO", "XUS.TO"] : row.pattern === "etf" ? ["XHC.TO", "ZUH.TO"] : ["XIC.TO", "VCN.TO"];
        const alternatives = await Promise.all(symbols.map(s => product(s).catch(() => null)));
        row.alternatives = alternatives.filter((p): p is NonNullable<typeof p> => p !== null);
        row.notes = buildTemplateNotes(row); row.templateNotes = { ...row.notes };
      }
    }));
  }
  return { id, sourceFile: "Top 20 Holdings_20261016.csv", reportDate: "2026-10-16", generatedAt: new Date().toISOString(), version: 1, mode: "simulation", rows };
}
