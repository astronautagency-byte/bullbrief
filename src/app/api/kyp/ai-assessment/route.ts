import { NextResponse } from "next/server";
import { groqGenerateKypAssessment } from "@/lib/providers/groq/client";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: "AI assessment drafting is not configured." }, { status: 503 });
  try {
    const body = await request.json();
    if (!body?.facts || typeof body.facts !== "object" || Array.isArray(body.facts) || !Object.keys(body.facts).length) return NextResponse.json({ error: "Upload and analyze a product PDF first." }, { status: 400 });
    if (JSON.stringify(body).length > 150000) return NextResponse.json({ error: "The assessment data is too large. Use a smaller document." }, { status: 413 });
    const criteria: Record<string, string | number> = {};
    if (["Growth", "Income", "Diversification"].includes(body.criteria?.purpose)) criteria.purpose = body.criteria.purpose;
    for (const [key, max] of Object.entries({ maxFee: 10, maxHolding: 100, minYield: 100, maxPE: 200 })) {
      const value = body.criteria?.[key];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max) criteria[key] = value;
    }
    const assessment = await groqGenerateKypAssessment({
      fileName: typeof body.fileName === "string" ? body.fileName.slice(0, 180) : "Uploaded product PDF",
      facts: body.facts,
      products: Array.isArray(body.products) ? body.products.slice(0, 12) : undefined,
      criteria,
    });
    return NextResponse.json({ data: assessment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("KYP AI assessment failed", error);
    return NextResponse.json({ error: "The AI draft could not be completed. Try again in a moment." }, { status: 500 });
  }
}
