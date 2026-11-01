import type { SimulationNotes, SimulationRow, SectionKey } from "./model";
import { sectionKeys } from "./model";
const prospective = /^\s*(review|confirm|verify|assess|evaluate|obtain|document|determine|monitor|compare|check)\b|\b(not established|not verified|not supplied|not provided|not available|cannot|do not|must not|insufficient evidence)\b/i;
const unsupportedStrength = /\b(high[- ]growth|strong (?:free )?cash[- ]flows?|robust (?:free )?cash[- ]flows?|consistent alpha|superior (?:returns?|performance)|undervalued|overvalued|outperforms?|sustainable dividends?|guaranteed|risk[- ]free|downside protection|lower volatility|defensive investment|financially strong|strong balance sheet|high[- ]quality issuer)\b/i;
const performedWork = /\b(I|we) (reviewed|compared|confirmed|assessed|discussed|approved|recommended)\b|\b(dealer[- ]approved|approved by (?:the )?dealer|suitable for (?:this|the) client|perfectly align(?:s)? with)\b/i;
export function guardAiNotes(row: SimulationRow, proposed: SimulationNotes, onlyGeneratedSections = false) {
  const notes = { ...proposed };
  const fallback: SectionKey[] = [];
  const reasons: string[] = [];
  const target = row.identity === "matched" ? row.research : null;
  const allowedPercentages = [target?.expenseRatio, target?.return3Y, target?.dividendYield, ...row.alternatives.map(p => p.expenseRatio)].filter((v): v is number => v != null).map(v => v * 100);
  for (const key of sectionKeys.filter(k => k !== "evidenceSources")) {
    if (onlyGeneratedSections && row.sectionOrigins?.[key] !== "ai") continue;
    const text = proposed[key].replace(/[\u2010-\u2015\u2212]/g, "-");
    let reason = "";
    // This simulation has no issuer risk disclosure, total-cost schedule, dealer-conflict
    // review, or observed spreads/depth. Those sections stay source-based checklists.
    if (["risk", "costs", "liquidityComplexity", "conflicts", "lowerCostRationale"].includes(key)) reason = "Required risk, cost, liquidity or dealer evidence is absent from this holdings-only simulation";
    if (row.identity !== "matched" && ["structure", "costs", "liquidityComplexity", "rationale"].includes(key)) reason = "Exact instrument evidence is unresolved";
    for (const sentence of text.split(/(?<=[.!?])\s+/)) {
      if (/\b(suitability (?:hinges|depends|is established)|appropriate for (?:the|this) client|meets the client.s (?:needs|objectives))\b/i.test(sentence)) reason = "Client-specific conclusions are not supported";
      if (performedWork.test(sentence)) reason = "Unsubstantiated completed work, approval or suitability claim";
      if (prospective.test(sentence)) continue;
      if (unsupportedStrength.test(sentence)) reason = "Unsupported investment-quality or performance claim";
      if (target?.expenseRatio == null && /\b(lower[- ]cost|lower fees|lowering[^.]{0,35}(?:fees|costs)|reducing[^.]{0,35}(?:fees|costs)|cheaper|less expensive)\b/i.test(sentence)) reason = "Relative cost claim lacks comparable total-cost evidence";
      if (row.identity !== "matched" && /\b(is|offers|provides|uses|holds|invests|targets|represents|hedges|pays|redeems|operates|has)\b/i.test(sentence)) reason = "Product assertions cannot be established for an unresolved identity";
    }
    for (const match of text.matchAll(/([-+]?\d+(?:\.\d+)?)\s*%/g)) {
      const value = Number(match[1]);
      if (!allowedPercentages.some(n => Math.abs(n - value) <= .0051)) reason = "Percentage is absent from the supplied public evidence";
    }
    if (reason) { notes[key] = row.templateNotes[key]; fallback.push(key); reasons.push(`${key}: ${reason}`); }
  }
  // Exact CSV facts and source provenance are always deterministic.
  notes.evidenceSources = row.templateNotes.evidenceSources;
  return { notes, fallback, reasons };
}
