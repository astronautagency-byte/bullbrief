import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSession } from "@/lib/kyp-review/store";
import { getRun, saveRun } from "@/lib/kyp-simulation/store";
import { guardAiNotes } from "@/lib/kyp-simulation/quality";
import { notesSchema, sectionKeys } from "@/lib/kyp-simulation/model";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
 try {
  const session = await reviewSession(); const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid run." }, { status: 400 });
  const input = z.object({ holdingId: z.string().max(80), version: z.number().int().min(1), notes: notesSchema }).safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "All note sections must contain text and fit within 6,000 characters." }, { status: 400 });
  const run = await getRun(session, id);
  if (!run) return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
  const row = run.rows.find(r => r.holding.id === input.data.holdingId);
  if (!row) return NextResponse.json({ error: "Holding not found." }, { status: 404 });
  if (run.version !== input.data.version) return NextResponse.json({ error: "The simulation changed. Reload it before saving." }, { status: 409 });
  row.sectionOrigins = Object.fromEntries(Object.keys(input.data.notes).map(key => [key, input.data.notes[key as keyof typeof input.data.notes] !== row.notes[key as keyof typeof row.notes] ? "advisor" : row.sectionOrigins?.[key as keyof typeof row.notes] || row.generation]));
  row.notes = input.data.notes; row.generation = "advisor";
  run.version++;
  await saveRun(session, run, input.data.version);
  return NextResponse.json({ data: run });
 } catch (e) { const message = e instanceof Error ? e.message : "Could not save notes."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await reviewSession(); const { id } = await context.params;
    const input = z.object({ action: z.literal("recheck"), version: z.number().int().min(1) }).safeParse(await request.json());
    if (!z.string().uuid().safeParse(id).success || !input.success) return NextResponse.json({ error: "Invalid quality-check request." }, { status: 400 });
    const run = await getRun(session, id);
    if (!run) return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
    if (run.version !== input.data.version) return NextResponse.json({ error: "The simulation changed. Reload before rechecking." }, { status: 409 });
    let replaced = 0;
    for (const row of run.rows.filter(r => r.generation === "ai")) {
      const checked = guardAiNotes(row, row.notes, true);
      row.notes = checked.notes;
      row.sectionOrigins = { ...row.sectionOrigins, ...Object.fromEntries(checked.fallback.map(key => [key, "template"])) };
      replaced += checked.fallback.length;
      const kept = sectionKeys.filter(key => key !== "evidenceSources" && row.sectionOrigins?.[key] === "template");
      row.aiIssue = kept.length ? `Quality check retained source-based template wording for: ${kept.join(", ")}. Required product evidence or support is missing; review the source gaps.` : null;
    }
    run.version++; await saveRun(session, run, input.data.version);
    return NextResponse.json({ data: run, replaced });
  } catch (e) { const message = e instanceof Error ? e.message : "Quality check could not be saved."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
