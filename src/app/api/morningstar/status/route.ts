import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getMorningstarDirectConfiguration,
  isMorningstarDirectConfigured,
  listMorningstarEntitledViews,
} from "@/lib/providers/morningstar/direct";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const configuration = getMorningstarDirectConfiguration();
  if (!isMorningstarDirectConfigured()) {
    return NextResponse.json({
      ...configuration,
      connected: false,
      message: "Add licensed Morningstar Direct credentials and entitled view IDs to connect.",
    }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const views = await listMorningstarEntitledViews();
    return NextResponse.json({ ...configuration, connected: true, views }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ...configuration,
      connected: false,
      message: error instanceof Error ? error.message : "Morningstar Direct connection failed",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
