import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewSession, readArchive } from "@/lib/kyp-review/store";
import { renderReviewPdf } from "@/lib/kyp-review/pdf";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client } = await reviewSession();
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid record ID." }, { status: 400 });
    const row = await readArchive(client, id);
    if (!row || row.kind !== "audit") return NextResponse.json({ error: "Review not found." }, { status: 404 });
    if (new URL(request.url).searchParams.get("format") === "json") return NextResponse.json({ id: row.id, sha256: row.sha256, createdAt: row.created_at, document: JSON.parse(row.document), integrity: "verified" }, { headers: { "Cache-Control": "no-store" } });
    const bytes = await renderReviewPdf(row);
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="kyp-review-${id}.pdf"`, "Cache-Control": "private, no-store", "X-Archive-SHA256": row.sha256 } });
  } catch (e) { const message = e instanceof Error ? e.message : "Could not export the saved review."; return NextResponse.json({ error: message }, { status: message === "AUTH_REQUIRED" ? 401 : 503 }); }
}
