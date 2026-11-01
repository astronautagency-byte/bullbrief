import { z } from "zod";
import type { KypHolding } from "@/lib/kyp";
import type { ReviewProduct } from "@/lib/kyp-review/model";
export const sectionLabels = {
  structure: "Structure and return drivers", risk: "Material risks", costs: "Costs and their impact", liquidityComplexity: "Liquidity and complexity", conflicts: "Conflicts of interest", alternatives: "Reasonable alternatives", lowerCostRationale: "Lower-cost assessment", rationale: "Product rationale", clientExplanation: "Plain-language explanation", changeMonitoring: "Monitoring plan", evidenceSources: "Source evidence",
} as const;
export type SectionKey = keyof typeof sectionLabels;
export const sectionKeys = Object.keys(sectionLabels) as SectionKey[];
export const notesSchema = z.object(Object.fromEntries(sectionKeys.map(key => [key, z.string().trim().min(1).max(6000)])) as Record<SectionKey, z.ZodString>);
export type SimulationNotes = z.infer<typeof notesSchema>;
export type PatternKey = "equity" | "bank" | "pipeline" | "energy" | "technology" | "partnership" | "etf" | "fund" | "savings" | "private-credit" | "cdr" | "power";
export type SimulationRow = {
  holding: KypHolding; pattern: PatternKey; candidateSymbol: string | null;
  identity: "matched" | "candidate" | "unresolved" | "mismatch";
  identityEvidence: { provider: string; identifier: string; name: string | null; retrievedAt: string; sourceUrl: string } | null;
  research: ReviewProduct | null; alternatives: ReviewProduct[];
  notes: SimulationNotes; templateNotes: SimulationNotes;
  generation: "template" | "ai" | "advisor"; generatedAt: string;
  aiSafetyVersion?: number; sectionOrigins?: Partial<Record<SectionKey, "template" | "ai" | "advisor">>;
  aiProfile: { id: string; name: string; version: number } | null; aiIssue: string | null; gaps: string[];
};
export type SimulationRun = { id: string; sourceFile: string; reportDate: string; generatedAt: string; version: number; mode: "simulation"; rows: SimulationRow[] };
export const patternInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  rules: z.array(z.string().trim().min(5).max(500)).min(1).max(10),
  examples: z.array(z.object({ assetType: z.enum(["equity", "fund", "any"]), note: z.string().trim().min(40).max(4000) })).max(3),
  approved: z.literal(true),
});
export type NotePattern = z.infer<typeof patternInputSchema> & { id: string; version: number; createdAt: string };
export const defaultRules = ["Use concise, plain-language product-level research notes.", "Separate sourced facts, potential portfolio role, trade-offs and evidence gaps.", "Name the exact instrument and source date; preserve share classes and fund series.", "Do not imply documents were reviewed, a client decision was made, or suitability was established."];
export const candidateMappings: Record<string, { symbol: string; exchange: string; pattern: PatternKey }> = {
  "02079K107": { symbol: "GOOG", exchange: "XNAS", pattern: "technology" },
  "891160509": { symbol: "TD.TO", exchange: "XTSE", pattern: "bank" },
  "29250N105": { symbol: "ENB.TO", exchange: "XTSE", pattern: "pipeline" },
  "87807B107": { symbol: "TRP.TO", exchange: "XTSE", pattern: "pipeline" },
  "023135106": { symbol: "AMZN", exchange: "XNAS", pattern: "technology" },
  "867224107": { symbol: "SU.TO", exchange: "XTSE", pattern: "energy" },
  "706327103": { symbol: "PPL.TO", exchange: "XTSE", pattern: "pipeline" },
  "G16252101": { symbol: "BIP.UN.TO", exchange: "XTSE", pattern: "partnership" },
  "063671101": { symbol: "BMO.TO", exchange: "XTSE", pattern: "bank" },
  "15135U109": { symbol: "CVE.TO", exchange: "XTSE", pattern: "energy" },
  "136385101": { symbol: "CNQ.TO", exchange: "XTSE", pattern: "energy" },
  "41755F107": { symbol: "HHL.TO", exchange: "XTSE", pattern: "etf" },
  "037833100": { symbol: "AAPL", exchange: "XNAS", pattern: "technology" },
  "11271J107": { symbol: "BN.TO", exchange: "XTSE", pattern: "equity" },
  "59516M104": { symbol: "MSFT.NE", exchange: "NEO", pattern: "cdr" },
  "666511100": { symbol: "NPI.TO", exchange: "XTSE", pattern: "power" },
};
export function choosePattern(holding: KypHolding): PatternKey {
  const id = holding.portfolioHolding?.identifier || "";
  return candidateMappings[id]?.pattern || (id === "MIP809" ? "savings" : id === "NPP931" || id === "NPP1017" ? "private-credit" : holding.assetType === "fund" ? "fund" : "equity");
}
