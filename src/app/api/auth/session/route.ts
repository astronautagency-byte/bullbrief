import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const appSession = await auth();
  if (appSession) return NextResponse.json({ user: appSession.user });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
    },
  });
}
