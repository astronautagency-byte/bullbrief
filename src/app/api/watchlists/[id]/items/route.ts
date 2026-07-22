import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { symbol, companyName, exchangeCode } = body;

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.watchlistItem.findUnique({
    where: { watchlistId_symbol: { watchlistId: id, symbol: symbol.toUpperCase() } },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Symbol already in watchlist" },
      { status: 409 }
    );
  }

  const maxSort = watchlist.items.reduce<number>(
    (max, item) => Math.max(max, item.sortOrder),
    -1
  );

  const item = await prisma.watchlistItem.create({
    data: {
      watchlistId: id,
      symbol: symbol.toUpperCase(),
      companyName,
      exchangeCode,
      sortOrder: maxSort + 1,
    },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(
    items.map((item: { id: string; sortOrder: number }) =>
      prisma.watchlistItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
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
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const watchlist = await prisma.watchlist.findUnique({ where: { id } });
  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const item = await prisma.watchlistItem.findUnique({
    where: { id: itemId },
  });

  if (!item || item.watchlistId !== id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.watchlistItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
