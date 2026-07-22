import { NextResponse } from "next/server";
import { removeFavourite } from "@/lib/podcast-favourites-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = removeFavourite(id);
  return NextResponse.json({ removed, id });
}
