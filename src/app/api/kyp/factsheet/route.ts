import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { downloadDirectFundFactsheet } from "@/lib/providers/morningstar/direct";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const performanceId = searchParams.get("performanceId")?.trim() || "";
  const languageId = searchParams.get("languageId")?.trim().toUpperCase() || "ENG";
  if (!/^[A-Z0-9_-]{4,80}$/i.test(performanceId)) {
    return NextResponse.json({ error: "A valid Morningstar Performance ID is required" }, { status: 400 });
  }
  if (!/^[A-Z]{3}$/.test(languageId)) {
    return NextResponse.json({ error: "A valid language ID is required" }, { status: 400 });
  }

  try {
    const upstream = await downloadDirectFundFactsheet(performanceId, languageId);
    return new Response(await upstream.arrayBuffer(), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="morningstar-factsheet-${performanceId}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Fund factsheet is unavailable",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
