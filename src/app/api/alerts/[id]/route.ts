import { NextResponse } from "next/server";
import { removeAlert } from "@/lib/alerts-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const removed = removeAlert(id);
  if (!removed) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }
  return NextResponse.json({ removed: true });
}
