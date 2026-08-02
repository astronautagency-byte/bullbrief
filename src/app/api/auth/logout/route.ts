import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth";

export async function POST() {
  await signOut();
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // A local account can sign out even when Supabase is unavailable.
  }
  return NextResponse.json({ success: true });
}
