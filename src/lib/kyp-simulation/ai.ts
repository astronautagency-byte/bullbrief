import "server-only";
import { guardAiNotes } from "./quality";
import { notesSchema, sectionKeys, type NotePattern, type SimulationRow } from "./model";
import { groqDraftSimulationNotes } from "@/lib/providers/groq/client";
export function publicDraftContext(row: SimulationRow, pattern: NotePattern | null) {
  return {
    sourceProduct: { name: row.holding.requestedName, identifier: row.holding.portfolioHolding!.identifier },
    identity: row.identity,
    productEvidence: row.identity === "matched" && row.research ? { ...row.research, businessDescription: row.research.businessDescription?.slice(0, 1800) || null } : null,
    identityGap: row.identity !== "matched" ? "Exact source identifier has not been corroborated. Candidate research excluded." : null,
    reviewChecklistType: row.pattern,
    alternativeCandidates: row.alternatives.map(({ symbol, name, type, currency, expenseRatio, sourceUrl, retrievedAt }) => ({ symbol, name, type, currency, expenseRatio, sourceUrl, retrievedAt })),
    rules: pattern?.rules || ["Use concise plain-language product research notes; separate sourced facts, trade-offs and evidence gaps."],
    examples: (pattern?.examples || []).filter(e => e.assetType === "any" || e.assetType === (row.holding.assetType === "stock" ? "equity" : "fund")).slice(0, 2),
  };
}
export async function draftSimulationRow(row: SimulationRow, pattern: NotePattern | null) {
  const result = notesSchema.parse(await groqDraftSimulationNotes(publicDraftContext(row, pattern)));
  // Source/book evidence is deterministic and never sent to the AI provider.
  const checked = guardAiNotes(row, result);
  checked.notes.evidenceSources += " AI suggestions in the other sections remain subject to advisor review. Unsupported claims are replaced by source-based template notes.";
  row.notes = checked.notes; row.generation = "ai"; row.generatedAt = new Date().toISOString();
  row.aiSafetyVersion = 1;
  row.sectionOrigins = Object.fromEntries(sectionKeys.map(key => [key, key === "evidenceSources" || checked.fallback.includes(key) ? "template" : "ai"]));
  row.aiIssue = checked.reasons.length ? `Quality check kept template text for ${checked.fallback.length} sections: ${checked.reasons.join("; ")}.` : null;
  row.aiProfile = pattern ? { id: pattern.id, name: pattern.name, version: pattern.version } : null;
  return row;
}
