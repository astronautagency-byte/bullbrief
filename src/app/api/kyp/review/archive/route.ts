import { NextResponse } from "next/server";
import { archiveInputSchema, researchSchema, compileRationale } from "@/lib/kyp-review/model";
import { reviewSession, readArchive, appendArchive } from "@/lib/kyp-review/store";
export async function GET() {
  try {
    const { client } = await reviewSession();
    const { data, error } = await client.from("kyp_review_archive").select("id,created_at,sha256,document").eq("kind", "audit").order("created_at", { ascending: false }).limit(50);
    if (error) throw new Error("Could not load archived reviews.");
    return NextResponse.json({ data: (data || []).map(r => ({ id: r.id, createdAt: r.created_at, sha256: r.sha256, symbol: JSON.parse(r.document).research.target.symbol })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { const message = e instanceof Error ? e.message : "Archive unavailable."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
export async function POST(request: Request) {
  try {
    const session = await reviewSession();
    const input = archiveInputSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const value = input.data;
    const existing = await readArchive(session.client, value.requestId);
    if (existing) {
      if (existing.kind !== "audit") return NextResponse.json({ error: "Record ID is already in use." }, { status: 409 });
      return NextResponse.json({ id: existing.id, sha256: existing.sha256, createdAt: existing.created_at });
    }
    const source = await readArchive(session.client, value.researchId);
    if (!source || source.kind !== "research") return NextResponse.json({ error: "Source snapshot not found. Fetch the product again." }, { status: 404 });
    const research = researchSchema.parse(JSON.parse(source.document).research);
    if (research.alternatives.length !== 2 || new Set([research.target.symbol, ...research.alternatives.map(p => p.symbol)]).size !== 3) return NextResponse.json({ error: "Review two distinct alternatives before archiving." }, { status: 400 });
    const saved = await appendArchive(session, value.requestId, "audit", { research, researchId: source.id, sourceSha256: source.sha256, advisor: { name: value.advisorName, firm: value.firmName, regulatorId: value.regulatorId, email: session.user.email }, presetIds: value.presetIds, evidence: value.evidence, customNotes: value.customNotes, alternativesReason: value.alternativesReason, evidenceSources: value.evidenceSources, advisorConfirmed: true, rationale: compileRationale(value.presetIds, value.evidence, value.customNotes) });
    return NextResponse.json({ id: saved.id, sha256: saved.sha256, createdAt: saved.created_at }, { status: 201 });
  } catch (e) { const message = e instanceof Error ? e.message : "Could not archive this review."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
