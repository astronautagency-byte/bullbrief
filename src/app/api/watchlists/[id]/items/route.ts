import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_WATCHLIST_ITEMS = 100;

async function ownedWatchlist(id: string, userId: string) {
  if (!prisma) return null;
  return prisma.watchlist.findFirst({ where: { id, userId } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { id } = await params;
  if (!(await ownedWatchlist(id, session.user.id))) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }

  const body = await request.json();
  const symbol = typeof body.symbol === "string" ? body.symbol.trim().toUpperCase() : "";
  if (!/^[A-Z0-9.^=-]{1,20}$/.test(symbol)) {
    return NextResponse.json({ error: "Valid symbol is required" }, { status: 400 });
  }

  const count = await prisma.watchlistItem.count({ where: { watchlistId: id } });
  if (count >= MAX_WATCHLIST_ITEMS) {
    return NextResponse.json({ error: "Watchlist limit reached" }, { status: 400 });
  }

  try {
    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        symbol,
        companyName: typeof body.companyName === "string" ? body.companyName.slice(0, 160) : null,
        exchangeCode: typeof body.exchangeCode === "string" ? body.exchangeCode.slice(0, 80) : null,
        sortOrder: count,
      },
    });
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Symbol already in watchlist" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to save watchlist" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const db = prisma;

  const { id } = await params;
  if (!(await ownedWatchlist(id, session.user.id))) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }
  const body = await request.json();
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  await db.$transaction(
    body.items.map((item: { id: string; sortOrder: number }, index: number) =>
      db.watchlistItem.updateMany({
        where: { id: item.id, watchlistId: id },
        data: { sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index },
      })
    )
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const { id } = await params;
  if (!(await ownedWatchlist(id, session.user.id))) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }
  const itemId = new URL(request.url).searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const result = await prisma.watchlistItem.deleteMany({ where: { id: itemId, watchlistId: id } });
  if (!result.count) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
