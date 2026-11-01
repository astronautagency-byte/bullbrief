import type { KypHolding } from "@/lib/kyp";
import { sectionKeys, type SimulationRun } from "./model";
export function planKypDraftFill(run: SimulationRun, holdings: KypHolding[], drafts: Record<string, Record<string, unknown>>, onlyHoldingId?: string) {
  const nextHoldings = [...holdings]; const nextDrafts = { ...drafts };
  let filled = 0, skippedCompleted = 0, refreshed = 0;
  for (const row of run.rows.filter(r => !onlyHoldingId || r.holding.id === onlyHoldingId)) {
    const existing = { ...(drafts[row.holding.id] || {}) };
    if (existing.completed) { skippedCompleted++; continue; }
    const previous = existing.simulationSource as { originalNotes?: Record<string, string> } | undefined;
    const baseline = { ...(previous?.originalNotes || {}) };
    for (const key of sectionKeys) {
      const value = String(existing[key] || "").trim();
      if (!value) { existing[key] = row.notes[key]; baseline[key] = row.notes[key]; filled++; }
      else if (previous?.originalNotes?.[key] === existing[key]) { existing[key] = row.notes[key]; baseline[key] = row.notes[key]; refreshed++; }
    }
    if (!nextHoldings.some(h => h.id === row.holding.id)) nextHoldings.push(row.holding);
    nextDrafts[row.holding.id] = { ...existing, completed: false, completedAt: "", simulationSource: { runId: run.id, method: row.generation, identity: row.identity, state: "simulation_draft_requires_advisor_review", originalNotes: baseline } };
  }
  return { holdings: nextHoldings, drafts: nextDrafts, filled, refreshed, skippedCompleted };
}
