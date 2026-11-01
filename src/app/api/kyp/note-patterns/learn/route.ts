import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSession } from "@/lib/kyp-review/store";
import { groqLearnNoteStyle } from "@/lib/providers/groq/client";
export const maxDuration = 45;
export async function POST(request: Request) {
  try {
    await reviewSession();
    const input = z.object({ examples: z.array(z.object({ assetType: z.enum(["equity", "fund", "any"]), note: z.string().trim().min(40).max(4000) })).min(1).max(3), approvedForAi: z.literal(true) }).safeParse(await request.json());
    if (!input.success) return NextResponse.json({ error: "Add anonymized examples and confirm they may be used for AI style extraction." }, { status: 400 });
    const result = z.object({ rules: z.array(z.string().trim().min(5).max(500)).min(4).max(8) }).parse(await groqLearnNoteStyle(input.data.examples));
    return NextResponse.json({ data: result, learnedFrom: input.data.examples.length, status: "suggested_rules_require_approval" });
  } catch (e) { const message = e instanceof Error && e.message === "AUTH_REQUIRED" ? "Sign in to manage patterns." : "Style extraction failed. Your examples were not saved; enter writing rules manually or retry."; return NextResponse.json({ error: message }, { status: message.startsWith("Sign in") ? 401 : 502 }); }
}
