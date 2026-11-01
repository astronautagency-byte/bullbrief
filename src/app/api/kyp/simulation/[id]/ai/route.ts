import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSession } from "@/lib/kyp-review/store";
import { getPatterns, getRun, saveRun } from "@/lib/kyp-simulation/store";
import { sectionKeys } from "@/lib/kyp-simulation/model";
import { guardAiNotes } from "@/lib/kyp-simulation/quality";
import { GroqError } from "@/lib/providers/groq/client";
import { draftSimulationRow } from "@/lib/kyp-simulation/ai";
export const maxDuration = 60;
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await reviewSession();
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "AI drafting is not configured. Template notes remain available." }, { status: 503 });
    const { id } = await context.params;
    const input = z.object({ holdingId: z.string().max(80), version: z.number().int().min(1), profileId: z.string().uuid().optional() }).safeParse(await request.json());
    if (!z.string().uuid().safeParse(id).success || !input.success) return NextResponse.json({ error: "Invalid draft request." }, { status: 400 });
    const run = await getRun(session, id);
    if (!run) return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
    if (run.version !== input.data.version) return NextResponse.json({ error: "This simulation changed. Reload it before generating notes." }, { status: 409 });
    const row = run.rows.find(r => r.holding.id === input.data.holdingId);
    if (!row) return NextResponse.json({ error: "Holding not found." }, { status: 404 });
    const pattern = input.data.profileId ? (await getPatterns(session)).find(p => p.id === input.data.profileId) : null;
    if (input.data.profileId && !pattern) return NextResponse.json({ error: "Approved pattern not found." }, { status: 404 });
    // Recheck earlier generated text too, without another model call. Manual edits are never replaced.
    for (const previous of run.rows.filter(r => r.generation === "ai" && r.aiSafetyVersion === 1)) {
      const checked = guardAiNotes(previous, previous.notes, true);
      if (checked.fallback.length) {
        previous.notes = checked.notes;
        previous.sectionOrigins = { ...previous.sectionOrigins, ...Object.fromEntries(checked.fallback.map(key => [key, "template"])) };

      }
      const kept = sectionKeys.filter(key => key !== "evidenceSources" && previous.sectionOrigins?.[key] === "template");
      previous.aiIssue = kept.length ? `Quality check retained source-based template wording for: ${kept.join(", ")}. Required product evidence or support is missing; review the source gaps.` : null;
    }
    await draftSimulationRow(row, pattern || null);
    run.version++;
    await saveRun(session, run, input.data.version);
    return NextResponse.json({ data: run }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof GroqError && e.code === "RATE_LIMITED") return NextResponse.json({ error: "AI rate limit reached. Existing notes are unchanged; the batch can retry shortly.", retryAfterMs: e.retryAfterMs || 15000 }, { status: 429 });
    console.error("Simulation note draft failed:", e instanceof GroqError ? `${e.code} HTTP ${e.status || "unknown"}` : e instanceof Error ? e.name : "unknown");
    const message = e instanceof Error && e.message === "AUTH_REQUIRED" ? "Sign in to draft notes." : "The AI draft was not saved. Existing notes are unchanged; retry or use the templates.";
    return NextResponse.json({ error: message }, { status: message.startsWith("Sign in") ? 401 : 502 });
  }
}
