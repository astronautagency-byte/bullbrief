import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const result = await prisma.watchlist.updateMany({ where: { id, userId: session.user.id }, data: { name } });
  if (!result.count) return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  const watchlist = await prisma.watchlist.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  return NextResponse.json({ data: watchlist });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!prisma) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const { id } = await params;
  const watchlist = await prisma.watchlist.findFirst({ where: { id, userId: session.user.id } });
  if (!watchlist) return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  if (watchlist.isDefault) return NextResponse.json({ error: "Cannot delete default watchlist" }, { status: 400 });
  await prisma.watchlist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
