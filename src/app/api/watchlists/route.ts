import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readAccountWatchlist } from "@/lib/account-watchlist";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    data: [readAccountWatchlist(user.user_metadata)],
  });
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { data: readAccountWatchlist(user.user_metadata) },
    { status: 201 }
  );
}
