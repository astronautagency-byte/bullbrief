import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_WATCHLIST_ID,
  MAX_WATCHLIST_ITEMS,
  readAccountWatchlist,
  watchlistMetadataUpdate,
} from "@/lib/account-watchlist";

export async function POST(
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
  const { symbol, companyName, exchangeCode } = body;

  const normalizedSymbol = typeof symbol === "string" ? symbol.trim().toUpperCase() : "";
  if (!/^[A-Z0-9.^=-]{1,20}$/.test(normalizedSymbol)) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const watchlist = readAccountWatchlist(user.user_metadata);
  if (watchlist.items.some((item) => item.symbol === normalizedSymbol)) {
    return NextResponse.json(
      { error: "Symbol already in watchlist" },
      { status: 409 }
    );
  }
  if (watchlist.items.length >= MAX_WATCHLIST_ITEMS) {
    return NextResponse.json({ error: "Watchlist limit reached" }, { status: 400 });
  }
  const item = {
    id: crypto.randomUUID(),
    symbol: normalizedSymbol,
    companyName: typeof companyName === "string" ? companyName.slice(0, 160) : null,
    exchangeCode: typeof exchangeCode === "string" ? exchangeCode.slice(0, 80) : null,
    sortOrder: watchlist.items.length,
    addedAt: new Date().toISOString(),
  };
  watchlist.items.push(item);
  const { error } = await supabase.auth.updateUser({
    data: watchlistMetadataUpdate(watchlist),
  });
  if (error) {
    return NextResponse.json({ error: "Failed to save watchlist" }, { status: 502 });
  }
  return NextResponse.json({ data: item }, { status: 201 });
}

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
  const { items } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items array required" }, { status: 400 });
  }

  const watchlist = readAccountWatchlist(user.user_metadata);
  const order = new Map(
    items.map((item: { id: string; sortOrder: number }) => [item.id, item.sortOrder])
  );
  watchlist.items = watchlist.items
    .map((item) => ({ ...item, sortOrder: order.get(item.id) ?? item.sortOrder }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const { error } = await supabase.auth.updateUser({
    data: watchlistMetadataUpdate(watchlist),
  });
  if (error) {
    return NextResponse.json({ error: "Failed to reorder watchlist" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
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
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");

  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }

  const watchlist = readAccountWatchlist(user.user_metadata);
  if (!watchlist.items.some((item) => item.id === itemId)) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  watchlist.items = watchlist.items
    .filter((item) => item.id !== itemId)
    .map((item, index) => ({ ...item, sortOrder: index }));
  const { error } = await supabase.auth.updateUser({
    data: watchlistMetadataUpdate(watchlist),
  });
  if (error) {
    return NextResponse.json({ error: "Failed to update watchlist" }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
