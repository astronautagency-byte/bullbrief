import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSession } from "@/lib/kyp-review/store";
import { runSimulation } from "@/lib/kyp-simulation/engine";
import { saveRun } from "@/lib/kyp-simulation/store";
export const maxDuration = 90;
export async function GET() {
  try {
    const session = await reviewSession();
    const { data, error } = await session.client.from("kyp_simulation_runs").select("document").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error("Simulation storage is unavailable.");
    return NextResponse.json({ data: data?.document || null }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { const message = e instanceof Error ? e.message : "Simulation unavailable."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
export async function POST(request: Request) {
  try {
    const session = await reviewSession();
    const input = z.object({ enrich: z.boolean().default(true) }).safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: "Invalid simulation request." }, { status: 400 });
    const run = await runSimulation(randomUUID(), input.data.enrich);
    await saveRun(session, run);
    return NextResponse.json({ data: run }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (e) { const message = e instanceof Error ? e.message : "The simulation could not be generated."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
