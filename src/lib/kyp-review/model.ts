import { z } from "zod";

export const assetTypes = ["etf", "mutual-fund", "equity"] as const;
export type ReviewAssetType = typeof assetTypes[number];
export const categories = ["Canadian equity", "US equity", "International equity", "Canadian fixed income", "Canadian financials", "Canadian energy", "Healthcare", "Technology"] as const;
export const peerCandidates: Record<string, string[]> = {
  "Canadian equity": ["XIU.TO", "XIC.TO", "VCN.TO"],
  "US equity": ["VFV.TO", "ZSP.TO", "XUS.TO"],
  "International equity": ["XEF.TO", "VIU.TO", "ZEA.TO"],
  "Canadian fixed income": ["XBB.TO", "VAB.TO", "ZAG.TO"],
  "Canadian financials": ["XFN.TO", "ZEB.TO", "VCN.TO"],
  "Canadian energy": ["XEG.TO", "ZEO.TO", "VCN.TO"],
  "Healthcare": ["XHC.TO", "ZUH.TO", "HHL.TO"],
  "Technology": ["XIT.TO", "TEC.TO", "XQQ.TO"],
};
export const presets = [
  { id: "C1", group: "Costs", title: "Fee efficiency", text: "I compared the selected product's documented ongoing costs with the alternatives reviewed and recorded how costs affect the client's expected net returns." },
  { id: "C2", group: "Costs", title: "Higher-cost rationale", text: "I considered lower-cost alternatives and documented the specific strategy, service or portfolio benefit supporting the additional cost. Past performance alone does not establish that benefit." },
  { id: "R1", group: "Risk", title: "Risk alignment", text: "I assessed material risks, liquidity and potential loss against the client's documented objectives, time horizon, financial circumstances and capacity for loss. Beta alone does not establish suitability." },
  { id: "R2", group: "Risk", title: "Downside evidence", text: "I reviewed the cited downside-risk evidence, its period and limitations, and documented its relevance to this recommendation." },
  { id: "S1", group: "Portfolio", title: "Management and strategy", text: "I reviewed the documented management team, mandate and material strategy changes and recorded their relevance to the recommendation." },
  { id: "S2", group: "Portfolio", title: "Portfolio role", text: "I assessed this product's role in the client's portfolio, including concentration, diversification and liquidity, using the evidence recorded below." },
] as const;
export type PresetId = typeof presets[number]["id"];
export const tickerSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9^][A-Z0-9.^=-]{0,24}$/, "Enter a valid Yahoo ticker or fund symbol.");
export function normalizeTicker(value: string, market: "CA" | "US", type: ReviewAssetType) {
  const symbol = tickerSchema.parse(value);
  return market === "CA" && type !== "mutual-fund" && !symbol.includes(".") && !symbol.startsWith("^") ? `${symbol}.TO` : symbol;
}
export const productSchema = z.object({
  symbol: z.string(), name: z.string(), type: z.enum(assetTypes), currency: z.string().nullable(), exchange: z.string().nullable(),
  businessDescription: z.string().nullable().optional(),
  category: z.string().nullable(), expenseRatio: z.number().nullable(), beta: z.number().nullable(), return3Y: z.number().nullable(), dividendYield: z.number().nullable(), price: z.number().nullable(),
  sourceUrl: z.string(), retrievedAt: z.string(), marketAsOf: z.string().nullable(), warnings: z.array(z.string()),
});
export type ReviewProduct = z.infer<typeof productSchema>;
export const researchSchema = z.object({ target: productSchema, alternatives: z.array(productSchema).max(2), categoryBasis: z.string(), warnings: z.array(z.string()) });
export type ReviewResearch = z.infer<typeof researchSchema>;
export const researchInputSchema = z.object({ symbol: tickerSchema, assetType: z.enum(assetTypes), market: z.enum(["CA", "US"]), category: z.enum(categories).optional(), alternatives: z.array(tickerSchema).length(2).optional() });
export const archiveInputSchema = z.object({
  requestId: z.string().uuid(), researchId: z.string().uuid(),
  advisorName: z.string().trim().min(2).max(100), firmName: z.string().trim().min(2).max(150), regulatorId: z.string().trim().max(80),
  presetIds: z.array(z.enum(["C1", "C2", "R1", "R2", "S1", "S2"])).min(1).max(6).refine(v => new Set(v).size === v.length, "Duplicate rationale options."),
  evidence: z.record(z.string(), z.string().trim().max(2500)), customNotes: z.string().trim().min(20).max(6000),
  alternativesReason: z.string().trim().min(20).max(3000), evidenceSources: z.string().trim().min(10).max(4000),
  confirmed: z.literal(true),
}).superRefine((value, ctx) => {
  for (const id of value.presetIds) if (!value.evidence[id] || value.evidence[id].length < 20) ctx.addIssue({ code: "custom", path: ["evidence", id], message: "Add at least 20 characters of supporting evidence for each selected rationale." });
});
export type ArchiveInput = z.infer<typeof archiveInputSchema>;
export function compileRationale(ids: string[], evidence: Record<string, string>, customNotes: string) {
  return presets.filter(p => ids.includes(p.id)).map(p => `${p.title}\n${p.text}\nSupporting evidence: ${evidence[p.id] || ""}`).join("\n\n") + `\n\nClient-specific context\n${customNotes}`;
}
export function metric(value: number | null, percent = false) { return value == null ? "Not available" : percent ? `${(value * 100).toFixed(2)}%` : value.toFixed(2); }
