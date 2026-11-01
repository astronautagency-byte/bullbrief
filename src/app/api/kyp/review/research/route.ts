import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { researchInputSchema } from "@/lib/kyp-review/model";
import { researchProduct } from "@/lib/kyp-review/yahoo";
import { reviewSession, appendArchive } from "@/lib/kyp-review/store";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const session = await reviewSession();
    const input = researchInputSchema.safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: input.error.issues[0].message }, { status: 400 });
    const research = await researchProduct(input.data);
    const saved = await appendArchive(session, randomUUID(), "research", { research });
    return NextResponse.json({ data: research, researchId: saved.id, savedAt: saved.created_at }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Research could not be fetched.";
    return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Sign in to save a KYP review." : message }, { status: message === "AUTH_REQUIRED" ? 401 : 502 });
  }
}
