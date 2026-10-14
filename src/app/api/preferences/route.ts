import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!prisma) {
    return NextResponse.json({ data: null });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ data: prefs });
}

export async function PATCH(request: Request) {
  if (!prisma) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const prefs = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      timezone: body.timezone ?? "America/New_York",
      briefingSchedule: body.briefingSchedule ?? "morning",
      marketInterests: body.marketInterests ?? [],
      podcastInterests: body.podcastInterests ?? [],
      theme: body.theme ?? "dark",
      countryFocus: body.countryFocus ?? "us",
      workspaceModules: body.workspaceModules ?? ["watchlist", "markets", "picks", "kyp", "news", "podcasts", "saved"],
      companyName: typeof body.companyName === "string" ? body.companyName.trim().slice(0, 80) : "",
      brandColor: typeof body.brandColor === "string" && /^#[0-9a-f]{6}$/i.test(body.brandColor) ? body.brandColor.toLowerCase() : "#4be277",
    },
    update: {
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.briefingSchedule !== undefined && {
        briefingSchedule: body.briefingSchedule,
      }),
      ...(body.marketInterests !== undefined && {
        marketInterests: body.marketInterests,
      }),
      ...(body.podcastInterests !== undefined && {
        podcastInterests: body.podcastInterests,
      }),
      ...(body.theme !== undefined && { theme: body.theme }),
      ...(body.countryFocus !== undefined && {
        countryFocus: body.countryFocus,
      }),
      ...(body.workspaceModules !== undefined && {
        workspaceModules: body.workspaceModules,
      }),
      ...(typeof body.companyName === "string" && { companyName: body.companyName.trim().slice(0, 80) }),
      ...(typeof body.brandColor === "string" && /^#[0-9a-f]{6}$/i.test(body.brandColor) && { brandColor: body.brandColor.toLowerCase() }),
    },
  });

  return NextResponse.json({ data: prefs });
}
