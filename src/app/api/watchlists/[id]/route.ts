import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_WATCHLIST_ID,
  readAccountWatchlist,
  watchlistMetadataUpdate,
} from "@/lib/account-watchlist";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (id !== DEFAULT_WATCHLIST_ID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const watchlist = readAccountWatchlist(user.user_metadata);
  const updated = {
    ...watchlist,
    name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 80) : watchlist.name,
  };
  const { error } = await supabase.auth.updateUser({
    data: watchlistMetadataUpdate(updated),
  });
  if (error) {
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 502 });
  }
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await params;
  return NextResponse.json(
    { error: "Cannot delete default watchlist" },
    { status: 400 }
  );
}
