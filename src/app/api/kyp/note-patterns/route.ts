import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { reviewSession } from "@/lib/kyp-review/store";
import { getPatterns, simulationWriter } from "@/lib/kyp-simulation/store";
import { patternInputSchema } from "@/lib/kyp-simulation/model";
export async function GET() {
  try { return NextResponse.json({ data: await getPatterns(await reviewSession()) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (e) { const message = e instanceof Error ? e.message : "Patterns unavailable."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
export async function POST(request: Request) {
  try {
    const session = await reviewSession();
    const input = patternInputSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const id = randomUUID();
    const previous = (await getPatterns(session)).filter(p => p.name === input.data.name);
    const version = Math.max(0, ...previous.map(p => p.version)) + 1;
    const { data, error } = await simulationWriter().from("kyp_note_patterns").insert({ id, owner_id: session.user.id, document: input.data, version }).select().single();
    if (error) throw new Error("Pattern could not be saved.");
    return NextResponse.json({ data: { ...input.data, id, version, createdAt: data.created_at } }, { status: 201 });
  } catch (e) { const message = e instanceof Error ? e.message : "Pattern could not be saved."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
