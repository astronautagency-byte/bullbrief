import { NextResponse } from "next/server";
import { groqGenerateKypAssessment } from "@/lib/providers/groq/client";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "AI assessment drafting is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    if (!body?.facts || typeof body.facts !== "object") return NextResponse.json({ error: "Upload and analyze a product PDF first." }, { status: 400 });
    const assessment = await groqGenerateKypAssessment({
      fileName: typeof body.fileName === "string" ? body.fileName.slice(0, 180) : "Uploaded product PDF",
      facts: body.facts,
      products: Array.isArray(body.products) ? body.products.slice(0, 12) : undefined,
    });
    return NextResponse.json({ data: assessment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("KYP AI assessment failed", error);
    return NextResponse.json({ error: "The AI draft could not be completed. Try again in a moment." }, { status: 500 });
  }
}
