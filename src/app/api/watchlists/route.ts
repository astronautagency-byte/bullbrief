import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watchlists = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: watchlists });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  const watchlistCount = await prisma.watchlist.count({
    where: { userId: session.user.id },
  });

  const watchlist = await prisma.watchlist.create({
    data: {
      userId: session.user.id,
      name: name || "My Watchlist",
      isDefault: watchlistCount === 0,
    },
  });

  return NextResponse.json({ data: watchlist }, { status: 201 });
}
