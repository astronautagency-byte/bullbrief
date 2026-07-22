import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
  });

  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.watchlist.update({
    where: { id },
    data: {
      name: body.name ?? watchlist.name,
      isDefault: body.isDefault ?? watchlist.isDefault,
    },
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const watchlist = await prisma.watchlist.findUnique({
    where: { id },
  });

  if (!watchlist || watchlist.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (watchlist.isDefault) {
    return NextResponse.json(
      { error: "Cannot delete default watchlist" },
      { status: 400 }
    );
  }

  await prisma.watchlist.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
